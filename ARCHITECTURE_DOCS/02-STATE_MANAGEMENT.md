# State Management Architecture

## Overview

Twenty uses a **distributed state management approach** combining:
- **Recoil** for client-side global state (frontend)
- **Apollo Client Cache** for GraphQL-managed data (frontend)
- **Server-side state** via databases and services (backend)

---

## Frontend State Management

### Layer 1: Recoil (Global Application State)

Recoil is the primary state management library used across the frontend for non-fetched, application-level state.

#### Structure
```
recoil/
├── atoms/           # Single values
│   ├── User
│   ├── Workspace
│   ├── Navigation
│   └── UI (modals, sidebars, etc)
├── selectors/       # Derived state
│   ├── Computed values
│   ├── Filtered lists
│   └── Aggregations
└── families/        # Parameterized atoms/selectors
    └── Dynamic state keyed by ID
```

#### Common Usage Pattern
```tsx
// Atom definition
export const currentUserState = atom({
  key: 'currentUserState',
  default: null,
});

// Component usage
export const MyComponent = () => {
  const [currentUser, setCurrentUser] = useRecoilState(currentUserState);

  return <div>{currentUser?.name}</div>;
};
```

#### Key Atoms by Domain

**Authentication**
- `isUserLoggedInState` - Login status
- `currentUserState` - Logged-in user data
- `authTokenState` - JWT token

**Navigation**
- `currentWorkspaceState` - Active workspace
- `currentPageState` - Current page/route
- `sidebarOpenState` - Sidebar visibility

**UI State**
- `modalsStateFamily` - Modal visibility by ID
- `toastNotificationsState` - Toast queue
- `loadingState` - Global loading indicator
- `filterStateFamily` - View filters

**Feature-Specific**
- `selectedRecordsState` - Bulk selection
- `activeViewState` - Current view in object
- `sortConfigState` - Sorting preferences

### Layer 2: Apollo Client Cache (Server State)

Apollo Client manages data fetched from GraphQL API with automatic caching.

#### Cache Structure
```typescript
// Apollo normalizes GraphQL responses into a normalized cache
{
  'User:123': {
    __typename: 'User',
    id: '123',
    firstName: 'John',
    email: 'john@example.com',
    workspace: { __ref: 'Workspace:456' }
  },
  'Workspace:456': {
    __typename: 'Workspace',
    id: '456',
    name: 'Acme Corp'
  }
}
```

#### Cache Management
```tsx
// Reading from cache
const { data } = useQuery(GET_USER_QUERY);

// Writing to cache
const [createUser] = useMutation(CREATE_USER_MUTATION, {
  update(cache, { data: { createUser } }) {
    cache.modify({
      fields: {
        users(existing = []) {
          return [...existing, createUser];
        }
      }
    });
  }
});

// Refetching
refetch();
```

#### Cache Policies
- **cache-first**: Use cache, fallback to network
- **cache-and-network**: Use cache, update in background
- **network-only**: Always fetch fresh
- **no-cache**: Don't cache at all

### Layer 3: Component Local State

React hooks for component-specific state:
```tsx
// Local form state
const [formData, setFormData] = useState({});

// Effects
useEffect(() => {
  // Side effects
}, [dependency]);

// Custom hooks for reusable logic
const useFormHandler = () => {
  // Logic here
};
```

---

## State Flow Patterns

### Pattern 1: Fetch on Mount
```tsx
const UserProfile = ({ userId }) => {
  const { data, loading } = useQuery(GET_USER, {
    variables: { id: userId }
  });

  if (loading) return <Spinner />;
  return <div>{data.user.name}</div>;
};
```

### Pattern 2: Optimistic Updates
```tsx
const [updateUser] = useMutation(UPDATE_USER_MUTATION, {
  optimisticResponse: {
    __typename: 'Mutation',
    updateUser: {
      __typename: 'User',
      id: userId,
      name: newName  // Optimistic value
    }
  }
});

updateUser({ variables: { id: userId, name: newName } });
```

### Pattern 3: Recoil + Apollo Integration
```tsx
// Sync Apollo data with Recoil
const syncedUserState = selector({
  key: 'syncedUserState',
  get: async ({ get }) => {
    // Apollo automatically refetches if needed
    return get(apolloCacheSelector);
  }
});
```

### Pattern 4: Component Family State
```tsx
// Dynamic state for component instances
const tableColumnState = atomFamily({
  key: 'tableColumn',
  default: (columnId) => ({ width: 200, visible: true })
});

const TableHeader = ({ columnId }) => {
  const [column, setColumn] = useRecoilState(tableColumnState(columnId));
  return <th style={{ width: column.width }}>{columnId}</th>;
};
```

---

## Server-Side State Management

### Layer 1: Database State (Persistent)

#### Core Database (PostgreSQL - core schema)
Stores:
- User accounts
- Workspace configuration
- Authentication tokens
- Workspace settings

#### Workspace Database (PostgreSQL - workspace schemas)
Stores:
- Object records (Companies, Contacts, etc.)
- View configurations
- Relationships
- Audit logs

#### ClickHouse (Analytics)
Stores:
- Time-series events
- Activity logs
- Aggregate data
- Analytics dashboards

### Layer 2: Cache Layer (Redis)

```typescript
// Session storage
redis.set(`session:${sessionId}`, sessionData, 'EX', 3600);

// Object cache
redis.set(`object:${objectId}`, JSON.stringify(data), 'EX', 300);

// Permission cache
redis.set(`permissions:${userId}`, JSON.stringify(perms), 'EX', 600);
```

### Layer 3: In-Memory State (Services)

NestJS services maintain runtime state:
```typescript
@Injectable()
export class WorkspaceService {
  private workspaceCache = new Map<string, WorkspaceEntity>();

  getWorkspace(id: string) {
    if (this.workspaceCache.has(id)) {
      return this.workspaceCache.get(id);
    }
    // Fetch from DB and cache
  }
}
```

---

## State Synchronization

### Frontend ↔ Backend Sync

```
1. User Action (click, form submit, etc)
   ↓
2. Recoil state updated (optimistic)
   ↓
3. Apollo mutation sent to server
   ↓
4. Server validates & persists to DB
   ↓
5. Response returned to client
   ↓
6. Apollo cache updated with server response
   ↓
7. If optimistic was wrong, UI corrects itself
   ↓
8. Recoil updated with server truth
```

### Real-time Synchronization

For collaborative features (multiple users editing):

```
User A makes change
  ↓
Mutation sent to server
  ↓
Server updates DB
  ↓
Server broadcasts WebSocket event to all connected clients
  ↓
User B receives update
  ↓
Apollo cache invalidated & refetched
  ↓
Recoil updated
  ↓
UI re-renders for all users
```

---

## Context Store Pattern

The `context-store` module manages context-specific state:

```tsx
// Defines context boundaries
<EntityContextProvider entityId={entityId}>
  {/* All children share this context state */}
  <DetailsView />
  <ActivityLog />
  <RelatedRecords />
</EntityContextProvider>
```

### Benefits:
- Isolates state to a specific context
- Prevents prop drilling
- Enables local caching within context
- Cleanup on unmount

---

## State Lifecycle

### Creation
```
Component mounts
  ↓
Atom/Selector initialized with default value
  ↓
Query executed (if needed)
  ↓
Data loaded into state
```

### Updates
```
User action or server event
  ↓
setState called or mutation executed
  ↓
Subscribers notified
  ↓
Components re-render
  ↓
Side effects triggered (effects, subscriptions)
```

### Cleanup
```
Component unmounts
  ↓
Queries/subscriptions cancelled
  ↓
Recoil state reset (optional)
  ↓
Event listeners removed
```

---

## Best Practices

### 1. Use Recoil for UI State
- Modal visibility
- Sidebar toggles
- Form drafts
- Pagination state
- Selected filters

**Don't use for:**
- Server state (use Apollo)
- Large data sets (use Apollo)
- Data requiring validation (use Apollo)

### 2. Use Apollo for Server State
- Fetched records
- Relationships
- Mutations with side effects
- Real-time subscriptions

### 3. Prefer Component Local State for:
- Temporary UI state
- Form inputs (during editing)
- Hover states
- Animation states

### 4. Async Data Handling
```tsx
// Good: Let Apollo handle async
const { data, loading, error } = useQuery(QUERY);

// Bad: Don't manually manage async in Recoil
const [data, setData] = useState(null);
useEffect(() => {
  fetch(...).then(setData); // Anti-pattern
}, []);
```

### 5. Avoid State Duplication
- Don't store both Recoil and Apollo data
- Don't sync data manually
- Trust Apollo cache as source of truth

### 6. Normalize Data
Apollo automatically normalizes, but for Recoil:
```tsx
// Bad: Nested structure
const usersState = atom({
  default: [{ id: 1, name: 'John', team: { id: 1, name: 'Dev' } }]
});

// Good: Normalized
const usersState = atom({
  default: { 1: { id: 1, name: 'John', teamId: 1 } }
});
const teamsState = atom({
  default: { 1: { id: 1, name: 'Dev' } }
});
```

---

## Performance Optimization

### Memoization
```tsx
// Prevent unnecessary re-renders
const MemoComponent = React.memo(({ data }) => <div>{data}</div>);
```

### Selector Caching
```tsx
const filteredUsersSelector = selector({
  key: 'filteredUsers',
  get: ({ get }) => {
    // Cached until dependencies change
    const users = get(usersState);
    const filter = get(filterState);
    return users.filter(u => u.name.includes(filter));
  }
});
```

### Lazy Loading
```tsx
// Load data only when needed
const { data } = useQuery(QUERY, {
  skip: !isVisible // Don't fetch if not visible
});
```

### Pagination in Apollo
```tsx
const { data, fetchMore } = useQuery(GET_USERS, {
  variables: { first: 20 },
  fetchPolicy: 'cache-and-network'
});

const loadMore = () => {
  fetchMore({
    variables: { first: 20, after: cursor },
    updateQuery: (prev, { fetchMoreResult }) => {
      // Merge paginated results
    }
  });
};
```

---

## Debugging State

### Recoil DevTools
- Browser DevTools integration
- State time-travel debugging
- Dependency graph visualization

### Apollo DevTools
- GraphQL query inspector
- Cache browser
- Network tab integration

### Console Logging
```tsx
const debugState = selector({
  key: 'debugState',
  get: ({ get }) => {
    const value = get(myState);
    console.log('State updated:', value);
    return value;
  }
});
```

---

## Common Pitfalls

### ❌ Mistake 1: Updating state synchronously during render
```tsx
// Bad
const Component = () => {
  const [state, setState] = useRecoilState(myState);
  if (condition) setState(newValue); // Infinite loop!
  return <div>{state}</div>;
};

// Good
useEffect(() => {
  setState(newValue);
}, [condition]);
```

### ❌ Mistake 2: Missing dependencies
```tsx
// Bad
useEffect(() => {
  loadData(userId);
}, []); // Missing userId!

// Good
useEffect(() => {
  loadData(userId);
}, [userId]);
```

### ❌ Mistake 3: Mutating state directly
```tsx
// Bad
const [users, setUsers] = useRecoilState(usersState);
users[0].name = 'Changed'; // Direct mutation!

// Good
setUsers(prev =>
  prev.map((u, i) => i === 0 ? { ...u, name: 'Changed' } : u)
);
```

### ❌ Mistake 4: Apollo cache inconsistency
```tsx
// Bad: Cache gets out of sync
cache.writeQuery({ data: manualData });

// Good: Let mutations update cache
useMutation(MUTATION, { update: updateCache });
```
