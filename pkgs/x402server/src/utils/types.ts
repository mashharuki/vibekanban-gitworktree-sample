import type { FacilitatorClient } from "@x402/core/server";

export type WeatherData = {
  city: string;
  condition: string;
  temperatureC: number;
  humidity: number;
};

export interface WeatherService {
  getWeatherByCity(city: string): Promise<WeatherData | null>;
}

export type ErrorResponse = {
  statusCode: number;
  message: string;
};

export type CreateAppOptions = {
  enablePayment?: boolean;
  payment?: PaymentOptions;
};

export type PaymentOptions = {
  payTo?: string;
  facilitatorUrl?: string;
  price?: string;
  network?: string;
  facilitatorClient?: FacilitatorClient;
};

export type ResolvedPaymentOptions = {
  payTo: string;
  facilitatorUrl: string;
  price: string;
  network: string;
  facilitatorClient: FacilitatorClient;
};
