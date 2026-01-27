# Frontend Testing

Comprehensive guide to testing React components and frontend code in Twenty.

## Testing Tools

- **Jest** - Test runner and assertion library
- **React Testing Library** - Component testing utilities
- **MSW (Mock Service Worker)** - API mocking
- **Storybook** - Component development and visual testing
- **@testing-library/user-event** - User interaction simulation

## Component Testing

### Basic Component Tests

```typescript
// Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading state', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies correct variant class', () => {
    const { rerender } = render(<Button variant="primary">Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-primary');

    rerender(<Button variant="secondary">Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-secondary');
  });
});
```

### Form Component Tests

```typescript
// LoginForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('renders email and password fields', () => {
    render(<LoginForm onSubmit={jest.fn()} />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn();

    render(<LoginForm onSubmit={handleSubmit} />);

    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();

    render(<LoginForm onSubmit={jest.fn()} />);

    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn();

    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText(/logging in/i)).toBeInTheDocument();
  });
});
```

### List Component Tests

```typescript
// CompanyList.test.tsx
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompanyList } from './CompanyList';

const mockCompanies = [
  { id: '1', name: 'Acme Corp', industry: 'Technology' },
  { id: '2', name: 'Tech Inc', industry: 'Technology' },
  { id: '3', name: 'Finance Co', industry: 'Finance' },
];

describe('CompanyList', () => {
  it('renders list of companies', () => {
    render(<CompanyList companies={mockCompanies} />);

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Tech Inc')).toBeInTheDocument();
    expect(screen.getByText('Finance Co')).toBeInTheDocument();
  });

  it('renders empty state when no companies', () => {
    render(<CompanyList companies={[]} />);
    expect(screen.getByText(/no companies found/i)).toBeInTheDocument();
  });

  it('calls onSelect when company is clicked', async () => {
    const user = userEvent.setup();
    const handleSelect = jest.fn();

    render(<CompanyList companies={mockCompanies} onSelect={handleSelect} />);

    await user.click(screen.getByText('Acme Corp'));
    expect(handleSelect).toHaveBeenCalledWith(mockCompanies[0]);
  });

  it('highlights selected company', () => {
    render(
      <CompanyList
        companies={mockCompanies}
        selectedId="1"
      />
    );

    const selectedCard = screen.getByText('Acme Corp').closest('[data-testid="company-card"]');
    expect(selectedCard).toHaveClass('selected');
  });

  it('filters companies by search term', async () => {
    const user = userEvent.setup();

    render(<CompanyList companies={mockCompanies} />);

    await user.type(screen.getByPlaceholderText(/search/i), 'Acme');

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.queryByText('Tech Inc')).not.toBeInTheDocument();
    expect(screen.queryByText('Finance Co')).not.toBeInTheDocument();
  });
});
```

## Testing with Apollo Client

### Mocking GraphQL Queries

```typescript
// useCompanies.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { CompanyList } from './CompanyList';
import { GET_COMPANIES } from './queries';

const mocks = [
  {
    request: {
      query: GET_COMPANIES,
      variables: {},
    },
    result: {
      data: {
        companies: {
          edges: [
            {
              node: {
                id: '1',
                name: 'Acme Corp',
                industry: 'Technology',
              },
            },
          ],
        },
      },
    },
  },
];

describe('CompanyList with Apollo', () => {
  it('loads and displays companies', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <CompanyList />
      </MockedProvider>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });
  });

  it('handles query errors', async () => {
    const errorMocks = [
      {
        request: {
          query: GET_COMPANIES,
        },
        error: new Error('Network error'),
      },
    ];

    render(
      <MockedProvider mocks={errorMocks} addTypename={false}>
        <CompanyList />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error loading companies/i)).toBeInTheDocument();
    });
  });
});
```

### Testing Mutations

```typescript
// CreateCompanyForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { CreateCompanyForm } from './CreateCompanyForm';
import { CREATE_COMPANY } from './mutations';

const mocks = [
  {
    request: {
      query: CREATE_COMPANY,
      variables: {
        data: {
          name: 'New Company',
          industry: 'Technology',
        },
      },
    },
    result: {
      data: {
        createCompany: {
          id: '1',
          name: 'New Company',
          industry: 'Technology',
        },
      },
    },
  },
];

describe('CreateCompanyForm', () => {
  it('creates company successfully', async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <CreateCompanyForm onSuccess={onSuccess} />
      </MockedProvider>
    );

    await user.type(screen.getByLabelText(/name/i), 'New Company');
    await user.selectOptions(screen.getByLabelText(/industry/i), 'Technology');
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          name: 'New Company',
        })
      );
    });
  });
});
```

## Testing with Recoil

### Testing Atoms

```typescript
// companyState.test.ts
import { renderHook, act } from '@testing-library/react';
import { RecoilRoot, useRecoilState } from 'recoil';
import { selectedCompanyIdState, companyFiltersState } from './companyState';

describe('Company State', () => {
  describe('selectedCompanyIdState', () => {
    it('has null as default value', () => {
      const { result } = renderHook(
        () => useRecoilState(selectedCompanyIdState),
        { wrapper: RecoilRoot }
      );

      expect(result.current[0]).toBeNull();
    });

    it('updates selected company id', () => {
      const { result } = renderHook(
        () => useRecoilState(selectedCompanyIdState),
        { wrapper: RecoilRoot }
      );

      act(() => {
        result.current[1]('company-123');
      });

      expect(result.current[0]).toBe('company-123');
    });
  });

  describe('companyFiltersState', () => {
    it('has default filters', () => {
      const { result } = renderHook(
        () => useRecoilState(companyFiltersState),
        { wrapper: RecoilRoot }
      );

      expect(result.current[0]).toEqual({
        industry: null,
        search: '',
      });
    });

    it('updates filters', () => {
      const { result } = renderHook(
        () => useRecoilState(companyFiltersState),
        { wrapper: RecoilRoot }
      );

      act(() => {
        result.current[1]({
          industry: 'Technology',
          search: 'Acme',
        });
      });

      expect(result.current[0]).toEqual({
        industry: 'Technology',
        search: 'Acme',
      });
    });
  });
});
```

### Testing Selectors

```typescript
// companySelectors.test.ts
import { renderHook } from '@testing-library/react';
import { RecoilRoot, useRecoilValue, useSetRecoilState } from 'recoil';
import {
  companiesState,
  companyFiltersState,
  filteredCompaniesSelector
} from './companyState';

const mockCompanies = [
  { id: '1', name: 'Acme Corp', industry: 'Technology' },
  { id: '2', name: 'Tech Inc', industry: 'Technology' },
  { id: '3', name: 'Finance Co', industry: 'Finance' },
];

describe('filteredCompaniesSelector', () => {
  it('returns all companies when no filters', () => {
    const { result } = renderHook(
      () => {
        const setCompanies = useSetRecoilState(companiesState);
        const filtered = useRecoilValue(filteredCompaniesSelector);
        return { setCompanies, filtered };
      },
      { wrapper: RecoilRoot }
    );

    act(() => {
      result.current.setCompanies(mockCompanies);
    });

    expect(result.current.filtered).toHaveLength(3);
  });

  it('filters by industry', () => {
    const { result } = renderHook(
      () => {
        const setCompanies = useSetRecoilState(companiesState);
        const setFilters = useSetRecoilState(companyFiltersState);
        const filtered = useRecoilValue(filteredCompaniesSelector);
        return { setCompanies, setFilters, filtered };
      },
      { wrapper: RecoilRoot }
    );

    act(() => {
      result.current.setCompanies(mockCompanies);
      result.current.setFilters({ industry: 'Technology', search: '' });
    });

    expect(result.current.filtered).toHaveLength(2);
    expect(result.current.filtered[0].name).toBe('Acme Corp');
    expect(result.current.filtered[1].name).toBe('Tech Inc');
  });

  it('filters by search term', () => {
    const { result } = renderHook(
      () => {
        const setCompanies = useSetRecoilState(companiesState);
        const setFilters = useSetRecoilState(companyFiltersState);
        const filtered = useRecoilValue(filteredCompaniesSelector);
        return { setCompanies, setFilters, filtered };
      },
      { wrapper: RecoilRoot }
    );

    act(() => {
      result.current.setCompanies(mockCompanies);
      result.current.setFilters({ industry: null, search: 'Acme' });
    });

    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].name).toBe('Acme Corp');
  });
});
```

## Testing Custom Hooks

```typescript
// useCompanyForm.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCompanyForm } from './useCompanyForm';

describe('useCompanyForm', () => {
  it('initializes with empty values', () => {
    const { result } = renderHook(() => useCompanyForm());

    expect(result.current.values).toEqual({
      name: '',
      industry: '',
      employees: 0,
    });
  });

  it('updates field values', () => {
    const { result } = renderHook(() => useCompanyForm());

    act(() => {
      result.current.setFieldValue('name', 'Acme Corp');
    });

    expect(result.current.values.name).toBe('Acme Corp');
  });

  it('validates required fields', () => {
    const { result } = renderHook(() => useCompanyForm());

    act(() => {
      result.current.validateForm();
    });

    expect(result.current.errors.name).toBe('Name is required');
  });

  it('submits form with valid data', async () => {
    const onSubmit = jest.fn();
    const { result } = renderHook(() => useCompanyForm({ onSubmit }));

    act(() => {
      result.current.setFieldValue('name', 'Acme Corp');
      result.current.setFieldValue('industry', 'Technology');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Acme Corp',
      industry: 'Technology',
      employees: 0,
    });
  });

  it('resets form', () => {
    const { result } = renderHook(() => useCompanyForm());

    act(() => {
      result.current.setFieldValue('name', 'Acme Corp');
      result.current.reset();
    });

    expect(result.current.values.name).toBe('');
  });
});
```

## Testing with MSW (Mock Service Worker)

### Setting up MSW

```typescript
// mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/companies', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        { id: '1', name: 'Acme Corp', industry: 'Technology' },
        { id: '2', name: 'Tech Inc', industry: 'Technology' },
      ])
    );
  }),

  rest.post('/api/companies', (req, res, ctx) => {
    const { name, industry } = req.body as any;
    return res(
      ctx.status(201),
      ctx.json({
        id: '3',
        name,
        industry,
      })
    );
  }),

  rest.get('/api/companies/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({
        id,
        name: 'Acme Corp',
        industry: 'Technology',
      })
    );
  }),
];

// mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### Using MSW in Tests

```typescript
// CompanyList.msw.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { server } from '../mocks/server';
import { rest } from 'msw';
import { CompanyList } from './CompanyList';

describe('CompanyList with MSW', () => {
  it('loads and displays companies', async () => {
    render(<CompanyList />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Tech Inc')).toBeInTheDocument();
    });
  });

  it('handles server errors', async () => {
    server.use(
      rest.get('/api/companies', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );

    render(<CompanyList />);

    await waitFor(() => {
      expect(screen.getByText(/error loading companies/i)).toBeInTheDocument();
    });
  });

  it('handles empty response', async () => {
    server.use(
      rest.get('/api/companies', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json([]));
      })
    );

    render(<CompanyList />);

    await waitFor(() => {
      expect(screen.getByText(/no companies found/i)).toBeInTheDocument();
    });
  });
});
```

## Storybook Testing

### Component Stories

```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from '@storybook/test';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const WithInteraction: Story = {
  args: {
    children: 'Click me',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await userEvent.click(button);
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  },
};

export const LoadingState: Story = {
  args: {
    loading: true,
    children: 'Loading Button',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await expect(button).toBeDisabled();
    await expect(canvas.getByRole('status')).toBeInTheDocument();
  },
};
```

## Accessibility Testing

```typescript
// Button.a11y.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from './Button';

expect.extend(toHaveNoViolations);

describe('Button Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has correct ARIA attributes', () => {
    const { getByRole } = render(
      <Button aria-label="Submit form">Submit</Button>
    );

    const button = getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Submit form');
  });

  it('is keyboard accessible', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button');
    button.focus();

    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalled();
  });
});
```

## Test Utilities

### Custom Render Function

```typescript
// test-utils.tsx
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@emotion/react';
import { theme } from '../theme';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  mocks?: MockedResponse[];
  initialRecoilState?: any;
}

function AllTheProviders({
  children,
  mocks = [],
  initialRecoilState = {},
}: {
  children: React.ReactNode;
  mocks?: MockedResponse[];
  initialRecoilState?: any;
}) {
  return (
    <RecoilRoot initializeState={({ set }) => {
      Object.entries(initialRecoilState).forEach(([key, value]) => {
        set(key as any, value);
      });
    }}>
      <MockedProvider mocks={mocks} addTypename={false}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            {children}
          </ThemeProvider>
        </BrowserRouter>
      </MockedProvider>
    </RecoilRoot>
  );
}

function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions,
) {
  const { mocks, initialRecoilState, ...renderOptions } = options || {};

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders mocks={mocks} initialRecoilState={initialRecoilState}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
}

export * from '@testing-library/react';
export { customRender as render };
```

## Best Practices

1. **Test user behavior, not implementation**
2. **Use semantic queries (getByRole, getByLabelText)**
3. **Avoid testing implementation details**
4. **Mock external dependencies**
5. **Keep tests simple and focused**
6. **Use descriptive test names**
7. **Test edge cases and error states**
8. **Maintain high test coverage (80%+)**
9. **Use test utilities for common setup**
10. **Run tests in CI/CD pipeline**

## Running Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test --watch

# Run tests with coverage
yarn test --coverage

# Run specific test file
yarn test Button.test.tsx

# Run Storybook tests
yarn storybook:test
```

## Next Steps

- [Testing Strategy](./15-testing-strategy.md)
- [Backend Testing](./17-backend-testing.md)
- [Component Guidelines](./08-component-guidelines.md)

---

**Related Documentation:**
- [Frontend Architecture](./07-frontend-architecture.md)
- [State Management](./09-state-management.md)
- [Code Style](./22-code-style.md)
