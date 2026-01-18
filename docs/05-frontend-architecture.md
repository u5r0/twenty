# Frontendchitecture

Comprehensive guide to Twenty's frontend architecture, built with React, TypeScript, and modern tooling.

## Overview

Twenty's frontend is a single-page application (SPA) built with:
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Recoil** - State management
- **Apollo Client** - GraphQL client
- **Vite** - Build tool
- **Emotion/Linaria** - Styling

## Project Structure

```
packages/twenty-front/
├── src/
│   ├── modules/              # Feature modules
│   │   ├── auth/             # Authentication
│   │   ├── companies/        # Companies management
│   │   ├── people/           # People management
│   │   ├── opportunities/    # Sales opportunities
│   │   ├── activities/       # Tasks and notes
│   │   ├── views/            # View system (table, kanban)
│   │   ├── settings/         # Settings and configuration
│   │   ├── ui/               # UI components
│   │   ├── object-record/    # Generic record operations
│   │   ├── object-metadata/  # Metadata management
│   │   ├── workflow/         # Workflow automation
│   │   └── ...
│   ├── pages/                # Route components
│   │   ├── auth/             # Auth pages
│   │   ├── companies/        # Company pages
│   │   ├── people/           # People pages
│   │   ├── settings/         # Settings pages
│   │   └── not-found/        # 404 page
│   ├── generated/            # Generated GraphQL types
│   │   ├── graphql.tsx       # Generated hooks and types
│   │   └── schema.graphql    # GraphQL schema
│   ├── testing/              # Test utilities
│   │   ├── decorators/       # Storybook decorators
│   │   ├── mock-data/        # Mock data
│   │   └── test-utils.tsx    # Testing utilities
│   ├── __stories__/          # Storybook stories
│   ├── App.tsx               # Root component
│   ├── index.tsx             # Entry point
│   └── router.tsx            # Route configuration
├── public/                   # Static assets
│   ├── images/               # Images
│   ├── icons/                # Icons
│   └── index.html            # HTML template
├── .storybook/               # Storybook configuration
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies
```

## Module Organization

### Feature Module Structure

Each feature module follows a consistent structure:

```
modules/companies/
├── components/               # React components
│   ├── CompanyCard.tsx
│   ├── CompanyForm.tsx
│   └── CompanyList.tsx
├── hooks/                    # Custom hooks
│   ├── useCompanies.ts
│   ├── useCreateCompany.ts
│   └── useUpdateCompany.ts
├── states/                   # Recoil state
│   ├── companyState.ts
│   ├── selectedCompanyState.ts
│   └── companyFiltersState.ts
├── graphql/                  # GraphQL queries/mutations
│   ├── queries/
│   │   ├── getCompanies.ts
│   │   └── getCompany.ts
│   └── mutations/
│       ├── createCompany.ts
│       └── updateCompany.ts
├── types/                    # TypeScript types
│   └── Company.ts
├── utils/                    # Utility functions
│   └── companyUtils.ts
├── constants/                # Constants
│   └── companyConstants.ts
└── __tests__/                # Tests
    ├── CompanyCard.test.tsx
    └── useCompanies.test.ts
```

### Example: Companies Module

```typescript
// modules/companies/types/Company.ts
export interface Company {
  id: string;
  name: string;
  domainName: string;
  employees: number;
  industry: string;
  createdAt: string;
  updatedAt: string;
}

// modules/companies/states/companyState.ts
import { atom } from 'recoil';

export const selectedCompanyIdState = atom<string | null>({
  key: 'selectedCompanyId',
  default: null,
});

export const companyFiltersState = atom({
  key: 'companyFilters',
  default: {
    industry: null,
    minEmployees: null,
  },
});

// modules/companies/hooks/useCompanies.ts
import { useQuery } from '@apollo/client';
import { GET_COMPANIES } from '../graphql/queries/getCompanies';

export function useCompanies(filters?: CompanyFilters) {
  const { data, loading, error } = useQuery(GET_COMPANIES, {
    variables: { filter: filters },
  });

  return {
    companies: data?.companies?.edges?.map(edge => edge.node) ?? [],
    loading,
    error,
  };
}

// modules/companies/components/CompanyCard.tsx
import { Company } from '../types/Company';

interface CompanyCardProps {
  company: Company;
  onSelect?: (company: Company) => void;
}

export function CompanyCard({ company, onSelect }: CompanyCardProps) {
  return (
    <div onClick={() => onSelect?.(company)}>
      <h3>{company.name}</h3>
      <p>{company.industry}</p>
      <p>{company.employees} employees</p>
    </div>
  );
}
```

## Component Architecture

### Component Types

**1. Page Components**
Top-level route components:

```typescript
// pages/companies/CompaniesPage.tsx
export function CompaniesPage() {
  return (
    <PageLayout>
      <PageHeader title="Companies" />
      <CompanyList />
    </PageLayout>
  );
}
```

**2. Container Components**
Handle data fetching and state:

```typescript
// modules/companies/components/CompanyListContainer.tsx
export function CompanyListContainer() {
  const { companies, loading } = useCompanies();
  const [selectedId, setSelectedId] = useRecoilState(selectedCompanyIdState);

  if (loading) return <Spinner />;

  return (
    <CompanyList
      companies={companies}
      selectedId={selectedId}
      onSelect={setSelectedId}
    />
  );
}
```

**3. Presentational Components**
Pure UI components:

```typescript
// modules/companies/components/CompanyList.tsx
interface CompanyListProps {
  companies: Company[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function CompanyList({ companies, selectedId, onSelect }: CompanyListProps) {
  return (
    <div>
      {companies.map(company => (
        <CompanyCard
          key={company.id}
          company={company}
          selected={company.id === selectedId}
          onSelect={() => onSelect(company.id)}
        />
      ))}
    </div>
  );
}
```

### Component Patterns

**Composition Pattern:**

```typescript
// Compose smaller components
function CompanyDetails({ company }: { company: Company }) {
  return (
    <Card>
      <CompanyHeader company={company} />
      <CompanyInfo company={company} />
      <CompanyContacts company={company} />
      <CompanyActivities company={company} />
    </Card>
  );
}
```

**Render Props Pattern:**

```typescript
function DataLoader<T>({
  query,
  children
}: {
  query: DocumentNode;
  children: (data: T, loading: boolean) => ReactNode;
}) {
  const { data, loading } = useQuery(query);
  return <>{children(data, loading)}</>;
}

// Usage
<DataLoader query={GET_COMPANIES}>
  {(companies, loading) => (
    loading ? <Spinner /> : <CompanyList companies={companies} />
  )}
</DataLoader>
```

**Higher-Order Component Pattern:**

```typescript
function withAuth<P extends object>(Component: ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading } = useAuth();

    if (loading) return <Spinner />;
    if (!user) return <Navigate to="/login" />;

    return <Component {...props} />;
  };
}

// Usage
export default withAuth(CompaniesPage);
```

## State Management

### Recoil State

**Atoms (Simple State):**

```typescript
import { atom } from 'recoil';

// Simple value
export const themeState = atom({
  key: 'theme',
  default: 'light',
});

// Object state
export const userState = atom<User | null>({
  key: 'user',
  default: null,
});

// Array state
export const selectedIdsState = atom<string[]>({
  key: 'selectedIds',
  default: [],
});
```

**Atom Families (Parameterized State):**

```typescript
import { atomFamily } from 'recoil';

// State per entity ID
export const companyState = atomFamily<Company | null, string>({
  key: 'company',
  default: null,
});

// Usage
const [company, setCompany] = useRecoilState(companyState('company-123'));
```

**Selectors (Derived State):**

```typescript
import { selector } from 'recoil';

// Compute from other state
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
      return true;
    });
  },
});
```

**Async Selectors:**

```typescript
export const companySelector = selectorFamily({
  key: 'companySelector',
  get: (id: string) => async ({ get }) => {
    const response = await fetch(`/api/companies/${id}`);
    return response.json();
  },
});
```

### Apollo Client State

**Cache Configuration:**

```typescript
// apollo-client.ts
import { InMemoryCache } from '@apollo/client';

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        companies: {
          keyArgs: ['filter'],
          merge(existing, incoming) {
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

**Query Hooks:**

```typescript
import { useQuery } from '@apollo/client';

function useCompany(id: string) {
  const { data, loading, error, refetch } = useQuery(GET_COMPANY, {
    variables: { id },
    fetchPolicy: 'cache-first',
  });

  return {
    company: data?.company,
    loading,
    error,
    refetch,
  };
}
```

**Mutation Hooks:**

```typescript
import { useMutation } from '@apollo/client';

function useCreateCompany() {
  const [createCompany, { loading, error }] = useMutation(CREATE_COMPANY, {
    update(cache, { data }) {
      cache.modify({
        fields: {
          companies(existing = []) {
            const newCompanyRef = cache.writeFragment({
              data: data.createCompany,
              fragment: gql`
                fragment NewCompany on Company {
                  id
                  name
                }
              `,
            });
            return [...existing, newCompanyRef];
          },
        },
      });
    },
  });

  return { createCompany, loading, error };
}
```

**Optimistic Updates:**

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

## Custom Hooks

### Data Fetching Hooks

```typescript
// useCompanies.ts
export function useCompanies(options?: UseCompaniesOptions) {
  const { data, loading, error, refetch } = useQuery(GET_COMPANIES, {
    variables: { filter: options?.filter },
    skip: options?.skip,
  });

  const companies = useMemo(
    () => data?.companies?.edges?.map(edge => edge.node) ?? [],
    [data]
  );

  return { companies, loading, error, refetch };
}

// useCompany.ts
export function useCompany(id: string) {
  const { data, loading, error } = useQuery(GET_COMPANY, {
    variables: { id },
    skip: !id,
  });

  return {
    company: data?.company,
    loading,
    error,
  };
}
```

### Mutation Hooks

```typescript
// useCreateCompany.ts
export function useCreateCompany() {
  const [createMutation, { loading, error }] = useMutation(CREATE_COMPANY);

  const createCompany = useCallback(
    async (input: CompanyCreateInput) => {
      const { data } = await createMutation({
        variables: { data: input },
      });
      return data?.createCompany;
    },
    [createMutation]
  );

  return { createCompany, loading, error };
}
```

### State Hooks

```typescript
// useCompanyFilters.ts
export function useCompanyFilters() {
  const [filters, setFilters] = useRecoilState(companyFiltersState);

  const updateFilter = useCallback(
    (key: string, value: any) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    },
    [setFilters]
  );

  const clearFilters = useCallback(() => {
    setFilters({});
  }, [setFilters]);

  return { filters, updateFilter, clearFilters };
}
```

### Effect Hooks

```typescript
// useDocumentTitle.ts
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} - Twenty`;
    return () => {
      document.title = 'Twenty';
    };
  }, [title]);
}

// useDebounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

## Routing

### Route Configuration

```typescript
// router.tsx
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/companies" />,
      },
      {
        path: 'companies',
        element: <CompaniesPage />,
      },
      {
        path: 'companies/:id',
        element: <CompanyDetailsPage />,
      },
      {
        path: 'people',
        element: <PeoplePage />,
      },
      {
        path: 'settings',
        element: <SettingsLayout />,
        children: [
          {
            path: 'profile',
            element: <ProfileSettings />,
          },
          {
            path: 'workspace',
            element: <WorkspaceSettings />,
          },
        ],
      },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'signup',
        element: <SignupPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
```

### Navigation

```typescript
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

function CompanyCard({ company }: { company: Company }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/companies/${company.id}`);
  };

  return <div onClick={handleClick}>{company.name}</div>;
}

function CompanyDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') ?? 'overview';

  return <CompanyDetails id={id!} activeTab={tab} />;
}
```

## Styling

### Emotion (CSS-in-JS)

```typescript
import styled from '@emotion/styled';
import { css } from '@emotion/react';

// Styled components
const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: 500;

  ${props => props.variant === 'primary' && css`
    background: ${props.theme.colors.primary};
    color: white;
  `}

  ${props => props.variant === 'secondary' && css`
    background: ${props.theme.colors.secondary};
    color: ${props.theme.colors.text};
  `}
`;

// CSS prop
function MyComponent() {
  return (
    <div
      css={css`
        display: flex;
        gap: 16px;
      `}
    >
      <Button variant="primary">Save</Button>
      <Button variant="secondary">Cancel</Button>
    </div>
  );
}
```

### Linaria (Zero-runtime CSS)

```typescript
import { css } from '@linaria/core';
import { styled } from '@linaria/react';

// Static styles
const container = css`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
`;

// Styled components
const Card = styled.div`
  padding: 16px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

function CompanyGrid({ companies }: { companies: Company[] }) {
  return (
    <div className={container}>
      {companies.map(company => (
        <Card key={company.id}>
          {company.name}
        </Card>
      ))}
    </div>
  );
}
```

### Theme System

```typescript
// theme.ts
export const theme = {
  colors: {
    primary: '#5E35B1',
    secondary: '#7E57C2',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    text: '#212121',
    textSecondary: '#757575',
    background: '#FFFFFF',
    backgroundSecondary: '#F5F5F5',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '24px',
    },
  },
};

// Usage with Emotion
import { ThemeProvider } from '@emotion/react';

<ThemeProvider theme={theme}>
  <App />
</ThemeProvider>
```

## Performance Optimization

### Code Splitting

```typescript
import { lazy, Suspense } from 'react';

// Lazy load components
const CompaniesPage = lazy(() => import('./pages/companies/CompaniesPage'));
const PeoplePage = lazy(() => import('./pages/people/PeoplePage'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/people" element={<PeoplePage />} />
      </Routes>
    </Suspense>
  );
}
```

### Memoization

```typescript
import { memo, useMemo, useCallback } from 'react';

// Memoize component
const CompanyCard = memo(function CompanyCard({ company }: { company: Company }) {
  return <div>{company.name}</div>;
});

// Memoize expensive computation
function CompanyList({ companies }: { companies: Company[] }) {
  const sortedCompanies = useMemo(
    () => [...companies].sort((a, b) => a.name.localeCompare(b.name)),
    [companies]
  );

  const handleSelect = useCallback((id: string) => {
    console.log('Selected:', id);
  }, []);

  return (
    <div>
      {sortedCompanies.map(company => (
        <CompanyCard
          key={company.id}
          company={company}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
}
```

### Virtual Lists

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualCompanyList({ companies }: { companies: Company[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: companies.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <CompanyCard company={companies[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Error Handling

### Error Boundaries

```typescript
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

// Usage
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>
```

### Query Error Handling

```typescript
function CompanyList() {
  const { companies, loading, error } = useCompanies();

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return <div>{/* Render companies */}</div>;
}
```

## Testing

See [Frontend Testing Guide](./16-frontend-testing.md) for detailed testing strategies.

## Next Steps

- [Component Guidelines](./08-component-guidelines.md)
- [State Management](./09-state-management.md)
- [Styling Guide](./10-styling-guide.md)
- [Frontend Testing](./16-frontend-testing.md)

---

**Related Documentation:**
- [System Architecture](./04-system-architecture.md)
- [Technology Stack](./06-technology-stack.md)
- [Backend Architecture](./11-backend-architecture.md)

