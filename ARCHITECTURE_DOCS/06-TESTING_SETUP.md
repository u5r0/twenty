# Testing Setup & Strategy

## Overview

Twenty employs a comprehensive, multi-layered testing strategy covering unit tests, integration tests, and end-to-end tests across both frontend and backend. The testing infrastructure ensures code quality, reliability, and prevents regressions.

---

## Testing Stack

### Backend Testing
- **Framework:** Jest (v28+)
- **E2E:** Playwright (v1.40+)
- **Coverage:** nyc (v15+)
- **Mocking:** jest-mock-extended, ts-jest
- **Database:** Test database (PostgreSQL)

### Frontend Testing
- **Framework:** Jest (v28+)
- **Component Testing:** React Testing Library
- **E2E:** Playwright (v1.40+)
- **Mocking:** MSW (Mock Service Worker)
- **Coverage:** nyc

### Test Organization
```
packages/twenty-server/
├── src/
│   └── [modules]/
│       ├── [feature].service.ts
│       ├── [feature].resolver.ts
│       └── __tests__/
│           ├── [feature].service.spec.ts
│           ├── [feature].resolver.spec.ts
│           └── fixtures/
│
packages/twenty-front/
├── src/
│   └── [modules]/
│       ├── [component].tsx
│       ├── [component].spec.tsx
│       └── __tests__/
│           └── fixtures/

packages/twenty-e2e-testing/
├── tests/
│   ├── auth/
│   ├── companies/
│   ├── contacts/
│   └── [...other features]
└── reporters/
```

---

## Backend Testing

### Jest Configuration

**File:** `packages/twenty-server/jest.config.mjs`

```javascript
export default {
  displayName: 'twenty-server',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/__tests__/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
      isolatedModules: true,
    },
  },
};
```

### Test Database Setup

**File:** `packages/twenty-server/__tests__/setup.ts`

```typescript
import { config } from 'dotenv';

// Load test environment
config({ path: '.env.test', override: true });

// Set test database URL
process.env.PG_DATABASE_URL = process.env.TEST_DATABASE_URL ||
  'postgresql://user:password@localhost:5432/twenty_test';

// Disable logging during tests
process.env.ORM_QUERY_LOGGING = 'disabled';

// Setup global test timeout
jest.setTimeout(30000);

// Mock external services
jest.mock('aws-sdk');
jest.mock('@sentry/nestjs');

// Global teardown
afterAll(async () => {
  // Close database connections
  // Clean up temporary files
  // Stop any running servers
});
```

### Service Unit Tests

**Example:** `packages/twenty-server/src/modules/company/company.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CompanyService } from './company.service';
import { CompanyEntity } from './entities/company.entity';
import { CreateCompanyInput } from './dto/create-company.input';
import { UpdateCompanyInput } from './dto/update-company.input';

describe('CompanyService', () => {
  let service: CompanyService;
  let repository: Repository<CompanyEntity>;

  // Test data
  const mockCompany: CompanyEntity = {
    id: '123',
    name: 'Acme Corp',
    domainName: 'acme.com',
    revenue: 5000000,
    employees: 150,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    // Create testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        {
          provide: getRepositoryToken(CompanyEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
    repository = module.get<Repository<CompanyEntity>>(
      getRepositoryToken(CompanyEntity)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new company', async () => {
      const input: CreateCompanyInput = {
        name: 'Acme Corp',
        domainName: 'acme.com',
      };

      jest.spyOn(repository, 'create').mockReturnValue(mockCompany);
      jest.spyOn(repository, 'save').mockResolvedValue(mockCompany);

      const result = await service.create(input);

      expect(repository.create).toHaveBeenCalledWith(input);
      expect(repository.save).toHaveBeenCalledWith(mockCompany);
      expect(result).toEqual(mockCompany);
    });

    it('should throw error on invalid input', async () => {
      const input = { name: '' }; // Invalid: empty name

      await expect(service.create(input as CreateCompanyInput)).rejects.toThrow(
        'Company name is required'
      );
    });
  });

  describe('findAll', () => {
    it('should return all companies', async () => {
      const companies = [mockCompany];

      jest.spyOn(repository, 'find').mockResolvedValue(companies);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual(companies);
    });

    it('should filter soft-deleted companies', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        where: { deletedAt: null },
      });
    });
  });

  describe('findById', () => {
    it('should return company by id', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockCompany);

      const result = await service.findById('123');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '123', deletedAt: null },
      });
      expect(result).toEqual(mockCompany);
    });

    it('should return null if company not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a company', async () => {
      const input: UpdateCompanyInput = { name: 'Acme Inc' };
      const updated = { ...mockCompany, ...input };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockCompany);
      jest.spyOn(repository, 'save').mockResolvedValue(updated);

      const result = await service.update('123', input);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '123' },
      });
      expect(repository.save).toHaveBeenCalledWith(expect.objectContaining(input));
      expect(result.name).toBe('Acme Inc');
    });
  });

  describe('delete', () => {
    it('should soft delete a company', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockCompany);
      jest.spyOn(repository, 'save').mockResolvedValue({
        ...mockCompany,
        deletedAt: new Date(),
      });

      await service.delete('123');

      expect(repository.save).toHaveBeenCalled();
      const savedEntity = (repository.save as jest.Mock).mock.calls[0][0];
      expect(savedEntity.deletedAt).toBeDefined();
    });
  });
});
```

### GraphQL Resolver Tests

**Example:** `packages/twenty-server/src/modules/company/company.resolver.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CompanyResolver } from './company.resolver';
import { CompanyService } from './company.service';

describe('CompanyResolver', () => {
  let resolver: CompanyResolver;
  let service: CompanyService;

  const mockCompany = {
    id: '123',
    name: 'Acme',
    revenue: 5000000,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyResolver,
        {
          provide: CompanyService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockCompany),
            findAll: jest.fn().mockResolvedValue([mockCompany]),
            findById: jest.fn().mockResolvedValue(mockCompany),
            update: jest.fn().mockResolvedValue(mockCompany),
            delete: jest.fn().mockResolvedValue(mockCompany),
          },
        },
      ],
    }).compile();

    resolver = module.get<CompanyResolver>(CompanyResolver);
    service = module.get<CompanyService>(CompanyService);
  });

  describe('company', () => {
    it('should query a single company', async () => {
      const result = await resolver.company('123');

      expect(service.findById).toHaveBeenCalledWith('123');
      expect(result).toEqual(mockCompany);
    });

    it('should throw error if company not found', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(null);

      await expect(resolver.company('nonexistent')).rejects.toThrow(
        'Company not found'
      );
    });
  });

  describe('companies', () => {
    it('should query all companies with filter', async () => {
      const filter = { revenue: { gte: 1000000 } };

      const result = await resolver.companies(filter);

      expect(service.findAll).toHaveBeenCalledWith(filter);
      expect(result).toEqual([mockCompany]);
    });
  });

  describe('createCompany', () => {
    it('should create a new company', async () => {
      const input = { name: 'Acme', revenue: 5000000 };

      const result = await resolver.createCompany(input);

      expect(service.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockCompany);
    });
  });

  describe('updateCompany', () => {
    it('should update a company', async () => {
      const input = { name: 'Acme Inc' };

      const result = await resolver.updateCompany('123', input);

      expect(service.update).toHaveBeenCalledWith('123', input);
      expect(result).toEqual(mockCompany);
    });
  });

  describe('deleteCompany', () => {
    it('should delete a company', async () => {
      await resolver.deleteCompany('123');

      expect(service.delete).toHaveBeenCalledWith('123');
    });
  });
});
```

### Integration Tests

**Example:** `packages/twenty-server/__tests__/integration/company.integration.spec.ts`

```typescript
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppModule } from 'src/app.module';
import { CompanyEntity } from 'src/modules/company/entities/company.entity';

describe('Company Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clear database before each test
    await dataSource.query('DELETE FROM "company"');
  });

  describe('POST /graphql - createCompany', () => {
    it('should create a company and return it', async () => {
      const query = `
        mutation CreateCompany($input: CreateCompanyInput!) {
          createCompany(input: $input) {
            id
            name
            revenue
          }
        }
      `;

      const variables = {
        input: {
          name: 'Test Company',
          revenue: 1000000,
        },
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .expect(200);

      expect(response.body.data.createCompany).toBeDefined();
      expect(response.body.data.createCompany.name).toBe('Test Company');
    });
  });

  describe('Query - companies', () => {
    it('should return paginated list of companies', async () => {
      // Create test data
      const repo = dataSource.getRepository(CompanyEntity);
      await repo.save({
        name: 'Company 1',
        revenue: 1000000,
      });
      await repo.save({
        name: 'Company 2',
        revenue: 2000000,
      });

      const query = `
        query {
          companies(first: 10) {
            edges {
              node {
                id
                name
                revenue
              }
            }
            pageInfo {
              hasNextPage
            }
            totalCount
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body.data.companies.totalCount).toBe(2);
      expect(response.body.data.companies.edges.length).toBe(2);
    });
  });
});
```

### Database Testing

```typescript
// Fixtures for test data
export const createTestCompany = async (repo: Repository<CompanyEntity>) => {
  return repo.save({
    name: 'Test Company',
    domainName: 'test.com',
    revenue: 1000000,
  });
};

// Test transactions
describe('Database Transactions', () => {
  it('should rollback on error', async () => {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      // Perform operations
      await queryRunner.manager.save(company);
      throw new Error('Intentional error');
    } catch (error) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }

    // Verify rollback
    const saved = await queryRunner.manager.findOne(CompanyEntity, {
      where: { id: company.id },
    });
    expect(saved).toBeUndefined();
  });
});
```

---

## Frontend Testing

### Jest Configuration

**File:** `packages/twenty-front/jest.config.mjs`

```javascript
export default {
  displayName: 'twenty-front',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
  testMatch: ['**/?(*.)+(spec|test).ts?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss)$': 'jest-mock-css-modules',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json',
      isolatedModules: true,
    }],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/generated/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};
```

### Setup File

**File:** `packages/twenty-front/setupTests.ts`

```typescript
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure Testing Library
configure({ testIdAttribute: 'data-testid' });

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

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() { return []; }
} as any;

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
```

### Component Unit Tests

**Example:** `packages/twenty-front/src/modules/companies/components/CompanyForm.spec.tsx`

```typescript
import { render, screen, userEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { RecoilRoot } from 'recoil';

import { CompanyForm } from './CompanyForm';
import { UPDATE_COMPANY } from '../graphql/mutations';

const mockCompany = {
  id: '123',
  name: 'Acme',
  domainName: 'acme.com',
  revenue: 5000000,
};

const mocks = [
  {
    request: {
      query: UPDATE_COMPANY,
      variables: {
        id: '123',
        input: { name: 'Acme Inc' },
      },
    },
    result: {
      data: {
        updateCompany: {
          ...mockCompany,
          name: 'Acme Inc',
        },
      },
    },
  },
];

describe('CompanyForm', () => {
  const renderComponent = () => {
    return render(
      <RecoilRoot>
        <MockedProvider mocks={mocks}>
          <CompanyForm company={mockCompany} />
        </MockedProvider>
      </RecoilRoot>
    );
  };

  it('should render form fields with initial values', () => {
    renderComponent();

    const nameInput = screen.getByDisplayValue(mockCompany.name);
    const domainInput = screen.getByDisplayValue(mockCompany.domainName);

    expect(nameInput).toBeInTheDocument();
    expect(domainInput).toBeInTheDocument();
  });

  it('should update form field when user types', async () => {
    renderComponent();

    const nameInput = screen.getByDisplayValue(mockCompany.name) as HTMLInputElement;

    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'New Name');

    expect(nameInput.value).toBe('New Name');
  });

  it('should submit form with updated values', async () => {
    renderComponent();

    const nameInput = screen.getByDisplayValue(mockCompany.name);
    const submitButton = screen.getByRole('button', { name: /save/i });

    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Acme Inc');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Acme Inc')).toBeInTheDocument();
    });
  });

  it('should display validation errors', async () => {
    renderComponent();

    const nameInput = screen.getByDisplayValue(mockCompany.name);
    const submitButton = screen.getByRole('button', { name: /save/i });

    await userEvent.clear(nameInput);
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  it('should disable submit button during submission', async () => {
    renderComponent();

    const submitButton = screen.getByRole('button', { name: /save/i });

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });
});
```

### Hook Tests

**Example:** `packages/twenty-front/src/modules/companies/hooks/useCompany.spec.ts`

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { RecoilRoot } from 'recoil';
import { ReactNode } from 'react';

import { useCompany } from './useCompany';
import { GET_COMPANY } from '../graphql/queries';

const mockCompany = {
  id: '123',
  name: 'Acme',
  revenue: 5000000,
};

const mocks = [
  {
    request: {
      query: GET_COMPANY,
      variables: { id: '123' },
    },
    result: {
      data: { company: mockCompany },
    },
  },
];

describe('useCompany', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <RecoilRoot>
      <MockedProvider mocks={mocks}>
        {children}
      </MockedProvider>
    </RecoilRoot>
  );

  it('should fetch company data', async () => {
    const { result } = renderHook(() => useCompany('123'), { wrapper });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.company).toEqual(mockCompany);
  });

  it('should handle error', async () => {
    const errorMocks = [
      {
        request: {
          query: GET_COMPANY,
          variables: { id: 'nonexistent' },
        },
        error: new Error('Company not found'),
      },
    ];

    const { result } = renderHook(() => useCompany('nonexistent'), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <RecoilRoot>
          <MockedProvider mocks={errorMocks}>
            {children}
          </MockedProvider>
        </RecoilRoot>
      ),
    });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });
});
```

### Mock Service Worker (MSW)

**File:** `packages/twenty-front/src/mocks/handlers.ts`

```typescript
import { graphql, rest } from 'msw';

export const handlers = [
  // GraphQL Handler
  graphql.query('GetCompany', (req, res, ctx) => {
    return res(
      ctx.data({
        company: {
          id: '123',
          name: 'Acme',
          revenue: 5000000,
        },
      })
    );
  }),

  graphql.mutation('CreateCompany', (req, res, ctx) => {
    const { input } = req.variables;

    return res(
      ctx.data({
        createCompany: {
          id: Math.random().toString(),
          ...input,
        },
      })
    );
  }),

  // REST Handler
  rest.get('/api/v1/companies/:id', (req, res, ctx) => {
    return res(
      ctx.json({
        id: req.params.id,
        name: 'Acme',
        revenue: 5000000,
      })
    );
  }),

  rest.post('/api/v1/companies', (req, res, ctx) => {
    return res(
      ctx.json({
        id: Math.random().toString(),
        ...req.body,
      })
    );
  }),
];
```

**File:** `packages/twenty-front/src/mocks/server.ts`

```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

**File:** `packages/twenty-front/setupTests.ts` (add to existing)

```typescript
import { server } from './src/mocks/server';

// Start MSW before tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after tests
afterAll(() => server.close());
```

### State (Recoil) Tests

**Example:** `packages/twenty-front/src/modules/companies/states/companiesState.spec.ts`

```typescript
import { renderHook, act } from '@testing-library/react';
import { RecoilRoot, useRecoilState } from 'recoil';
import { ReactNode } from 'react';

import { companiesState } from './companiesState';

describe('companiesState', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <RecoilRoot>{children}</RecoilRoot>
  );

  it('should initialize with default value', () => {
    const { result } = renderHook(() => useRecoilState(companiesState), {
      wrapper,
    });

    expect(result.current[0]).toEqual([]);
  });

  it('should update state', () => {
    const { result } = renderHook(() => useRecoilState(companiesState), {
      wrapper,
    });

    const newCompanies = [
      { id: '1', name: 'Acme' },
      { id: '2', name: 'TechCorp' },
    ];

    act(() => {
      result.current[1](newCompanies);
    });

    expect(result.current[0]).toEqual(newCompanies);
  });

  it('should work with selectors', () => {
    const { result: stateResult } = renderHook(
      () => useRecoilState(companiesState),
      { wrapper }
    );

    const companies = [
      { id: '1', name: 'Acme', revenue: 5000000 },
      { id: '2', name: 'TechCorp', revenue: 8000000 },
    ];

    act(() => {
      stateResult.current[1](companies);
    });

    expect(stateResult.current[0]).toHaveLength(2);
  });
});
```

---

## End-to-End Testing (Playwright)

### Configuration

**File:** `packages/twenty-e2e-testing/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'yarn dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

### Example E2E Tests

**File:** `packages/twenty-e2e-testing/tests/companies/create-company.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Company Creation', () => {
  test('should create a new company', async ({ page }) => {
    // Navigate to companies page
    await page.goto('/companies');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Click create button
    const createButton = page.getByRole('button', { name: /new company/i });
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Fill form
    const form = page.locator('form');
    const nameInput = form.locator('input[name="name"]');
    const domainInput = form.locator('input[name="domainName"]');

    await nameInput.fill('Test Company');
    await domainInput.fill('testcompany.com');

    // Submit form
    const submitButton = form.locator('button[type="submit"]');
    await submitButton.click();

    // Verify creation
    await expect(
      page.getByText('Test Company')
    ).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/companies');
    await page.waitForLoadState('networkidle');

    const createButton = page.getByRole('button', { name: /new company/i });
    await createButton.click();

    const form = page.locator('form');
    const submitButton = form.locator('button[type="submit"]');

    // Try to submit empty form
    await submitButton.click();

    // Verify error messages
    await expect(
      page.getByText('Name is required')
    ).toBeVisible();
  });
});

test.describe('Company Filtering', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
  });

  test('should filter companies by revenue', async ({ page }) => {
    await page.goto('/companies');
    await page.waitForLoadState('networkidle');

    // Open filter panel
    const filterButton = page.getByRole('button', { name: /filter/i });
    await filterButton.click();

    // Set filter
    const revenueInput = page.locator('input[name="revenue_min"]');
    await revenueInput.fill('1000000');

    // Apply filter
    const applyButton = page.getByRole('button', { name: /apply/i });
    await applyButton.click();

    // Verify results
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });
});
```

**File:** `packages/twenty-e2e-testing/tests/auth/login.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill login form
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="password"]', 'password123');

    // Submit
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard
    await page.waitForURL('/dashboard');
    expect(page.url()).toContain('/dashboard');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    // Verify error message
    await expect(
      page.getByText('Invalid email or password')
    ).toBeVisible();
  });

  test('should logout successfully', async ({ page, context }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Open user menu
    const userMenu = page.locator('[data-testid="user-menu"]');
    await userMenu.click();

    // Click logout
    const logoutButton = page.getByRole('button', { name: /logout/i });
    await logoutButton.click();

    // Verify redirect to login
    await page.waitForURL('/login');
    expect(page.url()).toContain('/login');

    // Verify auth token cleared
    const cookies = await context.cookies();
    const authCookie = cookies.find(c => c.name === 'authToken');
    expect(authCookie).toBeUndefined();
  });
});
```

---

## Running Tests

### Backend Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run specific test file
yarn test company.service.spec.ts

# Run tests with coverage
yarn test:coverage

# Run integration tests only
yarn test:integration

# Run tests matching pattern
yarn test --testNamePattern="create"
```

### Frontend Tests

```bash
# Run all tests
cd packages/twenty-front
yarn test

# Run in watch mode
yarn test:watch

# Run specific component
yarn test CompanyForm.spec.tsx

# Run with coverage
yarn test:coverage

# Update snapshots
yarn test --updateSnapshot
```

### E2E Tests

```bash
# Run all E2E tests
cd packages/twenty-e2e-testing
yarn test

# Run specific test file
yarn test tests/companies/create-company.spec.ts

# Run in headed mode (see browser)
yarn test --headed

# Run in specific browser
yarn test --project=firefox

# Debug mode
yarn test --debug

# Generate report
yarn test
yarn show-report
```

---

## Test Fixtures & Test Data

### Backend Fixtures

**File:** `packages/twenty-server/__tests__/fixtures/company.fixture.ts`

```typescript
import { Repository } from 'typeorm';
import { CompanyEntity } from 'src/modules/company/entities/company.entity';

export class CompanyFixture {
  constructor(private repo: Repository<CompanyEntity>) {}

  async createOne(overrides?: Partial<CompanyEntity>): Promise<CompanyEntity> {
    return this.repo.save({
      name: 'Test Company',
      domainName: 'test.com',
      revenue: 1000000,
      ...overrides,
    });
  }

  async createMany(
    count: number,
    overrides?: Partial<CompanyEntity>
  ): Promise<CompanyEntity[]> {
    const companies: CompanyEntity[] = [];
    for (let i = 0; i < count; i++) {
      companies.push(
        await this.createOne({
          name: `Company ${i}`,
          ...overrides,
        })
      );
    }
    return companies;
  }

  async clean(): Promise<void> {
    await this.repo.delete({});
  }
}
```

### Frontend Fixtures

**File:** `packages/twenty-front/src/__tests__/fixtures/companies.fixture.ts`

```typescript
export const mockCompany = {
  id: '123',
  name: 'Acme',
  domainName: 'acme.com',
  revenue: 5000000,
  employees: 150,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

export const mockCompanies = [
  mockCompany,
  {
    id: '456',
    name: 'TechCorp',
    domainName: 'techcorp.com',
    revenue: 8000000,
    employees: 300,
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
  },
];
```

---

## Coverage Goals

### Backend Coverage Targets
- **Branches:** 60%+
- **Functions:** 60%+
- **Lines:** 60%+
- **Statements:** 60%+

### Frontend Coverage Targets
- **Branches:** 50%+
- **Functions:** 50%+
- **Lines:** 50%+
- **Statements:** 50%+

### Coverage Report

```bash
# Generate coverage report
yarn test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

---

## Best Practices

### 1. Test Organization
```
✓ One test file per module
✓ Group tests by functionality (describe blocks)
✓ Use meaningful test names
✓ Keep tests DRY with beforeEach/afterEach
```

### 2. Naming Convention
```typescript
describe('ComponentName', () => {
  describe('specific functionality', () => {
    it('should [expected behavior] when [condition]', () => {
      // Test
    });
  });
});
```

### 3. Test Structure (AAA Pattern)
```typescript
it('should create a company', () => {
  // Arrange
  const input = { name: 'Acme' };

  // Act
  const result = service.create(input);

  // Assert
  expect(result.name).toBe('Acme');
});
```

### 4. Mocking Strategy
```typescript
// ✓ Mock external dependencies
jest.mock('external-service');

// ✓ Mock HTTP requests (MSW)
server.use(graphql.query(...));

// ✗ Don't mock internal modules
// ✗ Don't test implementation details
```

### 5. Async Testing
```typescript
// ✓ Use async/await
it('should fetch data', async () => {
  const result = await service.fetch();
  expect(result).toBeDefined();
});

// ✓ Use waitFor for async state updates
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

### 6. Test Isolation
```typescript
// ✓ Clean up after tests
afterEach(() => {
  jest.clearAllMocks();
  server.resetHandlers();
});

// ✓ Use fresh instances
beforeEach(() => {
  // Create new instances
});
```

### 7. Avoid Common Pitfalls
```typescript
// ✗ Don't test implementation
// ✗ Don't test framework behavior
// ✗ Don't create massive test files
// ✗ Don't skip flaky tests (fix them)
// ✓ Test user interactions
// ✓ Test error scenarios
// ✓ Test edge cases
```

---

## Continuous Integration (CI)

### GitHub Actions Workflow

**File:** `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: twenty_test
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: yarn install

      - name: Run backend tests
        run: yarn test packages/twenty-server
        env:
          TEST_DATABASE_URL: postgresql://postgres:password@localhost:5432/twenty_test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: yarn install

      - name: Run frontend tests
        run: yarn test packages/twenty-front

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: yarn install

      - name: Run E2E tests
        run: yarn test packages/twenty-e2e-testing
```

---

## Debugging Tests

### Debug Single Test
```bash
node --inspect-brk node_modules/.bin/jest --runInBand test.spec.ts
```

### Verbose Output
```bash
yarn test --verbose --no-coverage
```

### Keep Playwright Browser Open
```bash
yarn test --headed --debug
```

### Log Apollo Requests
```typescript
const client = new ApolloClient({
  link: new ApolloLink((operation, forward) => {
    console.log('GraphQL Operation:', operation);
    return forward(operation).map(response => {
      console.log('GraphQL Response:', response);
      return response;
    });
  }),
});
```

---

## Testing Checklist

- [ ] All functions have at least one test
- [ ] Error scenarios tested
- [ ] Edge cases covered
- [ ] Mock external dependencies
- [ ] Use fixtures for test data
- [ ] Test names are descriptive
- [ ] Tests follow AAA pattern
- [ ] No test interdependencies
- [ ] Database cleaned between tests
- [ ] Coverage thresholds met
- [ ] CI/CD tests passing
- [ ] E2E critical paths tested

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Mock Service Worker](https://mswjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## Troubleshooting

### Test Timeout
```typescript
// Increase timeout for specific test
it('should load data', async () => {
  // test
}, 10000); // 10 second timeout

// Or in jest.config
jest.setTimeout(30000);
```

### Flaky Tests
- Avoid hardcoded waits (`sleep`)
- Use `waitFor` instead
- Mock time if needed
- Ensure proper async handling

### Memory Leaks
```typescript
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});
```

### Database Connection Issues
```typescript
// Ensure test database is running
// Check connection string in .env.test
// Verify migrations ran
yarn database:migrate:test
```

---

**Last Updated:** December 20, 2025
**Version:** 1.0
**Status:** Complete
