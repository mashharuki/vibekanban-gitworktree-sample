# Suggested Commands

## Initial Setup
```bash
pnpm install
```

## Workspace / Scripts (root)
```bash
pnpm format
pnpm x402server
pnpm mcpserver
```

## Package-level Execution (when packages are added)
```bash
pnpm --filter <pkg> dev
pnpm --filter <pkg> test
pnpm --filter <pkg> build
```

## Kiro Spec Workflow (reference)
```bash
# spec init
/kiro:spec-init "<feature description>"

# requirements -> design -> tasks -> impl
/kiro:spec-requirements <feature>
/kiro:spec-design <feature>
/kiro:spec-tasks <feature>
/kiro:spec-impl <feature>

# status
/kiro:spec-status <feature>
```

## Git / Inspection
```bash
git status
git log --oneline -10
rg --files
```
