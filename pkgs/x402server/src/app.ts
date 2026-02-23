import { paymentMiddleware } from "@x402/hono";
import { Hono } from "hono";
import {
  createResourceServer,
  type PaymentOptions,
  resolvePaymentOptions,
} from "./config";
import { createRoutes } from "./route";
import {
  createMockWeatherService,
  type WeatherService,
} from "./weather/service";

type ErrorResponse = {
  statusCode: number;
  message: string;
};

type CreateAppOptions = {
  enablePayment?: boolean;
  payment?: PaymentOptions;
};

const toErrorResponse = (
  statusCode: number,
  message: string,
): ErrorResponse => ({
  statusCode,
  message,
});

export const createApp = (
  weatherService: WeatherService = createMockWeatherService(),
  options: CreateAppOptions = {},
): Hono => {
  const app = new Hono();

  const enablePayment = options.enablePayment ?? true;

  if (enablePayment) {
    const paymentOptions = resolvePaymentOptions(options.payment);
    const resourceServer = createResourceServer(paymentOptions);

    app.use(
      paymentMiddleware(
        createRoutes(paymentOptions),
        resourceServer,
        undefined,
        undefined,
        true,
      ),
    );
  }

  app.get("/", (c) => {
    return c.json({ status: "ok" }, 200);
  });

  app.get("/weather", async (c) => {
    const city = c.req.query("city")?.trim();

    if (!city) {
      return c.json(
        toErrorResponse(400, "city query parameter is required"),
        400,
      );
    }

    try {
      const weather = await weatherService.getWeatherByCity(city);

      if (!weather) {
        return c.json(toErrorResponse(404, "city not found"), 404);
      }

      return c.json(weather, 200);
    } catch {
      return c.json(toErrorResponse(503, "weather service unavailable"), 503);
    }
  });

  return app;
};
