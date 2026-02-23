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

const DEFAULT_PAY_TO = "0x0000000000000000000000000000000000000000";
const DEFAULT_FACILITATOR_URL = "https://facilitator.x402.org";
const DEFAULT_PRICE_USD = "$0.01";
const BASE_SEPOLIA_NETWORK = "eip155:84532";

const toErrorResponse = (statusCode: number, message: string): ErrorResponse => ({
  statusCode,
  message,
});

const resolvePaymentOptions = (payment: PaymentOptions = {}) => {
  return {
    payTo: payment.payTo ?? process.env.SERVER_WALLET_ADDRESS ?? DEFAULT_PAY_TO,
    facilitatorUrl: payment.facilitatorUrl ?? process.env.FACILITATOR_URL ?? DEFAULT_FACILITATOR_URL,
    price: payment.price ?? DEFAULT_PRICE_USD,
    network: payment.network ?? BASE_SEPOLIA_NETWORK,
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
