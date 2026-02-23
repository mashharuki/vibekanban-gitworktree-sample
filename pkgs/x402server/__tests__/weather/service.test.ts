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

  it("matches cities with country suffix", async () => {
    const service = createMockWeatherService();

    const result = await service.getWeatherByCity("Tokyo, JP");

    expect(result).not.toBeNull();
    expect(result?.city).toBe("Tokyo");
  });

  it("matches cities wrapped by quotes", async () => {
    const service = createMockWeatherService();

    const singleQuoted = await service.getWeatherByCity("'Tokyo'");
    const doubleQuoted = await service.getWeatherByCity('"Tokyo"');

    expect(singleQuoted).not.toBeNull();
    expect(doubleQuoted).not.toBeNull();
    expect(singleQuoted?.city).toBe("Tokyo");
    expect(doubleQuoted?.city).toBe("Tokyo");
  });

  it("returns null for unknown city", async () => {
    const service = createMockWeatherService();

    const result = await service.getWeatherByCity("Atlantis");

    expect(result).toBeNull();
  });
});
