# Testing Strategy

Comprehensive guide to testing in Twenty, covering unit tests, integration tests, and end-to-end tests.

## Testing Philosophy

Tollows a comprehensive testing strategy:

1. **Unit Tests** - Test individual functions and components
2. **Integration Tests** - Test module interactions
3. **End-to-End Tests** - Test complete user workflows
4. **Visual Tests** - Test UI components with Storybook

## Testing Pyramid

```
        ┌─────────────┐
        │     E2E     │  ← Few, slow, expensive
        │   Tests     │
        ├─────────────┤
        │ Integration │  ← Some, medium speed
        │   Tests     │
        ├─────────────┤
        │    Unit     │  ← Many, fast, cheap
        │   Tests     │
        └─────────────┘
```

## Test Coverage Goals

- **Unit Tests:** 80%+ coverage
- **Integration Tests:** Critical paths covered
- **E2E Tests:** Main user workflows covered
- **Visual Tests:** All UI components

## Unit Testing

### Frontend Unit Tests

**Testing Library:** Jest + React Testing Library

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });

  it('shows loading spinner when loading', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('applies correct variant styles', () => {
    const { rerender } = render(<Button variant="primary">Click me</Button>);
    expect(screen.getByText('Click me')).toHaveClass('btn-primary');

    rerender(<Button variant="secondary">Click me</Button>);
    expect(screen.getByText('Click me')).toHaveClass('btn-secondary');
  });
});
```

### Testing Hooks

```typescript
// useCompanies.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { useCompanies } from './useCompanies';
import { GET_COMPANIES } from './queries';

const mocks = [
  {
    request: {
      query: GET_COMPANIES,
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

describe('useCompanies', () => {
  it('fetches companies successfully', async () => {
    const wrapper = ({ children }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useCompanies(), { wrapper });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.companies).toHaveLength(1);
    expect(result.current.companies[0].name).toBe('Acme Corp');
  });

  it('handles errors', async () => {
    const errorMocks = [
      {
        request: {
          query: GET_COMPANIES,
        },
        error: new Error('Network error'),
      },
    ];

    const wrapper = ({ children }) => (
      <MockedProvider mocks={errorMocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useCompanies(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });
});
```

### Testing Recoil State

```typescript
// companyState.test.ts
import { renderHook, act } from '@testing-library/react';
import { RecoilRoot, useRecoilState } from 'recoil';
import { selectedCompanyIdState } from './companyState';

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
```

### Backend Unit Tests

**Testing Library:** Jest

```typescript
// company.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CompanyService } from './company.service';
import { CompanyRepository } from './company.repository';

describe('CompanyService', () => {
  let service: CompanyService;
  let repository: CompanyRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        {
          provide: CompanyRepository,
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
    repository = module.get<CompanyRepository>(CompanyRepository);
  });

  describe('findAll', () => {
    it('should return an array of companies', async () => {
      const companies = [
        { id: '1', name: 'Acme Corp' },
        { id: '2', name: 'Tech Inc' },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(companies);

      const result = await service.findAll('workspace-1');
      expect(result).toEqual(companies);
      expect(repository.find).toHaveBeenCalledWith({
        where: { workspaceId: 'workspace-1', deletedAt: null },
      });
    });
  });

  describe('findOne', () => {
    it('should return a company', async () => {
      const company = { id: '1', name: 'Acme Corp' };

      jest.spyOn(repository, 'findOne').mockResolvedValue(company);

      const result = await service.findOne('1', 'workspace-1');
      expect(result).toEqual(company);
    });

    it('should throw NotFoundException when company not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(
        service.findOne('999', 'workspace-1')
      ).rejects.toThrow('Company not found');
    });
  });

  describe('create', () => {
    it('should create a company', async () => {
      const createDto = { name: 'New Company' };
      const createdCompany = { id: '1', ...createDto };

      jest.spyOn(repository, 'create').mockReturnValue(createdCompany);
      jest.spyOn(repository, 'save').mockResolvedValue(createdCompany);

      const result = await service.create(createDto, 'workspace-1');
      expect(result).toEqual(createdCompany);
    });
  });

  describe('update', () => {
    it('should update a company', async () => {
      const updateDto = { name: 'Updated Name' };
      const updatedCompany = { id: '1', ...updateDto };

      jest.spyOn(repository, 'update').mockResolvedValue(undefined);
      jest.spyOn(repository, 'findOne').mockResolvedValue(updatedCompany);

      const result = await service.update('1', updateDto, 'workspace-1');
      expect(result).toEqual(updatedCompany);
    });
  });

  describe('delete', () => {
    it('should soft delete a company', async () => {
      jest.spyOn(repository, 'softDelete').mockResolvedValue({ affected: 1 });

      const result = await service.delete('1', 'workspace-1');
      expect(result).toBe(true);
    });
  });
});
```

### Testing Resolvers

```typescript
// company.resolver.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CompanyResolver } from './company.resolver';
import { CompanyService } from './company.service';

describe('CompanyResolver', () => {
  let resolver: CompanyResolver;
  let service: CompanyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyResolver,
        {
          provide: CompanyService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<CompanyResolver>(CompanyResolver);
    service = module.get<CompanyService>(CompanyService);
  });

  describe('companies', () => {
    it('should return an array of companies', async () => {
      const companies = [{ id: '1', name: 'Acme Corp' }];
      const workspace = { id: 'workspace-1' };

      jest.spyOn(service, 'findAll').mockResolvedValue(companies);

      const result = await resolver.companies(null, workspace);
      expect(result).toEqual(companies);
    });
  });

  describe('company', () => {
    it('should return a single company', async () => {
      const company = { id: '1', name: 'Acme Corp' };
      const workspace = { id: 'workspace-1' };

      jest.spyOn(service, 'findOne').mockResolvedValue(company);

      const result = await resolver.company('1', workspace);
      expect(result).toEqual(company);
    });
  });

  describe('createCompany', () => {
    it('should create a company', async () => {
      const createDto = { name: 'New Company' };
      const createdCompany = { id: '1', ...createDto };
      const workspace = { id: 'workspace-1' };

      jest.spyOn(service, 'create').mockResolvedValue(createdCompany);

      const result = await resolver.createCompany(createDto, workspace);
      expect(result).toEqual(createdCompany);
    });
  });
});
```

## Integration Testing

### Frontend Integration Tests

```typescript
// CompanyList.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { RecoilRoot } from 'recoil';
import { CompanyList } from './CompanyList';
import { GET_COMPANIES } from './queries';

const mocks = [
  {
    request: {
      query: GET_COMPANIES,
      variables: { filter: {} },
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
                employees: 100,
              },
            },
            {
              node: {
                id: '2',
                name: 'Tech Inc',
                industry: 'Technology',
                employees: 50,
              },
            },
          ],
        },
      },
    },
  },
];

describe('CompanyList Integration', () => {
  it('fetches and displays companies', async () => {
    render(
      <RecoilRoot>
        <MockedProvider mocks={mocks} addTypename={false}>
          <CompanyList />
        </MockedProvider>
      </RecoilRoot>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Tech Inc')).toBeInTheDocument();
    });
  });

  it('filters companies by industry', async () => {
    render(
      <RecoilRoot>
        <MockedProvider mocks={mocks} addTypename={false}>
          <CompanyList />
        </MockedProvider>
      </RecoilRoot>
    );

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    // Apply filter
    const filterInput = screen.getByLabelText('Industry');
    fireEvent.change(filterInput, { target: { value: 'Technology' } });

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Tech Inc')).toBeInTheDocument();
    });
  });
});
```

### Backend Integration Tests

```typescript
// company.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('Company Integration Tests', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password',
      });

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /companies', () => {
    it('should return companies', async () => {
      const response = await request(app.getHttpServer())
        .get('/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .get('/companies')
        .expect(401);
    });
  });

  describe('POST /companies', () => {
    it('should create a company', async () => {
      const createDto = {
        name: 'Test Company',
        industry: 'Technology',
      };

      const response = await request(app.getHttpServer())
        .post('/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body.name).toBe(createDto.name);
      expect(response.body.id).toBeDefined();
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('GraphQL Integration', () => {
    it('should query companies', async () => {
      const query = `
        query {
          companies {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query })
        .expect(200);

      expect(response.body.data.companies).toBeDefined();
    });

    it('should create company via mutation', async () => {
      const mutation = `
        mutation CreateCompany($data: CreateCompanyInput!) {
          createCompany(data: $data) {
            id
            name
          }
        }
      `;

      const variables = {
        data: {
          name: 'GraphQL Company',
          industry: 'Technology',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: mutation, variables })
        .expect(200);

      expect(response.body.data.createCompany.name).toBe('GraphQL Company');
    });
  });
});
```

## End-to-End Testing

### Playwright E2E Tests

```typescript
// companies.e2e.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Companies', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name=email]', 'test@example.com');
    await page.fill('[name=password]', 'password');
    await page.click('button[type=submit]');
    await page.waitForURL('/companies');
  });

  test('should display companies list', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Companies');
    await expect(page.locator('[data-testid=company-card]')).toHaveCount(3);
  });

  test('should create a new company', async ({ page }) => {
    // Click new company button
    await page.click('button:has-text("New Company")');

    // Fill form
    await page.fill('[name=name]', 'Test Company');
    await page.fill('[name=industry]', 'Technology');
    await page.fill('[name=employees]', '100');

    // Submit
    await page.click('button:has-text("Save")');

    // Verify company was created
    await expect(page.locator('text=Test Company')).toBeVisible();
  });

  test('should edit a company', async ({ page }) => {
    // Click on first company
    await page.click('[data-testid=company-card]:first-child');

    // Click edit button
    await page.click('button:has-text("Edit")');

    // Update name
    await page.fill('[name=name]', 'Updated Company Name');
    await page.click('button:has-text("Save")');

    // Verify update
    await expect(page.locator('text=Updated Company Name')).toBeVisible();
  });

  test('should delete a company', async ({ page }) => {
    // Click on first company
    await page.click('[data-testid=company-card]:first-child');

    // Click delete button
    await page.click('button:has-text("Delete")');

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Verify company was deleted
    await expect(page.locator('[data-testid=company-card]')).toHaveCount(2);
  });

  test('should filter companies', async ({ page }) => {
    // Apply filter
    await page.click('button:has-text("Filter")');
    await page.selectOption('[name=industry]', 'Technology');
    await page.click('button:has-text("Apply")');

    // Verify filtered results
    const companies = page.locator('[data-testid=company-card]');
    await expect(companies).toHaveCount(2);
  });

  test('should search companies', async ({ page }) => {
    // Enter search term
    await page.fill('[placeholder="Search companies"]', 'Acme');

    // Verify search results
    await expect(page.locator('text=Acme Corp')).toBeVisible();
    await expect(page.locator('[data-testid=company-card]')).toHaveCount(1);
  });
});
```

## Visual Testing with Storybook

### Component Stories

```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Danger Button',
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading Button',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

export const Small: Story = {
  args: {
    size: 'small',
    children: 'Small Button',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
    children: 'Large Button',
  },
};
```

### Interaction Tests

```typescript
// Button.stories.tsx (continued)
import { within, userEvent } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

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
```

## Test Utilities

### Test Setup

```typescript
// setupTests.ts
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Establish API mocking before all tests
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished
afterAll(() => server.close());

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

### Test Helpers

```typescript
// test-utils.tsx
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import { MockedProvider } from '@apollo/client/testing';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@emotion/react';
import { theme } from '../theme';

interface AllTheProvidersProps {
  children: React.ReactNode;
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  return (
    <RecoilRoot>
      <MockedProvider addTypename={false}>
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
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render };
```

## Running Tests

### Commands

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test --watch

# Run tests with coverage
yarn test --coverage

# Run specific test file
yarn test Button.test.tsx

# Run tests matching pattern
yarn test --testNamePattern="should render"

# Run E2E tests
cd packages/twenty-e2e-testing
yarn test:e2e

# Run E2E tests in headed mode
yarn test:e2e --headed

# Run Storybook tests
yarn storybook:test
```

## Best Practices

1. **Write tests first (TDD)** when possible
2. **Test behavior, not implementation**
3. **Keep tests simple and focused**
4. **Use descriptive test names**
5. **Mock external dependencies**
6. **Avoid testing implementation details**
7. **Test edge cases and error conditions**
8. **Keep tests fast**
9. **Use test utilities for common setup**
10. **Maintain test coverage above 80%**

## Next Steps

- [Frontend Testing](./16-frontend-testing.md)
- [Backend Testing](./17-backend-testing.md)
- [Code Style](./22-code-style.md)

---

**Related Documentation:**
- [Frontend Architecture](./07-frontend-architecture.md)
- [Backend Architecture](./11-backend-architecture.md)
- [Contributing Guide](./21-contributing.md)

