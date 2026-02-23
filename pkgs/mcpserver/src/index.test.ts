import { describe, expect, it } from "vitest";
import app from "./index";

const initializeRequestBody = {
  jsonrpc: "2.0",
  id: "initialize-1",
  method: "initialize",
  params: {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: {
      name: "vitest-client",
      version: "1.0.0",
    },
  },
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

describe("mcpserver core", () => {
  it("returns healthy status on GET /", async () => {
    const response = await app.request("/");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: "ok",
      service: "mcpserver",
    });
  });

  it("accepts MCP JSON-RPC initialize request on /mcp", async () => {
    const response = await app.request("/mcp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: JSON.stringify(initializeRequestBody),
    });

    const body = parseSseMessageData(await response.text()) as {
      jsonrpc: string;
      id: string;
      result: { serverInfo: { name: string } };
    };

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(body.jsonrpc).toBe("2.0");
    expect(body.id).toBe("initialize-1");
    expect(body.result.serverInfo.name).toBe("x402-weather-payment-mcpserver");
  });

  it("can reconnect after lifecycle close via DELETE /mcp", async () => {
    const initialResponse = await app.request("/mcp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        ...initializeRequestBody,
        id: "initialize-for-delete",
      }),
    });

    const sessionId =
      initialResponse.headers.get("mcp-session-id") ??
      initialResponse.headers.get("Mcp-Session-Id");

    const deleteResponse = await app.request("/mcp", {
      method: "DELETE",
      headers: sessionId
        ? {
            "mcp-session-id": sessionId,
            accept: "application/json, text/event-stream",
          }
        : { accept: "application/json, text/event-stream" },
    });

    expect([200, 202, 204]).toContain(deleteResponse.status);

    const reconnectResponse = await app.request("/mcp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        ...initializeRequestBody,
        id: "initialize-after-delete",
      }),
    });

    const reconnectBody = parseSseMessageData(
      await reconnectResponse.text(),
    ) as { id: string };

    expect(reconnectResponse.status).toBe(200);
    expect(reconnectResponse.headers.get("content-type")).toContain(
      "text/event-stream",
    );
    expect(reconnectBody.id).toBe("initialize-after-delete");
  });
});
