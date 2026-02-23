import type { ResolvedPaymentOptions } from "./config";

/**
 * ルーティング
 * @param payment
 * @returns
 */
export const createRoutes = (payment: ResolvedPaymentOptions) => {
  return {
    "GET /weather": {
      accepts: {
        scheme: "exact",
        price: payment.price,
        network: payment.network,
        payTo: payment.payTo,
      },
      description: "Access weather data",
      mimeType: "application/json",
    },
  };
};
