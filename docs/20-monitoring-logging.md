# Monitoring and Logging

Comprehensive guide to monitoring, logging, and observability in Twenty.

## Table of Contents

- [Overview](#overview)
- [Logging Strategy](#logging-strategy)
- [Monitoring Setup](#monitoring-setup)
- [Metrics and Alerts](#metrics-and-alerts)
- [Tracing](#tracing)
- [Error Tracking](#error-tracking)
-ance Monitoring](#performance-monitoring)
- [Log Management](#log-management)
- [Best Practices](#best-practices)

## Overview

Twenty uses a comprehensive observability stack to ensure system health, performance, and reliability.

### Observability Pillars

1. **Logs** - Detailed event records
2. **Metrics** - Quantitative measurements
3. **Traces** - Request flow tracking
4. **Errors** - Exception tracking

### Key Tools

- **Winston** - Structured logging
- **Prometheus** - Metrics collection
- **Grafana** - Visualization
- **Sentry** - Error tracking
- **OpenTelemetry** - Distributed tracing

## Logging Strategy

### Backend Logging

#### Winston Configuration

```typescript
// packages/twenty-server/src/core/logger/logger.service.ts
import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class TwentyLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'twenty-server' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
```

#### Structured Logging

```typescript
// Example: Logging in a service
import { Injectable } from '@nestjs/common';
import { TwentyLoggerService } from '@/core/logger/logger.service';

@Injectable()
export class CompanyService {
  constructor(private logger: TwentyLoggerService) {}

  async createCompany(data: CreateCompanyInput) {
    this.logger.log(
      'Creating company',
      JSON.stringify({
        action: 'create_company',
        userId: data.userId,
        companyName: data.name,
      })
    );

    try {
      const company = await this.companyRepository.save(data);

      this.logger.log(
        'Company created successfully',
        JSON.stringify({
          action: 'company_created',
          companyId: company.id,
          userId: data.userId,
        })
      );

      return company;
    } catch (error) {
      this.logger.error(
        'Failed to create company',
        error.stack,
        JSON.stringify({
          action: 'create_company_failed',
          userId: data.userId,
          error: error.message,
        })
      );
      throw error;
    }
  }
}
```

### Frontend Logging

#### Console Logging Wrapper

```typescript
// packages/twenty-front/src/modules/core/utils/logger.ts
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  debug(message: string, data?: any) {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data);
    }
  }

  info(message: string, data?: any) {
    console.info(`[INFO] ${message}`, data);
  }

  warn(message: string, data?: any) {
    console.warn(`[WARN] ${message}`, data);
  }

  error(message: string, error?: Error, data?: any) {
    console.error(`[ERROR] ${message}`, error, data);

    // Send to error tracking service
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        extra: { message, data },
      });
    }
  }
}

export const logger = new Logger();
```

#### Usage in Components

```typescript
import { logger } from '@/core/utils/logger';

export const CompanyList = () => {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    logger.debug('Fetching companies');

    fetchCompanies()
      .then((data) => {
        logger.info('Companies fetched', { count: data.length });
        setCompanies(data);
      })
      .catch((error) => {
        logger.error('Failed to fetch companies', error);
      });
  }, []);

  return <div>{/* ... */}</div>;
};
```

## Monitoring Setup

### Prometheus Metrics

#### Metrics Configuration

```typescript
// packages/twenty-server/src/core/metrics/metrics.module.ts
import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
})
export class MetricsModule {}
```

#### Custom Metrics

```typescript
// packages/twenty-server/src/core/metrics/metrics.service.ts
import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('http_requests_total')
    private httpRequestsCounter: Counter,

    @InjectMetric('http_request_duration_seconds')
    private httpRequestDuration: Histogram,

    @InjectMetric('active_connections')
    private activeConnections: Gauge,
  ) {}

  incrementHttpRequests(method: string, route: string, status: number) {
    this.httpRequestsCounter.inc({
      method,
      route,
      status,
    });
  }

  recordHttpDuration(method: string, route: string, duration: number) {
    this.httpRequestDuration.observe(
      { method, route },
      duration
    );
  }

  setActiveConnections(count: number) {
    this.activeConnections.set(count);
  }
}
```

#### Metrics Middleware

```typescript
// packages/twenty-server/src/core/metrics/metrics.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;

      this.metricsService.incrementHttpRequests(
        req.method,
        req.route?.path || req.path,
        res.statusCode
      );

      this.metricsService.recordHttpDuration(
        req.method,
        req.route?.path || req.path,
        duration
      );
    });

    next();
  }
}
```

### Grafana Dashboards

#### Dashboard Configuration

```json
{
  "dashboard": {
    "title": "Twenty Application Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])"
          }
        ]
      },
      {
        "title": "Active Connections",
        "targets": [
          {
            "expr": "active_connections"
          }
        ]
      }
    ]
  }
}
```

## Metrics and Alerts

### Key Metrics

#### Application Metrics

```typescript
// Custom business metrics
export class BusinessMetrics {
  // User activity
  @Counter('user_logins_total')
  userLogins: Counter;

  @Counter('user_signups_total')
  userSignups: Counter;

  // Data operations
  @Counter('companies_created_total')
  companiesCreated: Counter;

  @Counter('contacts_created_total')
  contactsCreated: Counter;

  @Histogram('graphql_query_duration_seconds')
  graphqlQueryDuration: Histogram;

  // Cache metrics
  @Counter('cache_hits_total')
  cacheHits: Counter;

  @Counter('cache_misses_total')
  cacheMisses: Counter;

  // Database metrics
  @Histogram('db_query_duration_seconds')
  dbQueryDuration: Histogram;

  @Counter('db_connection_errors_total')
  dbConnectionErrors: Counter;
}
```

### Alert Rules

#### Prometheus Alert Rules

```yaml
# prometheus-alerts.yml
groups:
  - name: twenty_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} requests/sec"

      # Slow response time
      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Slow response time"
          description: "95th percentile response time is {{ $value }}s"

      # Database connection issues
      - alert: DatabaseConnectionErrors
        expr: rate(db_connection_errors_total[5m]) > 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection errors"
          description: "{{ $value }} connection errors per second"

      # High memory usage
      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes / 1024 / 1024 > 1024
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value }}MB"

      # Cache hit rate too low
      - alert: LowCacheHitRate
        expr: rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m])) < 0.7
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Low cache hit rate"
          description: "Cache hit rate is {{ $value }}"
```

## Tracing

### OpenTelemetry Setup

#### Configuration

```typescript
// packages/twenty-server/src/core/tracing/tracing.module.ts
import { Module } from '@nestjs/common';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

@Module({})
export class TracingModule {
  static forRoot() {
    const sdk = new NodeSDK({
      traceExporter: new JaegerExporter({
        endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
      }),
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': {
            enabled: false,
          },
        }),
      ],
    });

    sdk.start();

    return {
      module: TracingModule,
    };
  }
}
```

#### Custom Spans

```typescript
import { trace } from '@opentelemetry/api';

export class CompanyService {
  private tracer = trace.getTracer('company-service');

  async createCompany(data: CreateCompanyInput) {
    const span = this.tracer.startSpan('createCompany');

    try {
      span.setAttribute('user.id', data.userId);
      span.setAttribute('company.name', data.name);

      const company = await this.companyRepository.save(data);

      span.setStatus({ code: SpanStatusCode.OK });
      return company;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      throw error;
    } finally {
      span.end();
    }
  }
}
```

## Error Tracking

### Sentry Integration

#### Backend Setup

```typescript
// packages/twenty-server/src/main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Postgres(),
  ],
});

// Error filter
app.useGlobalFilters(new SentryExceptionFilter());
```

#### Frontend Setup

```typescript
// packages/twenty-front/src/index.tsx
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [new BrowserTracing()],
  tracesSampleRate: 1.0,
});

// Error boundary
const App = () => (
  <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
    <AppContent />
  </Sentry.ErrorBoundary>
);
```

#### Custom Error Context

```typescript
import * as Sentry from '@sentry/node';

export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
    tags: {
      component: context?.component,
      action: context?.action,
    },
  });
}

// Usage
try {
  await createCompany(data);
} catch (error) {
  captureError(error, {
    component: 'CompanyService',
    action: 'createCompany',
    userId: data.userId,
  });
  throw error;
}
```

## Performance Monitoring

### Frontend Performance

#### Web Vitals Tracking

```typescript
// packages/twenty-front/src/modules/core/performance/web-vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to your analytics service
  console.log(metric);

  // Send to backend
  fetch('/api/analytics/web-vitals', {
    method: 'POST',
    body: JSON.stringify(metric),
    headers: { 'Content-Type': 'application/json' },
  });
}

export function initWebVitals() {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
}
```

#### React Performance Profiling

```typescript
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) {
  console.log({
    id,
    phase,
    actualDuration,
    baseDuration,
  });
}

export const ProfiledComponent = () => (
  <Profiler id="CompanyList" onRender={onRenderCallback}>
    <CompanyList />
  </Profiler>
);
```

### Backend Performance

#### Query Performance Monitoring

```typescript
// packages/twenty-server/src/core/database/query-logger.ts
import { Logger } from 'typeorm';

export class QueryLogger implements Logger {
  logQuery(query: string, parameters?: any[]) {
    const start = Date.now();

    return () => {
      const duration = Date.now() - start;

      if (duration > 1000) {
        console.warn('Slow query detected', {
          query,
          parameters,
          duration,
        });
      }
    };
  }

  logQueryError(error: string, query: string, parameters?: any[]) {
    console.error('Query error', {
      error,
      query,
      parameters,
    });
  }

  logQuerySlow(time: number, query: string, parameters?: any[]) {
    console.warn('Slow query', {
      time,
      query,
      parameters,
    });
  }

  logSchemaBuild(message: string) {
    console.log('Schema build', message);
  }

  logMigration(message: string) {
    console.log('Migration', message);
  }

  log(level: 'log' | 'info' | 'warn', message: any) {
    console[level](message);
  }
}
```

## Log Management

### Log Aggregation

#### ELK Stack Setup

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5000:5000"
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  elasticsearch-data:
```

#### Logstash Configuration

```conf
# logstash.conf
input {
  tcp {
    port => 5000
    codec => json
  }
}

filter {
  if [level] == "error" {
    mutate {
      add_tag => ["error"]
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "twenty-logs-%{+YYYY.MM.dd}"
  }
}
```

### Log Rotation

```typescript
// packages/twenty-server/src/core/logger/logger.service.ts
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const transport = new winston.transports.DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
});

const logger = winston.createLogger({
  transports: [transport],
});
```

## Best Practices

### Logging Best Practices

1. **Use Structured Logging**
```typescript
// Good
logger.info('User created', { userId: user.id, email: user.email });

// Bad
logger.info(`User ${user.id} created with email ${user.email}`);
```

2. **Log Levels**
- `ERROR`: System errors requiring immediate attention
- `WARN`: Potential issues that don't break functionality
- `INFO`: Important business events
- `DEBUG`: Detailed diagnostic information
- `VERBOSE`: Very detailed information

3. **Sensitive Data**
```typescript
// Never log sensitive data
logger.info('User login', {
  userId: user.id,
  // password: user.password, // NEVER!
  // token: user.token, // NEVER!
});
```

4. **Context Information**
```typescript
logger.info('Operation completed', {
  operation: 'createCompany',
  userId: context.userId,
  workspaceId: context.workspaceId,
  duration: Date.now() - startTime,
});
```

### Monitoring Best Practices

1. **Monitor What Matters**
- Request rate and latency
- Error rates
- Database performance
- Cache hit rates
- Business metrics

2. **Set Meaningful Alerts**
- Avoid alert fatigue
- Set appropriate thresholds
- Include actionable information
- Test alert rules

3. **Dashboard Design**
- Group related metrics
- Use appropriate visualizations
- Include time ranges
- Add annotations for deployments

### Performance Best Practices

1. **Minimize Overhead**
```typescript
// Sample traces, don't trace everything
const shouldTrace = Math.random() < 0.1; // 10% sampling

if (shouldTrace) {
  const span = tracer.startSpan('operation');
  // ... operation
  span.end();
}
```

2. **Async Logging**
```typescript
// Don't block on logging
logger.info('Event', data); // Fire and forget
```

3. **Batch Metrics**
```typescript
// Batch metric updates
const metrics = [];
metrics.push({ name: 'requests', value: 1 });
// ... collect more
sendMetricsBatch(metrics);
```

## Related Documentation

- [Deployment Guide](./18-deployment.md) - Production deployment
- [Configuration](./19-configuration.md) - Environment configuration
- [Troubleshooting](./26-troubleshooting.md) - Common issues
- [Backend Architecture](./11-backend-architecture.md) - Server architecture

---

*Last updated: December 31, 2024*

