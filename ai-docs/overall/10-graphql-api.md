# GraphQL API

Complete guide to Twenty's GraphQL API, including schema design, queries, mutations, and real-time subscriptions.

## Overview

Twenty uses GraphQL Yoga as its primary API layer, providing:
- **Type-safe queries** - Strong typing with TypeScript and auto-generated schemas
- **Flexible data fetching** - Request exactly what you need
- **Real-time updates** - Server-Sent Events (SSE) subscriptions
- **Automatic documentation** - Self-documenting schema via introspection
- **Efficient batching** - DataLoader pattern for N+1 query prevention

## GraphQL Endpoints

Twenty provides two GraphQL endpoints:

```
Core API (Workspace Data):
  Development: http://localhost:3000/graphql
  Production: https://your-domain.com/graphql

Metadata API (Schema Management):
  Development: http://localhost:3000/metadata
  Production: https://your-domain.com/metadata
```

## Authentication

All requests (except public endpoints) require authentication:

```http
POST /graphql
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

Twenty uses JWT-based authentication with access and refresh tokens.

## Schema Structure

Twenty's GraphQL schema is dynamically generated from workspace entities. The schema uses decorators to define types, fields, and relations.

### Workspace Entity Example

**Company Entity (Backend):**
```typescript
@WorkspaceEntity({
  standardId: STANDARD_OBJECT_IDS.company,
  namePlural: 'companies',
  labelSingular: msg`Company`,
  labelPlural: msg`Companies`,
  description: msg`A company`,
  icon: STANDARD_OBJECT_ICONS.company,
})
export class CompanyWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({
    type: FieldMetadataType.TEXT,
    label: msg`Name`,
    description: msg`The company name`,
  })
  @WorkspaceIsNullable()
  name: string | null;

  @WorkspaceField({
    type: FieldMetadataType.LINKS,
    label: msg`Domain Name`,
    description: msg`The company website URL`,
  })
  @WorkspaceIsNullable()
  domainName: LinksMetadata;

  @WorkspaceField({
    type: FieldMetadataType.NUMBER,
    label: msg`Employees`,
    description: msg`Number of employees`,
  })
  @WorkspaceIsNullable()
  employees: number | null;

  @WorkspaceRelation({
    type: RelationType.ONE_TO_MANY,
    label: msg`People`,
    description: msg`People linked to the company`,
    inverseSideTarget: () => PersonWorkspaceEntity,
  })
  people: Relation<PersonWorkspaceEntity[]>;
}
```

**Generated GraphQL Type:**
```graphql
type Company {
  id: ID!
  name: String
  domainName: Links
  employees: Float
  people: PersonConnection!
  createdAt: DateTime!
  updatedAt: DateTime!
  deletedAt: DateTime
}

type Links {
  primaryLinkUrl: String
  primaryLinkLabel: String
  secondaryLinks: [String!]
}
```

**Connection Type (Pagination):**
```graphql
type CompanyConnection {
  edges: [CompanyEdge!]!
  pageInfo: PageInfo!
}

type CompanyEdge {
  node: Company!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean
  hasPreviousPage: Boolean
  startCursor: String
  endCursor: String
}
```

**Filter Types:**
```graphql
input CompanyFilterInput {
  name: StringFilter
  employees: FloatFilter
  and: [CompanyFilterInput!]
  or: [CompanyFilterInput!]
  not: CompanyFilterInput
}

input StringFilter {
  eq: String
  neq: String
  in: [String!]
  is: String
  like: String
  ilike: String
}

input FloatFilter {
  eq: Float
  gt: Float
  gte: Float
  lt: Float
  lte: Float
  in: [Float!]
  is: String
}
```

## Queries

### Fetch Single Record

```graphql
query FindOneCompany($filter: CompanyFilterInput!) {
  company(filter: $filter) {
    id
    name
    domainName {
      primaryLinkUrl
      primaryLinkLabel
    }
    employees
    createdAt
    updatedAt
  }
}
```

**Variables:**
```json
{
  "filter": {
    "id": {
      "eq": "123e4567-e89b-12d3-a456-426614174000"
    }
  }
}
```

### Fetch List with Filtering

```graphql
query FindManyCompanies($filter: CompanyFilterInput, $orderBy: [CompanyOrderByInput!]) {
  companies(filter: $filter, orderBy: $orderBy) {
    edges {
      node {
        id
        name
        employees
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
```

**Variables:**
```json
{
  "filter": {
    "employees": {
      "gte": 50
    }
  },
  "orderBy": [
    {
      "name": "AscNullsFirst"
    }
  ]
}
```

### Pagination

**Forward Pagination (first/after):**
```graphql
query FindManyCompanies($first: Int, $after: String) {
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
query FindManyCompanies($last: Int, $before: String) {
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
query FindOneCompanyWithPeople($filter: CompanyFilterInput!) {
  company(filter: $filter) {
    id
    name
    people {
      edges {
        node {
          id
          name {
            firstName
            lastName
          }
          emails {
            primaryEmail
          }
        }
      }
    }
  }
}
```

### Complex Filtering

```graphql
query FindManyCompaniesWithComplexFilter {
  companies(
    filter: {
      or: [
        {
          and: [
            { employees: { gte: 100 } }
          ]
        },
        {
          and: [
            { employees: { gte: 500 } }
          ]
        }
      ]
    }
  ) {
    edges {
      node {
        id
        name
        employees
      }
    }
  }
}
```

## Mutations

### Create Record

```graphql
mutation CreateOneCompany($data: CompanyCreateInput!) {
  createCompany(data: $data) {
    id
    name
    domainName {
      primaryLinkUrl
    }
    employees
    createdAt
  }
}
```

**Variables:**
```json
{
  "data": {
    "name": "Acme Corp",
    "domainName": {
      "primaryLinkUrl": "https://acme.com",
      "primaryLinkLabel": "Website"
    },
    "employees": 100
  }
}
```

### Update Record

```graphql
mutation UpdateOneCompany($idToUpdate: ID!, $input: CompanyUpdateInput!) {
  updateCompany(id: $idToUpdate, data: $input) {
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
  "idToUpdate": "123e4567-e89b-12d3-a456-426614174000",
  "input": {
    "employees": 150
  }
}
```

### Delete Record

```graphql
mutation DeleteOneCompany($idToDelete: ID!) {
  deleteCompany(id: $idToDelete) {
    id
  }
}
```

**Variables:**
```json
{
  "idToDelete": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Batch Operations

**Batch Create:**
```graphql
mutation CreateManyCompanies($data: [CompanyCreateInput!]!) {
  createCompanies(data: $data) {
    id
    name
  }
}
```

**Batch Update:**
```graphql
mutation UpdateManyCompanies($filter: CompanyFilterInput!, $data: CompanyUpdateInput!) {
  updateCompanies(filter: $filter, data: $data) {
    id
    name
    updatedAt
  }
}
```

**Batch Delete:**
```graphql
mutation DeleteManyCompanies($filter: CompanyFilterInput!) {
  deleteCompanies(filter: $filter) {
    id
  }
}
```

## Subscriptions

Twenty uses Server-Sent Events (SSE) for real-time subscriptions, not WebSockets.

### Subscribe to Database Events

```graphql
subscription ListenToDbEvents {
  onDbEvent {
    eventType
    objectMetadataId
    recordId
    properties
  }
}
```

### SSE Connection (Frontend)

```typescript
import { createClient } from 'graphql-sse';

const client = createClient({
  url: 'http://localhost:3000/graphql',
  headers: () => {
    const token = getAuthToken();
    return {
      authorization: token ? `Bearer ${token}` : '',
    };
  },
});

// Subscribe to events
const unsubscribe = client.subscribe(
  {
    query: `
      subscription {
        onDbEvent {
          eventType
          recordId
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

// Cleanup
unsubscribe();
```

### Subscription Match

```graphql
subscription OnSubscriptionMatch {
  onSubscriptionMatch {
    id
    workspaceId
    userId
    createdAt
  }
}
```

## Error Handling

### Error Response Format

```json
{
  "errors": [
    {
      "message": "Record not found",
      "extensions": {
        "code": "NOT_FOUND"
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

### Handling Errors (Frontend)

```typescript
import { useQuery } from '@apollo/client';
import { GET_COMPANY } from './queries';

function CompanyDetails({ id }: { id: string }) {
  const { data, loading, error } = useQuery(GET_COMPANY, {
    variables: { filter: { id: { eq: id } } },
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

Twenty uses DataLoader to batch and cache database queries:

```typescript
// DataLoader Service (Backend)
import DataLoader from 'dataloader';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DataloaderService {
  createLoaders(workspaceId: string) {
    return {
      fieldMetadataLoader: new DataLoader(async (keys: string[]) => {
        const fieldMetadata = await this.fieldMetadataRepository.find({
          where: { id: In(keys), workspaceId },
        });
        const fieldMetadataMap = new Map(
          fieldMetadata.map((f) => [f.id, f])
        );
        return keys.map((key) => fieldMetadataMap.get(key));
      }),
    };
  }
}

// Usage in resolver
@ResolveField(() => [FieldMetadataDTO])
async fields(
  @Parent() objectMetadata: ObjectMetadataDTO,
  @Context() { loaders }: { loaders: IDataloaders },
) {
  return loaders.fieldMetadataLoader.loadMany(
    objectMetadata.fieldMetadataIds
  );
}
```

### Field-Level Authorization

Twenty uses guards for authorization:

```typescript
@Resolver(() => Company)
export class CompanyResolver {
  @Query(() => Company)
  @UseGuards(WorkspaceAuthGuard)
  async company(@Args('filter') filter: CompanyFilterInput) {
    return this.companyService.findOne(filter);
  }

  @ResolveField(() => [Person])
  @UseGuards(WorkspaceAuthGuard)
  async people(@Parent() company: Company) {
    return this.personService.findByCompany(company.id);
  }
}
```

### Custom Field Types

Twenty supports custom field metadata types:

```typescript
// Field metadata types
export enum FieldMetadataType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  DATE_TIME = 'DATE_TIME',
  LINKS = 'LINKS',
  EMAILS = 'EMAILS',
  PHONES = 'PHONES',
  CURRENCY = 'CURRENCY',
  FULL_NAME = 'FULL_NAME',
  ADDRESS = 'ADDRESS',
  RELATION = 'RELATION',
  // ... more types
}
```

## Performance Optimization

### Query Complexity Validation

Twenty validates query complexity to prevent expensive queries:

```typescript
// GraphQL Config (Backend)
import { useValidateGraphqlQueryComplexity } from 'src/engine/core-modules/graphql/hooks/use-validate-graphql-query-complexity.hook';

const config: YogaDriverConfig = {
  plugins: [
    useValidateGraphqlQueryComplexity({
      maximumAllowedFields: 2000,
      maximumAllowedRootResolvers: 10,
      checkDuplicateRootResolvers: true,
    }),
  ],
};
```

Configuration variables:
- `COMMON_QUERY_COMPLEXITY_LIMIT`: Default 2000
- `GRAPHQL_MAX_FIELDS`: Maximum fields per query
- `GRAPHQL_MAX_ROOT_RESOLVERS`: Maximum root resolvers per query

### Introspection Control

Introspection is disabled for unauthenticated users in production:

```typescript
useDisableIntrospectionAndSuggestionsForUnauthenticatedUsers(
  process.env.NODE_ENV === 'production'
)
```

## Testing GraphQL API

### Using cURL

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "query": "query { companies { edges { node { id name } } } }"
  }'
```

### Using GraphQL Playground

Navigate to `http://localhost:3000/graphql` in your browser (development mode only).

### Using Apollo Client (Frontend)

```typescript
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const client = new ApolloClient({
  uri: 'http://localhost:3000/graphql',
  cache: new InMemoryCache(),
  headers: {
    authorization: `Bearer ${token}`,
  },
});

const { data } = await client.query({
  query: gql`
    query FindManyCompanies {
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

   # Avoid requesting unnecessary fields
   ```

2. **Use fragments for reusability**
   ```graphql
   fragment CompanyFields on Company {
     id
     name
     employees
   }

   query {
     company(filter: { id: { eq: "123" } }) {
       ...CompanyFields
     }
   }
   ```

3. **Avoid deep nesting**
   - Limit query depth to prevent performance issues
   - Use pagination for large result sets

### Mutation Design

1. **Return updated data**
   ```graphql
   mutation UpdateOneCompany($id: ID!, $data: CompanyUpdateInput!) {
     updateCompany(id: $id, data: $data) {
       id
       name
       updatedAt
     }
   }
   ```

2. **Use optimistic updates (Frontend)**
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

## Architecture

Twenty's GraphQL implementation uses:
- **GraphQL Yoga** - Modern GraphQL server
- **NestJS** - Backend framework with decorators
- **TypeORM** - Database ORM
- **Apollo Client** - Frontend GraphQL client
- **Server-Sent Events** - Real-time subscriptions

## Next Steps

- [Backend Architecture](./08-backend-architecture.md)
- [Frontend Architecture](./05-frontend-architecture.md)
- [Database & ORM](./09-database-orm.md)
- [Authentication](./11-auth.md)

---

**Related Documentation:**
- [System Architecture](./02-system-architecture.md)
- [Testing Strategy](./12-testing-strategy.md)

