# TypeScript Type System

This document describes the TypeScript configuration and type checking setup across the Twenty monorepo.

## Overview

Twenty uses TypeScript 5.9.2 across all packages with varying strictness levels. The monorepo employs a hybrid approach:
- **Frontend**: Strict mode enabled with runtime type checking disabled during builds
- **Backend**: Partial strict mode with specific flags enabled
- **Shared packages**: Full strict mode for maximum type safety

## Base Configuration

All packages extend from `tsconfig.base.json` at the workspace root:

```json
{
  "compilerOptions": {
    "target": "es2018",
    "module": "esnext",
    "moduleResolution": "node",
    "lib": ["es2020", "dom"],
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true
  }
}
```

## Frontend (twenty-front)

### Configuration Strategy

The frontend uses **project references** with separate configs for different contexts:
- `tsconfig.dev.json` - Development with full type checking
- `tsconfig.build.json` - Production builds (excludes tests/stories)
- `tsconfig.spec.json` - Test files
- `tsconfig.storybook.json` - Storybook components

### Strict Mode Settings

```typescript
{
  "strict": true,                      // ✅ All strict checks en
pt'] = {
  tsconfigPath: isBuildCommand
    ? './tsconfig.build.json'
    : './tsconfig.dev.json'
}
```

**Build Process**: Type checking is **disabled by default** in production builds for speed:
```bash
VITE_DISABLE_TYPESCRIPT_CHECKER=true vite build
```

### Compilation Pipeline

1. **SWC** (via `@vitejs/plugin-react-swc`) - Handles TypeScript → JavaScript transformation
2. **esbuild** - Handles minification only
3. **Type checking** - Separate process via `vite-plugin-checker` or manual `tsc`

### Path Aliases

```typescript
{
  "@/*": ["./src/modules/*"],
  "~/*": ["./src/*"]
}
```

## Backend (twenty-server)

### Configuration

```typescript
{
  "module": "commonjs",              // Node.js compatibility
  "target": "es2018",
  "strictNullChecks": true,          // ✅ Enabled
  "alwaysStrict": true,              // ✅ Enabled
  "noImplicitAny": true,             // ✅ Enabled
  "strictBindCallApply": false,      // ⚠️ Disabled
  "forceConsistentCasingInFileNames": false,  // ⚠️ Disabled
  "noFallthroughCasesInSwitch": false,        // ⚠️ Disabled
  "emitDecoratorMetadata": true,     // Required for NestJS
  "experimentalDecorators": true,    // Required for NestJS
  "declaration": true,               // Generate .d.ts files
  "incremental": true                // Faster rebuilds
}
```

### Type Checking Status

The backend has **partial strict mode**:
- ✅ Null checks enforced
- ✅ Implicit any forbidden
- ⚠️ Some strict checks disabled for NestJS compatibility
- ⚠️ Case sensitivity not enforced

### Path Aliases

```typescript
{
  "src/*": ["./src/*"],
  "test/*": ["./test/*"]
}
```

## Shared Packages

### twenty-shared

**Strictest configuration** in the monorepo:
```typescript
{
  "strictNullChecks": true,
  "alwaysStrict": true,
  "noImplicitAny": true,
  "allowJs": false,              // No JavaScript files allowed
  "esModuleInterop": false       // Strict module compatibility
}
```

### twenty-ui

```typescript
{
  "strict": true,                // Full strict mode
  "moduleResolution": "bundler", // Modern resolution
  "noEmit": true                 // Library package
}
```

## GraphQL Type Generation

### Automated Type Generation

Twenty uses **GraphQL Code Generator** to create TypeScript types from GraphQL schemas:

#### Data API Types (`codegen.cjs`)
```javascript
schema: 'http://localhost:3000/graphql'
generates: './src/generated/graphql.ts'
plugins: [
  'typescript',
  'typescript-operations',
  'typescript-react-apollo'
]
```

Generates:
- Type definitions for all GraphQL types
- React hooks for queries/mutations
- Apollo Client integration

#### Metadata API Types (`codegen-metadata.cjs`)
```javascript
schema: 'http://localhost:3000/metadata'
generates: './src/generated-metadata/graphql.ts'
```

Separate generation for workspace metadata operations.

### Type Generation Workflow

```bash
# Generate data API types
nx graphql:generate twenty-front --config=data

# Generate metadata API types
nx graphql:generate twenty-front --config=metadata
```

## Monorepo Type Checking

### Nx Integration

Type checking is configured as an Nx target in `nx.json`:

```json
{
  "typecheck": {
    "executor": "nx:run-commands",
    "command": "tsc -b tsconfig.json --incremental",
    "cache": true,
    "dependsOn": ["^build"]
  }
}
```

### Running Type Checks

```bash
# Check single package
nx typecheck twenty-front

# Check all packages
nx run-many -t typecheck

# Watch mode
nx typecheck twenty-front --watch
```

### Caching

- Type check results are **cached** by Nx
- Incremental compilation via `--incremental` flag
- Cache location: `.cache/tsc/`

## Type Safety Issues

### Known Weaknesses

1. **Frontend Build**: Type checking disabled in production builds for performance
2. **Unused Variables**: `noUnusedLocals` and `noUnusedParameters` disabled in frontend
3. **Backend Strictness**: Some strict checks disabled for decorator compatibility
4. **Case Sensitivity**: Not enforced in backend (potential cross-platform issues)

### Recommendations

1. Enable type checking in CI/CD even if disabled in local builds
2. Consider enabling `noUnusedLocals` gradually with `// @ts-expect-error` for exceptions
3. Run `nx run-many -t typecheck` before merging PRs
4. Use `strictBindCallApply: true` in new backend modules

## Module Resolution

### Frontend
- **Strategy**: `bundler` (Vite-optimized)
- **Handles**: ESM, path aliases, JSON imports
- **Plugin**: `vite-tsconfig-paths` for alias resolution

### Backend
- **Strategy**: `node` (CommonJS)
- **Runtime**: `tsconfig-paths/register` for path aliases
- **Compilation**: TypeScript compiler generates JS + declarations

## Type Declaration Files

### Frontend
- `noEmit: true` - No declarations generated (not a library)
- Types consumed from `node_modules/@types`

### Backend
- `declaration: true` - Generates `.d.ts` files in `dist/`
- Used by other packages and external consumers

### Shared Packages
- Generate declarations for workspace consumption
- Published types for external use

## Testing Type Safety

### Jest Configuration

Both frontend and backend use `ts-jest` or `@swc/jest` for TypeScript in tests:

```typescript
// Frontend uses @swc/jest (faster)
transform: {
  '^.+\\.(ts|tsx)$': '@swc/jest'
}

// Backend uses ts-jest (better type checking)
transform: {
  '^.+\\.ts$': 'ts-jest'
}
```

### Test Type Checking

- Test files included in `tsconfig.spec.json`
- Separate from production type checking
- Can catch type errors in test code

## Performance Considerations

### Development
- **SWC**: ~20x faster than tsc for transpilation
- **Incremental**: Reuses previous compilation results
- **Parallel**: Nx runs type checks in parallel across packages

### Build
- **Frontend**: Type checking skipped (2-3x faster builds)
- **Backend**: Incremental compilation enabled
- **CI**: Full type checking enforced

## Compilation vs Type Checking

### Important Distinction

TypeScript serves two purposes in Twenty:

1. **Compilation** (TS → JS): Handled by SWC (fast)
2. **Type Checking**: Handled by `tsc` (slower, optional)

These are **decoupled** in the build process:

```bash
# Frontend build (no type checking)
vite build  # Uses SWC for compilation only

# Separate type check
tsc -b tsconfig.json --noEmit
```

### Why Decouple?

- **Speed**: SWC compiles 20x faster than tsc
- **Flexibility**: Can skip type checking in dev for faster iteration
- **CI/CD**: Can run type checking in parallel with builds

## Future Improvements

1. **Strict Mode**: Gradually enable all strict flags in backend
2. **Unused Code**: Enable unused variable detection
3. **Build Types**: Add optional type checking in frontend builds
4. **Workspace Types**: Better type sharing between packages
5. **Generated Types**: Automate more type generation from schemas

## Related Documentation

- [Technology Stack](./04-technology-stack.md)
- [Frontend Architecture](./05-frontend-architecture.md)
- [Backend Architecture](./08-backend-architecture.md)
- [Testing Strategy](./12-testing-strategy.md)
