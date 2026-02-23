import { ExactEvmScheme } from "@x402/evm";
import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { privateKeyToAccount } from "viem/accounts";

export type WeatherData = {
  city: string;
  condition: string;
  temperatureC: number;
  humidity: number;
};

type ErrorResponse = {
  message?: string;
};

type X402FetchClientEnv = {
  CLIENT_PRIVATE_KEY: string;
  X402_SERVER_URL: string;
};

export type { X402FetchClientEnv };

type X402FetchClientDeps = {
  fetchImpl: typeof fetch;
  wrapFetchWithPaymentFromConfig: typeof wrapFetchWithPaymentFromConfig;
  privateKeyToAccount: typeof privateKeyToAccount;
  createSchemeClient: (account: ReturnType<typeof privateKeyToAccount>) => unknown;
};

const defaultDeps: X402FetchClientDeps = {
  fetchImpl: fetch,
  wrapFetchWithPaymentFromConfig,
  privateKeyToAccount,
  createSchemeClient: (account) => new ExactEvmScheme(account),
};

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const parsed = (await response.json()) as ErrorResponse;
    if (parsed?.message) {
      return parsed.message;
    }
  } catch {
    // ignore json parse failure
  }

  return response.statusText || "unknown error";
};

const validateEnv = (env: X402FetchClientEnv): void => {
  if (!env.CLIENT_PRIVATE_KEY) {
    throw new Error("CLIENT_PRIVATE_KEY is required");
  }

  if (!env.X402_SERVER_URL) {
    throw new Error("X402_SERVER_URL is required");
  }
};

export class X402FetchClient {
  constructor(
    private readonly baseUrl: string,
    private readonly paymentFetch: typeof fetch,
  ) {}

  async fetchWeather(city: string): Promise<WeatherData> {
    const url = new URL("/weather", this.baseUrl);
    url.searchParams.set("city", city);

    let response: Response;

    try {
      response = await this.paymentFetch(url.toString(), {
        method: "GET",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      throw new Error(`x402server connection failed: ${message}`);
    }

    if (response.status === 402) {
      const detail = await parseErrorMessage(response);
      throw new Error(`x402 payment failed (402): ${detail}`);
    }

    if (!response.ok) {
      const detail = await parseErrorMessage(response);
      throw new Error(`weather request failed (${response.status}): ${detail}`);
    }

    return (await response.json()) as WeatherData;
  }
}

export const createX402FetchClient = (
  env: X402FetchClientEnv,
  deps: X402FetchClientDeps = defaultDeps,
): X402FetchClient => {
  validateEnv(env);

  let account: ReturnType<typeof privateKeyToAccount>;
  try {
    account = deps.privateKeyToAccount(env.CLIENT_PRIVATE_KEY as `0x${string}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    throw new Error(`CLIENT_PRIVATE_KEY is invalid: ${message}`);
  }

  const paymentFetch = deps.wrapFetchWithPaymentFromConfig(deps.fetchImpl, {
    schemes: [
      {
        network: "eip155:*",
        client: deps.createSchemeClient(account),
      },
    ],
  });

  return new X402FetchClient(env.X402_SERVER_URL, paymentFetch);
};
