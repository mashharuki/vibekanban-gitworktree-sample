import { x402Version } from "@x402/core";
import type { FacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm";
import { privateKeyToAccount } from "viem/accounts";
import { afterAll, describe, expect, it } from "vitest";
import { createApp as createMcpApp } from "../src/index";
import {
  createX402FetchClient,
  type X402FetchClientEnv,
} from "../src/x402-fetch-client";

type CreateX402App = typeof import("../../x402server/src/index")["createApp"];
type RequestableApp = {
  request: (input: string, init?: RequestInit) => Promise<Response>;
};

const parseSseMessageData = (ssePayload: string): unknown => {
  const dataLine = ssePayload
    .split("\n")
    .find((line) => line.startsWith("data: "));
  if (!dataLine) {
    throw new Error("SSE payload does not contain a data line");
  }

  return JSON.parse(dataLine.slice("data: ".length));
};

const initializeMcpServer = async (
  app: ReturnType<typeof createMcpApp>,
  env: X402FetchClientEnv,
) => {
  const initResponse = await app.request(
    "/mcp",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "initialize-1",
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: {
            name: "vitest-e2e-client",
            version: "1.0.0",
          },
        },
      }),
    },
    env,
  );

  expect(initResponse.status).toBe(200);
};

const originalFetch = globalThis.fetch;
const originalPaymentEnv = {
  SERVER_WALLET_ADDRESS: process.env.SERVER_WALLET_ADDRESS,
  FACILITATOR_URL: process.env.FACILITATOR_URL,
  X402_PRICE_USD: process.env.X402_PRICE_USD,
  X402_NETWORK: process.env.X402_NETWORK,
};

const testPaymentEnv = {
  SERVER_WALLET_ADDRESS: "0x51908F598A5e0d8F1A3bAbFa6DF76F9704daD072",
  FACILITATOR_URL: "https://x402.org/facilitator",
  X402_PRICE_USD: "$0.01",
  X402_NETWORK: "eip155:84532",
};

const mockedFacilitatorFetch: typeof fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input.toString();
  if (
    url.includes("facilitator.x402.org") ||
    url.includes("x402.org/facilitator")
  ) {
    return new Response(
      JSON.stringify({
        kinds: [{ x402Version, scheme: "exact", network: "eip155:84532" }],
        extensions: [],
        signers: {},
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  }

  return originalFetch(input, init);
};

let createX402App: CreateX402App | null = null;

const loadCreateX402App = async (): Promise<CreateX402App> => {
  if (createX402App) {
    return createX402App;
  }

  process.env.SERVER_WALLET_ADDRESS = testPaymentEnv.SERVER_WALLET_ADDRESS;
  process.env.FACILITATOR_URL = testPaymentEnv.FACILITATOR_URL;
  process.env.X402_PRICE_USD = testPaymentEnv.X402_PRICE_USD;
  process.env.X402_NETWORK = testPaymentEnv.X402_NETWORK;
  globalThis.fetch = mockedFacilitatorFetch;
  const mod = await import("../../x402server/src/index");
  createX402App = mod.createApp;
  return createX402App;
};

afterAll(() => {
  globalThis.fetch = originalFetch;
  process.env.SERVER_WALLET_ADDRESS = originalPaymentEnv.SERVER_WALLET_ADDRESS;
  process.env.FACILITATOR_URL = originalPaymentEnv.FACILITATOR_URL;
  process.env.X402_PRICE_USD = originalPaymentEnv.X402_PRICE_USD;
  process.env.X402_NETWORK = originalPaymentEnv.X402_NETWORK;
});

const createAppConnectedWithX402Server = (x402App: RequestableApp) => {
  return createMcpApp({
    getWeatherToolDepsFactory: (getEnv) => ({
      createClient: (env) =>
        createX402FetchClient(env, {
          fetchImpl: (input, init) => {
            const url = new URL(
              typeof input === "string" ? input : input.toString(),
            );
            const pathWithQuery = `${url.pathname}${url.search}`;

            return x402App.request(pathWithQuery, {
              method: init?.method ?? "GET",
              headers: init?.headers,
              body: init?.body as BodyInit | null | undefined,
            });
          },
          wrapFetchWithPaymentFromConfig: (fetchImpl) => fetchImpl,
          privateKeyToAccount,
          createSchemeClient: (account) => new ExactEvmScheme(account),
        }),
      getEnv,
    }),
  });
};

const callGetWeatherTool = async (
  app: ReturnType<typeof createMcpApp>,
  city: string,
  env: X402FetchClientEnv,
) => {
  const response = await app.request(
    "/mcp",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: `tool-call-${city}`,
        method: "tools/call",
        params: {
          name: "get_weather",
          arguments: { city },
        },
      }),
    },
    env,
  );

  expect(response.status).toBe(200);
  return parseSseMessageData(await response.text()) as {
    result?: {
      isError?: boolean;
      content?: Array<{ type: string; text: string }>;
    };
    error?: { message?: string };
  };
};

const unpaidFacilitatorClient: FacilitatorClient = {
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

describe("e2e validation: mcpserver <-> x402server", () => {
  const env: X402FetchClientEnv = {
    CLIENT_PRIVATE_KEY:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    X402_SERVER_URL: "http://x402.local",
  };

  it("responds healthy from both services", async () => {
    const createX402 = await loadCreateX402App();
    const x402App = createX402(undefined, { enablePayment: false });
    const mcpApp = createAppConnectedWithX402Server(x402App);

    const x402Health = await x402App.request("/");
    const mcpHealth = await mcpApp.request("/");

    expect(x402Health.status).toBe(200);
    await expect(x402Health.json()).resolves.toEqual({ status: "ok" });
    expect(mcpHealth.status).toBe(200);
    await expect(mcpHealth.json()).resolves.toEqual({
      status: "ok",
      service: "mcpserver",
    });
  });

  it("returns weather data through MCP get_weather tool", async () => {
    const createX402 = await loadCreateX402App();
    const x402App = createX402(undefined, { enablePayment: false });
    const mcpApp = createAppConnectedWithX402Server(x402App);
    await initializeMcpServer(mcpApp, env);

    const body = await callGetWeatherTool(mcpApp, "Tokyo", env);
    const text = body.result?.content?.[0]?.text ?? "";

    expect(body.error).toBeUndefined();
    expect(body.result?.isError).toBeUndefined();
    expect(text).toContain("City: Tokyo");
    expect(text).toContain("Condition:");
  });

  it("propagates city not found errors to MCP response", async () => {
    const createX402 = await loadCreateX402App();
    const x402App = createX402(undefined, { enablePayment: false });
    const mcpApp = createAppConnectedWithX402Server(x402App);
    await initializeMcpServer(mcpApp, env);

    const body = await callGetWeatherTool(mcpApp, "Atlantis", env);
    const text = body.result?.content?.[0]?.text ?? "";

    expect(body.error).toBeUndefined();
    expect(body.result?.isError).toBe(true);
    expect(text).toContain("weather request failed (404)");
    expect(text).toContain("city not found");
  });

  it("propagates validation errors when city is missing", async () => {
    const createX402 = await loadCreateX402App();
    const x402App = createX402(undefined, { enablePayment: false });
    const mcpApp = createAppConnectedWithX402Server(x402App);
    await initializeMcpServer(mcpApp, env);

    const body = await callGetWeatherTool(mcpApp, "", env);
    const errorText =
      body.error?.message ?? body.result?.content?.[0]?.text ?? "";
    expect(errorText).toContain("city is required");
  });

  it("propagates x402 payment-required errors from protected weather endpoint", async () => {
    const createX402 = await loadCreateX402App();
    const x402App = createX402(undefined, {
      payment: { facilitatorClient: unpaidFacilitatorClient },
    });
    const mcpApp = createAppConnectedWithX402Server(x402App);
    await initializeMcpServer(mcpApp, env);

    const body = await callGetWeatherTool(mcpApp, "Tokyo", env);
    const text = body.result?.content?.[0]?.text ?? "";

    expect(body.error).toBeUndefined();
    expect(body.result?.isError).toBe(true);
    expect(text).toContain("x402 payment failed (402):");
  });
});
