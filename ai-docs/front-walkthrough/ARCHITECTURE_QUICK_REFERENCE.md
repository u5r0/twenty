# Twenty-Front Architecture - Quick Reference

## The 3 Core Concepts

### 1. Metadata-Driven Everything
```
Metadata → GraphQL Query → Data → UI Components
```
No hardcoded logic for specific object types!

### 2. Generic Object-Record System
```
ONE RecordTable component handles:
- Companies
- People
- Opportunities
- Custom objects
- Everything!
```

### 3. Dual State Management
```
Apollo Cache (Server State) + Recoil (UI State) = Complete State
```

---

## File Structure Map

```
packages/twenty-front/src/
├── pages/
│   └── object-record/
│       └── RecordIndexPage.tsx          ← Entry point for /objects/:type
│
├── modules/
│   ├── object-metadata/                 ← Metadata system
│   │   ├── types/ObjectMetadataItem.ts  ← Object schema
│   │   └── types/FieldMetadataItem.ts   ← Field schema
│   │
│   ├── object-record/                   ← Core record management
│   │   ├── hooks/
│   │   │   ├── useFindManyRecords.ts    ← Fetch records
│   │   │   └── useUpdateOneRecord.ts    ← Update record
│   │   ├── record-index/                ← List view
│   │   ├── record-table/                ← Table view
│   │   ├── record-board/                ← Kanban view
│   │   ├── record-field/                ← Field display/edit
│   │   └── utils/
│   │       └── generateFindManyRecordsQuery.ts  ← Query builder
│   │
│   └── companies/                       ← Type definitions only!
│       └── types/Company.ts
│
└── generated/
    └── graphql.ts                       ← Generated types from backend
```


---

## Data Flow Cheat Sheet

### Reading Data (Query)
```
1. URL: /objects/companies
2. Route → RecordIndexPage
3. Get metadata for "companies"
4. Generate GraphQL query from metadata
5. Apollo executes query
6. Response → Apollo Cache (normalized)
7. Response → Recoil State (UI state)
8. Components read from Recoil
9. Render on screen
```

### Writing Data (Mutation)
```
1. User edits field
2. Optimistic update (instant UI feedback)
3. Generate GraphQL mutation
4. Apollo executes mutation
5. Server responds
6. Apollo Cache updated
7. Recoil State synced
8. UI reflects final state
```

---

## Key Hooks Reference

### Data Fetching
```typescript
// Fetch many records
const { records, loading, error } = useFindManyRecords({
  objectNameSingular: 'company',
  filter: { name: { contains: 'Acme' } },
  orderBy: [{ name: 'ASC' }],
  limit: 60,
});

// Fetch one record
const { record, loading } = useFindOneRecord({
  objectNameSingular: 'company',
  objectRecordId: 'company-1',
});
```

### Data Mutation
```typescript
// Update record
const { updateOneRecord } = useUpdateOneRecord();
updateOneRecord({
  objectNameSingular: 'company',
  idToUpdate: 'company-1',
  updateOneRecordInput: { name: 'New Name' },
});

// Create record
const { createOneRecord } = useCreateOneRecord();
createOneRecord({
  objectNameSingular: 'company',
  input: { name: 'New Company' },
});

// Delete record
const { deleteOneRecord } = useDeleteOneRecord();
deleteOneRecord({
  objectNameSingular: 'company',
  idToDelete: 'company-1',
});
```

### Metadata Access
```typescript
// Get metadata for one object
const { objectMetadataItem } = useObjectMetadataItem({
  objectNameSingular: 'company',
});

// Get all metadata
const { objectMetadataItems } = useObjectMetadataItems();
```

### State Access
```typescript
// Read record from store
const record = useRecoilValue(recordStoreFamilyState('company-1'));

// Update record in store
const setRecord = useSetRecoilState(recordStoreFamilyState('company-1'));
setRecord(newRecordData);

// Component-scoped state
const value = useRecoilComponentValue(someState, instanceId);
```


### Instance Pattern
```typescript
// Multiple instances with isolated state
<RecordTable recordTableId="main-table" />
<RecordTable recordTableId="modal-table" />

// Access instance-specific state
const state = useRecoilComponentValue(someState, 'main-table');
```

---

## Common Gotchas

### 1. Type Safety is Limited
```typescript
// ❌ This won't give you autocomplete
const record = useRecoilValue(recordStoreFamilyState('company-1'));
record.name; // 'any' type

// ✅ Use type assertion if needed
const company = record as Company;
company.name; // 'string' type
```

### 2. Metadata Must Be Loaded First
```typescript
// ❌ Will fail if metadata not loaded
const { objectMetadataItem } = useObjectMetadataItem({
  objectNameSingular: 'company'
});

// ✅ Check if loaded
if (!objectMetadataItem) return <Spinner />;
```

### 3. Instance IDs Matter
```typescript
// ❌ Wrong instance ID = wrong state
const state = useRecoilComponentValue(someState, 'wrong-id');

// ✅ Use correct instance ID from context
const { recordTableId } = useRecordTableContextOrThrow();
const state = useRecoilComponentValue(someState, recordTableId);
```

---

## Performance Tips

1. **Use React.memo for expensive components**
2. **Use useMemo for expensive computations**
3. **Use useCallback for event handlers**
4. **Leverage Recoil family state for granular updates**
5. **Use Apollo cache-first policy when possible**
6. **Virtualize long lists (RecordTable already does this)**

