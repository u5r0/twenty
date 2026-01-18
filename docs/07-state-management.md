# State Management

Comprehensivete management in Twenty using Recoil and Apollo Client.

## State Management Layers

Twenty uses a multi-layered approach to state management:

```
┌─────────────────────────────────────────┐
│     Layer 1: Component Local State      │
│     (useState, useReducer)              │
│     - UI state (modals, dropdowns)      │
│     - Form inputs                       │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│     Layer 2: Recoil (Global State)      │
│     - UI preferences                    │
│     - Filters, selections               │
│     - Derived state                     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│     Layer 3: Apollo Client Cache        │
│     - Server data                       │
│     - GraphQL responses                 │
│     - Normalized cache                  │
└─────────────────────────────────────────┘
```

## Recoil State Management

### Atoms (Simple State)

Atoms represent pieces of state.

```typescript
import { atom } from 'recoil';

// Simple value
export const themeState = atom<'light' | 'dark'>({
  key: 'theme',
  default: 'light',
});

// Object state
export const userPreferencesState = atom<UserPreferences>({
  key: 'userPreferences',
  default: {
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
  },
});

// Array state
export const selectedCompanyIdsState = atom<string[]>({
  key: 'selectedCompanyIds',
  default: [],
});

// Nullable state
export const currentUserState = atom<User | null>({
  key: 'currentUser',
  default: null,
});
```

### Using Atoms

```typescript
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';

function ThemeToggle() {
  // Read and write
  const [theme, setTheme] = useRecoilState(themeState);

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Toggle Theme
    </button>
  );
}

function ThemedComponent() {
  // Read only
  const theme = useRecoilValue(themeState);

  return <div className={`theme-${theme}`}>Content</div>;
}

function ThemeController() {
  // Write only
  const setTheme = useSetRecoilState(themeState);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme as 'light' | 'dark');
    }
  }, [setTheme]);

  return null;
}
```

### Atom Families (Parameterized State)

Create atoms dynamically based on parameters.

```typescript
import { atomFamily } from 'recoil';

// State per entity ID
export const companyState = atomFamily<Company | null, string>({
  key: 'company',
  default: null,
});

// State per filter type
export const filterState = atomFamily<FilterValue, string>({
  key: 'filter',
  default: null,
});

// Usage
function CompanyCard({ companyId }: { companyId: string }) {
  const [company, setCompany] = useRecoilState(companyState(companyId));

  return <div>{company?.name}</div>;
}

function IndustryFilter() {
  const [industry, setIndustry] = useRecoilState(filterState('industry'));

  return (
    <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
      <option value="">All</option>
      <option value="tech">Technology</option>
      <option value="finance">Finance</option>
    </select>
  );
}
```

### Selectors (Derived State)

Compute values from other state.

```typescript
import { selector } from 'recoil';

// Simple derived state
export const selectedCompanyCountSelector = selector({
  key: 'selectedCompanyCount',
  get: ({ get }) => {
    const selectedIds = get(selectedCompanyIdsState);
    return selectedIds.length;
  },
});

// Complex derived state
export const filteredCompaniesSelector = selector({
  key: 'filteredCompanies',
  get: ({ get }) => {
    const companies = get(companiesState);
    const filters = get(companyFiltersState);

    return companies.filter(company => {
      if (filters.industry && company.industry !== filters.industry) {
        return false;
      }
      if (filters.minEmployees && company.employees < filters.minEmployees) {
        return false;
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return company.name.toLowerCase().includes(searchLower);
      }
      return true;
    });
  },
});

// Writable selector
export const temperatureState = atom({
  key: 'temperature',
  default: 0,
});

export const temperatureFahrenheitState = selector({
  key: 'temperatureFahrenheit',
  get: ({ get }) => {
    const celsius = get(temperatureState);
    return (celsius * 9) / 5 + 32;
  },
  set: ({ set }, newValue) => {
    const fahrenheit = newValue as number;
    const celsius = ((fahrenheit - 32) * 5) / 9;
    set(temperatureState, celsius);
  },
});
```

### Async Selectors

Fetch data asynchronously.

```typescript
import { selector, selectorFamily } from 'recoil';

// Async selector
export const currentUserSelector = selector({
  key: 'currentUserSelector',
  get: async () => {
    const response = await fetch('/api/user/me');
    return response.json();
  },
});

// Async selector family
export const companySelector = selectorFamily({
  key: 'companySelector',
  get: (id: string) => async () => {
    const response = await fetch(`/api/companies/${id}`);
    return response.json();
  },
});

// Usage with Suspense
function UserProfile() {
  const user = useRecoilValue(currentUserSelector);
  return <div>{user.name}</div>;
}

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <UserProfile />
    </Suspense>
  );
}
```

### Atom Effects

Side effects for atoms.

```typescript
import { atom } from 'recoil';

// Persist to localStorage
export const themeState = atom({
  key: 'theme',
  default: 'light',
  effects: [
    ({ onSet, setSelf }) => {
      // Load from localStorage on init
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        setSelf(savedTheme);
      }

      // Save to localStorage on change
      onSet((newValue) => {
        localStorage.setItem('theme', newValue);
      });
    },
  ],
});

// Sync with URL
export const searchQueryState = atom({
  key: 'searchQuery',
  default: '',
  effects: [
    ({ onSet, setSelf }) => {
      // Load from URL on init
      const params = new URLSearchParams(window.location.search);
      const query = params.get('q');
      if (query) {
        setSelf(query);
      }

      // Update URL on change
      onSet((newValue) => {
        const params = new URLSearchParams(window.location.search);
        if (newValue) {
          params.set('q', newValue);
        } else {
          params.delete('q');
        }
        window.history.replaceState({}, '', `?${params.toString()}`);
      });
    },
  ],
});
```

## Apollo Client State Management

### Cache Configuration

```typescript
import { InMemoryCache } from '@apollo/client';

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        companies: {
          // Merge strategy
          keyArgs: ['filter', 'sort'],
          merge(existing, incoming, { args }) {
            if (args?.after) {
              // Append for pagination
              return {
                ...incoming,
                edges: [...(existing?.edges || []), ...incoming.edges],
              };
            }
            return incoming;
          },
        },
      },
    },
    Company: {
      fields: {
        people: {
          merge(existing, incoming) {
            return incoming;
          },
        },
      },
    },
  },
});
```

### Reading from Cache

```typescript
import { useApolloClient } from '@apollo/client';

function useCompanyFromCache(id: string) {
  const client = useApolloClient();

  const company = client.readFragment({
    id: `Company:${id}`,
    fragment: gql`
      fragment CompanyData on Company {
        id
        name
        industry
      }
    `,
  });

  return company;
}
```

### Writing to Cache

```typescript
import { useApolloClient } from '@apollo/client';

function useUpdateCompanyCache() {
  const client = useApolloClient();

  const updateCompany = (id: string, updates: Partial<Company>) => {
    client.writeFragment({
      id: `Company:${id}`,
      fragment: gql`
        fragment CompanyData on Company {
          id
          name
          industry
        }
      `,
      data: updates,
    });
  };

  return updateCompany;
}
```

### Cache Updates After Mutations

```typescript
import { useMutation } from '@apollo/client';

function useCreateCompany() {
  const [createCompany] = useMutation(CREATE_COMPANY, {
    update(cache, { data }) {
      // Read existing data
      const existing = cache.readQuery({
        query: GET_COMPANIES,
      });

      // Write updated data
      cache.writeQuery({
        query: GET_COMPANIES,
        data: {
          companies: {
            ...existing.companies,
            edges: [
              ...existing.companies.edges,
              {
                __typename: 'CompanyEdge',
                node: data.createCompany,
                cursor: data.createCompany.id,
              },
            ],
          },
        },
      });
    },
  });

  return createCompany;
}
```

### Optimistic Updates

```typescript
function useUpdateCompany() {
  const [updateCompany] = useMutation(UPDATE_COMPANY, {
    optimisticResponse: (variables) => ({
      updateCompany: {
        __typename: 'Company',
        id: variables.id,
        ...variables.data,
      },
    }),
    update(cache, { data }) {
      cache.modify({
        id: `Company:${data.updateCompany.id}`,
        fields: {
          name() {
            return data.updateCompany.name;
          },
          industry() {
            return data.updateCompany.industry;
          },
        },
      });
    },
  });

  return updateCompany;
}
```

## Combining Recoil and Apollo

### Pattern 1: Recoil for UI, Apollo for Data

```typescript
// Recoil for UI state
export const selectedCompanyIdState = atom<string | null>({
  key: 'selectedCompanyId',
  default: null,
});

export const companyViewModeState = atom<'table' | 'kanban'>({
  key: 'companyViewMode',
  default: 'table',
});

// Apollo for data
function CompanyList() {
  const { data, loading } = useQuery(GET_COMPANIES);
  const [selectedId, setSelectedId] = useRecoilState(selectedCompanyIdState);
  const viewMode = useRecoilValue(companyViewModeState);

  if (loading) return <Spinner />;

  return viewMode === 'table' ? (
    <CompanyTable
      companies={data.companies}
      selectedId={selectedId}
      onSelect={setSelectedId}
    />
  ) : (
    <CompanyKanban
      companies={data.companies}
      selectedId={selectedId}
      onSelect={setSelectedId}
    />
  );
}
```

### Pattern 2: Sync Apollo Data to Recoil

```typescript
// Recoil atom
export const companiesState = atom<Company[]>({
  key: 'companies',
  default: [],
});

// Sync component
function CompaniesSync() {
  const { data } = useQuery(GET_COMPANIES);
  const setCompanies = useSetRecoilState(companiesState);

  useEffect(() => {
    if (data?.companies) {
      setCompanies(data.companies.edges.map(edge => edge.node));
    }
  }, [data, setCompanies]);

  return null;
}

// Usage
function App() {
  return (
    <>
      <CompaniesSync />
      <CompanyList />
    </>
  );
}
```

### Pattern 3: Recoil Selector with Apollo

```typescript
import { selector } from 'recoil';
import { apolloClient } from './apollo-client';

export const companiesSelector = selector({
  key: 'companiesSelector',
  get: async () => {
    const { data } = await apolloClient.query({
      query: GET_COMPANIES,
    });
    return data.companies.edges.map(edge => edge.node);
  },
});

// Usage
function CompanyList() {
  const companies = useRecoilValue(companiesSelector);
  return (
    <div>
      {companies.map(company => (
        <CompanyCard key={company.id} company={company} />
      ))}
    </div>
  );
}
```

## State Management Patterns

### Filter State Pattern

```typescript
// Filter state
export const companyFiltersState = atom<CompanyFilters>({
  key: 'companyFilters',
  default: {
    industry: null,
    minEmployees: null,
    search: '',
  },
});

// Filtered data selector
export const filteredCompaniesSelector = selector({
  key: 'filteredCompanies',
  get: ({ get }) => {
    const companies = get(companiesState);
    const filters = get(companyFiltersState);

    return companies.filter(company => {
      if (filters.industry && company.industry !== filters.industry) {
        return false;
      }
      if (filters.minEmployees && company.employees < filters.minEmployees) {
        return false;
      }
      if (filters.search) {
        return company.name.toLowerCase().includes(filters.search.toLowerCase());
      }
      return true;
    });
  },
});

// Usage
function CompanyFilters() {
  const [filters, setFilters] = useRecoilState(companyFiltersState);

  return (
    <div>
      <input
        value={filters.search}
        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        placeholder="Search..."
      />
      <select
        value={filters.industry || ''}
        onChange={(e) => setFilters({ ...filters, industry: e.target.value || null })}
      >
        <option value="">All Industries</option>
        <option value="tech">Technology</option>
        <option value="finance">Finance</option>
      </select>
    </div>
  );
}

function CompanyList() {
  const companies = useRecoilValue(filteredCompaniesSelector);

  return (
    <div>
      {companies.map(company => (
        <CompanyCard key={company.id} company={company} />
      ))}
    </div>
  );
}
```

### Selection State Pattern

```typescript
// Selection state
export const selectedIdsState = atom<Set<string>>({
  key: 'selectedIds',
  default: new Set(),
});

// Selection helpers
export const useSelection = () => {
  const [selectedIds, setSelectedIds] = useRecoilState(selectedIdsState);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, [setSelectedIds]);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, [setSelectedIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, [setSelectedIds]);

  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  return {
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    selectedCount: selectedIds.size,
  };
};

// Usage
function CompanyList({ companies }: { companies: Company[] }) {
  const { selectedIds, toggleSelection, selectAll, clearSelection } = useSelection();

  return (
    <div>
      <div>
        <button onClick={() => selectAll(companies.map(c => c.id))}>
          Select All
        </button>
        <button onClick={clearSelection}>Clear</button>
        <span>{selectedIds.size} selected</span>
      </div>
      {companies.map(company => (
        <CompanyCard
          key={company.id}
          company={company}
          selected={selectedIds.has(company.id)}
          onToggle={() => toggleSelection(company.id)}
        />
      ))}
    </div>
  );
}
```

### Modal State Pattern

```typescript
// Modal state
export const modalState = atom<{
  type: string | null;
  props: any;
}>({
  key: 'modal',
  default: {
    type: null,
    props: {},
  },
});

// Modal helpers
export const useModal = () => {
  const [modal, setModal] = useRecoilState(modalState);

  const openModal = useCallback((type: string, props: any = {}) => {
    setModal({ type, props });
  }, [setModal]);

  const closeModal = useCallback(() => {
    setModal({ type: null, props: {} });
  }, [setModal]);

  return {
    modal,
    openModal,
    closeModal,
    isOpen: modal.type !== null,
  };
};

// Usage
function CompanyCard({ company }: { company: Company }) {
  const { openModal } = useModal();

  return (
    <div>
      <h3>{company.name}</h3>
      <button onClick={() => openModal('editCompany', { company })}>
        Edit
      </button>
      <button onClick={() => openModal('deleteCompany', { companyId: company.id })}>
        Delete
      </button>
    </div>
  );
}

function ModalManager() {
  const { modal, closeModal } = useModal();

  if (!modal.type) return null;

  return (
    <Modal onClose={closeModal}>
      {modal.type === 'editCompany' && <EditCompanyModal {...modal.props} />}
      {modal.type === 'deleteCompany' && <DeleteCompanyModal {...modal.props} />}
    </Modal>
  );
}
```

## Best Practices

### 1. Choose the Right Layer

```typescript
// ✅ Component state for UI-only
function Dropdown() {
  const [isOpen, setIsOpen] = useState(false);
  // ...
}

// ✅ Recoil for shared UI state
const selectedCompanyIdState = atom<string | null>({
  key: 'selectedCompanyId',
  default: null,
});

// ✅ Apollo for server data
const { data } = useQuery(GET_COMPANIES);
```

### 2. Avoid State Duplication

```typescript
// ❌ Bad - Duplicating server data
const [companies, setCompanies] = useState([]);
const { data } = useQuery(GET_COMPANIES);

useEffect(() => {
  if (data) {
    setCompanies(data.companies);
  }
}, [data]);

// ✅ Good - Use Apollo cache directly
const { data } = useQuery(GET_COMPANIES);
const companies = data?.companies || [];
```

### 3. Use Selectors for Derived State

```typescript
// ❌ Bad - Computing in component
function CompanyList() {
  const companies = useRecoilValue(companiesState);
  const filters = useRecoilValue(filtersState);

  const filtered = companies.filter(/* ... */); // Recomputes on every render

  return <div>{/* ... */}</div>;
}

// ✅ Good - Use selector
const filteredCompaniesSelector = selector({
  key: 'filteredCompanies',
  get: ({ get }) => {
    const companies = get(companiesState);
    const filters = get(filtersState);
    return companies.filter(/* ... */);
  },
});

function CompanyList() {
  const companies = useRecoilValue(filteredCompaniesSelector);
  return <div>{/* ... */}</div>;
}
```

### 4. Normalize Data

```typescript
// ❌ Bad - Nested data
const companiesState = atom({
  key: 'companies',
  default: [
    {
      id: '1',
      name: 'Acme',
      people: [
        { id: 'p1', name: 'John' },
        { id: 'p2', name: 'Jane' },
      ],
    },
  ],
});

// ✅ Good - Normalized data
const companiesState = atom({
  key: 'companies',
  default: {
    '1': { id: '1', name: 'Acme', peopleIds: ['p1', 'p2'] },
  },
});

const peopleState = atom({
  key: 'people',
  default: {
    'p1': { id: 'p1', name: 'John', companyId: '1' },
    'p2': { id: 'p2', name: 'Jane', companyId: '1' },
  },
});
```

## Next Steps

- [Frontend Architecture](./07-frontend-architecture.md)
- [Component Guidelines](./08-component-guidelines.md)
- [GraphQL API](./13-graphql-api.md)

---

**Related Documentation:**
- [Technology Stack](./06-technology-stack.md)
- [Frontend Testing](./16-frontend-testing.md)

