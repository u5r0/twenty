# ObjectMetadataItemsLoadEffect: Complete Data Fetching Flow (Part 1)

## Overview

`ObjectMetadataItemsLoadEffect` is a React component that runs on app initialization to fetch all object schemas (metadata) from the GraphQL API. This metadata defines every object type in the system (Company, Person, Opportunity, etc.) including their fields, permissions, and relationships.

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. APP INITIALIZATION                                           │
│    - App.tsx renders                                            │
│    - ObjectMetadataItemsLoadEffect mounts                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. CHECK USER & WORKSPACE ST
│ USER AUTHENTICATED │
         │ (Storybook/Testing) │   │ (Production)       │
         └──────────┬──────────┘   └───┬────────────────┘
                    │                   │
         ┌──────────▼──────────┐   ┌───▼────────────────┐
         │ loadMockedMetadata  │   │ refreshMetadata    │
         │ (Static mock data)  │   │ (GraphQL API call) │
         └──────────┬──────────┘   └───┬────────────────┘
                    │                   │
                    └─────────┬─────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. GRAPHQL QUERY EXECUTION                                      │
│    Query: FindManyObjectMetadataItems                           │
│    Endpoint: /metadata (GraphQL)                                │
│    Variables: { paging: { first: 1000 } }                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. SERVER PROCESSES REQUEST                                     │
│    - NestJS ObjectMetadataResolver handles query                │
│    - Queries PostgreSQL metadata tables                         │
│    - Returns paginated object metadata                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. RESPONSE TRANSFORMATION                                      │
│    - mapPaginatedObjectMetadataItemsToObjectMetadataItems()     │
│    - Flattens pagination structure                              │
│    - Transforms fieldsList → fields                             │
│    - Transforms indexMetadataList → indexMetadatas              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. PERMISSION ENRICHMENT                                        │
│    - enrichObjectMetadataItemsWithPermissions()                 │
│    - Adds readableFields (filtered by permissions)              │
│    - Adds updatableFields (filtered by permissions)             │
│    - Uses currentUserWorkspace.objectsPermissions               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. STORE IN RECOIL STATE                                        │
│    - Updates objectMetadataItemsState                           │
│    - Deep equality check (only update if changed)               │
│    - Sets shouldAppBeLoadingState = false                       │
│    - Enables isAppEffectRedirectEnabledState                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. APP READY                                                    │
│    - All components can now access object metadata             │
│    - useObjectMetadataItems() returns populated data            │
│    - Pages can render object-specific UIs                      │
└─────────────────────────────────────────────────────────────────┘
```

## File 1: ObjectMetadataItemsLoadEffect.tsx

**Location:** `packages/twenty-front/src/modules/object-metadata/components/ObjectMetadataItemsLoadEffect.tsx`

### Line-by-Line Breakdown

```typescript
export const ObjectMetadataItemsLoadEffect = () => {
```
**Purpose:** Effect component that runs once on mount to load metadata.
**Pattern:** React component that returns empty fragment but has side effects.

---

```typescript
  const currentUser = useRecoilValue(currentUserState);
  const currentWorkspace = useRecoilValue(currentWorkspaceState);
```
**What it does:** Reads authentication state from Recoil.

**Data structures:**
```typescript
currentUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  // ... more user properties
}

currentWorkspace = {
  id: string;
  name: string;
  activationStatus: 'active' | 'suspended' | 'inactive';
  objectsPermissions: ObjectPermissions[];
  // ... more workspace properties
}
```

**System connection:** These states are set during authentication flow.

---

```typescript
  const [isInitialized, setIsInitialized] = useState(false);
```
**What it does:** Prevents multiple loads if component re-renders.
**Why needed:** useEffect dependencies might trigger multiple times, this ensures we only load once.

---

```typescript
  const { refreshObjectMetadataItems } = useRefreshObjectMetadataItems();
  const { loadMockedObjectMetadataItems } = useLoadMockedObjectMetadataItems();
```
**What it does:** Gets the two loading strategies:
- `refreshObjectMetadataItems`: Real API call (production)
- `loadMockedObjectMetadataItems`: Static mock data (Storybook/testing)

---

```typescript
  useEffect(() => {
    if (isInitialized) {
      return;
    }
```
**What it does:** Early return if already initialized.
**Prevents:** Duplicate API calls on re-renders.

---

```typescript
    const loadObjectMetadata = async () => {
      if (
        isUndefinedOrNull(currentUser) ||
        !isWorkspaceActiveOrSuspended(currentWorkspace)
      ) {
        await loadMockedObjectMetadataItems();
```
**What it does:** Uses mock data if:
- No user is logged in (Storybook, tests)
- Workspace is not active or suspended

**Mock data path:** Loads static JSON with predefined object schemas.
**Use cases:** Storybook stories, unit tests, development without backend.

---

```typescript
      } else {
        await refreshObjectMetadataItems();
      }
```
**What it does:** Uses real API if user is authenticated and workspace is active.
**Production path:** Makes GraphQL query to fetch live metadata.

---

```typescript
      setIsInitialized(true);
    };

    loadObjectMetadata();
  }, [
    currentUser,
    currentWorkspace,
    loadMockedObjectMetadataItems,
    refreshObjectMetadataItems,
    isInitialized,
  ]);
```
**What it does:** Runs the load function and marks as initialized.
**Dependencies:** Re-runs if user or workspace changes (e.g., switching workspaces).

---

```typescript
  return <></>;
};
```
**What it does:** Returns empty fragment (no UI).
**Pattern:** Effect-only component.

---

## File 2: useRefreshObjectMetadataItems.ts

**Location:** `packages/twenty-front/src/modules/object-metadata/hooks/useRefreshObjectMetadataItems.ts`

### Purpose
Hook that fetches metadata from GraphQL API and stores in Recoil.

### Line-by-Line Breakdown

```typescript
export const useRefreshObjectMetadataItems = (
  fetchPolicy: FetchPolicy = 'network-only',
) => {
```
**fetchPolicy options:**
- `'network-only'`: Always fetch from server (default)
- `'cache-first'`: Use cache if available
- `'no-cache'`: Don't cache the result

**Why network-only:** Ensures fresh metadata on app load.

---

```typescript
  const client = useApolloClient();
```
**What it does:** Gets Apollo Client instance for manual queries.
**Why manual query:** We need to process the data before storing in Recoil, so we use `client.query()` instead of `useQuery()` hook.

---

```typescript
  const refreshObjectMetadataItems = async () => {
    const objectMetadataItemsResult =
      await client.query<ObjectMetadataItemsQuery>({
        query: FIND_MANY_OBJECT_METADATA_ITEMS,
        variables: {},
        fetchPolicy,
      });
```
**What it does:** Executes the GraphQL query.

**Query details:**
- **Name:** `ObjectMetadataItems`
- **Operation:** Query (read-only)
- **Variables:** None (fetches all objects)
- **Returns:** Paginated list of object metadata

**Network request:**
```http
POST /metadata HTTP/1.1
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "query": "query ObjectMetadataItems { objects(paging: { first: 1000 }) { edges { node { ...ObjectMetadataFields } } pageInfo { hasNextPage } } }",
  "variables": {}
}
```

**Response structure:**
```json
{
  "data": {
    "objects": {
      "edges": [
        {
          "node": {
            "id": "uuid-1",
            "nameSingular": "company",
            "namePlural": "companies",
            "fieldsList": [...]
          }
        }
      ],
      "pageInfo": {
        "hasNextPage": false
      }
    }
  }
}
```

---

```typescript
    const objectMetadataItems =
      mapPaginatedObjectMetadataItemsToObjectMetadataItems({
        pagedObjectMetadataItems: objectMetadataItemsResult.data,
      });
```
**What it does:** Transforms the paginated response into a flat array.

**Transformation:**
- Input: `{ objects: { edges: [{ node: {...} }] } }`
- Output: `[{...}, {...}]`

**Why needed:** App code expects flat array, not GraphQL connection structure.

---

```typescript
    return replaceObjectMetadataItemIfDifferent(objectMetadataItems);
  };
```
**What it does:** Passes to the Recoil callback for state update.
**Returns:** The enriched metadata items.

---

See Part 2 for continuation...


## File 3: GraphQL Query & Fragment

### Query Definition

**Location:** `packages/twenty-front/src/modules/object-metadata/graphql/queries.ts`

```typescript
export const FIND_MANY_OBJECT_METADATA_ITEMS = gql`
  ${OBJECT_METADATA_FRAGMENT}
  query ObjectMetadataItems {
    objects(paging: { first: 1000 }) {
      edges {
        node {
          ...ObjectMetadataFields
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
`;
```

**Query breakdown:**
- **Name:** `ObjectMetadataItems`
- **Field:** `objects` (root query field)
- **Arguments:** `paging: { first: 1000 }` (fetch up to 1000 objects)
- **Returns:** Connection type with edges and pageInfo
- **Fragment:** `ObjectMetadataFields` (defined separately)

**Why pagination:** GraphQL best practice, allows fetching large datasets efficiently.
**Limit of 1000:** Reasonable limit for object types (most workspaces have < 100).

### Fragment Definition

**Location:** `packages/twenty-front/src/modules/object-metadata/graphql/fragment.ts`

The fragment defines all fields to fetch for each object. Key sections:

**Basic Object Properties:**
```graphql
id
nameSingular          # "company"
namePlural            # "companies"
labelSingular         # "Company"
labelPlural           # "Companies"
description
icon                  # "IconBuilding"
isCustom              # User-created vs system
isRemote              # External data source
isActive
isSystem              # Core system object
isUIReadOnly
```

**Field Metadata:**
```graphql
fieldsList {
  id
  type                # TEXT, NUMBER, RELATION, etc.
  name                # API name
  label               # Display name
  isCustom
  isActive
  isNullable
  defaultValue
  options             # For SELECT fields
  settings            # Type-specific config

  relation {
    type              # ONE_TO_MANY, etc.
    sourceObjectMetadata { id, nameSingular }
    targetObjectMetadata { id, nameSingular }
  }
}
```

**Index Metadata:**
```graphql
indexMetadataList {
  id
  name
  indexType
  isUnique
  indexFieldMetadataList {
    fieldMetadataId
    order
  }
}
```

## Complete Data Structures

### Final ObjectMetadataItem

```typescript
ObjectMetadataItem = {
  // Identity
  id: string;
  nameSingular: string;        // "company"
  namePlural: string;          // "companies"
  labelSingular: string;       // "Company"
  labelPlural: string;         // "Companies"

  // Configuration
  description: string | null;
  icon: string | null;
  isCustom: boolean;
  isRemote: boolean;
  isActive: boolean;
  isSystem: boolean;
  isUIReadOnly: boolean;
  isSearchable: boolean;

  // References
  labelIdentifierFieldMetadataId: string;
  imageIdentifierFieldMetadataId: string | null;

  // Fields (three versions for permissions)
  fields: FieldMetadataItem[];           // All fields
  readableFields: FieldMetadataItem[];   // User can read
  updatableFields: FieldMetadataItem[];  // User can update

  // Indexes
  indexMetadatas: IndexMetadataItem[];
}
```

### FieldMetadataItem

```typescript
FieldMetadataItem = {
  id: string;
  type: FieldMetadataType;     // TEXT, NUMBER, RELATION, etc.
  name: string;                // API name
  label: string;               // Display name
  description: string | null;
  icon: string | null;

  isCustom: boolean;
  isActive: boolean;
  isSystem: boolean;
  isNullable: boolean;
  isUnique: boolean;

  defaultValue: any;
  options: any | null;         // For SELECT fields
  settings: any | null;        // Type-specific config

  relation: RelationMetadata | null;
  morphRelations: RelationMetadata[];
}
```

## Usage Examples

### Reading Metadata in Components

```typescript
// Get all metadata
const { objectMetadataItems } = useObjectMetadataItems();

// Find specific object
const companyMetadata = objectMetadataItems.find(
  (item) => item.nameSingular === 'company'
);

// Access fields
const nameField = companyMetadata.fields.find(
  (field) => field.name === 'name'
);

// Use readable fields (respects permissions)
const visibleColumns = companyMetadata.readableFields.map(field => ({
  id: field.id,
  label: field.label,
  type: field.type
}));
```

### When Metadata is Available

```typescript
// Check if loaded
const objectMetadataItems = useRecoilValue(objectMetadataItemsState);
const isLoaded = objectMetadataItems.length > 0;

// Or use loading state
const shouldAppBeLoading = useRecoilValue(shouldAppBeLoadingState);
```

## Summary

The metadata loading flow:

1. **ObjectMetadataItemsLoadEffect** orchestrates the load
2. **useRefreshObjectMetadataItems** executes GraphQL query
3. **FIND_MANY_OBJECT_METADATA_ITEMS** defines what to fetch
4. **mapPaginatedObjectMetadataItemsToObjectMetadataItems** transforms response
5. **enrichObjectMetadataItemsWithPermissions** adds permission filtering
6. **objectMetadataItemsState** stores the final result

This metadata becomes the foundation for the entire app, defining what objects exist, what fields they have, and what users can do with them.
