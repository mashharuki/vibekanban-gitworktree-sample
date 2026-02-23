import { paymentMiddleware } from "@x402/hono";
import { Hono } from "hono";
import { createRoutes } from "./route";
import { createResourceServer, resolvePaymentOptions } from "./utils/config";
import type { ErrorResponse } from "./utils/types";
import { createMockWeatherService } from "./weather/service";

const toErrorResponse = (statusCode: number, message: string): ErrorResponse => ({
	statusCode,
	message,
});

const weatherService = createMockWeatherService();

export const app = new Hono();

const paymentOptions = resolvePaymentOptions();
const resourceServer = createResourceServer(paymentOptions);

app.use(paymentMiddleware(createRoutes(paymentOptions), resourceServer, undefined, undefined, true));

app.get("/", (c) => {
	return c.json({ status: "ok" }, 200);
});

app.get("/health", (c) => {
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

export default app;
