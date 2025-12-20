# Twenty Architecture Documentation - Index

This directory contains comprehensive documentation about the Twenty project architecture, focusing on the server and frontend systems.

---

## Quick Navigation

### 📋 [01-OVERVIEW.md](./01-OVERVIEW.md)
**High-level architecture overview**

- Project summary and purpose
- Architecture pattern (Client-Server, GraphQL-first)
- Technology stack breakdown
- Data flow patterns (requests, WebSockets)
- Core concepts (Workspaces, Metadata vs Data, Object Records)
- Module organization
- Authentication & Authorization
- API layers (GraphQL, REST, WebSockets)
- External integrations
- Deployment architecture
- Performance optimizations
- Security considerations
- Development workflow

**Best for:** Getting a bird's-eye view of the system, understanding how components fit together.

---

### 🔄 [02-STATE_MANAGEMENT.md](./02-STATE_MANAGEMENT.md)
**Complete state management architecture guide**

**Frontend State Management:**
- Layer 1: Recoil (global application state)
- Layer 2: Apollo Client Cache (GraphQL-managed server state)
- Layer 3: Component Local State (React hooks)

**Server-Side State:**
- Database persistence (PostgreSQL, ClickHouse)
- Cache layer (Redis)
- In-memory services

**State Synchronization:**
- Frontend ↔ Backend sync patterns
- Real-time collaboration via WebSockets
- Context Store pattern
- State lifecycle management

**Best Practices:**
- What to use Recoil for
- What to use Apollo for
- Avoiding state duplication
- Data normalization patterns
- Performance optimization (caching, lazy loading)

**Best for:** Understanding how data flows between frontend and backend, debugging state issues, learning state management patterns.

---

### 📊 [03-DATA_MODEL.md](./03-DATA_MODEL.md)
**Server-side data model and database schema**

**Database Architecture:**
- Multi-database strategy (PostgreSQL, ClickHouse, Redis)
- Core schema (system database)
- Metadata schema (dynamic object definitions)
- Workspace data schema (per-workspace data)

**TypeORM Entity Structure:**
- User entity
- Workspace entity
- Object metadata entity
- Field metadata entity

**TwentyORM:**
- Custom ORM wrapper around TypeORM
- Workspace-specific query handling
- Type safety and automatic schema resolution

**Field Types:**
- Supported field types with storage details
- GraphQL type mappings

**Relationships:**
- One-to-Many
- Many-to-Many
- Polymorphic relations

**Data Access Patterns:**
- Repository pattern
- Query builder pattern
- DataLoader pattern (N+1 prevention)

**Additional Topics:**
- Soft deletes & auditing
- Performance optimization (indexing)
- Data integrity (constraints, cascading)
- Migration strategy
- Best practices

**Best for:** Understanding the database structure, learning how to work with TwentyORM, implementing new features with proper data modeling.

---

### 📡 [04-API_COMMUNICATION.md](./04-API_COMMUNICATION.md)
**Frontend-Backend API specification and communication protocol**

**GraphQL API:**
- Endpoint configuration
- Authentication headers
- Schema structure (Object, Input, Filter, Pagination, Sort types)

**Query Examples:**
- Single record fetches
- List with filtering & pagination
- Nested queries
- Alias queries

**Mutation Examples:**
- Create operations
- Update operations
- Delete operations
- Batch operations
- Optimistic updates

**Subscription Examples:**
- Real-time record changes
- Collaborative updates
- WebSocket connections

**Error Handling:**
- Standard error response format
- Common error codes
- Error handling best practices

**REST API (Legacy):**
- Endpoint structure
- Request/response format

**Additional Topics:**
- Rate limiting
- Caching strategy
- Pagination & filtering
- File uploads
- Batch operations
- Security considerations
- Testing queries

**Best for:** Integrating frontend with backend, understanding API contracts, writing GraphQL queries/mutations, debugging API issues.

---

### ⚛️ [05-FRONTEND_ARCHITECTURE.md](./05-FRONTEND_ARCHITECTURE.md)
**Frontend architecture, components, and patterns**

**Technology Stack:**
- React, TypeScript, Recoil, Apollo Client, etc.

**Project Structure:**
- Complete directory layout
- Module organization
- Feature modules (auth, companies, views, etc.)

**Component Architecture:**
- Functional component patterns
- Component types (Page, Container, Presentational)

**Hooks & Custom Hooks:**
- Apollo hooks (useQuery, useMutation, useSubscription)
- Recoil hooks (useRecoilState, useRecoilValue)
- React hooks (useState, useEffect, useCallback, useMemo, useRef)
- Custom hooks examples

**Module Organization:**
- Example: Companies module structure
- Best practices for organizing features

**State Management Examples:**
- Simple atoms
- Atom families (parameterized state)
- Selectors (derived state)
- Async selectors

**Form Handling:**
- React Hook Form integration
- Validation
- Submission handling

**Error Handling:**
- Error boundaries
- Query/mutation error handling

**Performance:**
- Code splitting & lazy loading
- React.memo and hooks memoization
- Apollo caching strategies
- Virtual lists for large datasets

**Styling:**
- Emotion CSS-in-JS
- Linaria zero-runtime CSS

**Testing:**
- React Testing Library examples
- Mocking GraphQL queries

**Best Practices:**
- Component design principles
- State management patterns
- Performance optimization
- Testing strategies

**Best for:** Building frontend features, understanding component patterns, learning state management, optimizing performance, writing tests.

---

## Architecture Diagrams

### System Architecture
```
┌─────────────────────────────────────┐
│      twenty-front (React)           │
│  - UI Components                    │
│  - State Management (Recoil)        │
│  - Apollo Client (GraphQL)          │
└──────────────┬──────────────────────┘
               │ GraphQL/REST/WebSocket
┌──────────────▼──────────────────────┐
│   twenty-server (NestJS)            │
│  - GraphQL API (Yoga)               │
│  - REST API                         │
│  - Business Logic Modules           │
│  - TwentyORM/TypeORM                │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Data Storage Layer             │
│  - PostgreSQL (Core + Workspaces)   │
│  - ClickHouse (Analytics)           │
│  - Redis (Cache/Sessions)           │
└─────────────────────────────────────┘
```

### Data Flow
```
User Action
    ↓
React Component
    ↓
Apollo Client (GraphQL Mutation/Query)
    ↓
NestJS GraphQL Resolver
    ↓
Business Logic Module
    ↓
TwentyORM/TypeORM Repository
    ↓
PostgreSQL/ClickHouse
    ↓
Response (Serialized)
    ↓
Apollo Cache Update
    ↓
Recoil State Update
    ↓
Component Re-render
```

### State Management Layers
```
Frontend:
├── Recoil (Global App State)
├── Apollo Client Cache (GraphQL State)
└── Component Local State (React Hooks)

Backend:
├── Databases (PostgreSQL, ClickHouse)
├── Cache Layer (Redis)
└── In-Memory Services (NestJS)
```

---

## Key Technologies

### Backend
- **NestJS** - TypeScript framework for building efficient server applications
- **GraphQL** - Query language for API (via GraphQL Yoga)
- **TypeORM** - SQL ORM for database access
- **TwentyORM** - Custom ORM layer for workspace-specific queries
- **PostgreSQL** - Primary relational database
- **ClickHouse** - Analytics database
- **Redis** - In-memory cache

### Frontend
- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Recoil** - State management
- **Apollo Client** - GraphQL client
- **Emotion/Linaria** - CSS-in-JS styling
- **Vite** - Build tool
- **React Hook Form** - Form management

---

## Common Use Cases

### Adding a New Field to a CRM Object
1. **Backend:** Create TypeORM entity property + migration
2. **Metadata:** Update ObjectMetadataEntity with field definition
3. **API:** GraphQL schema automatically updates
4. **Frontend:** Add form input component + Apollo query updates

**References:** [Data Model - Field Types](./03-DATA_MODEL.md#standard-field-types), [API - Schema Types](./04-API_COMMUNICATION.md#core-schema-types)

### Creating a New Feature Module
1. **Backend:** Create NestJS module with service + resolver
2. **GraphQL:** Define schema with queries/mutations
3. **Frontend:** Create module with components, hooks, state
4. **Integration:** Connect via Apollo queries/mutations

**References:** [Frontend Architecture - Module Organization](./05-FRONTEND_ARCHITECTURE.md#module-organization), [API Communication - Examples](./04-API_COMMUNICATION.md#query-examples)

### Implementing Real-time Updates
1. **Backend:** Setup WebSocket subscriptions + event emitters
2. **GraphQL:** Define subscription types
3. **Frontend:** Use `useSubscription` Apollo hook
4. **State:** Update Recoil atoms on subscription data

**References:** [State Management - Real-time Sync](./02-STATE_MANAGEMENT.md#real-time-synchronization), [API - Subscriptions](./04-API_COMMUNICATION.md#subscription-examples)

### Optimizing Query Performance
1. **Backend:** Use DataLoaders to prevent N+1 queries
2. **Database:** Add appropriate indexes
3. **Frontend:** Use appropriate Apollo fetch policies
4. **Caching:** Leverage Apollo cache and Redis

**References:** [Data Model - Performance Optimization](./03-DATA_MODEL.md#performance-optimization), [Frontend - Performance](./05-FRONTEND_ARCHITECTURE.md#performance-optimization)

---

## Development Workflow

### Setup
```bash
# Install dependencies
yarn install

# Copy environment file
cp .env.example .env

# Run database migrations
yarn database:migrate:dev
```

### Development
```bash
# Terminal 1: Start backend
cd packages/twenty-server
yarn dev

# Terminal 2: Start frontend
cd packages/twenty-front
yarn dev

# Access at http://localhost:3000
# GraphQL Explorer at http://localhost:3001/graphql
```

### Making Changes

**Backend Changes:**
1. Modify NestJS service/resolver
2. Hot reload detects changes
3. Test via GraphQL Explorer
4. If schema change, frontend automatically updates

**Frontend Changes:**
1. Modify React component/state
2. Vite hot module reload
3. Changes reflect immediately in browser
4. Apollo client may need to refetch

---

## Debugging Tips

### Frontend
- **React DevTools** - Component tree, props inspection
- **Apollo DevTools** - GraphQL queries, cache inspection
- **Console** - Error messages, logging
- **Recoil DevTools** - State time-travel debugging

### Backend
- **TypeORM Logging** - Enable query logging in config
- **GraphQL Playground** - Test queries/mutations
- **Network Tab** - Inspect GraphQL payloads
- **NestJS Logger** - Application logs

---

## Performance Considerations

### Frontend
- Lazy load route components
- Memoize expensive computations
- Use Apollo `cache-and-network` policy
- Virtual lists for large datasets
- Code splitting and tree shaking

### Backend
- Use DataLoaders for batch queries
- Implement proper database indexes
- Cache metadata in memory
- Archive old data to ClickHouse
- Monitor slow queries

---

## Security Practices

### Authentication
- JWT tokens with expiration
- Secure storage on frontend
- Include in Authorization header

### Authorization
- Role-based access control (RBAC)
- Field-level permissions
- Object-level permissions
- Workspace isolation

### Data Protection
- Soft deletes for audit trail
- Encrypted connections (HTTPS/WSS)
- Input validation (GraphQL types)
- Rate limiting

---

## Resources & Links

- **Official Docs:** https://docs.twenty.com
- **GitHub:** https://github.com/twentyhq/twenty
- **Community:** Discord, GitHub Discussions
- **Issues:** Bug reports, feature requests

---

## Document Maintenance

These documents were created on **December 20, 2025** and reflect the current architecture of the Twenty project.

When updating documentation:
1. Keep related information together
2. Include code examples for clarity
3. Link between related sections
4. Update the index if adding new sections
5. Maintain consistent formatting

---

## Getting Help

### For Architecture Questions
- Check the relevant document (OVERVIEW for big picture, specific docs for details)
- Search for keywords using Ctrl+F
- Review code examples in each document

### For Implementation Questions
- Refer to specific use cases section
- Check "Best Practices" in relevant document
- Review actual codebase for patterns

### For Debugging
- Check the "Debugging Tips" section
- Enable verbose logging
- Use DevTools for your technology (React, Apollo, etc.)

---

## Document Structure

Each document is organized with:
- **Overview** - What this section covers
- **Core Concepts** - Key ideas and terminology
- **Detailed Explanations** - In-depth coverage with examples
- **Best Practices** - Recommended patterns
- **Common Patterns** - Real-world examples
- **Troubleshooting** - Common issues and solutions

---

**Last Updated:** December 20, 2025
**Document Version:** 1.0
**Status:** Complete

For updates or corrections, please refer to the project's contribution guidelines.
