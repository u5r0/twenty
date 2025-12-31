# Backend Testing

Comprehensive guide to testing NestJS backend code in Twenty.

## Testing Tools

- **Jest** - Test runner and assertion library
- **Supertest** - HTTP assertion library
- **@nestjs/testing** - NestJS testing utilities
- **TypeORM** - Database testing utilities

## Unit Testing

### Service Tests

```typescript
// company.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyService } from './company.service';
import { Company } from './entities/company.entity';
import { NotFoundException } from '@nestjs/common';

describe('CompanyService', () => {
  let service: CompanyService;
  let repository: Repository<Company>;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        {
          provide: getRepositoryToken(Company),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
    repository = module.get<Repository<Company>>(getRepositoryToken(Company));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
eturn an array of companies', async () => {
      const companies = [
        { id: '1', name: 'Acme Corp', workspaceId: 'ws-1' },
        { id: '2', name: 'Tech Inc', workspaceId: 'ws-1' },
      ];

      mockRepository.find.mockResolvedValue(companies);

      const result = await service.findAll('ws-1');

      expect(result).toEqual(companies);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-1', deletedAt: null },
        order: { name: 'ASC' },
      });
    });

    it('should return empty array when no companies', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll('ws-1');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a company', async () => {
      const company = { id: '1', name: 'Acme Corp', workspaceId: 'ws-1' };

      mockRepository.findOne.mockResolvedValue(company);

      const result = await service.findOne('1', 'ws-1');

      expect(result).toEqual(company);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', workspaceId: 'ws-1', deletedAt: null },
      });
    });

    it('should throw NotFoundException when company not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999', 'ws-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a company', async () => {
      const createDto = { name: 'New Company', industry: 'Technology' };
      const createdCompany = { id: '1', ...createDto, workspaceId: 'ws-1' };

      mockRepository.create.mockReturnValue(createdCompany);
      mockRepository.save.mockResolvedValue(createdCompany);

      const result = await service.create(createDto, 'ws-1');

      expect(result).toEqual(createdCompany);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        workspaceId: 'ws-1',
      });
      expect(mockRepository.save).toHaveBeenCalledWith(createdCompany);
    });

    it('should handle validation errors', async () => {
      const createDto = { name: '', industry: 'Technology' };

      mockRepository.create.mockReturnValue(createDto);
      mockRepository.save.mockRejectedValue(
        new Error('Validation failed'),
      );

      await expect(service.create(createDto, 'ws-1')).rejects.toThrow(
        'Validation failed',
      );
    });
  });

  describe('update', () => {
    it('should update a company', async () => {
      const updateDto = { name: 'Updated Name' };
      const updatedCompany = { id: '1', ...updateDto, workspaceId: 'ws-1' };

      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue(updatedCompany);

      const result = await service.update('1', updateDto, 'ws-1');

      expect(result).toEqual(updatedCompany);
      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: '1', workspaceId: 'ws-1' },
        updateDto,
      );
    });

    it('should throw NotFoundException when company not found', async () => {
      mockRepository.update.mockResolvedValue({ affected: 0 });

      await expect(
        service.update('999', { name: 'Updated' }, 'ws-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should soft delete a company', async () => {
      mockRepository.softDelete.mockResolvedValue({ affected: 1 });

      const result = await service.delete('1', 'ws-1');

      expect(result).toBe(true);
      expect(mockRepository.softDelete).toHaveBeenCalledWith({
        id: '1',
        workspaceId: 'ws-1',
      });
    });

    it('should return false when company not found', async () => {
      mockRepository.softDelete.mockResolvedValue({ affected: 0 });

      const result = await service.delete('999', 'ws-1');

      expect(result).toBe(false);
    });
  });

  describe('findByIndustry', () => {
    it('should return companies by industry', async () => {
      const companies = [
        { id: '1', name: 'Acme Corp', industry: 'Technology' },
        { id: '2', name: 'Tech Inc', industry: 'Technology' },
      ];

      mockRepository.find.mockResolvedValue(companies);

      const result = await service.findByIndustry('Technology', 'ws-1');

      expect(result).toEqual(companies);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          industry: 'Technology',
          workspaceId: 'ws-1',
          deletedAt: null,
        },
      });
    });
  });
});
```

### Resolver Tests

```typescript
// company.resolver.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CompanyResolver } from './company.resolver';
import { CompanyService } from './company.service';

describe('CompanyResolver', () => {
  let resolver: CompanyResolver;
  let service: CompanyService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockWorkspace = {
    id: 'ws-1',
    name: 'Test Workspace',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyResolver,
        {
          provide: CompanyService,
          useValue: mockService,
        },
      ],
    }).compile();

    resolver = module.get<CompanyResolver>(CompanyResolver);
    service = module.get<CompanyService>(CompanyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('companies', () => {
    it('should return an array of companies', async () => {
      const companies = [
        { id: '1', name: 'Acme Corp' },
        { id: '2', name: 'Tech Inc' },
      ];

      mockService.findAll.mockResolvedValue(companies);

      const result = await resolver.companies(null, mockWorkspace);

      expect(result).toEqual(companies);
      expect(mockService.findAll).toHaveBeenCalledWith('ws-1', null);
    });

    it('should pass filters to service', async () => {
      const filter = { industry: 'Technology' };

      mockService.findAll.mockResolvedValue([]);

      await resolver.companies(filter, mockWorkspace);

      expect(mockService.findAll).toHaveBeenCalledWith('ws-1', filter);
    });
  });

  describe('company', () => {
    it('should return a single company', async () => {
      const company = { id: '1', name: 'Acme Corp' };

      mockService.findOne.mockResolvedValue(company);

      const result = await resolver.company('1', mockWorkspace);

      expect(result).toEqual(company);
      expect(mockService.findOne).toHaveBeenCalledWith('1', 'ws-1');
    });
  });

  describe('createCompany', () => {
    it('should create a company', async () => {
      const createDto = { name: 'New Company', industry: 'Technology' };
      const createdCompany = { id: '1', ...createDto };

      mockService.create.mockResolvedValue(createdCompany);

      const result = await resolver.createCompany(createDto, mockWorkspace);

      expect(result).toEqual(createdCompany);
      expect(mockService.create).toHaveBeenCalledWith(createDto, 'ws-1');
    });
  });

  describe('updateCompany', () => {
    it('should update a company', async () => {
      const updateDto = { name: 'Updated Name' };
      const updatedCompany = { id: '1', ...updateDto };

      mockService.update.mockResolvedValue(updatedCompany);

      const result = await resolver.updateCompany('1', updateDto, mockWorkspace);

      expect(result).toEqual(updatedCompany);
      expect(mockService.update).toHaveBeenCalledWith('1', updateDto, 'ws-1');
    });
  });

  describe('deleteCompany', () => {
    it('should delete a company', async () => {
      mockService.delete.mockResolvedValue(true);

      const result = await resolver.deleteCompany('1', mockWorkspace);

      expect(result).toBe(true);
      expect(mockService.delete).toHaveBeenCalledWith('1', 'ws-1');
    });
  });
});
```

### Controller Tests

```typescript
// company.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';

describe('CompanyController', () => {
  let controller: CompanyController;
  let service: CompanyService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockWorkspace = {
    id: 'ws-1',
    name: 'Test Workspace',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyController],
      providers: [
        {
          provide: CompanyService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<CompanyController>(CompanyController);
    service = module.get<CompanyService>(CompanyService);
  });

  describe('findAll', () => {
    it('should return an array of companies', async () => {
      const companies = [{ id: '1', name: 'Acme Corp' }];

      mockService.findAll.mockResolvedValue(companies);

      const result = await controller.findAll(mockWorkspace);

      expect(result).toEqual(companies);
    });
  });

  describe('findOne', () => {
    it('should return a single company', async () => {
      const company = { id: '1', name: 'Acme Corp' };

      mockService.findOne.mockResolvedValue(company);

      const result = await controller.findOne('1', mockWorkspace);

      expect(result).toEqual(company);
    });
  });

  describe('create', () => {
    it('should create a company', async () => {
      const createDto = { name: 'New Company' };
      const createdCompany = { id: '1', ...createDto };

      mockService.create.mockResolvedValue(createdCompany);

      const result = await controller.create(createDto, mockWorkspace);

      expect(result).toEqual(createdCompany);
    });
  });
});
```

## Integration Testing

### E2E Tests with Supertest

```typescript
// company.e2e.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

describe('Company E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let workspaceId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password',
      });

    authToken = loginResponse.body.accessToken;
    workspaceId = loginResponse.body.user.workspaceId;
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await dataSource.query('DELETE FROM companies');
  });

  describe('GET /companies', () => {
    it('should return companies', async () => {
      // Create test data
      await dataSource.query(
        `INSERT INTO companies (id, name, workspace_id) VALUES ('1', 'Acme Corp', '${workspaceId}')`,
      );

      const response = await request(app.getHttpServer())
        .get('/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Acme Corp');
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .get('/companies')
        .expect(401);
    });

    it('should filter companies by industry', async () => {
      await dataSource.query(
        `INSERT INTO companies (id, name, industry, workspace_id)
         VALUES
         ('1', 'Acme Corp', 'Technology', '${workspaceId}'),
         ('2', 'Finance Co', 'Finance', '${workspaceId}')`,
      );

      const response = await request(app.getHttpServer())
        .get('/companies?industry=Technology')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Acme Corp');
    });
  });

  describe('POST /companies', () => {
    it('should create a company', async () => {
      const createDto = {
        name: 'Test Company',
        industry: 'Technology',
        employees: 100,
      };

      const response = await request(app.getHttpServer())
        .post('/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body.name).toBe(createDto.name);
      expect(response.body.id).toBeDefined();

      // Verify in database
      const companies = await dataSource.query(
        `SELECT * FROM companies WHERE id = '${response.body.id}'`,
      );
      expect(companies).toHaveLength(1);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });

    it('should validate field types', async () => {
      await request(app.getHttpServer())
        .post('/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Company',
          employees: 'invalid', // Should be number
        })
        .expect(400);
    });
  });

  describe('PUT /companies/:id', () => {
    it('should update a company', async () => {
      // Create test company
      const [company] = await dataSource.query(
        `INSERT INTO companies (id, name, workspace_id)
         VALUES ('1', 'Acme Corp', '${workspaceId}')
         RETURNING *`,
      );

      const updateDto = { name: 'Updated Name' };

      const response = await request(app.getHttpServer())
        .put(`/companies/${company.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe(updateDto.name);
    });

    it('should return 404 for non-existent company', async () => {
      await request(app.getHttpServer())
        .put('/companies/999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' })
        .expect(404);
    });
  });

  describe('DELETE /companies/:id', () => {
    it('should delete a company', async () => {
      // Create test company
      const [company] = await dataSource.query(
        `INSERT INTO companies (id, name, workspace_id)
         VALUES ('1', 'Acme Corp', '${workspaceId}')
         RETURNING *`,
      );

      await request(app.getHttpServer())
        .delete(`/companies/${company.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify soft delete
      const [deletedCompany] = await dataSource.query(
        `SELECT * FROM companies WHERE id = '${company.id}'`,
      );
      expect(deletedCompany.deleted_at).not.toBeNull();
    });
  });
});
```

### GraphQL E2E Tests

```typescript
// company.graphql.e2e.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('Company GraphQL E2E Tests', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login
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

  describe('Query: companies', () => {
    it('should query companies', async () => {
      const query = `
        query {
          companies {
            edges {
              node {
                id
                name
                industry
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
      expect(response.body.data.companies.edges).toBeInstanceOf(Array);
    });

    it('should filter companies', async () => {
      const query = `
        query GetCompanies($filter: CompanyFilter) {
          companies(filter: $filter) {
            edges {
              node {
                id
                name
                industry
              }
            }
          }
        }
      `;

      const variables = {
        filter: {
          industry: { eq: 'Technology' },
        },
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query, variables })
        .expect(200);

      expect(response.body.data.companies).toBeDefined();
    });
  });

  describe('Mutation: createCompany', () => {
    it('should create company', async () => {
      const mutation = `
        mutation CreateCompany($data: CreateCompanyInput!) {
          createCompany(data: $data) {
            id
            name
            industry
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
      expect(response.body.data.createCompany.id).toBeDefined();
    });

    it('should validate input', async () => {
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
          name: '', // Invalid: empty name
        },
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: mutation, variables })
        .expect(200);

      expect(response.body.errors).toBeDefined();
    });
  });
});
```

## Database Testing

### In-Memory Database

```typescript
// test-database.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const testDatabaseConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: ':memory:',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true,
  dropSchema: true,
};
```

### Test Fixtures

```typescript
// fixtures/company.fixture.ts
import { DataSource } from 'typeorm';
import { Company } from '../entities/company.entity';

export async function createCompanyFixture(
  dataSource: DataSource,
  data: Partial<Company> = {},
): Promise<Company> {
  const repository = dataSource.getRepository(Company);

  const company = repository.create({
    name: 'Test Company',
    industry: 'Technology',
    employees: 100,
    workspaceId: 'ws-1',
    ...data,
  });

  return repository.save(company);
}

export async function createCompaniesFixture(
  dataSource: DataSource,
  count: number = 3,
): Promise<Company[]> {
  const companies = [];

  for (let i = 0; i < count; i++) {
    companies.push(
      await createCompanyFixture(dataSource, {
        name: `Company ${i + 1}`,
      }),
    );
  }

  return companies;
}
```

## Best Practices

1. **Use dependency injection for testability**
2. **Mock external dependencies**
3. **Test business logic, not framework code**
4. **Use test fixtures for consistent data**
5. **Clean up database after each test**
6. **Test error cases and edge conditions**
7. **Keep tests fast and isolated**
8. **Use descriptive test names**
9. **Maintain high test coverage (80%+)**
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
yarn test company.service.spec.ts

# Run E2E tests
yarn test:e2e

# Run integration tests
yarn test:integration
```

## Next Steps

- [Testing Strategy](./15-testing-strategy.md)
- [Frontend Testing](./16-frontend-testing.md)
- [Backend Architecture](./11-backend-architecture.md)

---

**Related Documentation:**
- [Database & ORM](./12-database-orm.md)
- [GraphQL API](./13-graphql-api.md)
- [Code Style](./22-code-style.md)
