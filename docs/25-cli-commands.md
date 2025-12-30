# CLI Commands Reference

Complete reference for all available commands in the Twenty project.

## Root Commands

### Development

```bash
# Start all services (frontend + backend + worker)
yarn start

# Install dependencies
yarn install

# Clean install (remove node_modules first)
yarn install --force
```

### Building

```bash
# Build all packages
yarn build

# Build specific package
nx build twenty-front
nx build twenty-server

# Build affected packages only
nx affected:build
```

### Testing

```bash
# Run all tests
yarn test

# Run tests for specific package
nx test twenty-front
nx test twenty-server

# Run tests in watch mode
yarn test --watch

# Run tests with coverage
yarn test --coverage

# Run affected tests only
nx affected:test
```

### Code Quality

```bash
# Lint all code
yarn lint

# Lint specific package
nx lint twenty-front

# Lint and auto-fix
yarn lint --fix

# Format code
yarn fmt

# Format specific files
yarn fmt --write "packages/twenty-front/src/**/*.ts"

# Type check all packages
yarn typecheck

# Type check specific package
cd package-front && yarn typecheck
```

## Frontend Commands (twenty-front)

### Development

```bash
cd packages/twenty-front

# Start development server (port 3000)
yarn dev

# Start with custom port
PORT=3001 yarn dev

# Start with TypeScript checking disabled
VITE_DISABLE_TYPESCRIPT_CHECKER=true yarn dev
```

### Building

```bash
# Build for production
yarn build

# Build and analyze bundle
yarn build --analyze

# Preview production build
yarn preview
```

### GraphQL

```bash
# Generate TypeScript types from GraphQL schema
yarn graphql:generate

# Generate in watch mode
yarn graphql:generate --watch
```

### Storybook

```bash
# Start Storybook development server
yarn storybook

# Build Storybook
yarn storybook:build

# Serve built Storybook
yarn storybook:serve:static

# Run Storybook tests
yarn storybook:test

# Run Storybook tests without coverage
yarn storybook:test:no-coverage
```

### Testing

```bash
# Run unit tests
yarn test

# Run tests in watch mode
yarn test --watch

# Run tests with coverage
yarn test --coverage

# Run specific test file
yarn test src/modules/auth/hooks/useAuth.test.ts
```

## Backend Commands (twenty-server)

### Development

```bash
cd packages/twenty-server

# Start development server (port 3001)
yarn start:dev

# Start in debug mode
yarn start:debug

# Start worker process
yarn worker:dev

# Start in production mode
yarn start:prod
```

### Database

```bash
# Run migrations
yarn database:migrate

# Revert last migration
yarn database:migrate:revert

# Generate new migration
yarn database:migration:generate src/database/migrations/MyMigration

# Create empty migration
yarn database:migration:create src/database/migrations/MyMigration

# Reset database (WARNING: deletes all data)
yarn database:reset

# Seed database
yarn database:seed

# Drop database
yarn database:drop
```

### Building

```bash
# Build for production
yarn build

# Clean build directory
rm -rf dist && yarn build
```

### Testing

```bash
# Run unit tests
yarn test

# Run integration tests
yarn test:integration

# Run e2e tests
yarn test:e2e

# Run tests in watch mode
yarn test --watch

# Run specific test file
yarn test src/modules/user/user.service.spec.ts
```

## Nx Commands

### Workspace

```bash
# Show dependency graph
nx graph

# Show affected projects
nx affected

# Reset Nx cache
nx reset

# Show workspace info
nx report
```

### Running Tasks

```bash
# Run task for all projects
nx run-many -t build --all
nx run-many -t test --all
nx run-many -t lint --all

# Run task for specific projects
nx run-many -t build -p twenty-front twenty-server

# Run task for affected projects
nx affected:build
nx affected:test
nx affected:lint

# Run task with specific configuration
nx build twenty-front --configuration=production
```

### Code Generation

```bash
# Generate React component
nx generate @nx/react:component MyComponent --project=twenty-front

# Generate React library
nx generate @nx/react:library my-library --directory=packages

# Generate NestJS module
nx generate @nx/nest:module my-module --project=twenty-server

# Generate NestJS service
nx generate @nx/nest:service my-service --project=twenty-server

# Generate NestJS controller
nx generate @nx/nest:controller my-controller --project=twenty-server
```

## Docker Commands

### Development

```bash
# Start all services
docker-compose -f packages/twenty-docker/docker-compose.yml up -d

# Start specific service
docker-compose -f packages/twenty-docker/docker-compose.yml up -d postgres
docker-compose -f packages/twenty-docker/docker-compose.yml up -d redis

# Stop all services
docker-compose -f packages/twenty-docker/docker-compose.yml down

# View logs
docker-compose -f packages/twenty-docker/docker-compose.yml logs -f

# View logs for specific service
docker-compose -f packages/twenty-docker/docker-compose.yml logs -f postgres
```

### Database

```bash
# Connect to PostgreSQL
docker exec -it twenty-postgres psql -U twenty -d default

# Backup database
docker exec twenty-postgres pg_dump -U twenty default > backup.sql

# Restore database
docker exec -i twenty-postgres psql -U twenty default < backup.sql

# Connect to Redis
docker exec -it twenty-redis redis-cli
```

### Cleanup

```bash
# Remove all containers
docker-compose -f packages/twenty-docker/docker-compose.yml down

# Remove containers and volumes
docker-compose -f packages/twenty-docker/docker-compose.yml down -v

# Remove all Twenty images
docker images | grep twenty | awk '{print $3}' | xargs docker rmi
```

## E2E Testing Commands

```bash
cd packages/twenty-e2e-testing

# Run all e2e tests
yarn test:e2e

# Run tests in headed mode (see browser)
yarn test:e2e --headed

# Run tests in debug mode
yarn test:e2e --debug

# Run specific test file
yarn test:e2e tests/auth.spec.ts

# Run tests in specific browser
yarn test:e2e --project=chromium
yarn test:e2e --project=firefox
yarn test:e2e --project=webkit

# Generate test report
yarn test:e2e --reporter=html

# Update snapshots
yarn test:e2e --update-snapshots
```

## Documentation Commands

```bash
cd packages/twenty-docs

# Generate documentation JSON
yarn docs:generate

# Generate navigation template
yarn docs:generate-navigation-template

# Start documentation server
yarn dev

# Build documentation
yarn build
```

## Utility Commands

### Cleanup

```bash
# Remove all node_modules
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# Remove all build artifacts
find . -name "dist" -type d -prune -exec rm -rf '{}' +
find . -name "build" -type d -prune -exec rm -rf '{}' +

# Remove all TypeScript build info
find . -name "*.tsbuildinfo" -delete

# Clear Nx cache
nx reset

# Clear Yarn cache
yarn cache clean
```

### Dependencies

```bash
# Update all dependencies
yarn upgrade-interactive

# Update specific dependency
yarn upgrade package-name

# Add dependency to workspace
yarn add package-name

# Add dependency to specific package
yarn workspace @/twenty-front add package-name

# Remove dependency
yarn remove package-name
```

### Git

```bash
# Update from upstream
git fetch upstream
git merge upstream/main

# Rebase on main
git rebase main

# Interactive rebase (squash commits)
git rebase -i HEAD~3

# Amend last commit
git commit --amend

# Reset to upstream
git reset --hard upstream/main
```

## Environment Variables

### Frontend

```bash
# Set API URL
REACT_APP_SERVER_BASE_URL=http://localhost:3001 yarn dev

# Disable TypeScript checker
VITE_DISABLE_TYPESCRIPT_CHECKER=true yarn dev

# Enable debug mode
DEBUG=* yarn dev
```

### Backend

```bash
# Set port
PORT=3002 yarn start:dev

# Set log level
LOG_LEVEL=debug yarn start:dev

# Enable query logging
TYPEORM_LOGGING=true yarn start:dev
```

## Troubleshooting Commands

### Port Issues

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Find and kill in one command
lsof -ti :3000 | xargs kill -9
```

### Database Issues

```bash
# Check PostgreSQL status
docker ps | grep postgres

# Restart PostgreSQL
docker restart twenty-postgres

# View PostgreSQL logs
docker logs twenty-postgres

# Check database connections
docker exec twenty-postgres psql -U twenty -d default -c "SELECT * FROM pg_stat_activity;"
```

### Cache Issues

```bash
# Clear all caches
nx reset
rm -rf node_modules/.cache
rm -rf packages/twenty-front/node_modules/.vite
rm -rf .nx/cache

# Reinstall dependencies
rm -rf node_modules
yarn install
```

## Performance Commands

### Profiling

```bash
# Profile build
NODE_OPTIONS="--max-old-space-size=4096" yarn build

# Analyze bundle size
cd packages/twenty-front
yarn build --analyze

# Profile tests
yarn test --maxWorkers=1 --logHeapUsage
```

### Benchmarking

```bash
# Measure build time
time yarn build

# Measure test time
time yarn test

# Measure startup time
time yarn start
```

## CI/CD Commands

### GitHub Actions

```bash
# Run CI checks locally
act -j test

# Run specific workflow
act -j lint

# Run with secrets
act -j deploy --secret-file .secrets
```

### Pre-commit Hooks

```bash
# Install pre-commit hooks
yarn husky install

# Run pre-commit checks manually
yarn pre-commit
```

## Quick Reference

### Most Used Commands

```bash
# Development
yarn start                    # Start all services
yarn test                     # Run all tests
yarn lint                     # Lint code
yarn fmt                      # Format code

# Database
yarn database:migrate         # Run migrations
yarn database:seed            # Seed database

# Building
yarn build                    # Build all packages

# Nx
nx graph                      # Show dependency graph
nx reset                      # Clear cache
nx affected:test              # Test affected packages
```

### Emergency Commands

```bash
# Complete reset
rm -rf node_modules .nx/cache
yarn install
nx reset
yarn database:reset
yarn start

# Fix port conflicts
lsof -ti :3000 | xargs kill -9
lsof -ti :3001 | xargs kill -9

# Fix database
docker restart twenty-postgres
yarn database:migrate
```

## Next Steps

- [Development Setup](./03-development-setup.md)
- [Troubleshooting](./26-troubleshooting.md)
- [Contributing Guide](./21-contributing.md)

---

**Related Documentation:**
- [Configuration](./19-configuration.md)
- [Testing Strategy](./15-testing-strategy.md)

