import type { FacilitatorClient } from "@x402/core/server";

// /weather が返すドメインモデル
export type WeatherData = {
  city: string;
  condition: string;
  temperatureC: number;
  humidity: number;
};

// 天気取得ロジックの抽象。実装差し替えを容易にする。
export interface WeatherService {
  getWeatherByCity(city: string): Promise<WeatherData | null>;
}

// API のエラーレスポンス形式
export type ErrorResponse = {
  statusCode: number;
  message: string;
};

// createApp の起動オプション
export type CreateAppOptions = {
  enablePayment?: boolean;
  payment?: PaymentOptions;
};

// 呼び出し側が部分的に指定できる支払い設定
export type PaymentOptions = {
  payTo?: string;
  facilitatorUrl?: string;
  price?: string;
  network?: string;
  facilitatorClient?: FacilitatorClient;
};

// 実行時に必須項目が解決済みの支払い設定
export type ResolvedPaymentOptions = {
  payTo: string;
  facilitatorUrl: string;
  price: string;
  network: string;
  facilitatorClient: FacilitatorClient;
};
