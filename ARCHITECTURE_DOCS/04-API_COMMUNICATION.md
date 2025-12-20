# API Communication Specification

## Overview

Twenty uses a **GraphQL-first architecture** with optional REST API support. The GraphQL API is the primary interface for frontend-backend communication, while REST is available for legacy integrations and webhooks.

---

## GraphQL API

### Endpoint & Configuration

```
URL: /graphql
Method: POST / GET (introspection)
Authentication: Bearer Token in Authorization header
Content-Type: application/json
WebSocket: /graphql (subscriptions)
```

### Authentication Header
```
Authorization: Bearer <JWT_TOKEN>

Header Example:
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

---

## Schema Structure

### Core Schema Types

#### 1. Object Types (Entities)

```graphql
# User Type (Core)
type User {
  id: ID!
  email: String!
  firstName: String!
  lastName: String!
  defaultAvatarUrl: String
  isEmailVerified: Boolean!
  disabled: Boolean
  canImpersonate: Boolean!
  workspaces: [Workspace!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

# Workspace Type (Core)
type Workspace {
  id: ID!
  name: String!
  displayName: String
  domainName: String
  logo: String
  members: [WorkspaceMember!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

# Company Type (Data Object - Dynamic)
type Company {
  id: ID!
  name: String!
  domainName: String
  accountOwner: Person
  revenue: Float
  employees: Int
  opportunities: [Opportunity!]!
  people: [Person!]!
  createdAt: DateTime!
  updatedAt: DateTime!
  deletedAt: DateTime
}

# Person Type (Data Object - Dynamic)
type Person {
  id: ID!
  firstName: String!
  lastName: String!
  email: String
  phone: String
  jobTitle: String
  company: Company
  opportunities: [Opportunity!]!
  createdAt: DateTime!
  updatedAt: DateTime!
  deletedAt: DateTime
}

# Opportunity Type (Data Object - Dynamic)
type Opportunity {
  id: ID!
  name: String!
  amount: Float
  stage: String!        # QUALIFIED, PROPOSAL, WON, CLOSED_LOST
  probability: Float
  expectedCloseDate: DateTime
  company: Company!
  owner: Person
  createdAt: DateTime!
  updatedAt: DateTime!
  deletedAt: DateTime
}
```

#### 2. Input Types

```graphql
# Create/Update Inputs
input CreateCompanyInput {
  name: String!
  domainName: String
  accountOwnerId: ID
  revenue: Float
  employees: Int
}

input UpdateCompanyInput {
  name: String
  domainName: String
  revenue: Float
  employees: Int
}

input CreatePersonInput {
  firstName: String!
  lastName: String
  email: String
  phone: String
  jobTitle: String
  companyId: ID
}

input UpdatePersonInput {
  firstName: String
  lastName: String
  email: String
  phone: String
  jobTitle: String
}

input CreateOpportunityInput {
  name: String!
  amount: Float
  stage: String!
  probability: Float
  expectedCloseDate: DateTime
  companyId: ID!
  ownerId: ID
}
```

#### 3. Filter Types

```graphql
input CompanyFilter {
  AND: [CompanyFilter!]
  OR: [CompanyFilter!]
  NOT: CompanyFilter

  id: IDFilterComparison
  name: StringFilterComparison
  revenue: NumberFilterComparison
  createdAt: DateTimeFilterComparison
  deletedAt: DateTimeFilterComparison
}

input StringFilterComparison {
  eq: String
  neq: String
  gt: String
  gte: String
  lt: String
  lte: String
  like: String
  in: [String!]
  notIn: [String!]
  iLike: String
  isNull: Boolean
}

input DateTimeFilterComparison {
  eq: DateTime
  neq: DateTime
  gt: DateTime
  gte: DateTime
  lt: DateTime
  lte: DateTime
  in: [DateTime!]
  notIn: [DateTime!]
  isBetween: DateTimeRangeComparison
}

input DateTimeRangeComparison {
  from: DateTime!
  to: DateTime!
}
```

#### 4. Pagination Types

```graphql
input PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

input CursorConnectionArgs {
  first: Int
  after: String
  last: Int
  before: String
}

type CompanyConnection {
  edges: [CompanyEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type CompanyEdge {
  cursor: String!
  node: Company!
}
```

#### 5. Sort Types

```graphql
input CompanySort {
  field: CompanySortFields!
  direction: SortDirection!
}

enum CompanySortFields {
  NAME
  REVENUE
  CREATED_AT
  UPDATED_AT
}

enum SortDirection {
  ASC
  DESC
}
```

---

## Query Examples

### 1. Fetch Single Record

```graphql
query GetCompany($id: ID!) {
  company(id: $id) {
    id
    name
    domainName
    revenue
    accountOwner {
      id
      firstName
      lastName
      email
    }
    people {
      id
      firstName
      lastName
      jobTitle
    }
    opportunities {
      id
      name
      amount
      stage
    }
    createdAt
    updatedAt
  }
}

# Variables
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 2. List Records with Filtering

```graphql
query ListCompanies(
  $filter: CompanyFilter
  $sort: [CompanySort!]
  $first: Int
  $after: String
) {
  companies(
    filter: $filter
    sort: $sort
    first: $first
    after: $after
  ) {
    edges {
      cursor
      node {
        id
        name
        revenue
        employees
        createdAt
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    totalCount
  }
}

# Variables
{
  "filter": {
    "AND": [
      { "revenue": { "gte": 1000000 } },
      { "deletedAt": { "isNull": true } }
    ]
  },
  "sort": [
    { "field": "REVENUE", "direction": "DESC" }
  ],
  "first": 20,
  "after": null
}
```

### 3. Nested Queries

```graphql
query CompanyWithActivities($id: ID!) {
  company(id: $id) {
    id
    name
    people {
      id
      firstName
      opportunities {
        id
        name
        amount
        stage
      }
    }
    activities {
      id
      type
      content
      createdAt
      createdBy {
        firstName
        lastName
      }
    }
  }
}
```

### 4. Alias Queries (Multiple Requests)

```graphql
query MultipleCompanies {
  topRevenue: companies(
    sort: { field: REVENUE, direction: DESC }
    first: 5
  ) {
    edges { node { id name revenue } }
  }

  newest: companies(
    sort: { field: CREATED_AT, direction: DESC }
    first: 5
  ) {
    edges { node { id name createdAt } }
  }

  myCompanies: companies(
    filter: { accountOwnerId: { eq: "current-user-id" } }
  ) {
    edges { node { id name } }
  }
}
```

---

## Mutation Examples

### 1. Create Record

```graphql
mutation CreateCompany($input: CreateCompanyInput!) {
  createCompany(input: $input) {
    id
    name
    domainName
    revenue
    createdAt
  }
}

# Variables
{
  "input": {
    "name": "Acme Corp",
    "domainName": "acme.com",
    "revenue": 5000000,
    "employees": 150
  }
}
```

### 2. Update Record

```graphql
mutation UpdateCompany(
  $id: ID!
  $input: UpdateCompanyInput!
) {
  updateCompany(id: $id, input: $input) {
    id
    name
    revenue
    updatedAt
  }
}

# Variables
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "input": {
    "revenue": 6000000,
    "employees": 200
  }
}
```

### 3. Delete Record

```graphql
mutation DeleteCompany($id: ID!) {
  deleteCompany(id: $id) {
    id
    deletedAt
  }
}

# Variables
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 4. Batch Operations

```graphql
mutation BatchCreatePeople($inputs: [CreatePersonInput!]!) {
  createPeople(inputs: $inputs) {
    id
    firstName
    lastName
    email
    createdAt
  }
}

# Variables
{
  "inputs": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "jobTitle": "CEO"
    },
    {
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com",
      "jobTitle": "CTO"
    }
  ]
}
```

### 5. Bulk Update

```graphql
mutation BulkUpdateCompanies(
  $ids: [ID!]!
  $input: UpdateCompanyInput!
) {
  bulkUpdateCompanies(ids: $ids, input: $input) {
    id
    name
    updatedAt
  }
}

# Variables
{
  "ids": ["id1", "id2", "id3"],
  "input": {
    "accountOwnerId": "new-owner-id"
  }
}
```

---

## Subscription Examples

### 1. Record Created/Updated

```graphql
subscription OnCompanyChanged($workspaceId: ID!) {
  companyChanged(workspaceId: $workspaceId) {
    mutation
    data {
      id
      name
      revenue
    }
  }
}
```

### 2. Record Deleted

```graphql
subscription OnCompanyDeleted($companyId: ID!) {
  companyDeleted(companyId: $companyId) {
    id
    name
    deletedAt
  }
}
```

### 3. Real-time Collaboration

```graphql
subscription OnObjectRecordUpdated($objectType: String!) {
  objectRecordUpdated(objectType: $objectType) {
    id
    objectType
    operation      # CREATE, UPDATE, DELETE
    data {
      # Record data
    }
    updatedBy {
      id
      email
    }
    updatedAt
  }
}
```

---

## Error Handling

### GraphQL Error Response

```json
{
  "data": null,
  "errors": [
    {
      "message": "User not found",
      "extensions": {
        "code": "NOT_FOUND",
        "statusCode": 404,
        "path": ["user", "id"]
      }
    }
  ]
}
```

### Common Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| NOT_FOUND | 404 | Record doesn't exist |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | No permission |
| BAD_REQUEST | 400 | Invalid input |
| VALIDATION_ERROR | 422 | Field validation failed |
| INTERNAL_SERVER_ERROR | 500 | Server error |
| CONFLICT | 409 | Duplicate/conflict |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |

### Error Response Example

```json
{
  "data": null,
  "errors": [
    {
      "message": "Validation failed",
      "extensions": {
        "code": "VALIDATION_ERROR",
        "statusCode": 422,
        "validationErrors": [
          {
            "field": "email",
            "message": "Invalid email format"
          },
          {
            "field": "name",
            "message": "Name is required"
          }
        ]
      }
    }
  ]
}
```

---

## REST API (Legacy)

### Endpoints

```
GET    /api/v1/companies              # List
GET    /api/v1/companies/{id}         # Get single
POST   /api/v1/companies              # Create
PATCH  /api/v1/companies/{id}         # Update
DELETE /api/v1/companies/{id}         # Delete

GET    /api/v1/people                 # List
GET    /api/v1/people/{id}            # Get single
POST   /api/v1/people                 # Create
PATCH  /api/v1/people/{id}            # Update
DELETE /api/v1/people/{id}            # Delete

# Same pattern for opportunities, etc
```

### Request/Response Format

```bash
# Create Company
curl -X POST http://localhost:3001/api/v1/companies \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "domainName": "acme.com",
    "revenue": 5000000
  }'

# Response
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Acme Corp",
  "domainName": "acme.com",
  "revenue": 5000000,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

## Rate Limiting

### Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642264800
```

### Strategy
- **Anonymous:** 100 requests/hour
- **Authenticated:** 1000 requests/hour
- **Premium:** Unlimited or custom

### Throttling Response
```json
{
  "statusCode": 429,
  "message": "Too many requests",
  "retryAfter": 60
}
```

---

## Caching Strategy

### Cache Headers
```
Cache-Control: private, max-age=300   # 5 minutes
ETag: "abc123"
Last-Modified: Mon, 15 Jan 2024 10:30:00 GMT
```

### Apollo Client Policies
- **cache-first** - Use cached data if available
- **cache-and-network** - Use cache, then fetch
- **network-only** - Always fetch fresh
- **no-cache** - Don't cache

---

## Pagination & Filtering

### Cursor-Based Pagination
```graphql
query {
  companies(first: 20, after: "cursor123") {
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      node { id name }
    }
  }
}
```

### Filtering
```graphql
query {
  companies(filter: {
    revenue: { gte: 1000000 }
    name: { iLike: "%acme%" }
    deletedAt: { isNull: true }
  }) {
    id name revenue
  }
}
```

### Sorting
```graphql
query {
  companies(
    sort: [
      { field: REVENUE, direction: DESC }
      { field: NAME, direction: ASC }
    ]
  ) {
    id name revenue
  }
}
```

---

## File Upload

### Mutation
```graphql
mutation UploadFile($file: Upload!) {
  uploadFile(file: $file) {
    id
    filename
    size
    mimeType
    url
    createdAt
  }
}
```

### JavaScript Example
```javascript
const file = document.querySelector('#file-input').files[0];

const response = await fetch('/graphql', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: new FormData({
    operations: JSON.stringify({
      query: UPLOAD_FILE_MUTATION,
      variables: { file: null }
    }),
    map: JSON.stringify({ 0: ['variables.file'] }),
    0: file
  })
});
```

---

## Batch Operations

### Batch Query
```graphql
query BatchFetch(
  $companyIds: [ID!]!
  $personIds: [ID!]!
) {
  companies: companiesByIds(ids: $companyIds) { id name }
  people: peopleByIds(ids: $personIds) { id firstName }
}
```

### Batch Mutation
```graphql
mutation BatchUpdate(
  $updates: [UpdateInput!]!
) {
  bulkUpdate(updates: $updates) {
    id
    updatedAt
  }
}
```

---

## Best Practices

### 1. Always Specify Fields (No Overfetching)
```graphql
# Good
query {
  company(id: "123") {
    id
    name
    revenue
  }
}

# Bad - fetches everything
query {
  company(id: "123") {
    ...AllFields
  }
}
```

### 2. Use Fragments for Reusable Selections
```graphql
fragment CompanyFields on Company {
  id
  name
  domainName
  revenue
}

query {
  company(id: "123") {
    ...CompanyFields
  }
}
```

### 3. Batch Related Queries
```graphql
# Good - single request
query {
  company(id: "123") { id name }
  opportunities(filter: { companyId: "123" }) { id name }
}

# Bad - separate requests
query { company(id: "123") { id name } }
query { opportunities(filter: { companyId: "123" }) { id } }
```

### 4. Use Aliases for Clarity
```graphql
query {
  allCompanies: companies(first: 100) { id name }
  activeCompanies: companies(
    filter: { deletedAt: { isNull: true } }
  ) { id name }
}
```

### 5. Handle Errors Appropriately
```typescript
const { data, error } = useQuery(GET_COMPANY);

if (error) {
  if (error.graphQLErrors?.[0]?.extensions?.code === 'NOT_FOUND') {
    return <NotFoundPage />;
  }
  return <ErrorPage error={error} />;
}
```

---

## WebSocket Connection

### Subscription Setup
```typescript
// Apollo Client WebSocket Link
import { WebSocketLink } from '@apollo/client/link/ws';

const wsLink = new WebSocketLink({
  uri: 'ws://localhost:3001/graphql',
  options: {
    reconnect: true,
    connectionParams: {
      authToken: token
    }
  }
});
```

### Subscribe to Changes
```typescript
const subscription = gql`
  subscription OnCompanyUpdated($workspaceId: ID!) {
    companyUpdated(workspaceId: $workspaceId) {
      id
      name
      revenue
    }
  }
`;

const { data, loading } = useSubscription(subscription, {
  variables: { workspaceId }
});
```

---

## Security Considerations

1. **Authentication Required** - All queries/mutations require valid JWT
2. **Field-Level Permissions** - Backend validates field access
3. **Rate Limiting** - Prevent abuse
4. **Input Validation** - GraphQL type system validates
5. **CSRF Protection** - Handled by framework
6. **Data Masking** - Sensitive fields redacted
7. **Audit Logging** - All mutations logged

---

## Testing Queries

### Using GraphQL Playground
```
Available at: http://localhost:3001/graphql
```

### Using cURL
```bash
curl -X POST http://localhost:3001/graphql \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ user { id email } }"
  }'
```

### Using Apollo Testing Utilities
```typescript
import { MockedProvider } from '@apollo/client/testing';

const mocks = [
  {
    request: {
      query: GET_COMPANY,
      variables: { id: '123' }
    },
    result: {
      data: {
        company: { id: '123', name: 'Acme' }
      }
    }
  }
];

render(
  <MockedProvider mocks={mocks}>
    <MyComponent />
  </MockedProvider>
);
```
