import { Hono } from "hono";
import {
  createMockWeatherService,
  type WeatherService,
} from "./weather/service";

type ErrorResponse = {
  statusCode: number;
  message: string;
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
): Hono => {
  const app = new Hono();

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
      return c.json(
        toErrorResponse(503, "weather service unavailable"),
        503,
      );
    }
  });

  return app;
};

const app = createApp();

export default app;
