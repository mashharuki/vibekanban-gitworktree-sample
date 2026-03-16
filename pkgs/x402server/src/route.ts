import type { ResolvedPaymentOptions } from "./utils/types";

/**
 * ルーティング
 * @param payment
 * @returns
 */
export const createRoutes = (payment: ResolvedPaymentOptions) => {
  return {
    // x402 ミドルウェアが参照する「保護対象 + 決済条件」の定義。
    "GET /weather": {
      accepts: {
        scheme: "exact",
        price: payment.price,
        network: payment.network as `${string}:${string}`,
        payTo: payment.payTo,
      },
      description: "Access weather data",
      mimeType: "application/json",
    },
  };
};
