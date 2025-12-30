# System Architecture

High-level overview of Twenty's system architecture and design patterns.

## Architecture Overview

Twenty follows a modern **client-server architecture** with a clear separation between frontend and backend, communicating primarily through GraphQL.

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  twenty-front (React SPA)                              │ │
│  │  - UI Components                                       │ │
│  │  - State Management (Recoil + Apollo Cache)           │ │
│  │  - Business Logic                                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                    GraphQL / REST / WebSocket
                              │
┌─────────────────────────────────────────────────────────────┐
│                        Server Layer                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  twenty-server (NestJS)                                │ │
│  │  - GraphQL API (Yoga)                   │ │
│  │  - REST API                                            │ │
│  │  - Business Logic Modules                              │ │
│  │  - Authentication & Authorization                      │ │
│  │  - Job Queue (BullMQ)                                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ PostgreSQL   │  │ ClickHouse   │  │    Redis     │     │
│  │ (Core Data)  │  │ (Analytics)  │  │ (Cache/Jobs) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Core Architectural Patterns

### 1. Monorepo Architecture

Twenty uses **Nx** to manage a monorepo containing multiple packages:

- **Applications:** twenty-front, twenty-server, twenty-website
- **Libraries:** twenty-ui, twenty-shared, twenty-utils
- **Tools:** twenty-cli, create-twenty-app
- **Integrations:** twenty-zapier, twenty-sdk

Benefits:
- Shared code and dependencies
- Consistent tooling and standards
- Atomic cross-package changes
- Efficient CI/CD pipelines

### 2. Multi-Tenant Architecture

Twenty supports multiple workspaces with complete data isolation:

```
┌─────────────────────────────────────────────────────────┐
│              System Database (PostgreSQL)                │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │   Users    │  │ Workspaces │  │    Metadata      │  │
│  │            │  │            │  │ (Object/Field    │  │
│  │            │  │            │  │  Definitions)    │  │
│  └────────────┘  └────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼──────┐  ┌──────▼──────┐  ┌─────▼───────┐
│ Workspace 1  │  │ Workspace 2 │  │ Workspace N │
│   Database   │  │  Database   │  │  Database   │
│              │  │             │  │             │
│ - Companies  │  │ - Companies │  │ - Companies │
│ - People     │  │ - People    │  │ - People    │
│ - Custom     │  │ - Custom    │  │ - Custom    │
│   Objects    │  │   Objects   │  │   Objects   │
└──────────────┘  └─────────────┘  └─────────────┘
```

### 3. Metadata-Driven Architecture

Twenty uses a **metadata layer** to define objects and fields dynamically:

```typescript
// Metadata defines the structure
ObjectMetadata {
  name: "Company"
  fields: [
    { name: "name", type: "TEXT" },
    { name: "employees", type: "NUMBER" },
    { name: "industry", type: "SELECT" }
  ]
}

// Data follows the metadata structure
CompanyRecord {
  id: "uuid",
  name: "Acme Corp",
  employees: 100,
  industry: "Technology"
}
```

Benefits:
- Dynamic schema without migrations
- User-defined custom objects
- Flexible field types
- Runtime schema validation

### 4. GraphQL-First API

Primary API is GraphQL with automatic schema generation:

```graphql
# Query
query GetCompanies {
  companies(filter: { industry: { eq: "Technology" } }) {
    edges {
      node {
        id
        name
        employees
        people {
          edges {
            node {
              name
              email
            }
          }
        }
      }
    }
  }
}

# Mutation
mutation CreateCompany($data: CompanyCreateInput!) {
  createCompany(data: $data) {
    id
    name
  }
}

# Subscription
subscription OnCompanyUpdated {
  companyUpdated {
    id
    name
    updatedAt
  }
}
```

## Component Architecture

### Frontend (twenty-front)

```
twenty-front/
├── src/
│   ├── modules/           # Feature modules
│   │   ├── auth/          # Authentication
│   │   ├── companies/     # Companies management
│   │   ├── people/        # People management
│   │   ├── views/         # View system (table, kanban)
│   │   ├── settings/      # Settings & configuration
│   │   └── ...
│   ├── pages/             # Route components
│   ├── generated/         # Generated GraphQL types
│   ├── testing/           # Test utilities
│   └── __stories__/       # Storybook stories
```

**Key Technologies:**
- React 18 (UI framework)
- TypeScript (type safety)
- Recoil (state management)
- Apollo Client (GraphQL client)
- Emotion/Linaria (styling)
- Vite (build tool)

### Backend (twenty-server)

```
twenty-server/
├── src/
│   ├── engine/            # Core engine
│   │   ├── api/           # GraphQL API layer
│   │   ├── metadata/      # Metadata management
│   │   ├── workspace/     # Workspace management
│   │   └── twenty-orm/    # Custom ORM
│   ├── modules/           # Business logic modules
│   │   ├── auth/          # Authentication
│   │   ├── user/          # User management
│   │   ├── workflow/      # Workflow automation
│   │   ├── messaging/     # Email/messaging
│   │   └── ...
│   ├── database/          # Database migrations
│   └── integrations/      # External integrations
```

**Key Technologies:**
- NestJS (framework)
- GraphQL Yoga (GraphQL server)
- TypeORM (database ORM)
- TwentyORM (custom ORM layer)
- BullMQ (job queue)
- Passport (authentication)

## Data Flow

### Request Flow

```
1. User Action (Click, Type, etc.)
   ↓
2. React Component Handler
   ↓
3. Apollo Client (GraphQL Query/Mutation)
   ↓
4. HTTP Request to Backend
   ↓
5. NestJS Middleware (Auth, Logging, etc.)
   ↓
6. GraphQL Resolver
   ↓
7. Business Logic Service
   ↓
8. TwentyORM Repository
   ↓
9. TypeORM Query Builder
   ↓
10. PostgreSQL Database
    ↓
11. Response (JSON)
    ↓
12. Apollo Cache Update
    ↓
13. Recoil State Update (if needed)
    ↓
14. Component Re-render
```

### Real-time Updates Flow

```
1. Database Change (Insert/Update/Delete)
   ↓
2. TypeORM Subscriber Triggered
   ↓
3. Event Emitter Publishes Event
   ↓
4. WebSocket Server Broadcasts
   ↓
5. Apollo Client Subscription Receives
   ↓
6. Cache Updated
   ↓
7. UI Updates Automatically
```

## Authentication & Authorization

### Authentication Flow

```
1. User Login Request
   ↓
2. Validate Credentials
   ↓
3. Generate JWT Tokens
   - Access Token (short-lived)
   - Refresh Token (long-lived)
   ↓
4. Return Tokens to Client
   ↓
5. Client Stores Tokens
   ↓
6. Include Access Token in Requests
   ↓
7. Server Validates Token
   ↓
8. Extract User & Workspace Context
```

### Authorization Layers

1. **Workspace-Level**
   - User must belong to workspace
   - Workspace isolation enforced

2. **Role-Level**
   - Admin, Member, Viewer roles
   - Custom roles supported

3. **Object-Level**
   - Read, Create, Update, Delete permissions
   - Per-object permission rules

4. **Field-Level**
   - View, Edit permissions
   - Per-field access control

## Caching Strategy

### Frontend Caching

**Apollo Client Cache:**
- Normalized cache for GraphQL data
- Automatic cache updates on mutations
- Optimistic UI updates
- Cache persistence (optional)

**Recoil State:**
- UI state (filters, selections, etc.)
- Derived state (computed values)
- Atom effects for persistence

### Backend Caching

**Redis Cache:**
- Session storage
- Metadata cache (hot data)
- Rate limiting counters
- Job queue data

**In-Memory Cache:**
- Frequently accessed metadata
- User permissions
- Workspace settings

## Scalability Considerations

### Horizontal Scaling

**Frontend:**
- Static assets served via CDN
- Multiple frontend instances behind load balancer
- Client-side rendering reduces server load

**Backend:**
- Stateless API servers
- Load balancer distributes requests
- Shared Redis for session state
- Shared PostgreSQL for data

### Vertical Scaling

**Database:**
- Connection pooling
- Read replicas for queries
- Write master for mutations
- ClickHouse for analytics queries

**Job Processing:**
- Separate worker processes
- BullMQ for distributed jobs
- Horizontal worker scaling

## Performance Optimizations

### Frontend

1. **Code Splitting**
   - Route-based splitting
   - Component lazy loading
   - Dynamic imports

2. **Memoization**
   - React.memo for components
   - useMemo for expensive computations
   - useCallback for stable references

3. **Virtual Lists**
   - Render only visible items
   - Efficient scrolling for large datasets

4. **Apollo Optimizations**
   - Fetch policies (cache-first, network-only)
   - Batch queries
   - DataLoader pattern

### Backend

1. **Database Indexing**
   - Indexes on frequently queried fields
   - Composite indexes for complex queries
   - Partial indexes for filtered queries

2. **Query Optimization**
   - DataLoader for N+1 prevention
   - Eager loading for relations
   - Query result caching

3. **Job Queue**
   - Async processing for heavy tasks
   - Email sending
   - Data imports/exports
   - Webhook calls

## Security Architecture

### Network Security

- HTTPS/TLS for all connections
- WSS for WebSocket connections
- CORS configuration
- Rate limiting

### Application Security

- JWT token authentication
- Password hashing (bcrypt)
- SQL injection prevention (parameterized queries)
- XSS prevention (React escaping)
- CSRF protection

### Data Security

- Workspace data isolation
- Row-level security
- Soft deletes for audit trail
- Encrypted sensitive fields

## Deployment Architecture

### Development

```
Developer Machine
├── Frontend (Vite Dev Server)
├── Backend (NestJS Dev Server)
├── PostgreSQL (Docker)
└── Redis (Docker)
```

### Production

```
┌─────────────────────────────────────────┐
│          Load Balancer / CDN            │
└─────────────────┬───────────────────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
┌───▼────┐                 ┌────▼───┐
│Frontend│                 │Backend │
│Servers │                 │Servers │
│(Static)│                 │(API)   │
└────────┘                 └────┬───┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
              ┌─────▼──┐   ┌────▼───┐  ┌───▼────┐
              │Postgres│   │ Redis  │  │Workers │
              └────────┘   └────────┘  └────────┘
```

## Monitoring & Observability

### Logging

- Structured logging (JSON)
- Log levels (debug, info, warn, error)
- Request/response logging
- Error tracking (Sentry)

### Metrics

- API response times
- Database query performance
- Cache hit rates
- Job queue metrics

### Tracing

- Distributed tracing
- Request correlation IDs
- Performance profiling

## Next Steps

- [Monorepo Structure](./05-monorepo-structure.md)
- [Technology Stack](./06-technology-stack.md)
- [Frontend Architecture](./07-frontend-architecture.md)
- [Backend Architecture](./11-backend-architecture.md)

---

**Related Documentation:**
- [Database & ORM](./12-database-orm.md)
- [GraphQL API](./13-graphql-api.md)
- [Authentication](./14-auth.md)

