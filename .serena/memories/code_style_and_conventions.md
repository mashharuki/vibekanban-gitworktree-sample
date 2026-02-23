# Code Style and Conventions

## Naming
- Files: kebab-case (e.g., `weather-handler.ts`)
- Classes/Types: PascalCase (e.g., `WeatherResponse`)
- Functions/Variables: camelCase (e.g., `getWeatherForecast`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)

## TypeScript
- Strict mode enabled
- Explicit type annotations preferred
- No `any` type

## Testing
- Vitest for all packages
- TDD approach (per AGENTS.md guidelines)
- Test files co-located: `*.test.ts` next to source

## Git
- Conventional Commits: feat:, fix:, docs:, test:, refactor:, chore:
- Commit messages in English
- Atomic commits

## Import Order
1. External libraries
2. Internal shared packages (@repo/shared)
3. Local modules
