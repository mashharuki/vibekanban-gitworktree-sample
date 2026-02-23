import { type FacilitatorClient, HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
import { Hono } from "hono";
import { createMockWeatherService, type WeatherService } from "./weather/service";

type ErrorResponse = {
  statusCode: number;
  message: string;
};

type PaymentOptions = {
  payTo?: string;
  facilitatorUrl?: string;
  price?: string;
  network?: string;
  facilitatorClient?: FacilitatorClient;
};

type CreateAppOptions = {
  enablePayment?: boolean;
  payment?: PaymentOptions;
};

const toErrorResponse = (statusCode: number, message: string): ErrorResponse => ({
  statusCode,
  message,
});

const requiredPaymentConfig = (value: string | undefined, key: string) => {
  if (value?.trim()) {
    return value;
  }

  throw new Error(`Missing required payment configuration: ${key}`);
};

const resolvePaymentOptions = (payment: PaymentOptions = {}) => {
  return {
    payTo: requiredPaymentConfig(payment.payTo ?? process.env.SERVER_WALLET_ADDRESS, "SERVER_WALLET_ADDRESS"),
    facilitatorUrl: requiredPaymentConfig(payment.facilitatorUrl ?? process.env.FACILITATOR_URL, "FACILITATOR_URL"),
    price: requiredPaymentConfig(payment.price ?? process.env.X402_PRICE_USD, "X402_PRICE_USD"),
    network: requiredPaymentConfig(payment.network ?? process.env.X402_NETWORK, "X402_NETWORK"),
    facilitatorClient: payment.facilitatorClient,
  };
};

export const createApp = (
  weatherService: WeatherService = createMockWeatherService(),
  options: CreateAppOptions = {},
): Hono => {
  const app = new Hono();

  const enablePayment = options.enablePayment ?? true;

  if (enablePayment) {
    const paymentOptions = resolvePaymentOptions(options.payment);
    const facilitatorClient =
      paymentOptions.facilitatorClient ??
      new HTTPFacilitatorClient({
        url: paymentOptions.facilitatorUrl,
      });
    const resourceServer = new x402ResourceServer(facilitatorClient).register(
      paymentOptions.network,
      new ExactEvmScheme(),
    );

    app.use(
      paymentMiddleware(
        {
          "GET /weather": {
            accepts: {
              scheme: "exact",
              price: paymentOptions.price,
              network: paymentOptions.network,
              payTo: paymentOptions.payTo,
            },
            description: "Access weather data",
          },
        },
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
      return c.json(toErrorResponse(400, "city query parameter is required"), 400);
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
