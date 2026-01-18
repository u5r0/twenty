# Database & ORM

Complete guide to database architecture and ORM usage in Twenty.

## Database Architecture

Twenty uses a multi-database strategy:

```
┌──────────────────────────────────────────────────┐
│           PostgreSQL (Primary)                    │
│  ┌────────────────────────────────────────────┐  │
│  │  System Database                           │  │
│  │  - Users                                   │  │
│  │  - Workspaces                              │  │
│  │  - Metadata (Object/Field definitions)     │  │
│  └────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────┐  │
│  │  Workspace Databases (per workspace)       │  │
│  │  - Companies                               │  │
│  │  - People                                  │  │
│  │  - Custom Objects                          │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│           ClickHouse (Analytics)                  │
│  - Event tracking                                 │
│  - Analytics queries                              │
│  - Historical data                                │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│           Redis (Cache & Jobs)                    │
│  - Session storage                                │
│  - Cache layer                                    │
│  - Job queue (BullMQ)                             │
└──────────────────────────────────────────────────┘
```

## PostgreSQL Schema

### System Database

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Workspaces table
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Workspace members
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(workspace_id, user_id)
);

-- Object metadata
CREATE TABLE object_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  label_singular VARCHAR(100) NOT NULL,
  label_plural VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  is_custom BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(workspace_id, name)
);

-- Field metadata
CREATE TABLE field_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  object_metadata_id UUID REFERENCES object_metadata(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  label VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  is_nullable BOOLEAN DEFAULT true,
  is_custom BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  default_value JSONB,
  options JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(object_metadata_id, name)
);
```

### Workspace Database

```sql
-- Companies table (example)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  domain_name VARCHAR(255),
  employees INTEGER,
  industry VARCHAR(100),
  address JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

-- People table (example)
CREATE TABLE people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

-- Indexes
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_deleted_at ON companies(deleted_at);
CREATE INDEX idx_people_email ON people(email);
CREATE INDEX idx_people_company_id ON people(company_id);
CREATE INDEX idx_people_deleted_at ON people(deleted_at);
```

## TypeORM

### Entity Definition

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  domainName: string;

  @Column({ type: 'int', nullable: true })
  employees: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  industry: string;

  @Column({ type: 'jsonb', nullable: true })
  address: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };

  @OneToMany(() => Person, person => person.company)
  people: Person[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;
}

@Entity('people')
export class Person {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'uuid', nullable: true })
  companyId: string;

  @ManyToOne(() => Company, company => company.people)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
```

### Repository Pattern

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';

@Injectable()
export class CompanyRepository {
  constructor(
    @InjectRepository(Company)
    private repository: Repository<Company>,
  ) {}

  // Find all
  async findAll(): Promise<Company[]> {
    return this.repository.find({
      where: { deletedAt: null },
      order: { name: 'ASC' },
    });
  }

  // Find one
  async findOne(id: string): Promise<Company | null> {
    return this.repository.findOne({
      where: { id, deletedAt: null },
    });
  }

  // Find with relations
  async findWithPeople(id: string): Promise<Company | null> {
    return this.repository.findOne({
      where: { id, deletedAt: null },
      relations: ['people'],
    });
  }

  // Create
  async create(data: Partial<Company>): Promise<Company> {
    const company = this.repository.create(data);
    return this.repository.save(company);
  }

  // Update
  async update(id: string, data: Partial<Company>): Promise<Company> {
    await this.repository.update(id, data);
    return this.findOne(id);
  }

  // Soft delete
  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  // Hard delete
  async hardDelete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  // Custom queries
  async findByIndustry(industry: string): Promise<Company[]> {
    return this.repository.find({
      where: { industry, deletedAt: null },
    });
  }

  async countByIndustry(): Promise<Record<string, number>> {
    const results = await this.repository
      .createQueryBuilder('company')
      .select('company.industry', 'industry')
      .addSelect('COUNT(*)', 'count')
      .where('company.deletedAt IS NULL')
      .groupBy('company.industry')
      .getRawMany();

    return results.reduce((acc, { industry, count }) => {
      acc[industry] = parseInt(count);
      return acc;
    }, {});
  }
}
```

### Query Builder

```typescript
// Simple query
const companies = await this.repository
  .createQueryBuilder('company')
  .where('company.industry = :industry', { industry: 'Technology' })
  .andWhere('company.employees >= :minEmployees', { minEmployees: 100 })
  .orderBy('company.name', 'ASC')
  .getMany();

// With joins
const companies = await this.repository
  .createQueryBuilder('company')
  .leftJoinAndSelect('company.people', 'people')
  .where('company.industry = :industry', { industry: 'Technology' })
  .getMany();

// With pagination
const [companies, total] = await this.repository
  .createQueryBuilder('company')
  .skip(offset)
  .take(limit)
  .getManyAndCount();

// Complex query
const companies = await this.repository
  .createQueryBuilder('company')
  .leftJoin('company.people', 'people')
  .where('company.industry = :industry', { industry: 'Technology' })
  .andWhere(
    new Brackets(qb => {
      qb.where('company.employees >= :min', { min: 100 })
        .orWhere('people.id IS NOT NULL');
    })
  )
  .groupBy('company.id')
  .having('COUNT(people.id) > :count', { count: 5 })
  .orderBy('company.name', 'ASC')
  .getMany();

// Raw query
const results = await this.repository.query(
  'SELECT * FROM companies WHERE industry = $1',
  ['Technology']
);
```

### Transactions

```typescript
import { DataSource } from 'typeorm';

@Injectable()
export class CompanyService {
  constructor(
    private dataSource: DataSource,
    private companyRepository: CompanyRepository,
    private personRepository: PersonRepository,
  ) {}

  async createCompanyWithPeople(
    companyData: Partial<Company>,
    peopleData: Partial<Person>[],
  ): Promise<Company> {
    return this.dataSource.transaction(async manager => {
      // Create company
      const company = manager.create(Company, companyData);
      await manager.save(company);

      // Create people
      const people = peopleData.map(data =>
        manager.create(Person, {
          ...data,
          companyId: company.id,
        })
      );
      await manager.save(people);

      // Return company with people
      return manager.findOne(Company, {
        where: { id: company.id },
        relations: ['people'],
      });
    });
  }
}
```

## TwentyORM (Custom ORM)

TwentyORM is a custom ORM layer built on top of TypeORM that provides workspace-aware queries and metadata-driven operations.

### Basic Usage

```typescript
import { Injectable } from '@nestjs/common';
import { TwentyORM } from '@/engine/twenty-orm';

@Injectable()
export class CompanyService {
  constructor(private twentyOrm: TwentyORM) {}

  async findAll(workspaceId: string): Promise<Company[]> {
    return this.twentyOrm
      .workspace(workspaceId)
      .findMany('company', {
        where: {},
        orderBy: { name: 'asc' },
      });
  }

  async findOne(workspaceId: string, id: string): Promise<Company> {
    return this.twentyOrm
      .workspace(workspaceId)
      .findOne('company', {
        where: { id },
      });
  }

  async create(
    workspaceId: string,
    data: Partial<Company>,
  ): Promise<Company> {
    return this.twentyOrm
      .workspace(workspaceId)
      .create('company', data);
  }

  async update(
    workspaceId: string,
    id: string,
    data: Partial<Company>,
  ): Promise<Company> {
    return this.twentyOrm
      .workspace(workspaceId)
      .update('company', {
        where: { id },
        data,
      });
  }

  async delete(workspaceId: string, id: string): Promise<void> {
    await this.twentyOrm
      .workspace(workspaceId)
      .delete('company', {
        where: { id },
      });
  }
}
```

### Advanced Queries

```typescript
// With relations
const companies = await this.twentyOrm
  .workspace(workspaceId)
  .findMany('company', {
    where: { industry: 'Technology' },
    include: {
      people: true,
    },
  });

// With filters
const companies = await this.twentyOrm
  .workspace(workspaceId)
  .findMany('company', {
    where: {
      AND: [
        { industry: { eq: 'Technology' } },
        { employees: { gte: 100 } },
      ],
    },
  });

// With pagination
const result = await this.twentyOrm
  .workspace(workspaceId)
  .findMany('company', {
    where: {},
    take: 10,
    skip: 0,
  });

// Aggregations
const stats = await this.twentyOrm
  .workspace(workspaceId)
  .aggregate('company', {
    _count: true,
    _avg: { employees: true },
    _sum: { employees: true },
    _min: { employees: true },
    _max: { employees: true },
  });
```

## Migrations

### Creating Migrations

```bash
# Generate migration from entity changes
yarn database:migration:generate src/database/migrations/AddCompanyAddress

# Create empty migration
yarn database:migration:create src/database/migrations/AddIndexes
```

### Migration File

```typescript
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddCompanyAddress1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add column
    await queryRunner.addColumn(
      'companies',
      new TableColumn({
        name: 'address',
        type: 'jsonb',
        isNullable: true,
      })
    );

    // Add index
    await queryRunner.createIndex(
      'companies',
      new TableIndex({
        name: 'idx_companies_industry',
        columnNames: ['industry'],
      })
    );

    // Create table
    await queryRunner.createTable(
      new Table({
        name: 'company_notes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'company_id',
            type: 'uuid',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['company_id'],
            referencedTableName: 'companies',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('company_notes');
    await queryRunner.dropIndex('companies', 'idx_companies_industry');
    await queryRunner.dropColumn('companies', 'address');
  }
}
```

### Running Migrations

```bash
# Run migrations
yarn database:migrate

# Revert last migration
yarn database:migrate:revert

# Show migration status
yarn database:migration:show
```

## Database Best Practices

### 1. Use Indexes

```sql
-- Single column index
CREATE INDEX idx_companies_name ON companies(name);

-- Composite index
CREATE INDEX idx_companies_industry_employees
  ON companies(industry, employees);

-- Partial index
CREATE INDEX idx_active_companies
  ON companies(name)
  WHERE deleted_at IS NULL;

-- Full-text search index
CREATE INDEX idx_companies_name_fts
  ON companies
  USING gin(to_tsvector('english', name));
```

### 2. Use Soft Deletes

```typescript
// Entity with soft delete
@Entity()
export class Company {
  @DeleteDateColumn()
  deletedAt: Date;
}

// Soft delete
await repository.softDelete(id);

// Restore
await repository.restore(id);

// Find including deleted
await repository.find({ withDeleted: true });
```

### 3. Use Transactions

```typescript
// Always use transactions for multiple operations
await dataSource.transaction(async manager => {
  await manager.save(company);
  await manager.save(people);
});
```

### 4. Optimize Queries

```typescript
// ❌ Bad - N+1 query problem
const companies = await companyRepository.find();
for (const company of companies) {
  company.people = await personRepository.find({
    where: { companyId: company.id },
  });
}

// ✅ Good - Use joins
const companies = await companyRepository.find({
  relations: ['people'],
});

// ✅ Better - Use DataLoader
const companies = await companyRepository.find();
const peopleByCompanyId = await dataLoader.loadMany(
  companies.map(c => c.id)
);
```

### 5. Use Connection Pooling

```typescript
// typeorm.config.ts
export default {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  extra: {
    max: 20, // Maximum pool size
    min: 5,  // Minimum pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
};
```

## Next Steps

- [Backend Architecture](./11-backend-architecture.md)
- [GraphQL API](./13-graphql-api.md)
- [System Architecture](./04-system-architecture.md)

---

**Related Documentation:**
- [Technology Stack](./06-technology-stack.md)
- [Deployment](./18-deployment.md)
