import { describe, expect, it } from "vitest";
import { createApp } from "./index";
import type { WeatherData, WeatherService } from "./weather/service";

const sampleWeather: WeatherData = {
  city: "Tokyo",
  condition: "Sunny",
  temperatureC: 28,
  humidity: 60,
};

describe("x402server API", () => {
  it("returns service status on GET /", async () => {
    const app = createApp();

    const res = await app.request("/");

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: "ok" });
  });

  it("returns 400 when city query is missing", async () => {
    const app = createApp();

    const res = await app.request("/weather");

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      statusCode: 400,
      message: "city query parameter is required",
    });
  });

  it("returns 200 with weather data when city is found", async () => {
    const weatherService: WeatherService = {
      async getWeatherByCity() {
        return sampleWeather;
      },
    };
    const app = createApp(weatherService);

    const res = await app.request("/weather?city=Tokyo");

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(sampleWeather);
  });

  it("returns 404 when city is not found", async () => {
    const weatherService: WeatherService = {
      async getWeatherByCity() {
        return null;
      },
    };
    const app = createApp(weatherService);

    const res = await app.request("/weather?city=Atlantis");

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({
      statusCode: 404,
      message: "city not found",
    });
  });

  it("returns 503 when weather service throws", async () => {
    const weatherService: WeatherService = {
      async getWeatherByCity() {
        throw new Error("upstream unavailable");
      },
    };
    const app = createApp(weatherService);

    const res = await app.request("/weather?city=Tokyo");

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({
      statusCode: 503,
      message: "weather service unavailable",
    });
  });
});
