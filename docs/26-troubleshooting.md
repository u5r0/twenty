# Troubleshooting Guide

Common issues and their solutions when wwith Twenty.

## Installation Issues

### Node Version Mismatch

**Problem:** Wrong Node.js version installed

```bash
Error: The engine "node" is incompatible with this module.
Expected version "^24.5.0". Got "18.0.0"
```

**Solution:**
```bash
# Install correct version with nvm
nvm install 24.5.0
nvm use 24.5.0

# Verify version
node --version  # Should output v24.5.0

# Set as default
nvm alias default 24.5.0
```

### Yarn Installation Fails

**Problem:** Yarn not found or wrong version

```bash
yarn: command not found
```

**Solution:**
```bash
# Enable Corepack (comes with Node.js)
corepack enable

# Verify installation
yarn --version  # Should output 4.9.2 or higher

# If still issues, reinstall Node.js
```

### Dependency Installation Errors

**Problem:** Dependencies fail to install

```bash
error An unexpected error occurred: "EACCES: permission denied"
```

**Solution:**
```bash
# Clear cache
yarn cache clean

# Remove node_modules
rm -rf node_modules
rm -rf packages/*/node_modules

# Reinstall
yarn install

# If permission issues persist
sudo chown -R $USER:$USER ~/.yarn
```

## Development Server Issues

### Port Already in Use

**Problem:** Port 3000 or 3001 already occupied

```bash
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find process using port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3002 yarn dev

# Kill all Node processes (nuclear option)
killall node
```

### Frontend Won't Start

**Problem:** Vite dev server fails to start

```bash
Error: Failed to load config from vite.config.ts
```

**Solution:**
```bash
cd packages/twenty-front

# Clear Vite cache
rm -rf node_modules/.vite

# Clear build artifacts
rm -rf dist

# Reinstall dependencies
rm -rf node_modules
yarn install

# Try starting again
yarn dev
```

### Backend Won't Start

**Problem:** NestJS server fails to start

```bash
Error: Cannot find module '@nestjs/core'
```

**Solution:**
```bash
cd packages/twenty-server

# Reinstall dependencies
rm -rf node_modules
yarn install

# Rebuild
yarn build

# Check environment variables
cat .env

# Try starting again
yarn start:dev
```

## Database Issues

### Cannot Connect to PostgreSQL

**Problem:** Database connection refused

```bash
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# If not running, start it
docker-compose -f packages/twenty-docker/docker-compose.yml up -d postgres

# Check logs
docker logs twenty-postgres

# Test connection
docker exec -it twenty-postgres psql -U twenty -d default

# Verify connection string in .env
PG_DATABASE_URL=postgres://twenty:twenty@localhost:5432/default
```

### Migration Fails

**Problem:** Database migration errors

```bash
Error: relation "users" already exists
```

**Solution:**
```bash
cd packages/twenty-server

# Check migration status
yarn database:migration:show

# Revert last migration
yarn database:migrate:revert

# Run migrations again
yarn database:migrate

# If completely broken, reset (WARNING: deletes data)
yarn database:reset
yarn database:migrate
yarn database:seed
```

### Database Connection Pool Exhausted

**Problem:** Too many connections

```bash
Error: sorry, too many clients already
```

**Solution:**
```bash
# Check active connections
docker exec twenty-postgres psql -U twenty -d default -c \
  "SELECT count(*) FROM pg_stat_activity;"

# Kill idle connections
docker exec twenty-postgres psql -U twenty -d default -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle';"

# Increase max connections (in docker-compose.yml)
command: postgres -c max_connections=200

# Restart PostgreSQL
docker restart twenty-postgres
```

## Redis Issues

### Cannot Connect to Redis

**Problem:** Redis connection refused

```bash
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution:**
```bash
# Check if Redis is running
docker ps | grep redis

# Start Redis
docker-compose -f packages/twenty-docker/docker-compose.yml up -d redis

# Test connection
docker exec -it twenty-redis redis-cli ping
# Should return: PONG

# Check logs
docker logs twenty-redis

# Verify Redis URL in .env
REDIS_URL=redis://localhost:6379
```

### Redis Memory Issues

**Problem:** Redis out of memory

```bash
Error: OOM command not allowed when used memory > 'maxmemory'
```

**Solution:**
```bash
# Check memory usage
docker exec twenty-redis redis-cli INFO memory

# Clear all keys (development only)
docker exec twenty-redis redis-cli FLUSHALL

# Increase memory limit (in docker-compose.yml)
command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru

# Restart Redis
docker restart twenty-redis
```

## GraphQL Issues

### Schema Generation Fails

**Problem:** GraphQL types not generating

```bash
Error: Cannot find GraphQL schema
```

**Solution:**
```bash
cd packages/twenty-front

# Ensure backend is running
curl http://localhost:3001/graphql

# Clear generated files
rm -rf src/generated

# Regenerate types
yarn graphql:generate

# If still failing, check codegen config
cat codegen.cjs
```

### GraphQL Query Errors

**Problem:** Query returns errors

```graphql
{
  "errors": [
    {
      "message": "Cannot query field 'companies' on type 'Query'"
    }
  ]
}
```

**Solution:**
```bash
# Check GraphQL schema
curl http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { types { name } } }"}'

# Regenerate frontend types
cd packages/twenty-front
yarn graphql:generate

# Clear Apollo cache
localStorage.clear()  # In browser console

# Restart backend
cd packages/twenty-server
yarn start:dev
```

## Build Issues

### TypeScript Errors

**Problem:** Type checking fails

```bash
Error: Type 'string' is not assignable to type 'number'
```

**Solution:**
```bash
# Check TypeScript version
yarn tsc --version

# Clear TypeScript cache
find . -name "*.tsbuildinfo" -delete

# Regenerate types
cd packages/twenty-front
yarn graphql:generate

# Run type check
yarn typecheck

# If errors persist, check tsconfig.json
```

### Build Fails

**Problem:** Production build errors

```bash
Error: Build failed with 1 error
```

**Solution:**
```bash
# Clear build artifacts
rm -rf dist
rm -rf packages/*/dist

# Clear Nx cache
nx reset

# Clear node_modules
rm -rf node_modules
yarn install

# Try building again
yarn build

# Build with verbose output
yarn build --verbose
```

### Out of Memory During Build

**Problem:** Build process runs out of memory

```bash
FATAL ERROR: Reached heap limit Allocation failed
```

**Solution:**
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" yarn build

# Or set permanently in package.json
"scripts": {
  "build": "NODE_OPTIONS='--max-old-space-size=4096' nx build"
}

# Build packages individually
nx build twenty-ui
nx build twenty-shared
nx build twenty-front
nx build twenty-server
```

## Testing Issues

### Tests Fail

**Problem:** Tests failing unexpectedly

```bash
FAIL src/modules/auth/hooks/useAuth.test.ts
```

**Solution:**
```bash
# Clear Jest cache
yarn test --clearCache

# Run tests with verbose output
yarn test --verbose

# Run specific test file
yarn test src/modules/auth/hooks/useAuth.test.ts

# Update snapshots
yarn test -u

# Run tests in band (no parallel)
yarn test --runInBand
```

### E2E Tests Timeout

**Problem:** Playwright tests timeout

```bash
Error: Test timeout of 30000ms exceeded
```

**Solution:**
```bash
cd packages/twenty-e2e-testing

# Increase timeout in playwright.config.ts
timeout: 60000

# Run in headed mode to debug
yarn test:e2e --headed

# Run in debug mode
yarn test:e2e --debug

# Check if services are running
curl http://localhost:3000
curl http://localhost:3001/health
```

## Performance Issues

### Slow Development Server

**Problem:** Dev server is slow

**Solution:**
```bash
# Disable TypeScript checking in Vite
VITE_DISABLE_TYPESCRIPT_CHECKER=true yarn dev

# Clear caches
nx reset
rm -rf node_modules/.cache
rm -rf packages/twenty-front/node_modules/.vite

# Use faster package manager
yarn install --check-cache

# Reduce worker count
yarn test --maxWorkers=2
```

### Slow Database Queries

**Problem:** Queries taking too long

**Solution:**
```bash
# Enable query logging
# In packages/twenty-server/.env
TYPEORM_LOGGING=true

# Check slow queries
docker exec twenty-postgres psql -U twenty -d default -c \
  "SELECT query, calls, total_time, mean_time
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;"

# Add indexes for frequently queried fields
# Create migration with appropriate indexes

# Analyze query plan
EXPLAIN ANALYZE SELECT * FROM companies WHERE industry = 'Technology';
```

## Authentication Issues

### Cannot Login

**Problem:** Login fails with valid credentials

```bash
Error: Unauthorized
```

**Solution:**
```bash
# Check JWT secrets in .env
ACCESS_TOKEN_SECRET=your-secret-here
REFRESH_TOKEN_SECRET=your-refresh-secret-here

# Clear browser storage
localStorage.clear()
sessionStorage.clear()

# Check backend logs
docker logs twenty-server

# Verify user exists in database
docker exec twenty-postgres psql -U twenty -d default -c \
  "SELECT * FROM users WHERE email = 'user@example.com';"

# Reset password (if needed)
yarn database:seed
```

### Token Expired

**Problem:** Token expires too quickly

**Solution:**
```bash
# Adjust token expiration in .env
ACCESS_TOKEN_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# Restart backend
cd packages/twenty-server
yarn start:dev

# Clear old tokens
localStorage.clear()
```

## Docker Issues

### Container Won't Start

**Problem:** Docker container fails to start

```bash
Error: Container exited with code 1
```

**Solution:**
```bash
# Check logs
docker logs twenty-postgres
docker logs twenty-redis

# Remove and recreate containers
docker-compose -f packages/twenty-docker/docker-compose.yml down
docker-compose -f packages/twenty-docker/docker-compose.yml up -d

# Check Docker resources
docker system df

# Clean up unused resources
docker system prune -a
```

### Volume Permission Issues

**Problem:** Permission denied on volumes

```bash
Error: EACCES: permission denied
```

**Solution:**
```bash
# Fix permissions
sudo chown -R $USER:$USER packages/twenty-docker/.local-storage

# Or use Docker with user flag
docker-compose -f packages/twenty-docker/docker-compose.yml up -d \
  --user $(id -u):$(id -g)
```

## Git Issues

### Merge Conflicts

**Problem:** Conflicts when merging/rebasing

**Solution:**
```bash
# Update from upstream
git fetch upstream
git checkout main
git merge upstream/main

# Rebase your branch
git checkout feature/my-feature
git rebase main

# If conflicts occur
# 1. Edit conflicting files
# 2. Mark as resolved
git add .
git rebase --continue

# Or abort rebase
git rebase --abort
```

### Large Files

**Problem:** Cannot push large files

```bash
Error: file size exceeds GitHub's file size limit
```

**Solution:**
```bash
# Remove large files from history
git filter-branch --tree-filter 'rm -f large-file.zip' HEAD

# Or use BFG Repo-Cleaner
bfg --delete-files large-file.zip

# Add to .gitignore
echo "*.zip" >> .gitignore
echo "*.tar.gz" >> .gitignore
```

## Environment Issues

### Missing Environment Variables

**Problem:** Required env vars not set

```bash
Error: Environment variable PG_DATABASE_URL is required
```

**Solution:**
```bash
# Copy example files
cp packages/twenty-server/.env.example packages/twenty-server/.env
cp packages/twenty-front/.env.example packages/twenty-front/.env

# Edit with your values
nano packages/twenty-server/.env

# Verify variables are set
cat packages/twenty-server/.env | grep PG_DATABASE_URL
```

### Wrong Environment

**Problem:** Running in wrong environment

**Solution:**
```bash
# Check current environment
echo $NODE_ENV

# Set environment
export NODE_ENV=development

# Or set per command
NODE_ENV=production yarn build
```

## Getting More Help

### Enable Debug Logging

```bash
# Frontend
DEBUG=* yarn dev

# Backend
LOG_LEVEL=debug yarn start:dev

# Database queries
TYPEORM_LOGGING=true yarn start:dev
```

### Collect System Information

```bash
# Node and Yarn versions
node --version
yarn --version

# Docker version
docker --version
docker-compose --version

# OS information
uname -a

# Nx report
nx report

# Package versions
cat package.json | grep version
```

### Report Issues

When reporting issues, include:

1. **Error message** - Full error output
2. **Steps to reproduce** - What you did
3. **Expected behavior** - What should happen
4. **Actual behavior** - What actually happened
5. **Environment** - OS, Node version, etc.
6. **Logs** - Relevant log output

### Community Support

- **Discord:** https://discord.gg/cx5n4Jzs57
- **GitHub Issues:** https://github.com/twentyhq/twenty/issues
- **GitHub Discussions:** https://github.com/twentyhq/twenty/discussions

## Next Steps

- [CLI Commands](./25-cli-commands.md)
- [FAQ](./27-faq.md)
- [Development Setup](./03-development-setup.md)

---

**Related Documentation:**
- [Configuration](./19-configuration.md)
- [Contributing Guide](./21-contributing.md)

