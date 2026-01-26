# Twenty-Front Architecture: Complete Walkthrough

## From Backend to Screen - A Company Record Journey

This document walks through how a single Company record flows from the backend GraphQL API all the way to being rendered on your screen. We'll trace every step, every pattern, and every type transformation.

---

## Table of Contents

1. [The Big Picture](#the-big-picture)
2. [Step 1: Route & Page Entry](#step-1-route--page-entry)
3. [Step 2: Metadata Resolution](#step-2-metadata-resolution)
4. [Step 3: GraphQL Query Generation](#step-3-graphql-query-generation)
5. [Step 4: Data Fetching with Apollo](#step-4-data-fetching-with-apollo)
6. [Step 5: State Management](#step-5-state-management)
7. [Step 6: Component Rendering](#step-6-component-rendering)
8. [Step 7: Field Display](#step-7-field-display)
9. [Key Patterns & Concepts](#key-patterns--concepts)
10. [Type System Deep Dive](#type-system-deep-dive)

---

## The Big Picture

Twenty uses a **generic object-record system**. This means:
- There's NO separate `CompanyList` component
- There's NO separate `PersonList` component
- Instead, ONE generic system handles ALL object types (companies, people, opportunities, etc.)

The magic happens through **metadata-driven architecture**:
```
URL → Metadata → GraphQL Query → Apollo Cache → Recoil State → Generic Components → Rendered UI
```


---

## Step 1: Route & Page Entry

### The URL
```
https://app.twenty.com/objects/companies
```

### Route Configuration
The router (in `useCreateAppRouter.tsx`) maps this to:
```typescript
<Route path="/objects/:objectNamePlural" element={<RecordIndexPage />} />
```

### RecordIndexPage Component
**Location:** `packages/twenty-front/src/pages/object-record/RecordIndexPage.tsx`

```typescript
export const RecordIndexPage = () => {
  // 1. Get the current object metadata ID from context store
  const contextStoreCurrentObjectMetadataItemId = useRecoilComponentValue(
    contextStoreCurrentObjectMetadataItemIdComponentState,
    MAIN_CONTEXT_STORE_INSTANCE_ID,
  );

  // 2. Get ALL object metadata items
  const { objectMetadataItems } = useObjectMetadataItems();

  // 3. Find the specific metadata for "companies"
  const objectMetadataItem = objectMetadataItems.find(
    (item) => item.id === contextStoreCurrentObjectMetadataItemId,
  );

  // 4. Render the generic container
  return (
    <PageContainer>
      <RecordIndexContainerGater />
    </PageContainer>
  );
};
```

**Key Insight:** The page doesn't know it's showing companies! It just knows it's showing "some object type" based on metadata.


---

## Step 2: Metadata Resolution

### What is ObjectMetadataItem?

**Location:** `packages/twenty-front/src/modules/object-metadata/types/ObjectMetadataItem.ts`

```typescript
export type ObjectMetadataItem = {
  id: string;
  nameSingular: string;        // "company"
  namePlural: string;          // "companies"
  labelSingular: string;       // "Company"
  labelPlural: string;         // "Companies"
  fields: FieldMetadataItem[]; // All field definitions
  readableFields: FieldMetadataItem[];
  updatableFields: FieldMetadataItem[];
  labelIdentifierFieldMetadataId: string; // Which field is the "name"
  // ... more properties
};
```

### FieldMetadataItem Structure

```typescript
export type FieldMetadataItem = {
  id: string;
  name: string;              // "domainName", "employees", etc.
  label: string;             // "Domain Name", "Employees"
  type: FieldMetadataType;   // TEXT, NUMBER, RELATION, etc.
  isNullable: boolean;
  defaultValue?: any;
  options?: FieldMetadataItemOption[];
  relation?: FieldMetadataItemRelation;
  // ... more properties
};
```

### Example: Company Metadata
```typescript
{
  id: "abc-123",
  nameSingular: "company",
  namePlural: "companies",
  labelSingular: "Company",
  labelPlural: "Companies",
  fields: [
    { name: "id", type: "UUID", label: "ID" },
    { name: "name", type: "TEXT", label: "Name" },
    { name: "domainName", type: "LINKS", label: "Domain Name" },
    { name: "employees", type: "NUMBER", label: "Employees" },
    { name: "address", type: "ADDRESS", label: "Address" },
    { name: "accountOwner", type: "RELATION", label: "Account Owner" },
    // ... more fields
  ]
}
```

**Key Insight:** The metadata tells the frontend EVERYTHING about how to query, display, and edit companies - without hardcoding anything!


---

## Step 3: GraphQL Query Generation

### The Hook Chain
```
useFindManyRecords → useFindManyRecordsQuery → generateFindManyRecordsQuery
```

### generateFindManyRecordsQuery

**Location:** `packages/twenty-front/src/modules/object-record/utils/generateFindManyRecordsQuery.ts`

This function **dynamically generates** a GraphQL query based on metadata:

```typescript
export const generateFindManyRecordsQuery = ({
  objectMetadataItem,
  objectMetadataItems,
  recordGqlFields,
  // ...
}) => gql`
  query FindManyCompanies(
    $filter: CompanyFilterInput,
    $orderBy: [CompanyOrderByInput],
    $lastCursor: String,
    $limit: Int
  ) {
    companies(
      filter: $filter,
      orderBy: $orderBy,
      first: $limit,
      after: $lastCursor
    ) {
      edges {
        node {
          id
          __typename
          name
          domainName {
            primaryLinkUrl
            primaryLinkLabel
          }
          employees
          address {
            addressStreet1
            addressCity
            addressState
          }
          accountOwner {
            id
            name
          }
          # ... all other fields
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
`;
```

### How Fields Are Mapped

The `mapObjectMetadataToGraphQLQuery` function walks through each field and:
1. **Simple fields** (TEXT, NUMBER) → Just include the field name
2. **Composite fields** (ADDRESS, LINKS) → Include nested structure
3. **Relations** (RELATION) → Include related object fields
4. **Permissions** → Only include fields the user can read


---

## Step 4: Data Fetching with Apollo

### useFindManyRecords Hook

**Location:** `packages/twenty-front/src/modules/object-record/hooks/useFindManyRecords.ts`

```typescript
export const useFindManyRecords = ({
  objectNameSingular,  // "company"
  filter,              // { name: { contains: "Acme" } }
  orderBy,             // [{ name: "ASC" }]
  limit,               // 60
  // ...
}) => {
  // 1. Get metadata
  const { objectMetadataItem } = useObjectMetadataItem({ objectNameSingular });

  // 2. Generate query
  const { findManyRecordsQuery } = useFindManyRecordsQuery({
    objectNameSingular,
    recordGqlFields,
  });

  // 3. Execute query with Apollo
  const { data, loading, error, fetchMore, refetch } = useQuery(
    findManyRecordsQuery,
    {
      variables: { filter, orderBy, limit },
      fetchPolicy: 'cache-first',
      onCompleted: handleFindManyRecordsCompleted,
      onError: handleFindManyRecordsError,
    }
  );

  // 4. Extract records from response
  const records = data?.[objectMetadataItem.namePlural]?.edges?.map(
    edge => edge.node
  ) ?? [];

  return {
    records,      // Array of company objects
    totalCount,   // Total number of companies
    loading,
    error,
    fetchMoreRecords,
    refetch,
  };
};
```

### Apollo Response Structure

```typescript
{
  companies: {
    edges: [
      {
        node: {
          id: "company-1",
          __typename: "Company",
          name: "Acme Corp",
          domainName: { primaryLinkUrl: "acme.com" },
          employees: 150,
          // ... all fields
        },
        cursor: "cursor-1"
      },
      // ... more companies
    ],
    pageInfo: {
      hasNextPage: true,
      endCursor: "cursor-60"
    },
    totalCount: 250
  }
}
```


---

## Step 5: State Management

Twenty uses **TWO state management systems** working together:

### 1. Apollo Cache (Server State)
- Stores the raw GraphQL response
- Normalized by `id` and `__typename`
- Handles caching, refetching, optimistic updates

### 2. Recoil (UI State)
- Stores derived/computed state
- Manages UI-specific state (selected rows, filters, etc.)
- Provides component-scoped state

### Record Store Pattern

**Location:** `packages/twenty-front/src/modules/object-record/record-store/states/recordStoreFamilyState.ts`

```typescript
export const recordStoreFamilyState = createFamilyState<
  ObjectRecord | null | undefined,
  string
>({
  key: 'recordStoreFamilyState',
  defaultValue: null,
});
```

This creates a **family of atoms** - one atom per record ID:

```typescript
// Usage in components
const [company1, setCompany1] = useRecoilState(recordStoreFamilyState('company-1'));
const [company2, setCompany2] = useRecoilState(recordStoreFamilyState('company-2'));
```

### Why This Pattern?

1. **Granular updates:** Updating one company doesn't re-render all companies
2. **Easy access:** Any component can access any record by ID
3. **Consistency:** Single source of truth per record

### State Flow

```
Apollo Query → Records Array → Populate Record Store → Components Read from Store
```

```typescript
// After query completes
records.forEach(record => {
  setRecoilState(recordStoreFamilyState(record.id), record);
});

// In a table cell component
const record = useRecoilValue(recordStoreFamilyState(recordId));
```


---

## Step 6: Component Rendering

### Component Hierarchy

```
RecordIndexPage
  └─ RecordIndexContainer
      └─ RecordIndexTableContainer
          └─ RecordTableWithWrappers
              └─ RecordTable
                  └─ RecordTableContent
                      └─ RecordTableBody
                          └─ RecordTableRow (for each company)
                              └─ RecordTableCell (for each field)
                                  └─ FieldDisplay
                                      └─ TextFieldDisplay / NumberFieldDisplay / etc.
```

### RecordIndexContainer

**Location:** `packages/twenty-front/src/modules/object-record/record-index/components/RecordIndexContainer.tsx`

```typescript
export const RecordIndexContainer = () => {
  const [recordIndexViewType] = useRecoilState(recordIndexViewTypeState);
  const { objectNamePlural, recordIndexId, objectMetadataItem } =
    useRecordIndexContextOrThrow();

  return (
    <StyledContainer>
      <ViewBar viewBarId={recordIndexId} />

      {/* Table View */}
      {recordIndexViewType === ViewType.Table && (
        <RecordIndexTableContainer recordTableId={recordIndexId} />
      )}

      {/* Kanban View */}
      {recordIndexViewType === ViewType.Kanban && (
        <RecordBoardContainer recordBoardId={recordIndexId} />
      )}

      {/* Calendar View */}
      {recordIndexViewType === ViewType.Calendar && (
        <RecordIndexCalendarContainer recordCalendarInstanceId={recordIndexId} />
      )}
    </StyledContainer>
  );
};
```

**Key Insight:** Same container, different views - all driven by `recordIndexViewType` state!


---

## Step 7: Field Display

### The Field Context Pattern

Every field cell is wrapped in a `FieldContext` that provides:

**Location:** `packages/twenty-front/src/modules/object-record/record-field/ui/contexts/FieldContext.ts`

```typescript
export type GenericFieldContextType = {
  recordId: string;                    // "company-1"
  fieldDefinition: FieldDefinition;    // Metadata about this field
  fieldMetadataItemId?: string;        // "field-123"
  isLabelIdentifier: boolean;          // Is this the "name" field?
  isRecordFieldReadOnly: boolean;      // Can user edit?
  useUpdateRecord?: RecordUpdateHook;  // How to save changes
  onOpenEditMode?: () => void;
  onCloseEditMode?: () => void;
  // ... more context
};
```

### RecordTableCell Component

**Location:** `packages/twenty-front/src/modules/object-record/record-table/record-table-cell/components/RecordTableCell.tsx`

```typescript
export const RecordTableCell = () => {
  return (
    <FieldFocusContextProvider>
      <RecordTableCellContainer
        nonEditModeContent={<FieldDisplay />}
      />
    </FieldFocusContextProvider>
  );
};
```

### FieldDisplay - The Type Router

**Location:** `packages/twenty-front/src/modules/object-record/record-field/ui/components/FieldDisplay.tsx`

This component routes to the correct display component based on field type:

```typescript
export const FieldDisplay = () => {
  const { fieldDefinition, isLabelIdentifier, isForbidden } =
    useContext(FieldContext);

  if (isForbidden) return <ForbiddenFieldDisplay />;

  if (isFieldIdentifierDisplay(fieldDefinition, isLabelIdentifier)) {
    return <ChipFieldDisplay />;
  }

  if (isFieldText(fieldDefinition)) return <TextFieldDisplay />;
  if (isFieldNumber(fieldDefinition)) return <NumberFieldDisplay />;
  if (isFieldLinks(fieldDefinition)) return <LinksFieldDisplay />;
  if (isFieldCurrency(fieldDefinition)) return <CurrencyFieldDisplay />;
  if (isFieldAddress(fieldDefinition)) return <AddressFieldDisplay />;
  if (isFieldRelationManyToOne(fieldDefinition)) return <RelationToOneFieldDisplay />;
  // ... 20+ more field types

  return null;
};
```


### Example: Rendering Company Name

Let's trace how "Acme Corp" gets rendered:

1. **Data in Store:**
```typescript
recordStoreFamilyState('company-1') = {
  id: 'company-1',
  __typename: 'Company',
  name: 'Acme Corp',
  // ... other fields
}
```

2. **Field Context:**
```typescript
{
  recordId: 'company-1',
  fieldDefinition: {
    type: 'TEXT',
    name: 'name',
    label: 'Name',
    metadata: { fieldName: 'name' }
  },
  isLabelIdentifier: true,  // This is the main identifier!
}
```

3. **FieldDisplay routes to ChipFieldDisplay** (because `isLabelIdentifier: true`)

4. **ChipFieldDisplay renders:**
```tsx
<RecordChip
  record={{ id: 'company-1', name: 'Acme Corp' }}
  objectNameSingular="company"
/>
```

5. **Final HTML:**
```html
<div class="chip">
  <Avatar>A</Avatar>
  <span>Acme Corp</span>
</div>
```

### Example: Rendering Employee Count

1. **Data:** `employees: 150`

2. **Field Context:**
```typescript
{
  recordId: 'company-1',
  fieldDefinition: {
    type: 'NUMBER',
    name: 'employees',
    label: 'Employees',
  },
  isLabelIdentifier: false,
}
```

3. **FieldDisplay routes to NumberFieldDisplay**

4. **NumberFieldDisplay renders:**
```tsx
<span>150</span>
```


---

## Key Patterns & Concepts

### 1. Metadata-Driven Architecture

**Everything is driven by metadata, not hardcoded logic.**

```typescript
// ❌ BAD: Hardcoded
if (objectType === 'company') {
  return <CompanyTable />;
} else if (objectType === 'person') {
  return <PersonTable />;
}

// ✅ GOOD: Metadata-driven
return <RecordTable objectMetadataItem={metadata} />;
```

### 2. Generic Object Record System

**One system handles all object types.**

```typescript
// The same component renders companies, people, opportunities, etc.
<RecordIndexPage />  // Works for ANY object type

// Type safety through generics
useFindManyRecords<Company>({ objectNameSingular: 'company' })
useFindManyRecords<Person>({ objectNameSingular: 'person' })
```

### 3. Component Instance Pattern

**Multiple instances of the same component can coexist.**

```typescript
// Each instance has its own state scope
<RecordTable recordTableId="companies-main" />
<RecordTable recordTableId="companies-modal" />

// State is scoped by instance ID
const state = useRecoilComponentValue(
  someState,
  'companies-main'  // Instance ID
);
```

### 4. Context Providers Pattern

**Nested contexts provide data down the tree.**

```typescript
<RecordIndexContext.Provider value={{ objectMetadataItem, recordIndexId }}>
  <RecordTableContext.Provider value={{ recordTableId, objectNameSingular }}>
    <FieldContext.Provider value={{ recordId, fieldDefinition }}>
      <FieldDisplay />
    </FieldContext.Provider>
  </RecordTableContext.Provider>
</RecordIndexContext.Provider>
```


### 5. Hook Composition Pattern

**Complex logic is built by composing smaller hooks.**

```typescript
// High-level hook
useFindManyRecords()
  ├─ useObjectMetadataItem()
  ├─ useFindManyRecordsQuery()
  │   ├─ useObjectMetadataItem()
  │   ├─ useObjectPermissions()
  │   └─ generateFindManyRecordsQuery()
  ├─ useQuery() [Apollo]
  ├─ useHandleFindManyRecordsCompleted()
  ├─ useHandleFindManyRecordsError()
  └─ useFetchMoreRecordsWithPagination()
```

### 6. Recoil Family State Pattern

**State is organized by ID for granular updates.**

```typescript
// Create a family of atoms
const recordStoreFamilyState = atomFamily({
  key: 'recordStore',
  default: null,
});

// Each record has its own atom
recordStoreFamilyState('company-1')  // Atom for company 1
recordStoreFamilyState('company-2')  // Atom for company 2

// Updating one doesn't affect the other
setRecoilState(recordStoreFamilyState('company-1'), newData);
// Only components using 'company-1' re-render!
```

### 7. Type Guards Pattern

**Runtime type checking for field types.**

```typescript
// Type guard functions
export const isFieldText = (
  field: FieldDefinition
): field is FieldTextDefinition => {
  return field.type === 'TEXT';
};

// Usage in FieldDisplay
if (isFieldText(fieldDefinition)) {
  // TypeScript now knows fieldDefinition is FieldTextDefinition
  return <TextFieldDisplay />;
}
```


---

## Type System Deep Dive

### The Type Hierarchy

```
ObjectRecord (Generic base type)
  ↓
Company / Person / Opportunity (Specific types)
  ↓
Record in Apollo Cache
  ↓
Record in Recoil State
  ↓
Field Values in Components
```

### 1. BaseObjectRecord

**Location:** `packages/twenty-front/src/modules/object-record/types/BaseObjectRecord.ts`

```typescript
export type BaseObjectRecord = {
  id: string;
  __typename: string;
};
```

Every record MUST have these two fields.

### 2. ObjectRecord

**Location:** `packages/twenty-front/src/modules/object-record/types/ObjectRecord.ts`

```typescript
export type ObjectRecord = Record<string, any> & BaseObjectRecord;
```

This is the **generic** type - it can hold any fields!

### 3. Company Type

**Location:** `packages/twenty-front/src/modules/companies/types/Company.ts`

```typescript
export type Company = {
  __typename: 'Company';
  id: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
  name: string;
  domainName: string | {
    __typename?: 'Links';
    primaryLinkUrl: string;
    primaryLinkLabel: string;
  };
  address: {
    __typename?: 'Address';
    addressStreet1: string;
    addressCity: string;
    // ... more address fields
  };
  employees: number | null;
  // ... more fields
};
```

**Key Insight:** This type is ONLY used for TypeScript type checking. The actual runtime code uses the generic `ObjectRecord` type!


### Type Flow Example

```typescript
// 1. Hook with generic type parameter
const { records } = useFindManyRecords<Company>({
  objectNameSingular: 'company'
});
// records: Company[]

// 2. Store in Recoil (loses specific type)
records.forEach(record => {
  setRecoilState(recordStoreFamilyState(record.id), record);
});

// 3. Read from Recoil (generic type)
const record = useRecoilValue(recordStoreFamilyState('company-1'));
// record: ObjectRecord | null

// 4. Access fields (runtime, no type safety)
const companyName = record?.name;  // any
const employees = record?.employees;  // any

// 5. Type assertion if needed
const company = record as Company;
const companyName = company.name;  // string
```

### Why This Design?

**Flexibility over Type Safety**

The generic system allows:
- Adding new object types without code changes
- Custom fields defined by users
- Dynamic field types

Trade-off:
- Less compile-time type safety
- More runtime flexibility
- Metadata provides the "schema"

### Field Metadata as Runtime Types

```typescript
// Instead of TypeScript types, we use metadata
const fieldMetadata: FieldMetadataItem = {
  name: 'employees',
  type: 'NUMBER',  // Runtime type information
  isNullable: true,
  // ...
};

// Components use this to determine behavior
if (fieldMetadata.type === 'NUMBER') {
  return <NumberFieldDisplay />;
}
```


---

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER NAVIGATES                                               │
│    URL: /objects/companies                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. ROUTE MATCHES                                                │
│    <Route path="/objects/:objectNamePlural"                     │
│           element={<RecordIndexPage />} />                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. METADATA RESOLUTION                                          │
│    - Get objectMetadataItems from Recoil                        │
│    - Find metadata for "companies"                              │
│    - Extract fields, permissions, etc.                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. GRAPHQL QUERY GENERATION                                     │
│    - generateFindManyRecordsQuery(metadata)                     │
│    - Creates: query FindManyCompanies { ... }                   │
│    - Includes all readable fields                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. APOLLO CLIENT QUERY                                          │
│    - useQuery(findManyRecordsQuery, { variables })              │
│    - Sends HTTP request to GraphQL API                          │
│    - Backend returns: { companies: { edges: [...] } }           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. APOLLO CACHE                                                 │
│    - Normalizes response by id + __typename                     │
│    - Stores: Company:company-1, Company:company-2, etc.         │
│    - Enables cache-first fetching                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. RECOIL STATE UPDATE                                          │
│    - Extract records from response                              │
│    - Populate recordStoreFamilyState(id) for each record        │
│    - Update UI state (loading, hasNextPage, etc.)               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. COMPONENT RENDERING                                          │
│    RecordIndexContainer                                         │
│      → RecordIndexTableContainer                                │
│        → RecordTable                                            │
│          → RecordTableBody                                      │
│            → RecordTableRow (for each company)                  │
│              → RecordTableCell (for each field)                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. FIELD DISPLAY                                                │
│    - FieldContext provides: recordId, fieldDefinition           │
│    - FieldDisplay routes to specific display component          │
│    - TextFieldDisplay / NumberFieldDisplay / etc.               │
│    - Reads value from recordStoreFamilyState(recordId)          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 10. RENDERED ON SCREEN                                          │
│     ┌──────────────────────────────────────────────────────┐   │
│     │ Name          │ Domain      │ Employees │ ...        │   │
│     ├──────────────────────────────────────────────────────┤   │
│     │ Acme Corp     │ acme.com    │ 150       │ ...        │   │
│     │ TechStart Inc │ techstart.io│ 45        │ ...        │   │
│     │ ...           │ ...         │ ...       │ ...        │   │
│     └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```


---

## Editing a Record: The Reverse Flow

When a user edits a company name, here's what happens:

### 1. User Interaction
```typescript
// User clicks on "Acme Corp" cell
<TextFieldDisplay />
  → onOpenEditMode()
  → Shows <TextFieldInput />
```

### 2. Local State Update
```typescript
// User types "Acme Corporation"
<TextFieldInput
  value={fieldValue}
  onChange={(newValue) => {
    // Update local state immediately (optimistic)
    setFieldValue(newValue);
  }}
/>
```

### 3. Mutation Hook
```typescript
const { updateOneRecord } = useUpdateOneRecord();

// On blur or Enter key
updateOneRecord({
  objectNameSingular: 'company',
  idToUpdate: 'company-1',
  updateOneRecordInput: {
    name: 'Acme Corporation'
  }
});
```

### 4. GraphQL Mutation
```graphql
mutation UpdateOneCompany($idToUpdate: ID!, $input: CompanyUpdateInput!) {
  updateOneCompany(id: $idToUpdate, data: $input) {
    id
    name
    updatedAt
  }
}
```

### 5. Optimistic Update
```typescript
// Apollo updates cache immediately (before server responds)
cache.writeFragment({
  id: 'Company:company-1',
  fragment: gql`fragment _ on Company { name }`,
  data: { name: 'Acme Corporation' }
});
```

### 6. Server Response
```typescript
// Server confirms the update
{
  updateOneCompany: {
    id: 'company-1',
    name: 'Acme Corporation',
    updatedAt: '2024-01-26T10:30:00Z'
  }
}
```

### 7. Cache & State Sync
```typescript
// Apollo cache is updated with server response
// Recoil state is synced
// Component re-renders with new value
```


---

## Key Takeaways

### 1. Everything is Generic
- No hardcoded components for specific object types
- One `RecordTable` works for companies, people, opportunities, etc.
- Metadata drives all behavior

### 2. Metadata is King
- `ObjectMetadataItem` describes the object structure
- `FieldMetadataItem` describes each field
- GraphQL queries are generated from metadata
- UI components are configured by metadata

### 3. Two-Layer State Management
- **Apollo Cache:** Server state, normalized, cached
- **Recoil State:** UI state, derived, component-scoped

### 4. Context Everywhere
- Nested contexts provide data down the tree
- `RecordIndexContext` → `RecordTableContext` → `FieldContext`
- Each level adds more specific information

### 5. Type Safety is Flexible
- Runtime uses generic `ObjectRecord` type
- Compile-time can use specific types (`Company`)
- Metadata provides runtime type information

### 6. Component Instances
- Multiple instances of same component can coexist
- State is scoped by instance ID
- Enables modals, side panels, multiple views

### 7. Hook Composition
- Complex logic built from smaller hooks
- Each hook has single responsibility
- Easy to test and reuse

### 8. Field Type Routing
- `FieldDisplay` routes to specific display components
- Type guards provide type safety
- 20+ field types supported


---

## Common Patterns You'll See

### 1. The "OrThrow" Pattern
```typescript
const useRecordIndexContextOrThrow = () => {
  const context = useContext(RecordIndexContext);
  if (!context) {
    throw new Error('useRecordIndexContext must be used within RecordIndexContext');
  }
  return context;
};
```
**Why:** Ensures context is always available, fails fast if not.

### 2. The Family State Pattern
```typescript
const someFamilyState = atomFamily<ValueType, KeyType>({
  key: 'someFamily',
  default: defaultValue,
});

// Usage
const value = useRecoilValue(someFamilyState(key));
```
**Why:** Granular state updates, prevents unnecessary re-renders.

### 3. The Component State Pattern
```typescript
const someComponentState = createComponentState<ValueType>({
  key: 'someState',
  defaultValue: defaultValue,
});

// Usage with instance ID
const value = useRecoilComponentValue(someComponentState, instanceId);
```
**Why:** Multiple instances of same component with isolated state.

### 4. The Metadata Hook Pattern
```typescript
const { objectMetadataItem } = useObjectMetadataItem({
  objectNameSingular: 'company'
});
```
**Why:** Centralized metadata access, consistent across app.

### 5. The Query Generation Pattern
```typescript
const query = generateSomeQuery({
  objectMetadataItem,
  objectMetadataItems,
  // ... other params
});
```
**Why:** Dynamic queries based on metadata, no hardcoding.

### 6. The Type Guard Pattern
```typescript
if (isFieldText(fieldDefinition)) {
  // TypeScript knows fieldDefinition is FieldTextDefinition
  return <TextFieldDisplay />;
}
```
**Why:** Runtime type checking with TypeScript type narrowing.


---

## Debugging Tips

### 1. Inspect Metadata
```typescript
// In browser console
const metadata = window.__APOLLO_CLIENT__.readQuery({
  query: gql`query { objects { id nameSingular namePlural fields { name type } } }`
});
console.log(metadata);
```

### 2. Inspect Apollo Cache
```typescript
// In browser console
window.__APOLLO_CLIENT__.cache.extract();
```

### 3. Inspect Recoil State
```typescript
// Use Recoil DevTools browser extension
// Or add debug observer
const DebugObserver = () => {
  const snapshot = useRecoilSnapshot();
  useEffect(() => {
    console.debug('Recoil state:', snapshot.getLoadable);
  }, [snapshot]);
  return null;
};
```

### 4. Find Component Instance ID
```typescript
// Look for data-testid or data-instance-id attributes
// Or check context values in React DevTools
```

### 5. Trace Query Execution
```typescript
// Enable Apollo Client DevTools
// Watch Network tab for GraphQL requests
// Check query variables and response
```

### 6. Check Field Metadata
```typescript
// In component
const { fieldDefinition } = useContext(FieldContext);
console.log('Field:', fieldDefinition);
```

---

## Next Steps

Now that you understand the architecture, you can:

1. **Add a new field type:** Create display/input components, add type guard
2. **Customize a view:** Modify table/kanban/calendar components
3. **Add new object type:** Just add metadata, everything else works!
4. **Optimize performance:** Use React.memo, useMemo, useCallback
5. **Add features:** Leverage existing hooks and patterns

---

##
