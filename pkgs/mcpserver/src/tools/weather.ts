import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  createX402FetchClient,
  type WeatherData,
  type X402FetchClient,
  type X402FetchClientEnv,
} from "../x402-fetch-client";

type WeatherFetchClient = Pick<X402FetchClient, "fetchWeather">;

type GetWeatherToolDeps = {
  createClient: (env: X402FetchClientEnv) => WeatherFetchClient;
  getEnv: () => X402FetchClientEnv;
};
export type { GetWeatherToolDeps };

type GetWeatherToolInput = z.infer<typeof getWeatherInputSchema>;

const buildErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "unknown error";
};

// MCP ツール入力の最小バリデーション（空文字 city を拒否）
export const getWeatherInputSchema = z.object({
  city: z.string().min(1, "city is required"),
});

// MCP レスポンスとして返しやすいプレーンテキストへ整形する。
export const formatWeatherText = (weather: WeatherData): string => {
  return [
    `City: ${weather.city}`,
    `Condition: ${weather.condition}`,
    `Temperature: ${weather.temperatureC}°C`,
    `Humidity: ${weather.humidity}%`,
  ].join("\n");
};

export const createGetWeatherToolHandler = (deps: GetWeatherToolDeps) => {
  // 各呼び出し時点で env からクライアントを生成し、最新設定を反映する。
  return async ({ city }: GetWeatherToolInput) => {
    try {
      const client = deps.createClient(deps.getEnv());
      const weather = await client.fetchWeather(city);

      return {
        content: [
          {
            type: "text" as const,
            text: formatWeatherText(weather),
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `Failed to fetch weather: ${buildErrorMessage(error)}`,
          },
        ],
      };
    }
  };
};

export const registerGetWeatherTool = (server: McpServer, deps: GetWeatherToolDeps): void => {
  // MCP クライアントから見えるツール名は get_weather で固定する。
  server.registerTool(
    "get_weather",
    {
      title: "Get Weather",
      description: "Get current weather information for a specified city",
      inputSchema: getWeatherInputSchema,
    },
    createGetWeatherToolHandler(deps),
  );
};

export const createDefaultGetWeatherToolDeps = (getEnv: () => X402FetchClientEnv): GetWeatherToolDeps => {
  // 依存注入を1か所にまとめ、テストでは差し替えやすくする。
  return {
    createClient: createX402FetchClient,
    getEnv,
  };
};
