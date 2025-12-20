# Twenty Architecture - Quick Reference Guide

## System Overview (One Page)

```
FRONTEND (React + TypeScript)              BACKEND (NestJS)                DATABASE
┌─────────────────────────────┐           ┌──────────────────────────┐   ┌──────────────┐
│ Pages & Components          │           │ GraphQL API (Yoga)       │   │ PostgreSQL   │
│ ├── Companies               │◄──────────►├── Resolvers              │──►├── Core       │
│ ├── Contacts                │   HTTP    │ ├── Company Resolver     │   │   Schema     │
│ ├── Opportunities           │  GraphQL  │ ├── Person Resolver      │   ├── Workspace  │
│ ├── Settings                │  WebSocket│ └── Opportunity Resolver │   │   Schemas    │
│                             │           │                          │   │              │
│ State Management            │           │ Business Logic Modules   │   │ ClickHouse   │
│ ├── Recoil Atoms            │           │ ├── Company Service      │   ├── Analytics  │
│ ├── Selectors               │           │ ├── Person Service       │   │   Data       │
│ └── Apollo Cache             │           │ └── ...                  │   │              │
│                             │           │                          │   │ Redis        │
│ Forms & Validation          │           │ Data Access Layer        │   ├── Cache      │
│ ├── React Hook Form         │           │ ├── TwentyORM            │   │── Sessions   │
│ └── Field Components        │           │ ├── TypeORM Repositories │   │              │
└─────────────────────────────┘           │ └── DataLoaders          │   └──────────────┘
                                          │                          │
                                          │ Authentication & Auth    │
                                          │ ├── JWT Validation       │
                                          │ ├── Permission Checks    │
                                          │ └── Role-Based Access    │
                                          └──────────────────────────┘
```

---

## Request/Response Cycle

```
USER ACTION (Click button, submit form)
        ↓
REACT COMPONENT
        ↓
Apollo Client / Recoil State Update
        ↓
GraphQL Query/Mutation sent to /graphql
        ↓
NestJS GraphQL Resolver
        ↓
Service Business Logic
        ↓
TwentyORM/TypeORM Query Builder
        ↓
PostgreSQL / ClickHouse Query
        ↓
Data Retrieved
        ↓
Response Serialized to GraphQL Types
        ↓
Apollo Cache Updated
        ↓
Recoil Atoms Updated
        ↓
React Components Re-render
        ↓
UI Updated
```

---

## State Management Layer Model

### Frontend States

```
┌─────────────────────────────────────────────────────────┐
│  Global Application State (Recoil Atoms)               │
│                                                         │
│  ├── User State (currentUser, isLoggedIn)             │
│  ├── Workspace State (currentWorkspace)               │
│  ├── Navigation State (currentPage, sidebarOpen)      │
│  ├── UI State (modalOpen, toastNotifications)         │
│  ├── View State (filters, sorting, pagination)        │
│  └── Selection State (selectedRecords, selectedView)  │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│  Server State (Apollo Cache)                           │
│                                                         │
│  ├── Companies (normalized)                            │
│  ├── Contacts (normalized)                             │
│  ├── Opportunities (normalized)                        │
│  └── Custom Objects (normalized)                       │
│                                                         │
│  Automatically synced via GraphQL queries/mutations    │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│  Component Local State (React Hooks)                   │
│                                                         │
│  ├── Form Field Values                                 │
│  ├── Temporary UI State (hover, focus)                │
│  └── Animation States                                  │
└─────────────────────────────────────────────────────────┘
```

---

## Data Model Layers

```
┌─────────────────────────────────────────────────────────┐
│  CORE DATABASE (PostgreSQL)                            │
│                                                         │
│  core schema:                                          │
│  ├── user (login accounts)                             │
│  ├── workspace (organizations)                         │
│  ├── userWorkspace (membership)                        │
│  ├── appToken (API credentials)                        │
│  ├── objectMetadata (object definitions)               │
│  ├── fieldMetadata (field definitions)                 │
│  ├── role & objectPermission (access control)         │
│  └── view (UI configuration)                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  WORKSPACE SCHEMAS (PostgreSQL)                        │
│  One schema per workspace                              │
│                                                         │
│  workspace_abc123:                                     │
│  ├── company (CRM records)                            │
│  ├── person (CRM records)                             │
│  ├── opportunity (CRM records)                        │
│  ├── custom_object_X (custom objects)                 │
│  └── relationships (join tables)                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  ANALYTICS (ClickHouse)                                │
│                                                         │
│  ├── activity_events (user actions)                    │
│  ├── audit_logs (data changes)                        │
│  ├── time_series_data (metrics)                       │
│  └── aggregations (dashboards)                        │
└─────────────────────────────────────────────────────────┘
```

---

## API Endpoints & Methods

```
GraphQL (Primary)
├── Query (fetch data)
│   ├── company(id) → Company
│   ├── companies(filter, sort, pagination) → CompanyConnection
│   ├── person(id) → Person
│   └── person(id) → Person
│
├── Mutation (modify data)
│   ├── createCompany(input) → Company
│   ├── updateCompany(id, input) → Company
│   ├── deleteCompany(id) → Company
│   ├── bulkCreatePeople(inputs) → [Person]
│   └── bulkUpdateCompanies(ids, input) → [Company]
│
└── Subscription (real-time)
    ├── companyChanged(workspaceId) → Change Event
    ├── companyDeleted(companyId) → Deletion Event
    └── objectRecordUpdated(objectType) → Update Event

REST API (Legacy)
├── GET    /api/v1/companies
├── POST   /api/v1/companies
├── PATCH  /api/v1/companies/{id}
└── DELETE /api/v1/companies/{id}
```

---

## Key Concepts Mapping

```
CONCEPT              IMPLEMENTATION
─────────────────────────────────────────────────────────
Workspace            Isolated PostgreSQL schema per org
Multi-tenancy        Schema separation + workspace filtering
Customizable Object  objectMetadata + fieldMetadata
Dynamic Field        Field types + JSONB storage
Relationship         Foreign keys + join tables
Permission          RBAC via role + objectPermission
Audit Trail         Soft deletes + timelineEvent table
Search              Full-text indexes + ClickHouse
Collaboration       WebSocket subscriptions
Analytics          ClickHouse time-series data
Real-time Updates  GraphQL subscriptions + event emitter
```

---

## Technology Decision Matrix

```
Decision                Backend          Frontend
──────────────────────────────────────────────────────
Framework             NestJS           React
Language              TypeScript        TypeScript
API Style             GraphQL + REST    GraphQL
ORM/State             TypeORM + Nest    Apollo + Recoil
Database              PostgreSQL        Browser Cache
Cache                 Redis             Apollo Cache
Styling               N/A               Emotion/Linaria
Build Tool            Standard Node     Vite
Authentication        JWT              localStorage
State Scope           Per Request       Global/Local
Real-time             WebSocket         WebSocket
Testing               Jest              Jest + RTL
Logging               OpenTelemetry     Console API
```

---

## Common Operations

### Create a Company
```
Frontend (React)
└─> Apollo Client (useMutation)
    └─> GraphQL (mutation createCompany)
        └─> NestJS Resolver (createCompany)
            └─> Service (companyService.create)
                └─> TypeORM Repository (save)
                    └─> PostgreSQL (INSERT)
                        └─> Return new Company
                            └─> Apollo Cache Update
                                └─> Component Re-render
```

### Update Company from Multiple Users
```
User A edits Company
└─> Mutation sent
    └─> Server persists to DB
        └─> Event emitter broadcasts
            └─> WebSocket to all clients
                └─> User B receives subscription event
                    └─> Apollo cache invalidated
                        └─> Both UIs show updated data
```

### Filter & Sort Companies
```
Frontend (View Component)
└─> Recoil (filterState, sortState)
    └─> Selector recalculates
        └─> Apollo Query with variables
            └─> NestJS Resolver receives filter/sort
                └─> Query Builder applies
                    └─> PostgreSQL executes
                        └─> Results paginated
                            └─> Apollo Cache stores
                                └─> Components re-render
```

---

## File Organization Summary

```
Frontend Module Structure          Backend Module Structure
───────────────────────────────    ──────────────────────────
modules/companies/                 src/modules/company/
├── components/                    ├── company.service.ts
├── hooks/                         ├── company.resolver.ts
├── states/ (Recoil)               ├── company.module.ts
├── types/                         ├── entities/
├── graphql/                       │   └── company.entity.ts
│   ├── queries.ts                 ├── dto/
│   ├── mutations.ts               │   ├── create-company.dto.ts
│   └── fragments.ts               │   └── update-company.dto.ts
└── utils/                         └── repositories/
                                       └── company.repository.ts
```

---

## Debugging Checklist

```
Frontend Issues
□ Check browser console for errors
□ Verify Apollo DevTools cache state
□ Check Recoil DevTools atom values
□ Verify GraphQL query in Network tab
□ Check component props (React DevTools)

Backend Issues
□ Check NestJS terminal for errors
□ Verify PostgreSQL connections
□ Check GraphQL Playground queries
□ Verify authentication token
□ Check service/resolver logs

Data Issues
□ Verify data in PostgreSQL (psql)
□ Check ClickHouse for analytics
□ Verify Redis cache keys
□ Check migration status
□ Verify workspace schema exists
```

---

## Performance Quick Tips

```
Frontend
├── Lazy load routes (React.lazy)
├── Memoize components (React.memo)
├── Cache mutations optimistically
├── Use Apollo cache-and-network policy
└── Virtual lists for large datasets

Backend
├── Use DataLoaders (prevent N+1)
├── Add database indexes
├── Cache metadata in memory
├── Archive old data to ClickHouse
└── Monitor slow queries

Database
├── Index frequently filtered columns
├── Use composite indexes
├── Partition large tables
├── Connection pooling
└── Regular VACUUM/ANALYZE
```

---

## Security Checklist

```
Authentication
□ JWT tokens with short expiration
□ Refresh tokens for longer sessions
□ Secure storage (httpOnly cookies preferred)
□ HTTPS/WSS for all connections

Authorization
□ Role-based access control (RBAC)
□ Field-level permissions enforced
□ Workspace isolation verified
□ Endpoint permission checks

Data Protection
□ Input validation (GraphQL types)
□ SQL injection prevention (TypeORM)
□ Rate limiting enabled
□ Audit logging implemented
□ Soft deletes for recovery

Infrastructure
□ Environment variables for secrets
□ CORS properly configured
□ CSRF protection enabled
□ Regular security audits
```

---

## Quick Commands

```bash
# Setup
yarn install
cp .env.example .env

# Backend
cd packages/twenty-server
yarn dev                           # Start dev server
yarn database:migrate:dev          # Run migrations
yarn typeorm migration:generate -n MigrationName

# Frontend
cd packages/twenty-front
yarn dev                           # Start dev server
yarn build                         # Build for production

# Testing
yarn test                          # Run all tests
yarn test:watch                    # Watch mode
yarn test:coverage                 # Coverage report

# Database
psql postgres                      # Connect to PostgreSQL
\dt                               # List tables
\d table_name                     # Describe table
SELECT * FROM "core"."user";     # Query core schema
```

---

## Architecture Patterns Used

```
Backend Patterns
├── Dependency Injection (NestJS)
├── Repository Pattern
├── Service Layer Pattern
├── Resolver Pattern (GraphQL)
├── DataLoader Pattern (batching)
├── Event-Driven Architecture
├── Middleware Pattern
└── Decorator Pattern

Frontend Patterns
├── Component Composition
├── Custom Hooks
├── Higher-Order Components
├── Render Props
├── Container/Presentational
├── State Management Pattern
├── Observer Pattern (Recoil)
└── Strategy Pattern (Fetch Policies)

Database Patterns
├── Schema Per Tenant (multi-tenancy)
├── Audit Log Pattern
├── Soft Delete Pattern
├── Event Sourcing (ClickHouse)
├── Normalized Schema Design
└── Index Strategy Pattern
```

---

## Related Documentation

- **Full Docs:** See individual markdown files in this directory
- **Code Examples:** Throughout each document
- **Best Practices:** Section in each relevant document
- **Troubleshooting:** Debugging section in technical docs

---

**Quick Links to Detailed Docs:**
- 📖 Overall Architecture: [01-OVERVIEW.md](./01-OVERVIEW.md)
- 🔄 State Management Deep Dive: [02-STATE_MANAGEMENT.md](./02-STATE_MANAGEMENT.md)
- 📊 Data Model Specification: [03-DATA_MODEL.md](./03-DATA_MODEL.md)
- 📡 API Communication Guide: [04-API_COMMUNICATION.md](./04-API_COMMUNICATION.md)
- ⚛️ Frontend Component Guide: [05-FRONTEND_ARCHITECTURE.md](./05-FRONTEND_ARCHITECTURE.md)

---

**Created:** December 20, 2025
**Version:** 1.0
**Status:** Complete
