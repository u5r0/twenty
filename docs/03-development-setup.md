# Development Setup

Complete guide to setting up your local development environmenr Twenty.

## Prerequisites

### Required Software

1. **Node.js v24.5.0**
   ```bash
   # Using nvm (recommended)
   nvm install 24.5.0
   nvm use 24.5.0

   # Verify installation
   node --version  # Should output v24.5.0
   ```

2. **Yarn v4.0.2+**
   ```bash
   # Enable Corepack (comes with Node.js)
   corepack enable

   # Verify installation
   yarn --version  # Should output 4.9.2 or higher
   ```

3. **Docker & Docker Compose**
   ```bash
   # Install Docker Desktop (macOS/Windows)
   # Or Docker Engine (Linux)

   # Verify installation
   docker --version
   docker-compose --version
   ```

4. **Git**
   ```bash
   # Verify installation
   git --version
   ```

### Optional Tools

- **PostgreSQL Client** - For database inspection
- **Redis CLI** - For cache debugging
- **Postman/Insomnia** - For API testing
- **VS Code** - Recommended IDE with extensions

## Initial Setup

### 1. Clone the Repository

```bash
# Clone via HTTPS
git clone https://github.com/twentyhq/twenty.git

# Or via SSH
git clone git@github.com:twentyhq/twenty.git

# Navigate to project
cd twenty
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
yarn install

# This will:
# - Install dependencies for all packages
# - Set up Nx workspace
# - Prepare build tools
```

### 3. Start Database Services

```bash
# Start PostgreSQL and Redis
docker-compose -f packages/twenty-docker/docker-compose.yml up -d postgres redis

# Verify services are running
docker ps

# You should see:
# - postgres:15 (port 5432)
# - redis:7 (port 6379)
```

### 4. Configure Environment Variables

**Backend (.env):**
```bash
cd packages/twenty-server
cp .env.example .env
```

Edit `packages/twenty-server/.env`:
```env
# Database
PG_DATABASE_URL=postgres://twenty:twenty@localhost:5432/default

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=3001
FRONT_BASE_URL=http://localhost:3000

# JWT
ACCESS_TOKEN_SECRET=your-secret-key-here
LOGIN_TOKEN_SECRET=your-login-secret-here
REFRESH_TOKEN_SECRET=your-refresh-secret-here
FILE_TOKEN_SECRET=your-file-secret-here

# Email (optional for development)
EMAIL_FROM_ADDRESS=noreply@twenty.com
EMAIL_SYSTEM_ADDRESS=system@twenty.com

# Storage (local for development)
STORAGE_TYPE=local
STORAGE_LOCAL_PATH=.local-storage
```

**Frontend (.env):**
```bash
cd packages/twenty-front
cp .env.example .env
```

Edit `packages/twenty-front/.env`:
```env
# API
REACT_APP_SERVER_BASE_URL=http://localhost:3001

# Feature flags (optional)
REACT_APP_ENABLE_FEATURE_X=true
```

### 5. Run Database Migrations

```bash
cd packages/twenty-server

# Run migrations
yarn database:migrate

# Seed database (optional)
yarn database:seed
```

### 6. Start Development Servers

**Option A: Start All Services (Recommended)**
```bash
# From project root
yarn start

# This starts:
# - Frontend (port 3000)
# - Backend (port 3001)
# - Worker processes
```

**Option B: Start Services Individually**
```bash
# Terminal 1: Backend
cd packages/twenty-server
yarn start:dev

# Terminal 2: Frontend
cd packages/twenty-front
yarn dev

# Terminal 3: Worker (optional)
cd packages/twenty-server
yarn worker:dev
```

### 7. Verify Installation

Open your browser:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **GraphQL Playground:** http://localhost:3001/graphql

## IDE Setup

### VS Code (Recommended)

**Install Extensions:**
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "GraphQL.vscode-graphql",
    "ms-vscode.vscode-typescript-next",
    "orta.vscode-jest",
    "firsttris.vscode-jest-runner"
  ]
}
```

**Workspace Settings (.vscode/settings.json):**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "eslint.workingDirectories": [
    "packages/twenty-front",
    "packages/twenty-server"
  ]
}
```

**Debug Configuration (.vscode/launch.json):**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "yarn",
      "runtimeArgs": ["start:debug"],
      "cwd": "${workspaceFolder}/packages/twenty-server",
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug Frontend",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/packages/twenty-front/src"
    }
  ]
}
```

### WebStorm/IntelliJ IDEA

1. Open project root
2. Enable TypeScript service
3. Configure ESLint and Prettier
4. Set Node.js interpreter to v24.5.0
5. Enable GraphQL plugin

## Development Workflow

### Running Tests

```bash
# Run all tests
yarn test

# Run tests for specific package
cd packages/twenty-front
yarn test

# Run tests in watch mode
yarn test --watch

# Run tests with coverage
yarn test --coverage

# Run e2e tests
cd packages/twenty-e2e-testing
yarn test:e2e
```

### Linting & Formatting

```bash
# Lint all code
yarn lint

# Lint specific package
cd packages/twenty-front
yarn lint

# Fix linting issues
yarn lint --fix

# Format code
yarn fmt

# Format specific files
yarn fmt --write "src/**/*.ts"
```

### Type Checking

```bash
# Type check all packages
yarn typecheck

# Type check specific package
cd packages/twenty-server
yarn typecheck

# Watch mode
yarn typecheck --watch
```

### Building

```bash
# Build all packages
yarn build

# Build specific package
cd packages/twenty-front
yarn build

# Build for production
NODE_ENV=production yarn build
```

### Database Operations

```bash
cd packages/twenty-server

# Create new migration
yarn database:migration:generate src/database/migrations/MyMigration

# Run migrations
yarn database:migrate

# Revert last migration
yarn database:migrate:revert

# Reset database (WARNING: deletes all data)
yarn database:reset

# Seed database
yarn database:seed
```

### GraphQL Code Generation

```bash
cd packages/twenty-front

# Generate TypeScript types from GraphQL schema
yarn graphql:generate

# Watch mode (regenerate on schema changes)
yarn graphql:generate --watch
```

## Common Development Tasks

### Adding a New Package

```bash
# Generate new library
nx generate @nx/react:library my-package --directory=packages

# Or manually create package structure
mkdir -p packages/my-package/src
cd packages/my-package
yarn init
```

### Creating a New Component

```bash
cd packages/twenty-front

# Generate component with Nx
nx generate @nx/react:component MyComponent --project=twenty-front

# Or create manually
mkdir -p src/modules/my-module/components/MyComponent
touch src/modules/my-module/components/MyComponent/MyComponent.tsx
```

### Adding a New API Endpoint

```bash
cd packages/twenty-server

# Generate NestJS module
nest generate module my-module

# Generate service
nest generate service my-module

# Generate resolver (for GraphQL)
nest generate resolver my-module
```

### Working with Storybook

```bash
cd packages/twenty-front

# Start Storybook
yarn storybook

# Build Storybook
yarn storybook:build

# Run Storybook tests
yarn storybook:test
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3000  # or :3001

# Kill process
kill -9 <PID>

# Or use different port
PORT=3002 yarn start
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View PostgreSQL logs
docker logs twenty-postgres

# Restart PostgreSQL
docker-compose restart postgres

# Connect to database
docker exec -it twenty-postgres psql -U twenty -d default
```

### Redis Connection Issues

```bash
# Check if Redis is running
docker ps | grep redis

# Test Redis connection
docker exec -it twenty-redis redis-cli ping

# Restart Redis
docker-compose restart redis
```

### Node Modules Issues

```bash
# Clear node_modules
rm -rf node_modules
rm -rf packages/*/node_modules

# Clear Yarn cache
yarn cache clean

# Reinstall dependencies
yarn install
```

### Build Cache Issues

```bash
# Clear Nx cache
nx reset

# Clear Vite cache
rm -rf packages/twenty-front/node_modules/.vite

# Clear TypeScript cache
find . -name "*.tsbuildinfo" -delete
```

### GraphQL Schema Issues

```bash
cd packages/twenty-front

# Clear generated files
rm -rf src/generated

# Regenerate types
yarn graphql:generate

# Restart dev server
yarn dev
```

## Environment Variables Reference

### Backend (twenty-server)

| Variable | Description | Default |
|----------|-------------|---------|
| `PG_DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_URL` | Redis connection string | - |
| `PORT` | Server port | 3001 |
| `FRONT_BASE_URL` | Frontend URL | http://localhost:3000 |
| `ACCESS_TOKEN_SECRET` | JWT access token secret | - |
| `REFRESH_TOKEN_SECRET` | JWT refresh token secret | - |
| `STORAGE_TYPE` | Storage backend (local/s3) | local |

### Frontend (twenty-front)

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_SERVER_BASE_URL` | Backend API URL | http://localhost:3001 |
| `VITE_DISABLE_TYPESCRIPT_CHECKER` | Disable TS checking in Vite | false |

## Next Steps

- [System Architecture](./04-system-architecture.md) - Understand the architecture
- [Frontend Architecture](./07-frontend-architecture.md) - Learn frontend patterns
- [Backend Architecture](./11-backend-architecture.md) - Learn backend patterns
- [Contributing Guide](./21-contributing.md) - Start contributing

---

**Related Documentation:**
- [Quick Start](./02-quick-start.md)
- [Configuration](./19-configuration.md)
- [Troubleshooting](./26-troubleshooting.md)

