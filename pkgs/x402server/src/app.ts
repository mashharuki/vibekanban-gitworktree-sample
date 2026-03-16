import { paymentMiddleware } from "@x402/hono";
import { Hono } from "hono";
import { createRoutes } from "./route";
import { createResourceServer, resolvePaymentOptions } from "./utils/config";
import type { CreateAppOptions, ErrorResponse, WeatherService } from "./utils/types";
import { createMockWeatherService } from "./weather/service";

const toErrorResponse = (statusCode: number, message: string): ErrorResponse => ({
  statusCode,
  message,
});

/**
 * Hono アプリケーションを作成します。
 * @param weatherService
 * @param options
 * @returns
 */
export const createApp = (
  weatherService: WeatherService = createMockWeatherService(),
  options: CreateAppOptions = {},
): Hono => {
  // Hono アプリ本体。テスト時は createApp に依存を差し込んで利用する。
  const app = new Hono();

  const enablePayment = options.enablePayment ?? true;

  if (enablePayment) {
    const paymentOptions = resolvePaymentOptions(options.payment);
    const resourceServer = createResourceServer(paymentOptions);
    const routes = createRoutes(paymentOptions);
    const protectedRouteKeys = new Set(Object.keys(routes));
    let resourceServerInitialization: Promise<void> | null = null;

    // 保護対象ルートの初回アクセス時のみ resource server を初期化する。
    app.use(async (c, next) => {
      const routeKey = `${c.req.method.toUpperCase()} ${c.req.path}`;

      if (!protectedRouteKeys.has(routeKey)) {
        return next();
      }

      if (!resourceServerInitialization) {
        resourceServerInitialization = resourceServer.initialize().catch((error) => {
          resourceServerInitialization = null;
          throw error;
        });
      }

      await resourceServerInitialization;
      return next();
    });

    // x402 検証ミドルウェア。createRoutes で定義したルートにのみ課金を適用する。
    app.use(paymentMiddleware(routes, resourceServer, undefined, undefined, false));
  }

  app.get("/", (c) => {
    return c.json({ status: "ok" }, 200);
  });

  /**
   * ヘルスチェック用のルート
   */
  app.get("/health", (c) => {
    return c.json({ status: "ok" }, 200);
  });

  /**
   * 天気情報を取得するルート
   */
  app.get("/weather", async (c) => {
    const city = c.req.query("city")?.trim();

    if (!city) {
      return c.json(toErrorResponse(400, "city query parameter is required"), 400);
    }

    try {
      const weather = await weatherService.getWeatherByCity(city);

      if (!weather) {
        // 入力自体は妥当だが対象都市が未登録のケース。
        return c.json(toErrorResponse(404, "city not found"), 404);
      }

      return c.json(weather, 200);
    } catch {
      // 外部 API 障害など、サービス内部失敗は 503 で返す。
      return c.json(toErrorResponse(503, "weather service unavailable"), 503);
    }
  });

  return app;
};
