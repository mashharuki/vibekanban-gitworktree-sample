import { StreamableHTTPTransport } from "@hono/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { cors } from "hono/cors";
import { Hono } from "hono";

const app = new Hono();

const mcpServer = new McpServer({
  name: "x402-weather-payment-mcpserver",
  version: "1.0.0",
});

let transport: StreamableHTTPTransport | null = null;

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
  const currentTransport = await connectServerIfNeeded();

  try {
    return await currentTransport.handleRequest(c);
  } finally {
    if (c.req.method === "DELETE") {
      await closeServerConnection();
    }
  }
});

export default app;
