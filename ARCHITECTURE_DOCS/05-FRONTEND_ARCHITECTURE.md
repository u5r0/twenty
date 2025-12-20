# Front-End Architecture

## Overview

The Twenty frontend is a modern React application built with TypeScript, using Recoil for state management and Apollo Client for GraphQL data fetching. It follows a modular, component-based architecture with clear separation of concerns.

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React 18.2 | UI rendering |
| **Language** | TypeScript | Type safety |
| **State Management** | Recoil 0.7.7 | Global state |
| **API Client** | Apollo Client 3.7.17 | GraphQL queries |
| **Styling** | Emotion + Linaria | CSS-in-JS |
| **UI Components** | Twenty-UI | Custom components |
| **Form Handling** | React Hook Form | Form management |
| **Build Tool** | Vite | Fast bundling |
| **Routing** | React Router v6 | Navigation |
| **Internationalization** | Lingui | Multi-language |

---

## Project Structure

```
twenty-front/
├── src/
│   ├── index.tsx                 # App entry point
│   ├── index.css                 # Global styles
│   ├── modules/                  # Feature modules
│   │   ├── apollo/               # GraphQL client setup
│   │   │   ├── components/       # Apollo wrappers
│   │   │   ├── hooks/            # useQuery, useMutation
│   │   │   ├── optimistic-effect/
│   │   │   ├── services/         # API services
│   │   │   └── utils/            # Helpers
│   │   │
│   │   ├── auth/                 # Authentication module
│   │   │   ├── components/       # Login, signup components
│   │   │   ├── hooks/            # useAuth, usePermission
│   │   │   ├── states/           # Auth state (Recoil)
│   │   │   └── services/         # Auth logic
│   │   │
│   │   ├── companies/            # Company CRM module
│   │   ├── contact-creation-manager/
│   │   ├── opportunities/        # Opportunity CRM module
│   │   │
│   │   ├── context-store/        # Global state management
│   │   │   ├── states/           # Recoil atoms
│   │   │   ├── contexts/         # React contexts
│   │   │   └── hooks/            # State hooks
│   │   │
│   │   ├── object-record/        # Generic record CRUD
│   │   │   ├── components/       # Record editor, viewer
│   │   │   ├── hooks/            # useRecordForm, etc
│   │   │   └── states/           # Record state
│   │   │
│   │   ├── views/                # View management
│   │   │   ├── components/       # Table, Kanban, Calendar views
│   │   │   ├── hooks/            # useViewFilters, useViewSort
│   │   │   └── states/           # View configuration state
│   │   │
│   │   ├── ui/                   # UI utilities
│   │   │   ├── utilities/        # Helpers, hooks
│   │   │   ├── components/       # Reusable UI components
│   │   │   ├── display/          # Display components
│   │   │   ├── editable-cell/    # Inline editing
│   │   │   ├── input/            # Form inputs
│   │   │   └── layout/           # Layout components
│   │   │
│   │   ├── navigation/           # Navigation & routing
│   │   ├── settings/             # Settings pages
│   │   ├── workspace/            # Workspace management
│   │   ├── workflow/             # Workflow automation
│   │   │
│   │   └── [other modules]/
│   │
│   ├── pages/                    # Page components
│   │   ├── App.tsx               # Root app component
│   │   ├── HomePage.tsx
│   │   ├── CompanyPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── [other pages]/
│   │
│   ├── types/                    # Global TypeScript types
│   │   ├── index.ts
│   │   ├── graphql-types.ts      # Generated from GraphQL
│   │   └── domain-types.ts
│   │
│   ├── utils/                    # Global utilities
│   │   ├── string.ts             # String helpers
│   │   ├── date.ts               # Date helpers
│   │   ├── array.ts              # Array helpers
│   │   └── [other utils]/
│   │
│   ├── hooks/                    # Global custom hooks
│   │   ├── useAuth.ts
│   │   ├── useWorkspace.ts
│   │   └── [other hooks]/
│   │
│   ├── generated/                # Auto-generated files
│   │   └── graphql.ts            # Generated GraphQL types
│   │
│   ├── locales/                  # i18n translations
│   └── testing/                  # Test utilities
│
├── public/                       # Static assets
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript config
└── package.json
```

---

## Component Architecture

### Functional Component Pattern

```typescript
// Example: Company Details Component
import { FC } from 'react';
import { useQuery } from '@apollo/client';
import { useRecoilState } from 'recoil';

interface CompanyDetailsProps {
  companyId: string;
}

const CompanyDetails: FC<CompanyDetailsProps> = ({ companyId }) => {
  // Fetch data from Apollo
  const { data, loading, error } = useQuery(GET_COMPANY_QUERY, {
    variables: { id: companyId }
  });

  // Global state
  const [selectedCompany, setSelectedCompany] = useRecoilState(selectedCompanyState);

  // Local state for component-specific logic
  const [isEditing, setIsEditing] = useState(false);

  if (loading) return <Spinner />;
  if (error) return <ErrorBoundary error={error} />;

  return (
    <div className={styles.container}>
      <Header>
        <h1>{data.company.name}</h1>
        <Button onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Save' : 'Edit'}
        </Button>
      </Header>

      {isEditing ? (
        <CompanyForm company={data.company} />
      ) : (
        <CompanyView company={data.company} />
      )}
    </div>
  );
};

export default CompanyDetails;
```

### Component Types

#### 1. Page Components
- Top-level route components
- Manage overall page state
- Orchestrate sub-components

```typescript
const CompanyListPage = () => {
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

  return (
    <PageLayout>
      <CompanyList onSelectCompany={setSelectedCompanyId} />
      {selectedCompanyId && <CompanyDetails id={selectedCompanyId} />}
    </PageLayout>
  );
};
```

#### 2. Feature/Container Components
- Handle data fetching
- Manage feature-specific state
- Compose smaller components

```typescript
const CompanyListContainer = () => {
  const { data, loading } = useQuery(GET_COMPANIES);
  const [filters, setFilters] = useRecoilState(companyFiltersState);

  return (
    <CompanyListView
      companies={data?.companies}
      loading={loading}
      filters={filters}
      onFilterChange={setFilters}
    />
  );
};
```

#### 3. Presentational/UI Components
- Pure components (no side effects)
- Receive data as props
- Focus on rendering

```typescript
interface CompanyListViewProps {
  companies: Company[];
  loading: boolean;
  onSelectCompany: (id: string) => void;
}

const CompanyListView: FC<CompanyListViewProps> = ({
  companies,
  loading,
  onSelectCompany
}) => {
  if (loading) return <Spinner />;

  return (
    <table>
      <tbody>
        {companies.map(company => (
          <tr key={company.id} onClick={() => onSelectCompany(company.id)}>
            <td>{company.name}</td>
            <td>${company.revenue}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

---

## Hooks & Custom Hooks

### Apollo Hooks

```typescript
// useQuery - Fetch data
const { data, loading, error, refetch } = useQuery(GET_COMPANIES, {
  variables: { limit: 10 },
  fetchPolicy: 'cache-and-network'
});

// useMutation - Mutate data
const [createCompany, { loading, error }] = useMutation(CREATE_COMPANY);

// useSubscription - Real-time updates
const { data } = useSubscription(ON_COMPANY_UPDATED);

// useApolloClient - Direct cache access
const client = useApolloClient();
client.readQuery({ query: GET_COMPANY, variables: { id } });
```

### Recoil Hooks

```typescript
// useRecoilState - Get & set state
const [user, setUser] = useRecoilState(userState);

// useRecoilValue - Get state only
const user = useRecoilValue(userState);

// useSetRecoilState - Set state only
const setUser = useSetRecoilState(userState);

// useRecoilTransactionObserver_UNSTABLE - Observe changes
const observer = useRecoilTransactionObserver_UNSTABLE(({ snapshot }) => {
  const newValue = snapshot.getLoadable(myAtom);
});
```

### React Hooks

```typescript
// useState - Component state
const [count, setCount] = useState(0);

// useEffect - Side effects
useEffect(() => {
  // Run when component mounts
  return () => { /* Cleanup */ };
}, []); // Dependencies

// useCallback - Memoize function
const handleClick = useCallback(() => {
  // Expensive operation
}, [dependency]);

// useMemo - Memoize value
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// useRef - Persistent reference
const inputRef = useRef(null);
```

### Custom Hooks

```typescript
// useCompany - Fetch single company
export const useCompany = (companyId: string) => {
  const { data, loading, error } = useQuery(GET_COMPANY, {
    variables: { id: companyId }
  });

  return { company: data?.company, loading, error };
};

// useCompanies - Fetch company list with filters
export const useCompanies = (filters?: CompanyFilter) => {
  const { data, loading, refetch } = useQuery(GET_COMPANIES, {
    variables: { filter: filters }
  });

  return {
    companies: data?.companies,
    loading,
    refetch
  };
};

// useForm - Handle form state & submission
export const useCompanyForm = (initialCompany?: Company) => {
  const form = useForm({ defaultValues: initialCompany });
  const [updateCompany] = useMutation(UPDATE_COMPANY);

  const onSubmit = async (data: UpdateCompanyInput) => {
    await updateCompany({
      variables: { id: initialCompany.id, input: data }
    });
  };

  return { form, onSubmit };
};
```

---

## Module Organization

### Example: Companies Module

```
modules/companies/
├── components/
│   ├── CompanyList.tsx         # List view
│   ├── CompanyDetail.tsx       # Detail view
│   ├── CompanyForm.tsx         # Edit form
│   ├── CompanyCard.tsx         # Card component
│   └── CompanyCreation.tsx     # Creation wizard
│
├── hooks/
│   ├── useCompany.ts
│   ├── useCompanies.ts
│   ├── useCompanyForm.ts
│   └── useCompanyFilters.ts
│
├── states/
│   ├── companiesState.ts       # List atom
│   ├── selectedCompanyState.ts # Selection atom
│   ├── companyFiltersState.ts  # Filter atom
│   └── selectors/              # Derived state
│       └── filteredCompaniesSelector.ts
│
├── types/
│   └── index.ts                # Module types
│
├── graphql/
│   ├── queries.ts              # GraphQL queries
│   ├── mutations.ts            # GraphQL mutations
│   └── fragments.ts            # Reusable fragments
│
├── utils/
│   ├── companyNameFormatter.ts
│   ├── companySort.ts
│   └── companyValidation.ts
│
└── index.ts                    # Module exports
```

---

## State Management Examples

### 1. Simple Atom

```typescript
// State definition
export const selectedCompanyState = atom({
  key: 'selectedCompany',
  default: null as Company | null
});

// Usage in component
const SelectedCompanyView = () => {
  const [selectedCompany, setSelectedCompany] = useRecoilState(
    selectedCompanyState
  );

  return (
    <div>
      {selectedCompany && (
        <>
          <h1>{selectedCompany.name}</h1>
          <Button onClick={() => setSelectedCompany(null)}>Deselect</Button>
        </>
      )}
    </div>
  );
};
```

### 2. Atom Family (Parameterized)

```typescript
// Dynamic state keyed by ID
export const companyDetailsState = atomFamily({
  key: 'companyDetails',
  default: (companyId: string) => null as Company | null
});

// Usage with different IDs
const CompanyDetail1 = () => {
  const [company, setCompany] = useRecoilState(
    companyDetailsState('company-1')
  );
  return <div>{company?.name}</div>;
};

const CompanyDetail2 = () => {
  const [company, setCompany] = useRecoilState(
    companyDetailsState('company-2')
  );
  return <div>{company?.name}</div>;
};
```

### 3. Selector (Derived State)

```typescript
// Computed state
export const filteredCompaniesSelector = selector({
  key: 'filteredCompanies',
  get: ({ get }) => {
    const companies = get(companiesState);
    const filters = get(companyFiltersState);
    const sortBy = get(companySortState);

    let filtered = companies.filter(c =>
      c.name.toLowerCase().includes(filters.name.toLowerCase())
    );

    if (filters.minRevenue) {
      filtered = filtered.filter(c => c.revenue >= filters.minRevenue);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy.field === 'revenue') {
        return sortBy.direction === 'asc'
          ? a.revenue - b.revenue
          : b.revenue - a.revenue;
      }
      return 0;
    });

    return filtered;
  }
});

// Usage
const FilteredCompanyList = () => {
  const filteredCompanies = useRecoilValue(filteredCompaniesSelector);
  return (
    <ul>
      {filteredCompanies.map(c => <li key={c.id}>{c.name}</li>)}
    </ul>
  );
};
```

### 4. Async Selector

```typescript
// Fetch data with Recoil
export const companyWithDetailsSelector = selector({
  key: 'companyWithDetails',
  get: async ({ get }) => {
    const companyId = get(selectedCompanyIdState);

    if (!companyId) return null;

    // Fetch from GraphQL (could use Apollo client)
    const response = await fetch(`/graphql`, {
      method: 'POST',
      body: JSON.stringify({
        query: `query { company(id: "${companyId}") { id name } }`
      })
    });

    return response.json();
  }
});

// Usage with Suspense
const CompanyWithDetails = () => {
  const company = useRecoilValue(companyWithDetailsSelector);

  return <div>{company?.name}</div>;
};
```

---

## Form Handling

### React Hook Form Integration

```typescript
import { useForm } from 'react-hook-form';

interface CompanyFormData {
  name: string;
  domainName?: string;
  revenue?: number;
}

const CompanyForm: FC<{ companyId?: string }> = ({ companyId }) => {
  const { data: company } = useQuery(GET_COMPANY, {
    variables: { id: companyId },
    skip: !companyId
  });

  const [updateCompany] = useMutation(UPDATE_COMPANY_MUTATION);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    reset
  } = useForm<CompanyFormData>({
    defaultValues: company
  });

  const onSubmit = async (data: CompanyFormData) => {
    try {
      await updateCompany({
        variables: {
          id: companyId,
          input: data
        }
      });
      reset(data);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input
          {...register('name', { required: 'Name is required' })}
          placeholder="Company name"
        />
        {errors.name && <span>{errors.name.message}</span>}
      </div>

      <div>
        <input
          {...register('domainName')}
          placeholder="Domain"
        />
      </div>

      <div>
        <input
          {...register('revenue', { valueAsNumber: true })}
          placeholder="Revenue"
          type="number"
        />
      </div>

      <button type="submit" disabled={!isDirty || isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
};
```

---

## Error Handling

### Error Boundaries

```typescript
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return this.props.fallback?.(this.state.error) || (
        <div>
          <h1>Something went wrong</h1>
          <p>{this.state.error.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Query/Mutation Error Handling

```typescript
const { data, error, loading } = useQuery(GET_COMPANIES, {
  errorPolicy: 'all'  // Don't throw on GraphQL errors
});

if (error) {
  const graphqlErrors = error.graphQLErrors?.[0];
  const networkError = error.networkError;

  if (graphqlErrors) {
    const code = graphqlErrors.extensions?.code;
    if (code === 'UNAUTHENTICATED') {
      return <LoginPage />;
    }
    if (code === 'FORBIDDEN') {
      return <PermissionDeniedPage />;
    }
  }

  if (networkError) {
    return <OfflineMessage />;
  }
}
```

---

## Lazy Loading

### Code Splitting with React.lazy

```typescript
// Dynamic imports
const CompanyDetails = lazy(() =>
  import('./CompanyDetails').then(m => ({ default: m.CompanyDetails }))
);

const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// Router setup
const routes = [
  {
    path: '/companies/:id',
    element: <Suspense fallback={<Spinner />}><CompanyDetails /></Suspense>
  },
  {
    path: '/settings',
    element: <Suspense fallback={<Spinner />}><SettingsPage /></Suspense>
  }
];
```

### Data Lazy Loading

```typescript
const { data, loading, fetchMore } = useQuery(GET_COMPANIES, {
  variables: { first: 20 }
});

const loadMore = () => {
  fetchMore({
    variables: {
      first: 20,
      after: data.companies.pageInfo.endCursor
    },
    updateQuery: (prev, { fetchMoreResult }) => ({
      companies: {
        ...fetchMoreResult.companies,
        edges: [
          ...prev.companies.edges,
          ...fetchMoreResult.companies.edges
        ]
      }
    })
  });
};
```

---

## Performance Optimization

### Memoization

```typescript
// React.memo - Prevent unnecessary re-renders
const CompanyCard = memo(({ company, onSelect }: Props) => (
  <div onClick={() => onSelect(company.id)}>
    <h3>{company.name}</h3>
  </div>
));

// useCallback - Memoize functions
const handleSelect = useCallback((id: string) => {
  setSelectedId(id);
}, []);

// useMemo - Memoize computed values
const sortedCompanies = useMemo(() => {
  return [...companies].sort((a, b) => a.name.localeCompare(b.name));
}, [companies]);
```

### Apollo Caching

```typescript
// Use appropriate fetch policies
useQuery(GET_COMPANIES, {
  fetchPolicy: 'cache-and-network'  // Show cache, then fetch
});

// Batch queries to avoid multiple requests
useQuery(gql`
  query {
    companies { id name }
    opportunities { id name amount }
  }
`);
```

### Virtual Lists

```typescript
import { FixedSizeList } from 'react-window';

const CompanyListVirtualized = ({ companies }: Props) => (
  <FixedSizeList height={600} itemCount={companies.length} itemSize={50}>
    {({ index, style }) => (
      <div style={style}>
        {companies[index].name}
      </div>
    )}
  </FixedSizeList>
);
```

---

## Styling

### Emotion CSS-in-JS

```typescript
import styled from '@emotion/styled';
import { css } from '@emotion/react';

// Styled components
const Container = styled.div`
  display: flex;
  padding: 20px;
  gap: 10px;
`;

const Title = styled.h1<{ variant?: 'primary' | 'secondary' }>`
  font-size: ${props => props.variant === 'primary' ? '24px' : '18px'};
  color: #333;
`;

// CSS helper
const textOverflow = css`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TruncatedText = styled.span`
  ${textOverflow}
`;
```

### Linaria (Zero-Runtime CSS)

```typescript
import { css } from '@linaria/core';

const containerClass = css`
  display: flex;
  gap: 10px;
`;

export const CompanyCard = ({ company }: Props) => (
  <div className={containerClass}>
    {company.name}
  </div>
);
```

---

## Testing

### Testing with React Testing Library

```typescript
import { render, screen, userEvent } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';

test('renders company form and submits', async () => {
  const mocks = [
    {
      request: {
        query: GET_COMPANY,
        variables: { id: '123' }
      },
      result: {
        data: { company: { id: '123', name: 'Acme' } }
      }
    },
    {
      request: {
        query: UPDATE_COMPANY,
        variables: { id: '123', input: { name: 'Acme Corp' } }
      },
      result: {
        data: { updateCompany: { id: '123', name: 'Acme Corp' } }
      }
    }
  ];

  render(
    <MockedProvider mocks={mocks}>
      <CompanyForm companyId="123" />
    </MockedProvider>
  );

  // Wait for component to load
  await screen.findByDisplayValue('Acme');

  // Update input
  const input = screen.getByPlaceholderText('Company name');
  await userEvent.clear(input);
  await userEvent.type(input, 'Acme Corp');

  // Submit form
  const submitButton = screen.getByText('Save');
  await userEvent.click(submitButton);

  // Verify mutation was called
  await waitFor(() => {
    expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
  });
});
```

---

## Best Practices

1. **Keep components small** - Single responsibility principle
2. **Use custom hooks** - Extract complex logic
3. **Prefer Recoil atoms** - Over prop drilling
4. **Use Apollo cache** - For server state
5. **Memoize expensive operations** - useCallback, useMemo
6. **Handle loading states** - Show spinners/skeletons
7. **Handle errors gracefully** - Error boundaries + messages
8. **Test components** - Unit + integration tests
9. **Lazy load routes** - Code splitting
10. **Monitor performance** - React DevTools Profiler
