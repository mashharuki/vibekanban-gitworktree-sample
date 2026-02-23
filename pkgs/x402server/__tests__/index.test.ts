import { x402Version } from "@x402/core";
import { describe, expect, it } from "vitest";
import type { WeatherData, WeatherService } from "../src/utils/types";

const sampleWeather: WeatherData = {
  city: "Tokyo",
  condition: "Sunny",
  temperatureC: 28,
  humidity: 60,
};

const testPaymentOptions = {
  payTo: "0x51908F598A5e0d8F1A3bAbFa6DF76F9704daD072",
  facilitatorUrl: "https://x402.org/facilitator",
  price: "$0.01",
  network: "eip155:84532",
};

const fakeFacilitatorClient = {
  async getSupported() {
    return {
      kinds: [{ x402Version, scheme: "exact", network: "eip155:84532" }],
      extensions: [],
      signers: {},
    };
  },
  async verify() {
    return { isValid: false, invalidReason: "missing payment" };
  },
  async settle() {
    return { success: true, transaction: "0x", network: "eip155:84532" };
  },
};

describe("x402server API", () => {
  it("returns service status on GET /", async () => {
    const app = createApp(undefined, {
      payment: {
        ...testPaymentOptions,
        facilitatorClient: fakeFacilitatorClient as any,
      },
    });

    const res = await app.request("/");

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: "ok" });
  });

  it("returns 402 for unpaid request on /weather", async () => {
    const app = createApp(undefined, {
      payment: {
        ...testPaymentOptions,
        facilitatorClient: fakeFacilitatorClient as any,
      },
    });

    const res = await app.request("/weather?city=Tokyo");

    expect(res.status).toBe(402);
  });

  it("accepts legacy facilitator host by normalizing it", async () => {
    const app = createApp(undefined, {
      payment: {
        ...testPaymentOptions,
        facilitatorUrl: "https://facilitator.x402.org",
        facilitatorClient: fakeFacilitatorClient as any,
      },
    });

    const res = await app.request("/");

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: "ok" });
  });

  it("keeps health check endpoint unprotected", async () => {
    const app = createApp(undefined, {
      payment: {
        ...testPaymentOptions,
        facilitatorClient: fakeFacilitatorClient as any,
      },
    });

    const res = await app.request("/");

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: "ok" });
  });

  it("returns 400 when city query is missing", async () => {
    const app = createApp(undefined, { enablePayment: false });

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
    const app = createApp(weatherService, { enablePayment: false });

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
    const app = createApp(weatherService, { enablePayment: false });

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
    const app = createApp(weatherService, { enablePayment: false });

    const res = await app.request("/weather?city=Tokyo");

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({
      statusCode: 503,
      message: "weather service unavailable",
    });
  });
});
