import { WeatherData, WeatherService } from "../utils/types";

// モックの天気予報データ
const MOCK_WEATHER_DATA: ReadonlyArray<WeatherData> = [
  {
    city: "Tokyo",
    condition: "Sunny",
    temperatureC: 28,
    humidity: 60,
  },
  {
    city: "Osaka",
    condition: "Cloudy",
    temperatureC: 26,
    humidity: 65,
  },
  {
    city: "New York",
    condition: "Rainy",
    temperatureC: 22,
    humidity: 72,
  },
];

const normalizeCity = (city: string): string => {
  const trimmed = city.trim().replace(/^['\"]+|['\"]+$/g, "");
  const withoutCountry = trimmed.split(",")[0]?.trim() ?? trimmed;

  return withoutCountry.toLowerCase();
};

/**
 * モックの天気予報を提供するWeatherServiceの実装を作成するファクトリーメソッド
 * @returns
 */
export const createMockWeatherService = (): WeatherService => {
  return {
    async getWeatherByCity(city: string): Promise<WeatherData | null> {
      const normalized = normalizeCity(city);

      const weather = MOCK_WEATHER_DATA.find(
        (item) => normalizeCity(item.city) === normalized,
      );

      return weather ?? null;
    },
  };
};
