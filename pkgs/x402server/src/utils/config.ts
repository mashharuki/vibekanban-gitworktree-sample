import { x402Client } from "@x402/axios";
import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import type { PaymentOptions, ResolvedPaymentOptions } from "./types";

export const client = new x402Client();
/**
 * 必須の支払い設定を取得します
 * @param value
 * @param key
 * @returns
 */
const requiredPaymentConfig = (value: string | undefined, key: string) => {
  if (value?.trim()) {
    return value;
  }

  throw new Error(`Missing required payment configuration: ${key}`);
};

/**
 * ファシリテーターURLを正規化します。
 * 特に、旧URLである https://facilitator.x402.org を https://x402.org/facilitator に変換します。
 * @param rawUrl
 * @returns
 */
const normalizeFacilitatorUrl = (rawUrl: string): string => {
  const trimmed = rawUrl.trim();

  if (trimmed === "https://facilitator.x402.org") {
    return "https://x402.org/facilitator";
  }

  const parsed = new URL(trimmed);
  if (parsed.hostname === "x402.org" && parsed.pathname === "/") {
    parsed.pathname = "/facilitator";
    return parsed.toString().replace(/\/$/, "");
  }

  return trimmed;
};

/**
 * 必須の支払い設定を取得します
 * @param payment
 * @returns
 */
export const resolvePaymentOptions = (payment: PaymentOptions = {}): ResolvedPaymentOptions => {
  const facilitatorUrl = requiredPaymentConfig(
    payment.facilitatorUrl ?? process.env.FACILITATOR_URL,
    "FACILITATOR_URL",
  );

  return {
    payTo: requiredPaymentConfig(payment.payTo ?? process.env.SERVER_WALLET_ADDRESS, "SERVER_WALLET_ADDRESS"),
    facilitatorUrl: normalizeFacilitatorUrl(facilitatorUrl),
    price: requiredPaymentConfig(payment.price ?? process.env.X402_PRICE_USD, "X402_PRICE_USD"),
    network: requiredPaymentConfig(payment.network ?? process.env.X402_NETWORK, "X402_NETWORK"),
    facilitatorClient: payment.facilitatorClient,
  };
};

/**
 * リソースサーバーインスタンスを作成する
 * @param paymentOptions
 * @returns
 */
export const createResourceServer = (paymentOptions: ResolvedPaymentOptions) => {
  const facilitatorClient =
    paymentOptions.facilitatorClient ??
    new HTTPFacilitatorClient({
      url: paymentOptions.facilitatorUrl,
    });

  return new x402ResourceServer(facilitatorClient).register(
    paymentOptions.network as `${string}:${string}`,
    new ExactEvmScheme(),
  );
};
