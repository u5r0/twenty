# Frontend Architecture

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
│   │   ├── companies/        # Companies type definitions
│   │   ├── people/           # People type definitions
│   │   ├── opportunities/    # Opportunities type definitions
│   │   ├── activities/       # Tasks and notes
│   │   ├── views/            # View system (table, kanban)
│   │   ├── settings/         # Settings and configuration
│   │   ├── ui/               # UI components
│   │   ├── object-record/    # Generic record operations
│   │   ├── object-metadata/  # Metadata management
│   │   ├── workflow/         # Workflow automation
│   │   ├── app/              # App root component and routing
│   │   └── ...               # Many other feature modules
│   ├── pages/                # Route components
│   │   ├── auth/             # Auth pages
│   │   ├── object-record/    # Generic object record pages (companies, people, etc.)
│   │   ├── settings/         # Settings pages
│   │   ├── onboarding/       # Onboarding pages
│   │   └── not-found/        # 404 page
│   ├── generated/            # Generated GraphQL types
│   │   └── graphql.ts        # Generated hooks and types
│   ├── generated-metadata/   # Generated metadata types
│   ├── testing/              # Test utilities
│   ├── config/               # Configuration
│   ├── hooks/                # Global hooks
│   ├── utils/                # Global utilities
│   ├── types/                # Global types
│   └── index.tsx             # Entry point
├── public/                   # Static assets
├── .storybook/               # Storybook configuration
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies
```

## Module Organization

### Feature Module Structure

Twenty uses a modular architecture where different modules have different structures based on their purpose:

**Type-Only Modules** (e.g., `companies/`, `people/`, `opportunities/`):
```
modules/companies/
└── types/                    # TypeScript type definitions
    └── Company.ts
```

These modules only contain type definitions because the actual functionality is handled by the generic `object-record/` module.

**Full-Featured Modules** (e.g., `activities/`, `auth/`, `views/`):
```
modules/activities/
├── components/               # React components
├── hooks/                    # Custom hooks
├── states/                   # Recoil state
├── graphql/                  # GraphQL queries/mutations
├── types/                    # TypeScript types
├── utils/                    # Utility functions
└── ...                       # Other subdirectories as needed
```

**Example Module Structures:**

The `action-menu/` module (full-featured):
```
modules/action-menu/
├── actions/
├── components/
├── constants/
├── contexts/
├── hooks/
├── mock/
├── states/
├── types/
└── utils/
```

The `auth/` module (full-featured):
```
modules/auth/
├── components/
├── constants/
├── contexts/
├── graphql/
├── hooks/
├── services/
├── sign-in-up/
├── states/
├── types/
└── utils/
```

### Example: Type Definitions

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
```

Note: Companies, people, and opportunities are managed through the generic `object-record/` module, which provides CRUD operations for all object types. The specific modules only contain type definitions.

## Component Architecture

### Component Types

**1. Page Components**
Top-level route components located in `src/pages/`:

```typescript
// pages/object-record/RecordIndexPage.tsx
// This page handles all object types (companies, people, opportunities, etc.)
export function RecordIndexPage() {
  return (
    <PageLayout>
      <PageHeader />
      <RecordIndexContainer />
    </PageLayout>
  );
}
```

Note: Twenty uses a generic object-record system, so there are no separate `pages/companies/` or `pages/people/` directories. All object types are handled through `pages/object-record/`.

**2. Container Components**
Handle data fetching and state (example from a full-featured module):

```typescript
// modules/activities/components/ActivityListContainer.tsx
export function ActivityListContainer() {
  const { activities, loading } = useActivities();
  const [selectedId, setSelectedId] = useRecoilState(selectedActivityIdState);

  if (loading) return <Spinner />;

  return (
    <ActivityList
      activities={activities}
      selectedId={selectedId}
      onSelect={setSelectedId}
    />
  );
}
```

**3. Presentational Components**
Pure UI components (generic example):

```typescript
// modules/ui/layout/components/Card.tsx
interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
```

### Component Patterns

**Composition Pattern:**

```typescript
// Compose smaller components (generic example)
function RecordDetails({ record }: { record: Record }) {
  return (
    <Card>
      <RecordHeader record={record} />
      <RecordInfo record={record} />
      <RecordRelations record={record} />
      <RecordActivities record={record} />
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
<DataLoader query={GET_RECORDS}>
  {(records, loading) => (
    loading ? <Spinner /> : <RecordList records={records} />
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
export default withAuth(SettingsPage);
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

// State per entity ID (generic example)
export const recordState = atomFamily<Record | null, string>({
  key: 'record',
  default: null,
});

// Usage
const [record, setRecord] = useRecoilState(recordState('record-123'));
```

**Selectors (Derived State):**

```typescript
import { selector } from 'recoil';

// Compute from other state (generic example)
export const filteredRecordsSelector = selector({
  key: 'filteredRecords',
  get: ({ get }) => {
    const records = get(recordsState);
    const filters = get(recordFiltersState);

    return records.filter(record => {
      // Apply filters
      return matchesFilters(record, filters);
    });
  },
});
```

**Async Selectors:**

```typescript
export const recordSelector = selectorFamily({
  key: 'recordSelector',
  get: (id: string) => async ({ get }) => {
    const response = await fetch(`/api/records/${id}`);
    return response.json();
  },
});
```

### Apollo Client State

**Cache Configuration:**

```typescript
// apollo-client.ts (example configuration)
import { InMemoryCache } from '@apollo/client';

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        records: {
          keyArgs: ['filter'],
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

function useRecord(id: string) {
  const { data, loading, error, refetch } = useQuery(GET_RECORD, {
    variables: { id },
    fetchPolicy: 'cache-first',
  });

  return {
    record: data?.record,
    loading,
    error,
    refetch,
  };
}
```

**Mutation Hooks:**

```typescript
import { useMutation } from '@apollo/client';

function useCreateRecord() {
  const [createRecord, { loading, error }] = useMutation(CREATE_RECORD, {
    update(cache, { data }) {
      cache.modify({
        fields: {
          records(existing = []) {
            const newRecordRef = cache.writeFragment({
              data: data.createRecord,
              fragment: gql`
                fragment NewRecord on Record {
                  id
                  name
                }
              `,
            });
            return [...existing, newRecordRef];
          },
        },
      });
    },
  });

  return { createRecord, loading, error };
}
```

**Optimistic Updates:**

```typescript
const [updateRecord] = useMutation(UPDATE_RECORD, {
  optimisticResponse: {
    updateRecord: {
      __typename: 'Record',
      id: recordId,
      name: newName,
    },
  },
});
```

## Custom Hooks

Custom hooks are located in module-specific `hooks/` directories or in the global `src/hooks/` directory.

### Data Fetching Hooks

```typescript
// Example from object-record module
export function useRecords(options?: UseRecordsOptions) {
  const { data, loading, error, refetch } = useQuery(GET_RECORDS, {
    variables: { filter: options?.filter },
    skip: options?.skip,
  });

  const records = useMemo(
    () => data?.records?.edges?.map(edge => edge.node) ?? [],
    [data]
  );

  return { records, loading, error, refetch };
}
```

### Mutation Hooks

```typescript
// Example mutation hook
export function useCreateRecord() {
  const [createMutation, { loading, error }] = useMutation(CREATE_RECORD);

  const createRecord = useCallback(
    async (input: RecordCreateInput) => {
      const { data } = await createMutation({
        variables: { data: input },
      });
      return data?.createRecord;
    },
    [createMutation]
  );

  return { createRecord, loading, error };
}
```

### State Hooks

```typescript
// Example state management hook
export function useRecordFilters() {
  const [filters, setFilters] = useRecoilState(recordFiltersState);

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

Twenty uses React Router v6 with routes configured via the `useCreateAppRouter` hook in `src/modules/app/hooks/useCreateAppRouter.tsx`:

```typescript
// Simplified example of route structure
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<AppLayout />}>
      {/* Object record routes (companies, people, opportunities, etc.) */}
      <Route path="/objects/:objectNamePlural" element={<RecordIndexPage />} />
      <Route path="/object/:objectNameSingular/:objectRecordId" element={<RecordShowPage />} />

      {/* Settings routes */}
      <Route path="/settings/*" element={<SettingsLayout />} />

      {/* Auth routes */}
      <Route path="/verify" element={<Authorize />} />
      <Route path="/sign-in" element={<SignInUp />} />
      <Route path="/sign-up" element={<SignInUp />} />

      {/* Onboarding routes */}
      <Route path="/create/workspace" element={<CreateWorkspace />} />
      <Route path="/create/profile" element={<CreateProfile />} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Route>
  )
);
```

Note: Twenty uses a generic object-record system, so routes like `/objects/companies` and `/objects/people` are handled by the same `RecordIndexPage` component, with the object type determined from the URL parameter.

### Navigation

```typescript
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

function RecordCard({ record }: { record: Record }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/object/${record.objectNameSingular}/${record.id}`);
  };

  return <div onClick={handleClick}>{record.name}</div>;
}

function RecordShowPage() {
  const { objectNameSingular, objectRecordId } = useParams();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') ?? 'overview';

  return <RecordDetails id={objectRecordId!} activeTab={tab} />;
}
```

## Styling

Twenty uses a combination of styling approaches:
- **twenty-ui**: Shared component library with pre-built UI components
- **Emotion**: CSS-in-JS for custom component styling
- **Linaria**: Zero-runtime CSS for performance-critical styles

### twenty-ui Component Library

Twenty maintains a separate `twenty-ui` package that provides reusable UI components, theming, and utilities shared across the application. This design system ensures consistency and reduces code duplication.

**Package Structure:**
```
packages/twenty-ui/src/
├── accessibility/        # Accessibility utilities
├── assets/              # Icons, themes, and static assets
├── components/          # Composite components (Chip, Tag, Pill, etc.)
├── display/             # Display components (Avatar, Icon, Tooltip, etc.)
├── feedback/            # Feedback components (Loader, ProgressBar)
├── input/               # Input components (Button, CodeEditor, etc.)
├── json-visualizer/     # JSON visualization components
├── layout/              # Layout components (Card, Section, etc.)
├── navigation/          # Navigation components (Menu, Link, etc.)
├── testing/             # Testing utilities and decorators
├── theme/               # Theme system and constants
└── utilities/           # Utility functions and hooks
```

**Importing from twenty-ui:**

The package uses subpath exports for tree-shaking and better organization:

```typescript
// Import specific categories
import { IconSearch, Avatar, Tooltip } from 'twenty-ui/display';
import { Button, IconButton, Toggle } from 'twenty-ui/input';
import { MenuItem, MenuItemSelect } from 'twenty-ui/navigation';
import { Card, Section } from 'twenty-ui/layout';
import { Loader, CircularProgressBar } from 'twenty-ui/feedback';
import { Chip, Tag, Pill } from 'twenty-ui/components';
import { MOBILE_VIEWPORT } from 'twenty-ui/theme';
import { useIsMobile, getOsControlSymbol } from 'twenty-ui/utilities';

// Import styles (done once in index.tsx)
import 'twenty-ui/style.css';
```

**Common twenty-ui Components Used in twenty-front:**

1. **Display Components:**
   - `IconSearch`, `IconX`, `IconChevronDown`, etc. - Tabler icons
   - `Avatar` - User/workspace avatars
   - `Tooltip`, `AppTooltip` - Tooltips with various positions
   - `Label` - Text labels
   - `AnimatedCheckmark` - Animated checkmark for success states
   - `OverflowingTextWithTooltip` - Text with ellipsis and tooltip

2. **Input Components:**
   - `Button`, `MainButton` - Primary action buttons
   - `IconButton`, `LightIconButton` - Icon-only buttons
   - `Toggle`, `Checkbox`, `Radio`, `RadioGroup` - Form controls
   - `CodeEditor` - Monaco-based code editor

3. **Navigation Components:**
   - `MenuItem`, `MenuItemSelect`, `MenuItemSelectTag` - Menu items
   - `NavigationBar` - Top navigation bar
   - `AdvancedSettingsToggle` - Settings toggle component
   - `UndecoratedLink` - Unstyled router links

4. **Layout Components:**
   - `Card` - Container with elevation
   - `Section` - Content sections
   - `AnimatedExpandableContainer` - Collapsible containers

5. **Feedback Components:**
   - `Loader` - Loading spinner
   - `CircularProgressBar` - Progress indicator
   - `Banner` - Information banners

6. **Composite Components:**
   - `Chip`, `Tag`, `Pill` - Label-like components with colors

**Theme Integration:**

twenty-ui provides theme constants and utilities:

```typescript
import { MOBILE_VIEWPORT } from 'twenty-ui/theme';

const StyledContainer = styled.div`
  @media (max-width: ${MOBILE_VIEWPORT}px) {
    padding: 8px;
  }
`;
```

**Utility Hooks:**

```typescript
import { useIsMobile } from 'twenty-ui/utilities';

function MyComponent() {
  const isMobile = useIsMobile();

  return isMobile ? <MobileView /> : <DesktopView />;
}
```

**Testing Utilities:**

```typescript
import { ComponentDecorator, CatalogDecorator } from 'twenty-ui/testing';

// Use in Storybook stories
export default {
  decorators: [ComponentDecorator],
};
```

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

// Lazy load page components
const RecordIndexPage = lazy(() => import('./pages/object-record/RecordIndexPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/objects/:objectNamePlural" element={<RecordIndexPage />} />
        <Route path="/settings/*" element={<SettingsPage />} />
      </Routes>
    </Suspense>
  );
}
```

### Memoization

```typescript
import { memo, useMemo, useCallback } from 'react';

// Memoize component
const RecordCard = memo(function RecordCard({ record }: { record: Record }) {
  return <div>{record.name}</div>;
});

// Memoize expensive computation
function RecordList({ records }: { records: Record[] }) {
  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => a.name.localeCompare(b.name)),
    [records]
  );

  const handleSelect = useCallback((id: string) => {
    console.log('Selected:', id);
  }, []);

  return (
    <div>
      {sortedRecords.map(record => (
        <RecordCard
          key={record.id}
          record={record}
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

function VirtualRecordList({ records }: { records: Record[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: records.length,
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
            <RecordCard record={records[virtualItem.index]} />
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
function RecordList() {
  const { records, loading, error } = useRecords();

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return <div>{/* Render records */}</div>;
}
```

## Testing

See [Frontend Testing Guide](./13-frontend-testing.md) for detailed testing strategies.

## Next Steps

- [Component Guidelines](./06-component-guidelines.md)
- [State Management](./07-state-management.md)
- [Backend Architecture](./08-backend-architecture.md)
- [Frontend Testing](./13-frontend-testing.md)

---

**Related Documentation:**
- [System Architecture](./02-system-architecture.md)
- [Monorepo Structure](./03-monorepo-structure.md)
- [Technology Stack](./04-technology-stack.md)

