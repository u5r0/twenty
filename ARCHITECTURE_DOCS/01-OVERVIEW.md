# Twenty Project Architecture Overview

## Project Summary

**Twenty** is an open-source, self-hosted CRM (Customer Relationship Management) platform. It's a full-stack application built with modern web technologies, designed for extensibility and enterprise-grade deployments.

**Repository Structure:**
- **twenty-server** - NestJS backend with GraphQL API
- **twenty-front** - React frontend with TypeScript
- **twenty-sdk** - SDK for programmatic access
- **twenty-shared** - Shared utilities and types

---

## Architecture Pattern

Twenty follows a **Client-Server Architecture** with a **GraphQL-first** approach:

```
┌─────────────────────────────────────┐
│      twenty-front (React)           │
│  - UI Components (React)            │
│  - State Management (Recoil)        │
│  - Apollo Client (GraphQL)          │
│  - Responsive Design                │
└──────────────┬──────────────────────┘
               │ GraphQL/REST
               │ WebSockets
┌──────────────▼──────────────────────┐
│   twenty-server (NestJS)            │
│  - GraphQL API (Yoga Driver)        │
│  - REST API                         │
│  - Business Logic Modules           │
│  - Database Layer (TwentyORM)       │
│  - TypeORM for Core DB              │
│  - ClickHouse Analytics             │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Database Layer                 │
│  - PostgreSQL (Core)                │
│  - PostgreSQL (Workspace Data)      │
│  - ClickHouse (Analytics)           │
│  - Redis (Caching)                  │
└─────────────────────────────────────┘
```

---

## Technology Stack

### Backend (twenty-server)
- **Framework:** NestJS 11.1.9
- **API Layer:** GraphQL (via @graphql-yoga/nestjs) + REST
- **Database ORM:** TypeORM + Custom TwentyORM
- **Query Building:** NestJS Query (@ptc-org/nestjs-query-graphql)
- **Authentication:** JWT + Passport (SAML, OIDC support)
- **Message Queue:** Bull/RabbitMQ
- **Analytics DB:** ClickHouse
- **Email:** React Email
- **AI Integration:** @ai-sdk (Anthropic, OpenAI, XAI)
- **Logging:** OpenTelemetry, Sentry

### Frontend (twenty-front)
- **Framework:** React 18.2.0
- **State Management:** Recoil 0.7.7
- **API Client:** Apollo Client 3.7.17
- **Styling:** Emotion, Linaria
- **UI Components:** Twenty-UI (custom component library)
- **Form Handling:** React Hook Form
- **Rich Text Editor:** TipTap
- **Charting:** Nivo
- **Build Tool:** Vite
- **Internationalization:** Lingui

---

## Data Flow

### Request Flow (Query/Mutation)

```
1. User Action in React Component
   ↓
2. Apollo Client sends GraphQL Query/Mutation
   ↓
3. NestJS GraphQL Server (Yoga Driver)
   ↓
4. GraphQL Resolver dispatches to Business Logic Module
   ↓
5. Module queries data via TwentyORM or TypeORM
   ↓
6. Data retrieved from PostgreSQL/ClickHouse
   ↓
7. Response serialized to GraphQL types
   ↓
8. Apollo Client updates Recoil state
   ↓
9. React Component re-renders with new data
```

### WebSocket/Subscription Flow (Real-time Updates)

```
WebSocket Connection (GraphQL Subscriptions)
   ↓
Event emitted in backend (NestJS Event Emitter)
   ↓
Subscriptions resolver broadcasts to connected clients
   ↓
Apollo Client receives update
   ↓
Recoil state updated
   ↓
React Components re-render
```

---

## Core Concepts

### Workspaces
- Each organization/team is isolated in a **workspace**
- Workspaces have their own database schemas
- Multi-tenancy is achieved through workspace separation
- Workspace data stored in dynamic PostgreSQL schemas

### Metadata vs Data
- **Metadata:** Object definitions, field configurations, permissions (stored in core schema)
- **Data:** Actual business records (stored in workspace-specific schemas)
- TwentyORM bridges this gap providing a unified interface

### Object Records
- CRM records (Companies, Contacts, Opportunities, etc.)
- Each object type is customizable through metadata
- Supports relationships: OneToMany, ManyToOne, ManyToMany

---

## Module Organization

### Backend Module Structure
```
src/
├── engine/                    # Core engine
│   ├── api/                   # API layer (GraphQL, REST)
│   ├── core-modules/          # Core business modules
│   │   ├── user/              # User management
│   │   ├── workspace/         # Workspace management
│   │   ├── auth/              # Authentication
│   │   └── ...
│   ├── metadata-modules/      # Metadata management
│   │   ├── object-metadata/   # Object definitions
│   │   ├── field-metadata/    # Field configurations
│   │   ├── view/              # View definitions
│   │   └── ...
│   ├── twenty-orm/            # Custom ORM
│   └── dataloaders/           # GraphQL DataLoaders
├── database/                  # Database configs
│   ├── typeorm/               # TypeORM configs
│   └── clickHouse/            # ClickHouse configs
└── modules/                   # Business logic modules
    ├── company/               # Company module
    ├── contact/               # Contact module
    ├── opportunity/           # Opportunity module
    └── ...
```

### Frontend Module Structure
```
src/
├── modules/                   # Feature modules
│   ├── apollo/                # GraphQL client setup
│   ├── auth/                  # Authentication UI
│   ├── companies/             # Company CRM
│   ├── contact-creation-manager/
│   ├── context-store/         # Global state (Recoil)
│   ├── object-record/         # Record CRUD UI
│   ├── views/                 # View management
│   └── ...
├── pages/                     # Page components
├── utils/                     # Utility functions
└── types/                     # TypeScript types
```

---

## Key Patterns

### 1. NestJS Module Pattern
- Each business domain has a dedicated module
- Modules export services for dependency injection
- Controllers/Resolvers handle API endpoints

### 2. GraphQL-First Design
- TypeORM/TypeGraphQL for schema generation
- Dynamic schema building based on metadata
- Scalars for custom types (UUID, DateTime, etc.)

### 3. React Component Pattern
- Functional components with hooks
- Recoil for state management
- Apollo hooks for data fetching (useQuery, useMutation)

### 4. Database Abstraction
- TwentyORM abstracts workspace-specific queries
- TypeORM for core/system tables
- ClickHouse for analytics/time-series data

---

## Authentication & Authorization

### Authentication Flow
1. User submits credentials (email/password)
2. NestJS validates against PostgreSQL
3. JWT token issued on successful authentication
4. Frontend stores token in secure storage
5. All subsequent requests include JWT in Authorization header

### Authorization
- Role-based Access Control (RBAC)
- Object-level permissions managed in metadata
- Field-level permissions supported
- Workspace membership controls access

---

## API Layer Details

### GraphQL API
- **Endpoint:** `/graphql`
- **Driver:** GraphQL Yoga (NestJS integration)
- **Schema:** Dynamically built from metadata
- **Types:** Generated from TypeORM entities
- **Directives:** Support for custom behaviors

### REST API
- **Endpoints:** `/api/v1/*`
- **Purpose:** Legacy support, webhook integrations
- **Auth:** JWT based

### Real-time (WebSockets)
- GraphQL Subscriptions via WebSockets
- Used for collaborative features
- Updates propagated to all connected clients

---

## External Integrations

### Email
- **Service:** AWS SES / Custom SMTP
- **Library:** React Email for templates
- **Use Cases:** Notifications, transactional emails

### AI/LLM
- **Providers:** OpenAI, Anthropic, XAI
- **Use:** Workflow automation, data enrichment
- **Integration:** @ai-sdk framework

### SSO/SAML
- **Providers:** OIDC, SAML 2.0
- **Purpose:** Enterprise authentication
- **Libraries:** @node-saml/passport-saml

### Calendar Sync
- **Integrations:** Google Calendar, Microsoft Graph
- **Purpose:** Sync meetings, calendar data
- **Libraries:** googleapis, @microsoft/microsoft-graph-client

---

## Deployment Architecture

### Development
- Monorepo with Nx for build orchestration
- Hot module reloading for frontend
- Backend runs on `localhost:3001`
- Frontend runs on `localhost:3000`

### Production
- Containerized deployment (Docker)
- Frontend: Static assets served via CDN/nginx
- Backend: NestJS server + queue workers
- Database: Managed PostgreSQL + ClickHouse
- Caching: Redis for sessions/cache
- Monitoring: OpenTelemetry, Sentry

---

## Performance Optimizations

1. **DataLoader Pattern:** Prevents N+1 queries in GraphQL
2. **Query Caching:** Redis caching for frequently accessed data
3. **Lazy Loading:** Dynamic imports for frontend code splitting
4. **Connection Pooling:** PostgreSQL connection pools
5. **Analytics Separation:** ClickHouse for heavy aggregations

---

## Security Considerations

1. **Authentication:** JWT with refresh tokens
2. **Authorization:** Fine-grained permission system
3. **Data Isolation:** Workspace-level data separation
4. **Input Validation:** GraphQL type system + custom validators
5. **Rate Limiting:** Implemented at GraphQL resolver level
6. **CSRF Protection:** Standard web security practices
7. **Encryption:** TLS for data in transit

---

## Future Extensibility

1. **Plugins:** Custom modules can be added to business logic
2. **Custom Fields:** Objects can be extended with custom fields
3. **Workflows:** Automation engine for business processes
4. **API Keys:** For external integrations
5. **Webhooks:** Event-driven integrations
6. **Custom Objects:** Create new CRM object types

---

## Development Workflow

### Server Development
```bash
cd packages/twenty-server
yarn dev          # Runs NestJS with hot reload
yarn database:migrate:dev
```

### Frontend Development
```bash
cd packages/twenty-front
yarn dev          # Runs Vite dev server
```

### Database Migrations
- TypeORM for core database
- Handled in `/src/database/typeorm/core/migrations/`
- Run with: `yarn database:migrate:prod`

### Testing
- Jest for unit tests
- Playwright for e2e tests
- Coverage reporting with nyc

---

## Observability & Monitoring

- **Logging:** Structured logs with OpenTelemetry
- **Tracing:** Distributed tracing support
- **Metrics:** Prometheus metrics collection
- **Error Tracking:** Sentry integration
- **Health Checks:** NestJS Terminus for readiness/liveness
