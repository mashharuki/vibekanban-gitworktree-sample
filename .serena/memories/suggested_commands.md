# Suggested Commands

## Package Management
```bash
pnpm install          # Install all dependencies
pnpm add <pkg> -w     # Add to root workspace
pnpm add <pkg> --filter <package>  # Add to specific package
```

## Development
```bash
pnpm dev              # Start all dev servers
pnpm dev --filter x402-backend  # Start specific server
wrangler dev          # Start Cloudflare Workers dev server (in package dir)
```

## Testing
```bash
pnpm test             # Run all tests
pnpm test --filter <package>  # Run tests for specific package
npx vitest            # Run vitest in current package
npx vitest --watch    # Watch mode
```

## Build & Deploy
```bash
pnpm build            # Build all packages
wrangler deploy       # Deploy to Cloudflare Workers (in package dir)
```

## Utilities (macOS/Darwin)
```bash
git status            # Check git status
git log --oneline -10 # Recent commits
```
