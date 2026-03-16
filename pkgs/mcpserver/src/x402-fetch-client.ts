import type { Fetcher } from "@cloudflare/workers-types";
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
  error?: string;
  details?: string;
};

type X402FetchClientEnv = {
  CLIENT_PRIVATE_KEY: string;
  X402_SERVER_URL?: string | Fetcher; // URL string or Service Binding
  X402SERVER?: Fetcher; // Cloudflare Service Binding
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

// サーバー側エラーの JSON 形式が揺れても、利用者に見せるメッセージを抽出する。
const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const parsed = (await response.json()) as ErrorResponse;
    if (parsed?.message) {
      return parsed.message;
    }
    if (parsed?.details) {
      return parsed.details;
    }
    if (parsed?.error) {
      return parsed.error;
    }
  } catch {
    // ignore json parse failure
  }

  return response.statusText || "unknown error";
};

const isFetcherBinding = (value: unknown): value is Fetcher => {
  return (
    typeof value === "object" &&
    value !== null &&
    "fetch" in value &&
    typeof (value as { fetch?: unknown }).fetch === "function"
  );
};

// Service Binding 優先で fetch 宛先を解決する。
const getServiceBinding = (env: X402FetchClientEnv): Fetcher | undefined => {
  if (isFetcherBinding(env.X402SERVER)) {
    return env.X402SERVER;
  }
  if (isFetcherBinding(env.X402_SERVER_URL)) {
    return env.X402_SERVER_URL;
  }
  return undefined;
};

// 実行に必須な秘密鍵と接続先を起動時に検証する。
const validateEnv = (env: X402FetchClientEnv): void => {
  if (!env.CLIENT_PRIVATE_KEY) {
    throw new Error("CLIENT_PRIVATE_KEY is required");
  }

  const hasUrlString = typeof env.X402_SERVER_URL === "string" && env.X402_SERVER_URL.length > 0;
  const serviceBinding = getServiceBinding(env);
  if (!hasUrlString && !serviceBinding) {
    throw new Error("either X402_SERVER_URL or X402SERVER is required");
  }
};

// Service Binding 利用時は内部 URL を使い、外部 URL 依存をなくす。
const resolveBaseUrl = (env: X402FetchClientEnv): string => {
  if (getServiceBinding(env)) {
    return "https://x402server.internal";
  }

  if (typeof env.X402_SERVER_URL === "string" && env.X402_SERVER_URL.length > 0) {
    return env.X402_SERVER_URL;
  }

  throw new Error("either X402_SERVER_URL or X402SERVER is required");
};

export class X402FetchClient {
  constructor(
    private readonly baseUrl: string,
    private readonly paymentFetch: typeof fetch,
  ) {}

  // x402 決済付きで /weather を呼び出し、失敗時は原因が分かるエラーへ変換する。
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
      const location = ` at ${url.toString()}`;
      const hint = response.status === 404 ? " (check X402_SERVER_URL points to x402server)" : "";
      throw new Error(`weather request failed (${response.status})${location}: ${detail}${hint}`);
    }

    return (await response.json()) as WeatherData;
  }
}

export const createX402FetchClient = (
  env: X402FetchClientEnv,
  deps: X402FetchClientDeps = defaultDeps,
): X402FetchClient => {
  validateEnv(env);

  // 不正な秘密鍵はここで即座に検出する。
  let account: ReturnType<typeof privateKeyToAccount>;
  try {
    account = deps.privateKeyToAccount(env.CLIENT_PRIVATE_KEY as `0x${string}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    throw new Error(`CLIENT_PRIVATE_KEY is invalid: ${message}`);
  }

  const serviceBinding = getServiceBinding(env);
  // Service Binding がある場合は binding.fetch を使い、なければ通常 fetch を使う。
  const fetchImpl = serviceBinding ? serviceBinding.fetch.bind(serviceBinding) : deps.fetchImpl;

  // wrapFetch により 402 応答時の再試行/支払いフローが透過的に有効化される。
  const paymentFetch = deps.wrapFetchWithPaymentFromConfig(fetchImpl, {
    schemes: [
      {
        network: "eip155:*",
        client: deps.createSchemeClient(account),
      },
    ],
  });

  return new X402FetchClient(resolveBaseUrl(env), paymentFetch);
};
