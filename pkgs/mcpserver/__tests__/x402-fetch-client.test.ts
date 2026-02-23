import { describe, expect, it, vi } from "vitest";
import {
  createX402FetchClient,
  type WeatherData,
} from "./../src/x402-fetch-client";

const dummyEnv = {
  CLIENT_PRIVATE_KEY:
    "0x1111111111111111111111111111111111111111111111111111111111111111",
  X402_SERVER_URL: "http://localhost:8787",
};

const createDeps = () => {
  const paymentFetch = vi.fn<typeof fetch>();
  const wrapFetchWithPaymentFromConfig = vi.fn(() => paymentFetch);

  return {
    paymentFetch,
    deps: {
      fetchImpl: vi.fn<typeof fetch>(),
      wrapFetchWithPaymentFromConfig,
      privateKeyToAccount: vi.fn(
        () =>
          ({
            address: "0x1111111111111111111111111111111111111111",
          }) as ReturnType<typeof import("viem/accounts").privateKeyToAccount>,
      ),
      createSchemeClient: vi.fn(() => ({ scheme: "mock" })),
    },
  };
};

describe("createX402FetchClient", () => {
  it("builds a payment-enabled fetch client and gets weather data", async () => {
    const weather: WeatherData = {
      city: "Tokyo",
      condition: "Sunny",
      temperatureC: 28,
      humidity: 60,
    };
    const { paymentFetch, deps } = createDeps();
    paymentFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(weather), { status: 200 }),
    );

    const client = createX402FetchClient(dummyEnv, deps);
    const result = await client.fetchWeather("Tokyo");

    expect(result).toEqual(weather);
    expect(paymentFetch).toHaveBeenCalledWith(
      "http://localhost:8787/weather?city=Tokyo",
      {
        method: "GET",
      },
    );
    expect(deps.wrapFetchWithPaymentFromConfig).toHaveBeenCalledTimes(1);
  });

  it("throws a clear error when x402server connection fails", async () => {
    const { paymentFetch, deps } = createDeps();
    paymentFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const client = createX402FetchClient(dummyEnv, deps);

    await expect(client.fetchWeather("Tokyo")).rejects.toThrow(
      "x402server connection failed: ECONNREFUSED",
    );
  });

  it("throws a payment error with details when response is 402", async () => {
    const { paymentFetch, deps } = createDeps();
    paymentFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "payment rejected" }), {
        status: 402,
      }),
    );

    const client = createX402FetchClient(dummyEnv, deps);

    await expect(client.fetchWeather("Tokyo")).rejects.toThrow(
      "x402 payment failed (402): payment rejected",
    );
  });

  it("uses details field when message is not present in error response", async () => {
    const { paymentFetch, deps } = createDeps();
    paymentFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: "settlement failed",
          details: "missing payment",
        }),
        {
          status: 402,
        },
      ),
    );

    const client = createX402FetchClient(dummyEnv, deps);

    await expect(client.fetchWeather("Tokyo")).rejects.toThrow(
      "x402 payment failed (402): missing payment",
    );
  });

  it("throws an HTTP error with status when response is not ok", async () => {
    const { paymentFetch, deps } = createDeps();
    paymentFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "service unavailable" }), {
        status: 503,
        statusText: "Service Unavailable",
      }),
    );

    const client = createX402FetchClient(dummyEnv, deps);

    await expect(client.fetchWeather("Tokyo")).rejects.toThrow(
      "weather request failed (503): service unavailable",
    );
  });

  it("validates required environment variables", () => {
    const { deps } = createDeps();

    expect(() =>
      createX402FetchClient(
        {
          CLIENT_PRIVATE_KEY: "",
          X402_SERVER_URL: "http://localhost:8787",
        },
        deps,
      ),
    ).toThrow("CLIENT_PRIVATE_KEY is required");

    expect(() =>
      createX402FetchClient(
        {
          CLIENT_PRIVATE_KEY: dummyEnv.CLIENT_PRIVATE_KEY,
          X402_SERVER_URL: "",
        },
        deps,
      ),
    ).toThrow("X402_SERVER_URL is required");
  });

  it("throws a clear error when private key is invalid", () => {
    const { deps } = createDeps();
    deps.privateKeyToAccount = vi.fn(() => {
      throw new Error("invalid hex");
    }) as typeof deps.privateKeyToAccount;

    expect(() => createX402FetchClient(dummyEnv, deps)).toThrow(
      "CLIENT_PRIVATE_KEY is invalid: invalid hex",
    );
  });
});
