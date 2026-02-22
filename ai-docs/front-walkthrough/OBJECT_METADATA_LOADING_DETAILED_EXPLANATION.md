deep equality check
6. **Enables app navigation** by setting ready flags

This metadata becomes the foundation for the entire app, defining:
- What objects exist
- What fields each object has
- What permissions apply
- How objects relate to each other
- How to render forms, tables, and views

Every page, component, and feature relies on this metadata to be dynamic and data-driven rather than hardcoded.
await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
  // Metadata should be available
});
```

---

## Summary

`ObjectMetadataItemsLoadEffect` orchestrates a complex data loading flow:

1. **Checks authentication state** to determine loading strategy
2. **Executes GraphQL query** to fetch all object schemas
3. **Transforms response** from paginated structure to flat array
4. **Enriches with permissions** to create filtered field lists
5. **Stores in Recoil** with ();
}
```

---

## Testing

### Storybook Setup

```typescript
// In PageDecorator
<ObjectMetadataItemsLoadEffect />
// Automatically loads mock metadata for stories
```

### Mock Data

```typescript
// Mock metadata includes:
// - Standard objects (Company, Person, Opportunity)
// - All fields with proper types
// - Relation definitions
// - Permission configurations
```

### Integration Tests

```typescript
// Test that metadata loads
test('loads object metadata on mount', async () => {
  render(<App />);
   Error is logged and app may show error state
}
```

### Validation Errors

```typescript
// Zod schema validation
const labelIdentifierFieldMetadataId =
  objectMetadataItemSchema.shape.labelIdentifierFieldMetadataId.parse(
    object.node.labelIdentifierFieldMetadataId,
  );
// Throws if validation fails
```

### Fallback to Mocks

```typescript
// If no user or inactive workspace
if (isUndefinedOrNull(currentUser) || !isWorkspaceActiveOrSuspended(currentWorkspace)) {
  await loadMockedObjectMetadataItems:** Uses GraphQL pagination (though fetches all at once)
2. **Fragment Reuse:** `OBJECT_METADATA_FRAGMENT` used in multiple queries
3. **Permission Pre-filtering:** `readableFields`/`updatableFields` computed once
4. **Memoization:** Components using metadata should memoize derived data

---

## Error Handling

### Network Errors

```typescript
// In useRefreshObjectMetadataItems
try {
  await client.query({ query: FIND_MANY_OBJECT_METADATA_ITEMS });
} catch (error) {
  // Apollo Client handles retry logic
  //e

// Check if loaded
const objectMetadataItems = useRecoilValue(objectMetadataItemsState);
const isLoaded = objectMetadataItems.length > 0;
```

---

## Performance Considerations

### Caching Strategy

1. **Apollo Cache:** Response is cached by Apollo Client
2. **Recoil State:** Stored in `objectMetadataItemsState` for fast access
3. **Deep Equality:** Only updates if data actually changed
4. **Single Fetch:** Loaded once on app init, reused throughout session

### Optimization Techniques

1. **Paginationbject
const companyMetadata = objectMetadataItems.find(
  (item) => item.nameSingular === 'company'
);

// Access fields
const nameField = companyMetadata.fields.find(
  (field) => field.name === 'name'
);

// Use readable fields (respects permissions)
const visibleFields = companyMetadata.readableFields;
```

### When Metadata is Available

```typescript
// Metadata is loaded when:
// 1. ObjectMetadataItemsLoadEffect completes
// 2. objectMetadataItemsState is populated
// 3. shouldAppBeLoadingState is falsedAt: string;
  updatedAt: string;

  defaultValue: any;
  options: any | null;         // For SELECT fields
  settings: any | null;        // Type-specific config

  isLabelSyncedWithName: boolean;
  morphId: string | null;
  applicationId: string | null;

  relation: RelationMetadata | null;
  morphRelations: RelationMetadata[];
}
```

---

## Usage in Components

### Reading Object Metadata

```typescript
// In any component
const { objectMetadataItems } = useObjectMetadataItems();

// Find specific oUser can update

  // Indexes
  indexMetadatas: IndexMetadataItem[];
}
```

### FieldMetadataItem Structure

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
  isUIReadOnly: boolean;
  isNullable: boolean;
  isUnique: boolean;

  creat;
  updatedAt: string;

  // References
  labelIdentifierFieldMetadataId: string;  // Main display field
  imageIdentifierFieldMetadataId: string | null;
  applicationId: string | null;

  // Configuration
  shortcut: string | null;     // Keyboard shortcut
  isLabelSyncedWithName: boolean;
  duplicateCriteria: any | null;

  // Fields (three versions)
  fields: FieldMetadataItem[];           // All fields
  readableFields: FieldMetadataItem[];   // User can read
  updatableFields: FieldMetadataItem[];  //    // "Company"
  labelPlural: string;         // "Companies"
  description: string | null;
  icon: string | null;         // "IconBuilding"

  // Flags
  isCustom: boolean;           // User-created object
  isRemote: boolean;           // External data source
  isActive: boolean;           // Currently active
  isSystem: boolean;           // System object (can't delete)
  isUIReadOnly: boolean;       // Can't edit in UI
  isSearchable: boolean;       // Appears in search

  // Timestamps
  createdAt: stringleFields: [
    { id: "name", name: "name" },
    { id: "salary", name: "salary" }
    // ssn excluded (no read permission)
  ],
  updatableFields: [
    { id: "name", name: "name" }
    // salary and ssn excluded (no update permission)
  ]
}
```

---

## Complete Data Structure

### Final ObjectMetadataItem Structure

```typescript
ObjectMetadataItem = {
  // Basic properties
  id: string;
  nameSingular: string;        // "company"
  namePlural: string;          // "companies"
  labelSingular: string;    s: fields.filter(
          (field) => !nonUpdatableFieldMetadataIds.includes(field.id),
        ),
      } satisfies ObjectMetadataItem;
    }) ?? [];

  return formattedObjects;
};
```

**What it does:** Creates three field lists:
1. `fields`: All fields (unfiltered)
2. `readableFields`: Fields user can read
3. `updatableFields`: Fields user can update

**Example:**
```typescript
{
  fields: [
    { id: "name", name: "name" },
    { id: "salary", name: "salary" },
    { id: "ssn", name: "ssn" }
  ],
  readab that user cannot read/update.

**Logic:**
```typescript
// For each field in fieldPermissions
// If canRead === false, add to nonReadableFieldMetadataIds
// If canUpdate === false, add to nonUpdatableFieldMetadataIds
```

---

```typescript
      const { fields, ...objectWithoutFields } = object;

      return {
        ...objectWithoutFields,
        fields: fields,
        readableFields: fields.filter(
          (field) => !nonReadableFieldMetadataIds.includes(field.id),
        ),
        updatableFieldte: boolean;
    }
  }
}
```

---

```typescript
      const nonReadableFieldMetadataIds = !isDefined(objectPermissions)
        ? []
        : getNonReadableFieldMetadataIdsFromObjectPermissions({
            objectPermissions: objectPermissions,
          });

      const nonUpdatableFieldMetadataIds = !isDefined(objectPermissions)
        ? []
        : getNonUpdatableFieldMetadataIdsFromObjectPermissions({
            objectPermissions: objectPermissions,
          });
```

**What it does:** Extracts field IDs---

```typescript
      const objectPermissions = getObjectPermissionsFromMapByObjectMetadataId({
        objectPermissionsByObjectMetadataId,
        objectMetadataId: object.id,
      });
```

**What it does:** Looks up permissions for this specific object.

**Returns:**
```typescript
{
  canReadObjectRecords: boolean;
  canCreateObjectRecords: boolean;
  canUpdateObjectRecords: boolean;
  canDeleteObjectRecords: boolean;
  fieldPermissions: {
    [fieldId: string]: {
      canRead: boolean;
      canUpda}
]
```

---

### 6. Permission Enrichment

**Location:** `packages/twenty-front/src/modules/object-metadata/utils/enrichObjectMetadataItemsWithPermissions.ts`

```typescript
export const enrichObjectMetadataItemsWithPermissions = ({
  objectMetadataItems,
  objectPermissionsByObjectMetadataId,
}: enrichObjectMetadataItemsWithPermissionsArgs) => {
  const formattedObjects: ObjectMetadataItem[] =
    objectMetadataItems.map((object) => {
```

**Purpose:** Adds permission-filtered field lists to each object.

  }) satisfies IndexMetadataItem,
        ),
      };
    }) ?? [];

  return formattedObjects;
};
```

**Transformations:**
1. `fieldsList` → `fields` (rename)
2. `indexMetadataList` → `indexMetadatas` (rename)
3. `indexFieldMetadataList` → `indexFieldMetadatas` (rename, nested)
4. Flatten `edges[].node` structure

**Before:**
```typescript
{
  objects: {
    edges: [
      { node: { fieldsList: [...], indexMetadataList: [...] } }
    ]
  }
}
```

**After:**
```typescript
[
  { fields: [...], indexMetadatas: [...] sList, indexMetadataList, ...objectWithoutFieldsList } =
        object.node;

      return {
        ...objectWithoutFieldsList,
        fields: fieldsList,
        labelIdentifierFieldMetadataId,
        indexMetadatas: indexMetadataList.map(
          (index) => ({
            ...index,
            indexFieldMetadatas: index.indexFieldMetadataList.map(
              (indexFieldMetadata) => ({
                ...indexFieldMetadata,
              }) satisfies IndexFieldMetadataItem,
            ),
        s.map((object) => {
```

**What it does:** Transforms GraphQL response structure to app data structure.

---

```typescript
      const labelIdentifierFieldMetadataId =
        objectMetadataItemSchema.shape.labelIdentifierFieldMetadataId.parse(
          object.node.labelIdentifierFieldMetadataId,
        );
```

**What it does:** Validates and parses the label identifier field ID using Zod schema.

**Why validation:** Ensures data integrity, catches API contract changes.

---

```typescript
      const { fieldeld can relate to multiple object types).

**Example:** Attachments can belong to Company OR Person.

---

### 5. Response Transformation

**Location:** `packages/twenty-front/src/modules/object-metadata/utils/mapPaginatedObjectMetadataItemsToObjectMetadataItems.ts`

```typescript
export const mapPaginatedObjectMetadataItemsToObjectMetadataItems = ({
  pagedObjectMetadataItems,
}: mapPaginatedObjectMetadataItemsToObjectMetadataItemsArgs) => {
  const formattedObjects =
    pagedObjectMetadataItems?.objects.edgeldMetadata`: Field on source object
- `targetFieldMetadata`: Field on target object

**Example:**
```typescript
// Company.people relation
{
  type: "ONE_TO_MANY",
  sourceObjectMetadata: { nameSingular: "company" },
  targetObjectMetadata: { nameSingular: "person" },
  sourceFieldMetadata: { name: "people" },
  targetFieldMetadata: { name: "company" }
}
```

---

```typescript
      morphRelations {
        // Same structure as relation
      }
    }
  }
`;
```

**Morph relations:** Polymorphic relations (one fiadata {
          id
          nameSingular
          namePlural
        }
        targetObjectMetadata {
          id
          nameSingular
          namePlural
        }
        sourceFieldMetadata {
          id
          name
        }
        targetFieldMetadata {
          id
          name
        }
      }
```

**Relation metadata:**
- `type`: ONE_TO_MANY, MANY_TO_ONE, MANY_TO_MANY
- `sourceObjectMetadata`: Object that owns the relation
- `targetObjectMetadata`: Object being related to
- `sourceFie
      isSystem
      isUIReadOnly
      isNullable
      isUnique
      createdAt
      updatedAt
      defaultValue
      options
      settings
      isLabelSyncedWithName
      morphId
      applicationId
```

**Field properties:**
- `type`: TEXT, NUMBER, RELATION, SELECT, etc.
- `name`: API name ("domainName")
- `label`: Display name ("Domain Name")
- `options`: For SELECT fields (dropdown choices)
- `settings`: Type-specific configuration

---

```typescript
      relation {
        type
        sourceObjectMetist {
      id
      createdAt
      updatedAt
      name
      indexWhereClause
      indexType
      isUnique
      isCustom
      indexFieldMetadataList {
        id
        fieldMetadataId
        createdAt
        updatedAt
        order
      }
    }
```

**Index metadata:**
- Database indexes for performance
- Unique constraints
- Composite indexes (multiple fields)

---

```typescript
    fieldsList {
      id
      type
      name
      label
      description
      icon
      isCustom
      isActiveetadataId
    applicationId
    shortcut
    isLabelSyncedWithName
    isSearchable
    duplicateCriteria
```

**Object properties:**
- `nameSingular/namePlural`: API names ("company"/"companies")
- `labelSingular/labelPlural`: Display names ("Company"/"Companies")
- `isCustom`: User-created vs system object
- `isRemote`: External data source (e.g., Stripe)
- `isSystem`: Core system object (can't be deleted)
- `labelIdentifierFieldMetadataId`: Which field is the main label

---

```typescript
    indexMetadataLject types (most workspaces have < 100).

---

### 4. GraphQL Fragment

**Location:** `packages/twenty-front/src/modules/object-metadata/graphql/fragment.ts`

```typescript
export const OBJECT_METADATA_FRAGMENT = gql`
  fragment ObjectMetadataFields on Object {
    id
    nameSingular
    namePlural
    labelSingular
    labelPlural
    description
    icon
    isCustom
    isRemote
    isActive
    isSystem
    isUIReadOnly
    createdAt
    updatedAt
    labelIdentifierFieldMetadataId
    imageIdentifierFieldMhasNextPage
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

**Limit of 1000:** Reasonable limit for ob effects.

**System connection:** Allows URL-based navigation to work (e.g., `/objects/companies` can now resolve).

---

### 3. GraphQL Query Definition

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
        typescript
        if (snapshot.getLoadable(shouldAppBeLoadingState).getValue() === true) {
          set(shouldAppBeLoadingState, false);
        }
```
**What it does:** Marks app as finished loading.

**System connection:** Loading screen disappears, app becomes interactive.

---

```typescript
        if (
          snapshot.getLoadable(isAppEffectRedirectEnabledState).getValue() === false
        ) {
          set(isAppEffectRedirectEnabledState, true);
        }
```
**What it does:** Enables navigationoadable(objectMetadataItemsState).getValue(),
            newObjectMetadataItems,
          ) &&
          newObjectMetadataItems.length > 0
        ) {
          set(objectMetadataItemsState, newObjectMetadataItems);
        }
```
**What it does:** Only updates state if data actually changed.

**Why deep equality check:** Prevents unnecessary re-renders if metadata hasn't changed.

**Performance:** This is crucial because updating `objectMetadataItemsState` triggers re-renders in many components.

---

```tMetadataItems = enrichObjectMetadataItemsWithPermissions({
          objectMetadataItems: toSetObjectMetadataItems,
          objectPermissionsByObjectMetadataId,
        });
```
**What it does:** Adds permission-filtered field lists to each object.

**Enrichment process:**
1. For each object, get its permissions
2. Filter fields by read permissions → `readableFields`
3. Filter fields by update permissions → `updatableFields`

---

```typescript
        if (
          !isDeeplyEqual(
            snapshot.getL );
```
**What it does:** Creates a lookup map of permissions by object ID.

**Input:**
```typescript
currentUserWorkspace.objectsPermissions = [
  { objectMetadataId: "company-id", canRead: true, canCreate: true, ... },
  { objectMetadataId: "person-id", canRead: true, canCreate: false, ... },
]
```

**Output:**
```typescript
{
  "company-id": { objectMetadataId: "company-id", canRead: true, ... },
  "person-id": { objectMetadataId: "person-id", canRead: true, ... },
}
```

---

```typescript
        const newObjec
```
**What it does:** Gets current workspace from Recoil snapshot.

**Why snapshot:** Synchronous read of Recoil state within callback.

---

```typescript
        const objectPermissionsByObjectMetadataId =
          currentUserWorkspace.objectsPermissions.reduce(
            (acc, objectPermission) => {
              acc[objectPermission.objectMetadataId] = objectPermission;
              return acc;
            },
            {} as Record<string, ObjectPermissions & { objectMetadataId: string }>,
         ectMetadataItemIfDifferent = useRecoilCallback(
    ({ set, snapshot }) =>
      (toSetObjectMetadataItems) => {
```
**What it does:** Recoil callback that can read and write state atomically.

**Why useRecoilCallback:** Allows reading multiple Recoil states and updating them in a single transaction.

---

```typescript
        const currentUserWorkspace = snapshot
          .getLoadable(currentUserWorkspaceState)
          .getValue();

        if (!isDefined(currentUserWorkspace)) {
          return;
        }ingular: "company", ... } },
      { node: { id: "...", nameSingular: "person", ... } },
    ],
    pageInfo: { hasNextPage: false, ... }
  }
}
```

**Output structure:**
```typescript
[
  { id: "...", nameSingular: "company", fields: [...], ... },
  { id: "...", nameSingular: "person", fields: [...], ... },
]
```

---

```typescript
    return replaceObjectMetadataItemIfDifferent(objectMetadataItems);
  };
```
**What it does:** Passes to the Recoil callback for state update.

---

```typescript
  const replaceObjta HTTP/1.1
Content-Type: application/json

{
  "query": "query ObjectMetadataItems { objects(paging: { first: 1000 }) { ... } }",
  "variables": {}
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

**Input structure:**
```typescript
{
  objects: {
    edges: [
      { node: { id: "...", nameSst refreshObjectMetadataItems = async () => {
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
POST /metada Hook that fetches metadata from GraphQL API and stores in Recoil.

**fetchPolicy options:**
- `'network-only'`: Always fetch from server (default)
- `'cache-first'`: Use cache if available
- `'no-cache'`: Don't cache the result

---

```typescript
  const client = useApolloClient();
```
**What it does:** Gets Apollo Client instance for manual queries.

**Why manual query:** We need to process the data before storing in Recoil, so we use `client.query()` instead of `useQuery()` hook.

---

```typescript
  conectMetadataItems,
    refreshObjectMetadataItems,
    isInitialized,
  ]);
```
**What it does:** Runs the load function and marks as initialized.

**Dependencies:** Re-runs if user or workspace changes (e.g., switching workspaces).

---

### 2. useRefreshObjectMetadataItems.ts

**Location:** `packages/twenty-front/src/modules/object-metadata/hooks/useRefreshObjectMetadataItems.ts`

```typescript
export const useRefreshObjectMetadataItems = (
  fetchPolicy: FetchPolicy = 'network-only',
) => {
```
**Purpose:**
```
**What it does:** Uses mock data if:
- No user is logged in (Storybook, tests)
- Workspace is not active or suspended

**Mock data path:** Loads static JSON with predefined object schemas.

---

```typescript
      } else {
        await refreshObjectMetadataItems();
      }
```
**What it does:** Uses real API if user is authenticated and workspace is active.

---

```typescript
      setIsInitialized(true);
    };

    loadObjectMetadata();
  }, [
    currentUser,
    currentWorkspace,
    loadMockedObjrategies:
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

---

```typescript
    const loadObjectMetadata = async () => {
      if (
        isUndefinedOrNull(currentUser) ||
        !isWorkspaceActiveOrSuspended(currentWorkspace)
      ) {
        await loadMockedObjectMetadataItems();sions[];
  // ... workspace properties
}
```

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
**What it does:** Gets the two loading stffect component that runs once on mount to load metadata.

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
  // ... user properties
}

currentWorkspace = {
  id: string;
  name: string;
  activationStatus: 'active' | 'suspended' | 'inactive';
  objectsPermissions: ObjectPermiscan now access object metadata             │
│    - useObjectMetadataItems() returns populated data            │
│    - Pages can render object-specific UIs                      │
└─────────────────────────────────────────────────────────────────┘
```

## File-by-File Breakdown

### 1. ObjectMetadataItemsLoadEffect.tsx

**Location:** `packages/twenty-front/src/modules/object-metadata/components/ObjectMetadataItemsLoadEffect.tsx`

```typescript
export const ObjectMetadataItemsLoadEffect = () => {
```
**Purpose:** Etes objectMetadataItemsState                           │
│    - Deep equality check (only update if changed)               │
│    - Sets shouldAppBeLoadingState = false                       │
│    - Enables isAppEffectRedirectEnabledState                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. APP READY                                                    │
│    - All components
│    - enrichObjectMetadataItemsWithPermissions()                 │
│    - Adds readableFields (filtered by permissions)              │
│    - Adds updatableFields (filtered by permissions)             │
│    - Uses currentUserWorkspace.objectsPermissions               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. STORE IN RECOIL STATE                                        │
│    - Upda    │
│    - mapPaginatedObjectMetadataItemsToObjectMetadataItems()     │
│    - Flattens pagination structure                              │
│    - Transforms fieldsList → fields                             │
│    - Transforms indexMetadataList → indexMetadatas              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. PERMISSION ENRICHMENT                                        │────────┐
│ 4. SERVER PROCESSES REQUEST                                     │
│    - NestJS ObjectMetadataResolver handles query                │
│    - Queries PostgreSQL metadata tables                         │
│    - Returns paginated object metadata                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. RESPONSE TRANSFORMATION                                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. GRAPHQL QUERY EXECUTION                                      │
│    Query: FindManyObjectMetadataItems                           │
│    Endpoint: /metadata (GraphQL)                                │
│    Variables: { paging: { first: 1000 } }                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────  │ USER AUTHENTICATED │
         │ (Storybook/Testing) │   │ (Production)       │
         └──────────┬──────────┘   └───┬────────────────┘
                    │                   │
         ┌──────────▼──────────┐   ┌───▼────────────────┐
         │ loadMockedMetadata  │   │ refreshMetadata    │
         │ (Static mock data)  │   │ (GraphQL API call) │
         └──────────┬──────────┘   └───┬────────────────┘
                    │                   │
                    └─────────┬─────────┘
                 relationships.

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. APP INITIALIZATION                                           │
│    - App.tsx renders                                            │
│    - ObjectMetadataItemsLoadEffect mounts                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. CHECK USER & WORKSPACE SObjectMetadataItemsLoadEffect` is a React component that runs on app initialization to fetch all object schemas (metadata) from the GraphQL API. This metadata defines every object type in the system (Company, Person, Opportunity, etc.) including their fields, permissions, and # ObjectMetadataItemsLoadEffect: Complete Data Fetching Flow

## Overview

`
