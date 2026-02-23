export type WeatherData = {
  city: string;
  condition: string;
  temperatureC: number;
  humidity: number;
};

export interface WeatherService {
  getWeatherByCity(city: string): Promise<WeatherData | null>;
}

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

const normalizeCity = (city: string): string => city.trim().toLowerCase();

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
