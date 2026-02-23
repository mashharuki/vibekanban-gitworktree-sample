import { describe, expect, it } from "vitest";

describe("mcpserver project setup", () => {
  it("should import @modelcontextprotocol/sdk", async () => {
    const { McpServer } = await import(
      "@modelcontextprotocol/sdk/server/mcp.js"
    );
    expect(McpServer).toBeDefined();
  });

  it("should import @hono/mcp", async () => {
    const mod = await import("@hono/mcp");
    expect(mod).toBeDefined();
  });

  it("should import zod", async () => {
    const { z } = await import("zod");
    expect(z.object).toBeDefined();
    expect(z.string).toBeDefined();
  });

  it("should import @x402/fetch", async () => {
    const mod = await import("@x402/fetch");
    expect(mod).toBeDefined();
  });

  it("should import hono", async () => {
    const { Hono } = await import("hono");
    expect(Hono).toBeDefined();
  });
});
