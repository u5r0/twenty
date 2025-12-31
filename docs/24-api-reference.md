# API Reference

Complete API reference for Twenty's GraphQL and REST endpoints.

## Table oftents

- [Overview](#overview)
- [GraphQL API](#graphql-api)
- [REST API](#rest-api)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Pagination](#pagination)
- [Filtering and Sorting](#filtering-and-sorting)
- [Webhooks](#webhooks)
- [Rate Limits](#rate-limits)

## Overview

Twenty provides both GraphQL and REST APIs for interacting with the platform.

### Base URLs

```
GraphQL: https://api.twenty.com/graphql
REST:    https://api.twenty.com/rest
```

### API Versions

Current version: `v1`

## GraphQL API

### Schema Overview

```graphql
type Query {
  # Companies
  companies(filter: CompanyFilter, orderBy: CompanyOrderBy): [Company!]!
  company(id: ID!): Company

  # People
  people(filter: PersonFilter, orderBy: PersonOrderBy): [Person!]!
  person(id: ID!): Person

  # Opportunities
  opportunities(filter: OpportunityFilter): [Opportunity!]!
  opportunity(id: ID!): Opportunity

  # Activities
  activities(filter: ActivityFilter): [Activity!]!
  activity(id: ID!): Activity

  # User
  currentUser: User!

  # Workspace
  currentWorkspace: Workspace!
}

type Mutation {
  # Companies
  createCompany(data: CreateCompanyInput!): Company!
  updateCompany(id: ID!, data: UpdateCompanyInput!): Company!
  deleteCompany(id: ID!): Boolean!

  # People
  createPerson(data: CreatePersonInput!): Person!
  updatePerson(id: ID!, data: UpdatePersonInput!): Person!
  deletePerson(id: ID!): Boolean!

  # Opportunities
  createOpportunity(data: CreateOpportunityInput!): Opportunity!
  updateOpportunity(id: ID!, data: UpdateOpportunityInput!): Opportunity!
  deleteOpportunity(id: ID!): Boolean!

  # Activities
  createActivity(data: CreateActivityInput!): Activity!
  updateActivity(id: ID!, data: UpdateActivityInput!): Activity!
  deleteActivity(id: ID!): Boolean!

  # Auth
  signUp(email: String!, password: String!): AuthPayload!
  signIn(email: String!, password: String!): AuthPayload!
  refreshToken(refreshToken: String!): AuthPayload!
}

type Subscription {
  companyCreated: Company!
  companyUpdated(id: ID!): Company!
  companyDeleted(id: ID!): ID!
}
```

### Types

#### Company

```graphql
type Company {
  id: ID!
  name: String!
  domainName: String
  address: String
  employees: Int
  linkedinUrl: String
  xUrl: String
  annualRecurringRevenue: Float
  idealCustomerProfile: Boolean
  createdAt: DateTime!
  updatedAt: DateTime!

  # Relations
  people: [Person!]!
  opportunities: [Opportunity!]!
  activities: [Activity!]!
}

input CreateCompanyInput {
  name: String!
  domainName: String
  address: String
  employees: Int
  linkedinUrl: String
  xUrl: String
  annualRecurringRevenue: Float
  idealCustomerProfile: Boolean
}

input UpdateCompanyInput {
  name: String
  domainName: String
  address: String
  employees: Int
  linkedinUrl: String
  xUrl: String
  annualRecurringRevenue: Float
  idealCustomerProfile: Boolean
}

input CompanyFilter {
  name: StringFilter
  employees: IntFilter
  annualRecurringRevenue: FloatFilter
  idealCustomerProfile: BooleanFilter
  createdAt: DateTimeFilter
}

input CompanyOrderBy {
  name: SortOrder
  employees: SortOrder
  annualRecurringRevenue: SortOrder
  createdAt: SortOrder
}
```

#### Person

```graphql
type Person {
  id: ID!
  firstName: String!
  lastName: String!
  email: String
  phone: String
  city: String
  avatarUrl: String
  linkedinUrl: String
  xUrl: String
  jobTitle: String
  createdAt: DateTime!
  updatedAt: DateTime!

  # Relations
  company: Company
  opportunities: [Opportunity!]!
  activities: [Activity!]!
}

input CreatePersonInput {
  firstName: String!
  lastName: String!
  email: String
  phone: String
  city: String
  avatarUrl: String
  linkedinUrl: String
  xUrl: String
  jobTitle: String
  companyId: ID
}

input UpdatePersonInput {
  firstName: String
  lastName: String
  email: String
  phone: String
  city: String
  avatarUrl: String
  linkedinUrl: String
  xUrl: String
  jobTitle: String
  companyId: ID
}
```

#### Opportunity

```graphql
type Opportunity {
  id: ID!
  name: String!
  amount: Float
  closeDate: DateTime
  stage: OpportunityStage!
  probability: Int
  createdAt: DateTime!
  updatedAt: DateTime!

  # Relations
  company: Company
  pointOfContact: Person
  activities: [Activity!]!
}

enum OpportunityStage {
  NEW
  SCREENING
  MEETING
  PROPOSAL
  NEGOTIATION
  CLOSED_WON
  CLOSED_LOST
}

input CreateOpportunityInput {
  name: String!
  amount: Float
  closeDate: DateTime
  stage: OpportunityStage!
  probability: Int
  companyId: ID
  pointOfContactId: ID
}
```

#### Activity

```graphql
type Activity {
  id: ID!
  title: String!
  body: String
  type: ActivityType!
  dueAt: DateTime
  completedAt: DateTime
  createdAt: DateTime!
  updatedAt: DateTime!

  # Relations
  assignee: User
  company: Company
  person: Person
  opportunity: Opportunity
}

enum ActivityType {
  NOTE
  TASK
  EMAIL
  CALL
  MEETING
}

input CreateActivityInput {
  title: String!
  body: String
  type: ActivityType!
  dueAt: DateTime
  assigneeId: ID
  companyId: ID
  personId: ID
  opportunityId: ID
}
```

### Query Examples

#### Fetch Companies

```graphql
query GetCompanies {
  companies(
    filter: {
      employees: { gte: 50 }
      idealCustomerProfile: { eq: true }
    }
    orderBy: { name: ASC }
  ) {
    id
    name
    employees
    annualRecurringRevenue
    people {
      id
      firstName
      lastName
      email
    }
  }
}
```

#### Fetch Single Company

```graphql
query GetCompany($id: ID!) {
  company(id: $id) {
    id
    name
    domainName
    address
    employees
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
  }
}
```

#### Search People

```graphql
query SearchPeople($search: String!) {
  people(
    filter: {
      or: [
        { firstName: { contains: $search } }
        { lastName: { contains: $search } }
        { email: { contains: $search } }
      ]
    }
  ) {
    id
    firstName
    lastName
    email
    company {
      id
      name
    }
  }
}
```

### Mutation Examples

#### Create Company

```graphql
mutation CreateCompany($data: CreateCompanyInput!) {
  createCompany(data: $data) {
    id
    name
    domainName
    createdAt
  }
}

# Variables
{
  "data": {
    "name": "Acme Corp",
    "domainName": "acme.com",
    "employees": 100,
    "idealCustomerProfile": true
  }
}
```

#### Update Person

```graphql
mutation UpdatePerson($id: ID!, $data: UpdatePersonInput!) {
  updatePerson(id: $id, data: $data) {
    id
    firstName
    lastName
    email
    jobTitle
  }
}

# Variables
{
  "id": "123",
  "data": {
    "jobTitle": "Senior Engineer",
    "email": "john@example.com"
  }
}
```

#### Create Opportunity

```graphql
mutation CreateOpportunity($data: CreateOpportunityInput!) {
  createOpportunity(data: $data) {
    id
    name
    amount
    stage
    company {
      id
      name
    }
  }
}

# Variables
{
  "data": {
    "name": "Q1 Enterprise Deal",
    "amount": 50000,
    "stage": "PROPOSAL",
    "companyId": "456"
  }
}
```

### Subscription Examples

#### Subscribe to Company Updates

```graphql
subscription OnCompanyUpdated($id: ID!) {
  companyUpdated(id: $id) {
    id
    name
    employees
    updatedAt
  }
}
```

## REST API

### Endpoints

#### Companies

```
GET    /rest/companies
GET    /rest/companies/:id
POST   /rest/companies
PUT    /rest/companies/:id
DELETE /rest/companies/:id
```

#### People

```
GET    /rest/people
GET    /rest/people/:id
POST   /rest/people
PUT    /rest/people/:id
DELETE /rest/people/:id
```

#### Opportunities

```
GET    /rest/opportunities
GET    /rest/opportunities/:id
POST   /rest/opportunities
PUT    /rest/opportunities/:id
DELETE /rest/opportunities/:id
```

### REST Examples

#### List Companies

```bash
curl -X GET "https://api.twenty.com/rest/companies?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "data": [
    {
      "id": "123",
      "name": "Acme Corp",
      "domainName": "acme.com",
      "employees": 100,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 50,
    "limit": 10,
    "offset": 0
  }
}
```

#### Create Company

```bash
curl -X POST "https://api.twenty.com/rest/companies" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Company",
    "domainName": "newco.com",
    "employees": 50
  }'
```

Response:
```json
{
  "data": {
    "id": "456",
    "name": "New Company",
    "domainName": "newco.com",
    "employees": 50,
    "createdAt": "2024-12-31T00:00:00Z"
  }
}
```

## Authentication

### JWT Authentication

```bash
# Login
curl -X POST "https://api.twenty.com/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password"
  }'
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

### Using Access Token

```bash
curl -X GET "https://api.twenty.com/graphql" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ currentUser { id email } }"}'
```

### Refresh Token

```bash
curl -X POST "https://api.twenty.com/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## Error Handling

### Error Response Format

```json
{
  "errors": [
    {
      "message": "Company not found",
      "extensions": {
        "code": "NOT_FOUND",
        "statusCode": 404,
        "timestamp": "2024-12-31T00:00:00Z"
      }
    }
  ]
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHENTICATED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `BAD_REQUEST` | 400 | Invalid input |
| `CONFLICT` | 409 | Resource conflict |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |

## Pagination

### Cursor-Based Pagination (GraphQL)

```graphql
query GetCompanies($cursor: String, $limit: Int) {
  companies(after: $cursor, first: $limit) {
    edges {
      node {
        id
        name
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### Offset-Based Pagination (REST)

```bash
GET /rest/companies?limit=20&offset=40
```

## Filtering and Sorting

### Filter Operators

```graphql
input StringFilter {
  eq: String          # Equals
  ne: String          # Not equals
  contains: String    # Contains substring
  startsWith: String  # Starts with
  endsWith: String    # Ends with
  in: [String!]       # In array
  notIn: [String!]    # Not in array
}

input IntFilter {
  eq: Int
  ne: Int
  gt: Int             # Greater than
  gte: Int            # Greater than or equal
  lt: Int             # Less than
  lte: Int            # Less than or equal
  in: [Int!]
  notIn: [Int!]
}
```

### Complex Filters

```graphql
query FilteredCompanies {
  companies(
    filter: {
      and: [
        { employees: { gte: 50 } }
        {
          or: [
            { name: { contains: "Tech" } }
            { domainName: { endsWith: ".io" } }
          ]
        }
      ]
    }
  ) {
    id
    name
  }
}
```

## Webhooks

### Webhook Events

```
company.created
company.updated
company.deleted
person.created
person.updated
person.deleted
opportunity.created
opportunity.updated
opportunity.deleted
```

### Webhook Payload

```json
{
  "event": "company.created",
  "timestamp": "2024-12-31T00:00:00Z",
  "data": {
    "id": "123",
    "name": "New Company",
    "domainName": "newco.com"
  },
  "workspaceId": "workspace-123"
}
```

### Webhook Signature

```typescript
import * as crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
```

## Rate Limits

### Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| GraphQL | 100 requests | 1 minute |
| REST | 60 requests | 1 minute |
| Auth | 5 requests | 1 minute |

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

### Rate Limit Error

```json
{
  "errors": [
    {
      "message": "Rate limit exceeded",
      "extensions": {
        "code": "RATE_LIMIT_EXCEEDED",
        "retryAfter": 60
      }
    }
  ]
}
```

## Related Documentation

- [GraphQL API](./13-graphql-api.md) - Detailed GraphQL guide
- [Authentication](./14-auth.md) - Authentication details
- [Backend Architecture](./11-backend-architecture.md) - Server architecture

---

*Last updated: December 31, 2024*

