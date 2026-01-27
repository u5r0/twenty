# Configuration Guide

Complete guide to configuring Twenty for different environments.

## Environment Variables

### Backend Configuration

#### Database

```env
# PostgreSQL
PG_DATABASE_URL=postgres://user:password@localhost:5432/twenty
POST=localhost
PG_DATABASE_PORT=5432
PG_DATABASE_USER=twenty
PG_DATABASE_PASSWORD=your-password
PG_DATABASE_NAME=twenty

# ClickHouse (Analytics)
CLICKHOUSE_URL=http://localhost:8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
CLICKHOUSE_DATABASE=twenty_analytics

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

#### Server

```env
# Server
PORT=3001
NODE_ENV=development
FRONT_BASE_URL=http://localhost:3000

# CORS
CORS_ORIGIN=http://localhost:3000
```

#### Authentication

```env
# JWT Secrets (generate with: openssl rand -base64 32)
ACCESS_TOKEN_SECRET=your-access-token-secret-here
LOGIN_TOKEN_SECRET=your-login-token-secret-here
REFRESH_TOKEN_SECRET=your-refresh-token-secret-here
FILE_TOKEN_SECRET=your-file-token-secret-here

# Token Expiration
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
LOGIN_TOKEN_EXPIRES_IN=15m
```

#### Email

```env
# Email Configuration
EMAIL_FROM_ADDRESS=noreply@your-domain.com
EMAIL_SYSTEM_ADDRESS=system@your-domain.com

# SMTP
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=your-email@gmail.com
EMAIL_SMTP_PASSWORD=your-app-password
EMAIL_SMTP_SECURE=false

# SendGrid (alternative)
SENDGRID_API_KEY=your-sendgrid-api-key
```

#### Storage

```env
# Storage Type (local, s3)
STORAGE_TYPE=local

# Local Storage
STORAGE_LOCAL_PATH=.local-storage

# S3 Storage
STORAGE_S3_REGION=us-east-1
STORAGE_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
STORAGE_S3_ENDPOINT=https://s3.amazonaws.com
```

#### OAuth

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_CALLBACK_URL=http://localhost:3001/auth/microsoft/callback
```

#### Monitoring

```env
# Sentry
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=production

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### Frontend Configuration

```env
# API
REACT_APP_SERVER_BASE_URL=http://localhost:3001
REACT_APP_GRAPHQL_ENDPOINT=http://localhost:3001/graphql
REACT_APP_WS_ENDPOINT=ws://localhost:3001/graphql

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_WORKFLOWS=true
REACT_APP_ENABLE_CUSTOM_OBJECTS=true

# Sentry
REACT_APP_SENTRY_DSN=your-sentry-dsn
REACT_APP_SENTRY_ENVIRONMENT=production

# Build
VITE_DISABLE_TYPESCRIPT_CHECKER=false
```

## Configuration Files

### TypeORM Configuration

```typescript
// packages/twenty-server/src/database/typeorm.config.ts
import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';

export const typeOrmConfig = (
  configService: ConfigService,
): DataSourceOptions => ({
  type: 'postgres',
  url: configService.get('PG_DATABASE_URL'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  synchronize: false,
  logging: configService.get('NODE_ENV') === 'development',
  extra: {
    max: 20, // Maximum pool size
    min: 5,  // Minimum pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
});

export default new DataSource(typeOrmConfig(new ConfigService()));
```

### Redis Configuration

```typescript
// packages/twenty-server/src/config/redis.config.ts
import { ConfigService } from '@nestjs/config';

export const redisConfig = (configService: ConfigService) => ({
  host: configService.get('REDIS_HOST', 'localhost'),
  port: configService.get('REDIS_PORT', 6379),
  password: configService.get('REDIS_PASSWORD'),
  db: 0,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});
```

### BullMQ Configuration

```typescript
// packages/twenty-server/src/config/queue.config.ts
import { BullModuleOptions } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';

export const queueConfig = (
  configService: ConfigService,
): BullModuleOptions => ({
  redis: {
    host: configService.get('REDIS_HOST', 'localhost'),
    port: configService.get('REDIS_PORT', 6379),
    password: configService.get('REDIS_PASSWORD'),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
```

### Apollo Client Configuration

```typescript
// packages/twenty-front/src/apollo-client.ts
import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const httpLink = createHttpLink({
  uri: process.env.REACT_APP_GRAPHQL_ENDPOINT || 'http://localhost:3001/graphql',
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: process.env.REACT_APP_WS_ENDPOINT || 'ws://localhost:3001/graphql',
    connectionParams: () => ({
      authorization: localStorage.getItem('accessToken'),
    }),
  })
);

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('accessToken');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  authLink.concat(httpLink)
);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          companies: {
            keyArgs: ['filter', 'sort'],
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
});
```

## Environment-Specific Configuration

### Development

```env
# .env.development
NODE_ENV=development
PORT=3001
FRONT_BASE_URL=http://localhost:3000

# Database
PG_DATABASE_URL=postgres://twenty:twenty@localhost:5432/twenty_dev

# Logging
LOG_LEVEL=debug
TYPEORM_LOGGING=true

# Email (use Mailtrap for testing)
EMAIL_SMTP_HOST=smtp.mailtrap.io
EMAIL_SMTP_PORT=2525
EMAIL_SMTP_USER=your-mailtrap-user
EMAIL_SMTP_PASSWORD=your-mailtrap-password

# Storage
STORAGE_TYPE=local
STORAGE_LOCAL_PATH=.local-storage
```

### Staging

```env
# .env.staging
NODE_ENV=staging
PORT=3001
FRONT_BASE_URL=https://staging.your-domain.com

# Database
PG_DATABASE_URL=postgres://user:password@staging-db:5432/twenty_staging

# Logging
LOG_LEVEL=info
TYPEORM_LOGGING=false

# Email
EMAIL_SMTP_HOST=smtp.sendgrid.net
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=apikey
EMAIL_SMTP_PASSWORD=your-sendgrid-api-key

# Storage
STORAGE_TYPE=s3
STORAGE_S3_REGION=us-east-1
STORAGE_S3_BUCKET=twenty-staging

# Monitoring
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=staging
```

### Production

```env
# .env.production
NODE_ENV=production
PORT=3001
FRONT_BASE_URL=https://your-domain.com

# Database
PG_DATABASE_URL=postgres://user:password@prod-db:5432/twenty_prod

# Logging
LOG_LEVEL=warn
TYPEORM_LOGGING=false

# Email
EMAIL_SMTP_HOST=smtp.sendgrid.net
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=apikey
EMAIL_SMTP_PASSWORD=your-sendgrid-api-key

# Storage
STORAGE_TYPE=s3
STORAGE_S3_REGION=us-east-1
STORAGE_S3_BUCKET=twenty-production

# Monitoring
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=production

# Security
CORS_ORIGIN=https://your-domain.com
```

## Docker Configuration

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: ${PG_DATABASE_USER:-twenty}
      POSTGRES_PASSWORD: ${PG_DATABASE_PASSWORD:-twenty}
      POSTGRES_DB: ${PG_DATABASE_NAME:-twenty}
    ports:
      - "${PG_DATABASE_PORT:-5432}:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U twenty"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  server:
    build:
      context: .
      dockerfile: packages/twenty-server/Dockerfile
    environment:
      - NODE_ENV=${NODE_ENV:-production}
      - PORT=${PORT:-3001}
      - PG_DATABASE_URL=${PG_DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - ACCESS_TOKEN_SECRET=${ACCESS_TOKEN_SECRET}
      - REFRESH_TOKEN_SECRET=${REFRESH_TOKEN_SECRET}
    ports:
      - "${PORT:-3001}:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  worker:
    build:
      context: .
      dockerfile: packages/twenty-server/Dockerfile
    command: yarn worker:prod
    environment:
      - NODE_ENV=${NODE_ENV:-production}
      - PG_DATABASE_URL=${PG_DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - server

  front:
    build:
      context: .
      dockerfile: packages/twenty-front/Dockerfile
    environment:
      - REACT_APP_SERVER_BASE_URL=${FRONT_BASE_URL}
    ports:
      - "3000:3000"
    depends_on:
      - server

volumes:
  postgres-data:
  redis-data:
```

## Kubernetes Configuration

### ConfigMap

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: twenty-config
  namespace: twenty
data:
  NODE_ENV: "production"
  PORT: "3001"
  FRONT_BASE_URL: "https://your-domain.com"
  PG_DATABASE_HOST: "postgres"
  PG_DATABASE_PORT: "5432"
  PG_DATABASE_NAME: "twenty"
  REDIS_HOST: "redis"
  REDIS_PORT: "6379"
  LOG_LEVEL: "info"
  STORAGE_TYPE: "s3"
  STORAGE_S3_REGION: "us-east-1"
```

### Secrets

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: twenty-secrets
  namespace: twenty
type: Opaque
stringData:
  PG_DATABASE_PASSWORD: "your-postgres-password"
  ACCESS_TOKEN_SECRET: "your-access-token-secret"
  REFRESH_TOKEN_SECRET: "your-refresh-token-secret"
  LOGIN_TOKEN_SECRET: "your-login-token-secret"
  FILE_TOKEN_SECRET: "your-file-token-secret"
  AWS_ACCESS_KEY_ID: "your-aws-access-key"
  AWS_SECRET_ACCESS_KEY: "your-aws-secret-key"
  SENDGRID_API_KEY: "your-sendgrid-api-key"
  SENTRY_DSN: "your-sentry-dsn"
```

## Configuration Best Practices

1. **Never commit secrets to version control**
2. **Use environment-specific .env files**
3. **Validate configuration on startup**
4. **Use strong secrets in production**
5. **Enable HTTPS in production**
6. **Configure proper CORS origins**
7. **Set appropriate log levels**
8. **Use connection pooling**
9. **Configure health checks**
10. **Monitor configuration changes**

## Configuration Validation

```typescript
// packages/twenty-server/src/config/validation.ts
import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3001),
  PG_DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().required(),
  ACCESS_TOKEN_SECRET: Joi.string().required(),
  REFRESH_TOKEN_SECRET: Joi.string().required(),
  LOGIN_TOKEN_SECRET: Joi.string().required(),
  FILE_TOKEN_SECRET: Joi.string().required(),
  FRONT_BASE_URL: Joi.string().uri().required(),
  STORAGE_TYPE: Joi.string().valid('local', 's3').default('local'),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
});
```

## Next Steps

- [Deployment Guide](./18-deployment.md)
- [Monitoring](./20-monitoring.md)
- [Troubleshooting](./26-troubleshooting.md)

---

**Related Documentation:**
- [Development Setup](./03-development-setup.md)
- [System Architecture](./04-system-architecture.md)

