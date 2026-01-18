# GraphQL API

Complete guide to Twenty's GraphQL API, including schema design, queries, mutations, and subscriptions.

## Overview

Twenty uses GraphQL as its primary API layer, providing:
- **Type-safe queries** - Strong typing with TypeScript
- **Flexible data fetching** - Request exactly what you need
- **Real-time updates** - WebSocket subscriptions
- **Automatic documentation** - Self-documenting schema
- **Efficient batching** - DataLoader pattern

## GraphQL Endpoint

```
Developttp://localhost:3001/graphql
Production: https://api.your-domain.com/graphql
```

## Authentication

All requests (except auth endpoints) require authentication:

```http
POST /graphql
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

## Schema Structure

### Core Types

**Object Type:**
```graphql
type Company {
  id: ID!
  name: String!
  domainName: String
  employees: Int
  industry: String
  people: [Person!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Person {
  id: ID!
  firstName: String!
  lastName: String!
  email: String!
  phone: String
  company: Company
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

**Connection Type (Pagination):**
```graphql
type CompanyConnection {
  edges: [CompanyEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type CompanyEdge {
  node: Company!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

**Input Types:**
```graphql
input CreateCompanyInput {
  name: String!
  domainName: String
  employees: Int
  industry: String
}

input UpdateCompanyInput {
  name: String
  domainName: String
  employees: Int
  industry: String
}
```

**Filter Types:**
```graphql
input CompanyFilter {
  name: StringFilter
  industry: StringFilter
  employees: IntFilter
  AND: [CompanyFilter!]
  OR: [CompanyFilter!]
}

input StringFilter {
  eq: String
  contains: String
  startsWith: String
  endsWith: String
  in: [String!]
}

input IntFilter {
  eq: Int
  gt: Int
  gte: Int
  lt: Int
  lte: Int
  in: [Int!]
}
```

**Sort Types:**
```graphql
input CompanySort {
  field: CompanySortField!
  direction: SortDirection!
}

enum CompanySortField {
  NAME
  EMPLOYEES
  CREATED_AT
  UPDATED_AT
}

enum SortDirection {
  ASC
  DESC
}
```

## Queries

### Fetch Single Record

```graphql
query GetCompany($id: ID!) {
  company(id: $id) {
    id
    name
    domainName
    employees
    industry
    createdAt
    updatedAt
  }
}
```

**Variables:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response:**
```json
{
  "data": {
    "company": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Acme Corp",
      "domainName": "acme.com",
      "employees": 100,
      "industry": "Technology",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

### Fetch List with Filtering

```graphql
query GetCompanies($filter: CompanyFilter, $sort: [CompanySort!]) {
  companies(filter: $filter, sort: $sort) {
    edges {
      node {
        id
        name
        industry
        employees
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
```

**Variables:**
```json
{
  "filter": {
    "industry": {
      "eq": "Technology"
    },
    "employees": {
      "gte": 50
    }
  },
  "sort": [
    {
      "field": "NAME",
      "direction": "ASC"
    }
  ]
}
```

### Pagination

**Forward Pagination (first/after):**
```graphql
query GetCompanies($first: Int!, $after: String) {
  companies(first: $first, after: $after) {
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

**Variables:**
```json
{
  "first": 10,
  "after": "cursor-value"
}
```

**Backward Pagination (last/before):**
```graphql
query GetCompanies($last: Int!, $before: String) {
  companies(last: $last, before: $before) {
    edges {
      node {
        id
        name
      }
      cursor
    }
    pageInfo {
      hasPreviousPage
      startCursor
    }
  }
}
```

### Nested Queries

```graphql
query GetCompanyWithPeople($id: ID!) {
  company(id: $id) {
    id
    name
    people {
      edges {
        node {
          id
          firstName
          lastName
          email
        }
      }
    }
  }
}
```

### Complex Filtering

```graphql
query GetFilteredCompanies {
  companies(
    filter: {
      OR: [
        {
          industry: { eq: "Technology" }
          employees: { gte: 100 }
        }
        {
          industry: { eq: "Finance" }
          employees: { gte: 500 }
        }
      ]
    }
  ) {
    edges {
      node {
        id
        name
        industry
        employees
      }
    }
  }
}
```

### Aggregations

```graphql
query GetCompanyStats {
  companyStats {
    totalCount
    averageEmployees
    byIndustry {
      industry
      count
      averageEmployees
    }
  }
}
```

## Mutations

### Create Record

```graphql
mutation CreateCompany($data: CreateCompanyInput!) {
  createCompany(data: $data) {
    id
    name
    domainName
    employees
    industry
    createdAt
  }
}
```

**Variables:**
```json
{
  "data": {
    "name": "Acme Corp",
    "domainName": "acme.com",
    "employees": 100,
    "industry": "Technology"
  }
}
```

**Response:**
```json
{
  "data": {
    "createCompany": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Acme Corp",
      "domainName": "acme.com",
      "employees": 100,
      "industry": "Technology",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

### Update Record

```graphql
mutation UpdateCompany($id: ID!, $data: UpdateCompanyInput!) {
  updateCompany(id: $id, data: $data) {
    id
    name
    employees
    updatedAt
  }
}
```

**Variables:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "data": {
    "employees": 150
  }
}
```

### Delete Record

```graphql
mutation DeleteCompany($id: ID!) {
  deleteCompany(id: $id)
}
```

**Variables:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response:**
```json
{
  "data": {
    "deleteCompany": true
  }
}
```

### Batch Operations

**Batch Create:**
```graphql
mutation CreateCompanies($data: [CreateCompanyInput!]!) {
  createCompanies(data: $data) {
    id
    name
  }
}
```

**Batch Update:**
```graphql
mutation UpdateCompanies($updates: [CompanyUpdateBatch!]!) {
  updateCompanies(updates: $updates) {
    id
    name
    updatedAt
  }
}
```

**Variables:**
```json
{
  "updates": [
    {
      "id": "id-1",
      "data": { "employees": 100 }
    },
    {
      "id": "id-2",
      "data": { "employees": 200 }
    }
  ]
}
```

**Batch Delete:**
```graphql
mutation DeleteCompanies($ids: [ID!]!) {
  deleteCompanies(ids: $ids)
}
```

## Subscriptions

### Subscribe to Record Changes

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

### Subscribe to List Changes

```graphql
subscription OnCompaniesChanged {
  companiesChanged {
    mutation
    node {
      id
      name
    }
  }
}
```

**Response:**
```json
{
  "data": {
    "companiesChanged": {
      "mutation": "CREATED",
      "node": {
        "id": "new-id",
        "name": "New Company"
      }
    }
  }
}
```

### WebSocket Connection

```typescript
import { createClient } from 'graphql-ws';

const client = createClient({
  url: 'ws://localhost:3001/graphql',
  connectionParams: {
    authorization: `Bearer ${token}`,
  },
});

const unsubscribe = client.subscribe(
  {
    query: `
      subscription {
        companyUpdated(id: "123") {
          id
          name
        }
      }
    `,
  },
  {
    next: (data) => console.log('Received:', data),
    error: (error) => console.error('Error:', error),
    complete: () => console.log('Complete'),
  }
);
```

## Error Handling

### Error Response Format

```json
{
  "errors": [
    {
      "message": "Company not found",
      "locations": [
        {
          "line": 2,
          "column": 3
        }
      ],
      "path": ["company"],
      "extensions": {
        "code": "NOT_FOUND",
        "statusCode": 404
      }
    }
  ],
  "data": null
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `UNAUTHENTICATED` | Not authenticated | 401 |
| `FORBIDDEN` | Not authorized | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `BAD_USER_INPUT` | Invalid input | 400 |
| `INTERNAL_SERVER_ERROR` | Server error | 500 |

### Handling Errors

```typescript
import { useQuery } from '@apollo/client';

function CompanyDetails({ id }: { id: string }) {
  const { data, loading, error } = useQuery(GET_COMPANY, {
    variables: { id },
  });

  if (loading) return <Spinner />;

  if (error) {
    if (error.graphQLErrors) {
      error.graphQLErrors.forEach(({ message, extensions }) => {
        if (extensions?.code === 'NOT_FOUND') {
          return <NotFound />;
        }
      });
    }
    return <ErrorMessage error={error} />;
  }

  return <CompanyCard company={data.company} />;
}
```

## Advanced Features

### DataLoader (N+1 Prevention)

```typescript
// Backend implementation
import DataLoader from 'dataloader';

@Injectable()
export class CompanyLoader {
  private loader: DataLoader<string, Company>;

  constructor(private companyRepository: CompanyRepository) {
    this.loader = new DataLoader(async (ids: string[]) => {
      const companies = await this.companyRepository.findByIds(ids);
      const companyMap = new Map(companies.map(c => [c.id, c]));
      return ids.map(id => companyMap.get(id));
    });
  }

  load(id: string): Promise<Company> {
    return this.loader.load(id);
  }
}

// Usage in resolver
@ResolveField(() => Company)
async company(
  @Parent() person: Person,
  @Context() { loaders }: { loaders: Loaders },
) {
  return loaders.company.load(person.companyId);
}
```

### Field-Level Authorization

```typescript
@Resolver(() => Company)
export class CompanyResolver {
  @Query(() => Company)
  @UseGuards(JwtAuthGuard)
  async company(@Args('id') id: string) {
    return this.companyService.findOne(id);
  }

  @ResolveField(() => [Person])
  @UseGuards(FieldPermissionGuard)
  @RequirePermission('company.people.read')
  async people(@Parent() company: Company) {
    return this.personService.findByCompany(company.id);
  }
}
```

### Custom Scalars

```typescript
// Custom Date scalar
import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('DateTime')
export class DateTimeScalar implements CustomScalar<string, Date> {
  description = 'DateTime custom scalar type';

  parseValue(value: string): Date {
    return new Date(value);
  }

  serialize(value: Date): string {
    return value.toISOString();
  }

  parseLiteral(ast: ValueNode): Date {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  }
}
```

### Directives

```graphql
directive @auth(requires: Role = MEMBER) on FIELD_DEFINITION | OBJECT

type Company @auth(requires: MEMBER) {
  id: ID!
  name: String!
  revenue: Float @auth(requires: ADMIN)
}
```

## Performance Optimization

### Query Complexity

```typescript
// Limit query complexity
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { Plugin } from '@nestjs/apollo';
import {
  ApolloServerPlugin,
  GraphQLRequestListener,
} from 'apollo-server-plugin-base';

@Plugin()
export class ComplexityPlugin implements ApolloServerPlugin {
  constructor(private gqlSchemaHost: GraphQLSchemaHost) {}

  async requestDidStart(): Promise<GraphQLRequestListener> {
    const maxComplexity = 1000;
    const { schema } = this.gqlSchemaHost;

    return {
      async didResolveOperation({ request, document }) {
        const complexity = getComplexity({
          schema,
          operationName: request.operationName,
          query: document,
          variables: request.variables,
        });

        if (complexity > maxComplexity) {
          throw new Error(
            `Query is too complex: ${complexity}. Maximum allowed complexity: ${maxComplexity}`,
          );
        }
      },
    };
  }
}
```

### Caching

```typescript
// Cache directive
import { CacheControl } from '@nestjs/graphql';

@Resolver(() => Company)
export class CompanyResolver {
  @Query(() => Company)
  @CacheControl({ maxAge: 60 })
  async company(@Args('id') id: string) {
    return this.companyService.findOne(id);
  }
}
```

### Persisted Queries

```typescript
// Enable persisted queries
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

GraphQLModule.forRoot({
  autoSchemaFile: true,
  persistedQueries: {
    cache: new Map(),
  },
  plugins: [
    ApolloServerPluginLandingPageLocalDefault({ embed: true }),
  ],
});
```

## Testing GraphQL API

### Using cURL

```bash
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "query": "query { companies { edges { node { id name } } } }"
  }'
```

### Using GraphQL Playground

Navigate to `http://localhost:3001/graphql` in your browser.

### Using Apollo Client

```typescript
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const client = new ApolloClient({
  uri: 'http://localhost:3001/graphql',
  cache: new InMemoryCache(),
  headers: {
    authorization: `Bearer ${token}`,
  },
});

const { data } = await client.query({
  query: gql`
    query GetCompanies {
      companies {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  `,
});
```

## Best Practices

### Query Design

1. **Request only needed fields**
   ```graphql
   # Good
   query {
     companies {
       edges {
         node {
           id
           name
         }
       }
     }
   }

   # Bad (requesting unnecessary fields)
   query {
     companies {
       edges {
         node {
           id
           name
           domainName
           employees
           industry
           createdAt
           updatedAt
         }
       }
     }
   }
   ```

2. **Use fragments for reusability**
   ```graphql
   fragment CompanyFields on Company {
     id
     name
     industry
   }

   query {
     company(id: "123") {
       ...CompanyFields
     }
   }
   ```

3. **Avoid deep nesting**
   ```graphql
   # Avoid
   query {
     company {
       people {
         company {
           people {
             company {
               # Too deep!
             }
           }
         }
       }
     }
   }
   ```

### Mutation Design

1. **Return updated data**
   ```graphql
   mutation UpdateCompany($id: ID!, $data: UpdateCompanyInput!) {
     updateCompany(id: $id, data: $data) {
       id
       name
       updatedAt
     }
   }
   ```

2. **Use optimistic updates**
   ```typescript
   const [updateCompany] = useMutation(UPDATE_COMPANY, {
     optimisticResponse: {
       updateCompany: {
         __typename: 'Company',
         id: companyId,
         name: newName,
       },
     },
   });
   ```

## Next Steps

- [API Reference](./24-api-reference.md)
- [Backend Architecture](./11-backend-architecture.md)
- [Authentication](./14-auth.md)

---

**Related Documentation:**
- [Frontend Architecture](./07-frontend-architecture.md)
- [Database & ORM](./12-database-orm.md)
- [Testing Strategy](./15-testing-strategy.md)

