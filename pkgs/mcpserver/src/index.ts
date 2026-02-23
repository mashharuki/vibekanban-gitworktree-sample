import { StreamableHTTPTransport } from "@hono/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  createDefaultGetWeatherToolDeps,
  registerGetWeatherTool,
} from "./weather-tool";
import type { GetWeatherToolDeps } from "./weather-tool";
import type { X402FetchClientEnv } from "./x402-fetch-client";

type CreateAppOptions = {
  getWeatherToolDepsFactory?: (
    getEnv: () => X402FetchClientEnv,
  ) => GetWeatherToolDeps;
};

export const createApp = (options: CreateAppOptions = {}): Hono => {
  const app = new Hono();
  const mcpServer = new McpServer({
    name: "x402-weather-payment-mcpserver",
    version: "1.0.0",
  });

  let transport: StreamableHTTPTransport | null = null;
  let currentEnv: X402FetchClientEnv | null = null;

  const getEnv = () =>
    currentEnv ?? {
      CLIENT_PRIVATE_KEY: "",
      X402_SERVER_URL: "",
    };
  const getWeatherToolDepsFactory =
    options.getWeatherToolDepsFactory ?? createDefaultGetWeatherToolDeps;

  registerGetWeatherTool(mcpServer, getWeatherToolDepsFactory(getEnv));

  const connectServerIfNeeded = async (): Promise<StreamableHTTPTransport> => {
    if (mcpServer.isConnected() && transport) {
      return transport;
    }

    transport = new StreamableHTTPTransport();
    await mcpServer.connect(transport);
    return transport;
  };

  const closeServerConnection = async (): Promise<void> => {
    if (transport) {
      await transport.close();
      transport = null;
    }

    if (mcpServer.isConnected()) {
      await mcpServer.close();
    }
  };

  app.use("/mcp", cors());

  app.get("/", (c) => {
    return c.json({
      status: "ok",
      service: "mcpserver",
    });
  });

  app.all("/mcp", async (c) => {
    currentEnv = c.env as X402FetchClientEnv;
    const currentTransport = await connectServerIfNeeded();

    try {
      return await currentTransport.handleRequest(c);
    } finally {
      if (c.req.method === "DELETE") {
        await closeServerConnection();
      }
    }
  });

  return app;
};

const app = createApp();

export default app;
