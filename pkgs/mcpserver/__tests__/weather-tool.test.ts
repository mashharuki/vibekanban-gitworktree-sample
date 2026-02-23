import { describe, expect, it, vi } from "vitest";
import type { WeatherData, X402FetchClientEnv } from "./../src/x402-fetch-client";
import { createGetWeatherToolHandler, formatWeatherText, getWeatherInputSchema } from "./weather-tool";

const dummyEnv: X402FetchClientEnv = {
  CLIENT_PRIVATE_KEY: "0x1111111111111111111111111111111111111111111111111111111111111111",
  X402_SERVER_URL: "http://localhost:8787",
};

describe("get_weather tool", () => {
  it("validates tool input schema", () => {
    expect(getWeatherInputSchema.safeParse({ city: "Tokyo" }).success).toBe(true);
    expect(getWeatherInputSchema.safeParse({ city: "" }).success).toBe(false);
    expect(getWeatherInputSchema.safeParse({}).success).toBe(false);
  });

  it("formats weather data as MCP text content", () => {
    const weather: WeatherData = {
      city: "Tokyo",
      condition: "Sunny",
      temperatureC: 28,
      humidity: 60,
    };

    expect(formatWeatherText(weather)).toBe(
      ["City: Tokyo", "Condition: Sunny", "Temperature: 28°C", "Humidity: 60%"].join("\n"),
    );
  });

  it("returns a success MCP response when weather is fetched", async () => {
    const weather: WeatherData = {
      city: "Tokyo",
      condition: "Sunny",
      temperatureC: 28,
      humidity: 60,
    };

    const fetchWeather = vi.fn().mockResolvedValue(weather);
    const createClient = vi.fn(() => ({ fetchWeather }));
    const handler = createGetWeatherToolHandler({
      createClient,
      getEnv: () => dummyEnv,
    });

    const response = await handler({ city: "Tokyo" });

    expect(createClient).toHaveBeenCalledWith(dummyEnv);
    expect(fetchWeather).toHaveBeenCalledWith("Tokyo");
    expect(response).toEqual({
      content: [
        {
          type: "text",
          text: ["City: Tokyo", "Condition: Sunny", "Temperature: 28°C", "Humidity: 60%"].join("\n"),
        },
      ],
    });
  });

  it("converts client errors into MCP error responses", async () => {
    const createClient = vi.fn(() => ({
      fetchWeather: vi.fn().mockRejectedValue(new Error("payment rejected")),
    }));

    const handler = createGetWeatherToolHandler({
      createClient,
      getEnv: () => dummyEnv,
    });

    const response = await handler({ city: "Tokyo" });

    expect(response).toEqual({
      isError: true,
      content: [
        {
          type: "text",
          text: "Failed to fetch weather: payment rejected",
        },
      ],
    });
  });
});
