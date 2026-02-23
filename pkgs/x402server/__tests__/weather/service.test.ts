import { describe, expect, it } from "vitest";
import { createMockWeatherService } from "../../src/weather/service";

describe("createMockWeatherService", () => {
  it("returns weather data for a known city", async () => {
    const service = createMockWeatherService();

    const result = await service.getWeatherByCity("Tokyo");

    expect(result).not.toBeNull();
    expect(result?.city).toBe("Tokyo");
    expect(result?.condition).toBeTypeOf("string");
    expect(result?.temperatureC).toBeTypeOf("number");
    expect(result?.humidity).toBeTypeOf("number");
  });

  it("matches cities case-insensitively", async () => {
    const service = createMockWeatherService();

    const upper = await service.getWeatherByCity("TOKYO");
    const lower = await service.getWeatherByCity("tokyo");

    expect(upper).toEqual(lower);
    expect(upper?.city).toBe("Tokyo");
  });

  it("returns null for unknown city", async () => {
    const service = createMockWeatherService();

    const result = await service.getWeatherByCity("Atlantis");

    expect(result).toBeNull();
  });
});
