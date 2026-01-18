# Monorepo Structure

Understanding Twenty's Nx-powered monorepo organization.

## Overview

Twenty uses **Nx** to manage a monorepo containing multiple interconnected packages. This structure enables code sharing, consistent tooling, and efficient development workflows.

## Repository Structure

```
twenty/
├── packages/                    # All packages
│   ├── twenty-front/           # React frontend application
│   ├── twenty-server/          # NestJS backend server
│   ├── twenty-ui/              # Shared UI component library
│   ├── twenty-emails/          # Email templates
│   ├── twenty-shared/          # Shared utilities
│   ├── twenty-utils/           # Common utilities
│   ├── twenty-sdk/             # JavaScript/TypeScript SDK
│   ├── twenty-cli/             # CLI tool
│   ├── twenty-docs/            # Documentation site
│   ├── twenty-website/         # Marketing website
│   ├── twenty-zapier/          # Zapier integration
│   ├── twenty-apps/            # App marketplace
│   ├── twenty-e2e-testing/     # End-to-end tests
│   ├── twenty-docker/          # Docker configurations
│   └── create-twenty-app/      # App scaffolding tool
├── tools/                       # Build and development tools
│   └── eslint-rules/           # Custom ESLint rules
├── ARCHITECTURE_DOCS/           # Architecture documentation
├── docs/                        # Project documentation
├── .github/                     # GitHub workflows and configs
├── .nx/                         # Nx cache and metadata
├── node_modules/                # Shared dependencies
├── nx.json                      # Nx configuration
├── package.json                 # Root package.json
├── tsconfig.base.json           # Base TypeScript config
├── yarn.lock                    # Dependency lock file
└── README.md                    # Project README
```

## Package Details

### Applications

#### twenty-front
**Frontend React application**

```
packages/twenty-front/
├── src/
│   ├── modules/              # Feature modules
│   ├── pages/                # Route components
│   ├── generated/            # Generated GraphQL types
│   ├── generated-metadata/   # Generated metadata types
│   ├── testing/              # Test utilities
│   ├── hooks/                # Custom React hooks
│   ├── utils/                # Utility functions
│   ├── types/                # TypeScript type definitions
│   ├── config/               # Configuration files
│   ├── loading/              # Loading states
│   ├── locales/              # Locale files
│   └── localization/         # Localization utilities
├── public/                   # Static assets
├── .storybook/               # Storybook configuration
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Package dependencies
```

**Key Features:**
- React 18 with TypeScript
- Recoil for state management
- Apollo Client for GraphQL
- Vite for fast builds
- Storybook for component development

**Scripts:**
```bash
yarn dev          # Start development server
yarn build        # Build for production
yarn test         # Run tests
yarn storybook    # Start Storybook
```

#### twenty-server
**Backend NestJS application**

```
packages/twenty-server/
├── src/
│   ├── engine/               # Core engine
│   │   ├── api/              # GraphQL API
│   │   ├── metadata-modules/ # Metadata management
│   │   ├── workspace-manager/# Workspace management
│   │   ├── workspace-datasource/ # Workspace data sources
│   │   ├── twenty-orm/       # Custom ORM
│   │   ├── core-modules/     # Core modules
│   │   └── ...               # Other engine components
│   ├── modules/              # Business logic modules
│   ├── database/             # Migrations and seeds
│   ├── command/              # CLI commands
│   └── main.ts               # Application entry point
├── test/                     # Integration tests
├── scripts/                  # Utility scripts
├── nest-cli.json             # NestJS CLI configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Package dependencies
```

**Key Features:**
- NestJS framework
- GraphQL Yoga server
- TypeORM + TwentyORM
- BullMQ for job queues
- Passport for authentication

**Scripts:**
```bash
yarn start:dev    # Start development server
yarn build        # Build for production
yarn test         # Run tests
yarn worker:dev   # Start worker process
```

#### twenty-website
**Marketing website (Next.js)**

```
packages/twenty-website/
├── src/
│   ├── app/                  # Next.js app directory
│   ├── components/           # React components
│   ├── content/              # Content files
│   └── styles/               # Global styles
├── public/                   # Static assets
├── next.config.js            # Next.js configuration
└── package.json              # Package dependencies
```

### Libraries

#### twenty-ui
**Shared UI component library**

```
packages/twenty-ui/
├── src/
│   ├── display/              # Display components
│   ├── input/                # Input components
│   ├── layout/               # Layout components
│   ├── navigation/           # Navigation components
│   ├── feedback/             # Feedback components
│   ├── theme/                # Theme system
│   └── index.ts              # Public exports
├── .storybook/               # Storybook configuration
└── package.json              # Package dependencies
```

**Usage:**
```typescript
import { Button, Input, Card } from '@/twenty-ui';
```

#### twenty-shared
**Shared business logic and utilities**

```
packages/twenty-shared/
├── src/
│   ├── types/                # Shared TypeScript types
│   ├── utils/                # Utility functions
│   ├── constants/            # Constants
│   └── index.ts              # Public exports
└── package.json              # Package dependencies
```

#### twenty-utils
**Common utilities**

```
packages/twenty-utils/
├── dangerfile.ts             # Danger.js configuration
├── graphql-introspection-query.graphql
└── package.json              # Package dependencies
```

#### twenty-emails
**Email templates**

```
packages/twenty-emails/
├── src/
│   ├── components/           # Email components
│   ├── templates/            # Email templates
│   └── index.ts              # Public exports
└── package.json              # Package dependencies
```

### Tools & Integrations

#### twenty-sdk
**JavaScript/TypeScript SDK**

```
packages/twenty-sdk/
├── src/
│   ├── client/               # API client
│   ├── types/                # Type definitions
│   └── index.ts              # Public exports
└── package.json              # Package dependencies
```

**Usage:**
```typescript
import { TwentyClient } from '@twenty/sdk';

const client = new TwentyClient({
  apiUrl: 'https://api.twenty.com',
  apiKey: 'your-api-key'
});
```

#### twenty-cli
**Command-line interface (DEPRECATED)**

> **Note:** This package is deprecated. Use `twenty-sdk` instead: https://www.npmjs.com/package/twenty-sdk

```
packages/twenty-cli/
├── deprecate.js              # Deprecation notice
├── package.json              # Package dependencies
└── README.md                 # Documentation
```

#### create-twenty-app
**App scaffolding tool**

```
packages/create-twenty-app/
├── src/
│   ├── constants/            # Constants
│   ├── utils/                # Utility functions
│   ├── cli.ts                # CLI entry point
│   └── create-app.command.ts # Create app command
└── package.json              # Package dependencies
```

**Usage:**
```bash
npx create-twenty-app my-app
```

#### twenty-zapier
**Zapier integration**

```
packages/twenty-zapier/
├── src/
│   ├── triggers/             # Zapier triggers
│   ├── actions/              # Zapier actions
│   └── index.js              # Entry point
└── package.json              # Package dependencies
```

### Testing

#### twenty-e2e-testing
**End-to-end tests**

```
packages/twenty-e2e-testing/
├── tests/                    # Test files
├── lib/                      # Test utilities
├── reporters/                # Custom reporters
├── playwright.config.ts      # Playwright configuration
└── package.json              # Package dependencies
```

**Usage:**
```bash
yarn test:e2e
```

## Nx Configuration

### nx.json

```json
{
  "workspaceLayout": {
    "appsDir": "packages",
    "libsDir": "packages"
  },
  "targetDefaults": {
    "build": {
      "cache": true,
      "dependsOn": ["^build"]
    },
    "test": {
      "cache": true
    },
    "lint": {
      "cache": true
    }
  }
}
```

### Task Dependencies

Nx automatically manages task dependencies:

```
twenty-front:build
  ↓ depends on
twenty-ui:build
  ↓ depends on
twenty-shared:build
```

## Dependency Management

### Workspace Dependencies

Packages can depend on each other:

```json
// packages/twenty-front/package.json
{
  "dependencies": {
    "@/twenty-ui": "*",
    "@/twenty-shared": "*"
  }
}
```

### Shared Dependencies

Common dependencies are hoisted to the root:

```json
// package.json (root)
{
  "dependencies": {
    "react": "^18.2.0",
    "typescript": "5.9.2"
  }
}
```

### Version Management

All packages share the same version:

```json
{
  "version": "0.2.1"
}
```

## Build System

### Nx Caching

Nx caches build outputs for faster rebuilds:

```bash
# First build (slow)
nx build twenty-front

# Subsequent builds (fast, from cache)
nx build twenty-front
```

### Affected Commands

Run tasks only for affected packages:

```bash
# Test only affected packages
nx affected:test

# Build only affected packages
nx affected:build

# Lint only affected packages
nx affected:lint
```

### Parallel Execution

Nx runs tasks in parallel when possible:

```bash
# Run tests for all packages in parallel
nx run-many -t test --all

# Run builds for specific packages
nx run-many -t build -p twenty-front twenty-server
```

## Development Workflow

### Starting Development

```bash
# Start all services
yarn start

# Start specific package
nx serve twenty-front

# Start multiple packages
nx run-many -t serve -p twenty-front twenty-server
```

### Running Tests

```bash
# Test all packages
yarn test

# Test specific package
nx test twenty-front

# Test affected packages
nx affected:test
```

### Building

```bash
# Build all packages
yarn build

# Build specific package
nx build twenty-front

# Build affected packages
nx affected:build
```

### Linting

```bash
# Lint all packages
yarn lint

# Lint specific package
nx lint twenty-front

# Lint affected packages
nx affected:lint
```

## Adding New Packages

### Create Library

```bash
# Generate new library
nx generate @nx/react:library my-library --directory=packages

# Or manually create
mkdir -p packages/my-library/src
cd packages/my-library
yarn init
```

### Create Application

```bash
# Generate new application
nx generate @nx/react:application my-app --directory=packages

# Or manually create
mkdir -p packages/my-app/src
cd packages/my-app
yarn init
```

### Configure Package

1. Add `package.json`
2. Add `tsconfig.json`
3. Add `project.json` (Nx configuration)
4. Update root `tsconfig.base.json` with path mapping

## Best Practices

### Package Organization

- **Applications** - Deployable units (front, server, website)
- **Libraries** - Reusable code (ui, shared, utils)
- **Tools** - Development utilities (cli, generators)

### Dependency Rules

- Libraries should not depend on applications
- Avoid circular dependencies
- Keep dependencies minimal
- Use workspace protocol for internal deps

### Code Sharing

- Extract common code to shared libraries
- Use barrel exports (index.ts)
- Document public APIs
- Version shared libraries together

### Testing Strategy

- Unit tests in each package
- Integration tests in applications
- E2E tests in separate package
- Use Nx caching for fast test runs

## Troubleshooting

### Clear Nx Cache

```bash
nx reset
```

### Rebuild Dependencies

```bash
nx run-many -t build --all --skip-nx-cache
```

### Check Dependency Graph

```bash
nx graph
```

### Analyze Bundle Size

```bash
nx build twenty-front --analyze
```

## Next Steps

- [Technology Stack](./04-technology-stack.md)
- [Frontend Architecture](./05-frontend-architecture.md)
- [Backend Architecture](./08-backend-architecture.md)

---

**Related Documentation:**
- [Project Overview](./01-project-overview.md)
- [System Architecture](./02-system-architecture.md)
