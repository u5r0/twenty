# Database & ORM

Complete guide to database architecture and ORM usage in Twenty.

## Database Architecture

Twenty uses a multi-database strategy with PostgreSQL as the primary database:

```
┌──────────────────────────────────────────────────┐
│           PostgreSQL (Primary)                    │
│  ┌────────────────────────────────────────────┐  │
│  │  System Database (core schema)             │  │
│  │  - Users                                   │  │
│  │  - Workspaces                              │  │
│  │  - Metadata (Object/Field definitions)     │  │
│  └────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────┐  │
│  │  Workspace Schemas (per workspace)         │  │
│  │  - Companies                               │  │
│  │  - People                                  │  │
│  │  - Custom Objects                          │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│           Redis (Cache & Jobs)                    │
│  - Session storage                                │
│  - Cache layer                                    │
│  - Job queue (BullMQ)                             │
└──────────────────────────────────────────────────┘
```

**Key Points:**
- The `core` schema contains system-level tables managed by TypeORM
- Each workspace gets its own PostgreSQL schema with dynamically generated tables
- Workspace schemas are managed by TwentyORM based on metadata definitions
- Redis is used for caching and job queuing with BullMQ

## PostgreSQL Schema

The following schemas are illustrative examples of the database structure. The actual schema is managed through TypeORM entities and migrations for the core schema, and dynamically generated through metadata for workspace schemas.

### System Database (Core Schema)

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

Workspace-specific tables are dynamically generated based on object metadata. Here's an illustrative example of what workspace tables might look like:

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

Twenty uses TypeORM as the underlying ORM for the core database (system tables like users, workspaces, metadata). However, for workspace-specific data, Twenty uses its custom TwentyORM layer (see below).

TypeORM is primarily used for:
- Core system entities (users, workspaces, object/field metadata)
- Database migrations
- Core schema management

The TypeORM configuration is located in `packages/twenty-server/src/database/typeorm/core/core.datasource.ts`.

### Entity Definition

Twenty uses a custom entity system with `@WorkspaceEntity` decorators rather than standard TypeORM entities. Here's an example from the actual codebase:

```typescript
import { msg } from '@lingui/core/macro';
import { STANDARD_OBJECT_IDS } from 'twenty-shared/metadata';
import { FieldMetadataType, RelationOnDeleteAction } from 'twenty-shared/types';

import { RelationType } from 'src/engine/metadata-modules/field-metadata/interfaces/relation-type.interface';
import { Relation } from 'src/engine/workspace-manager/workspace-sync-metadata/interfaces/relation.interface';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { WorkspaceEntity } from 'src/engine/twenty-orm/decorators/workspace-entity.decorator';
import { WorkspaceField } from 'src/engine/twenty-orm/decorators/workspace-field.decorator';
import { WorkspaceIsNullable } from 'src/engine/twenty-orm/decorators/workspace-is-nullable.decorator';
import { WorkspaceRelation } from 'src/engine/twenty-orm/decorators/workspace-relation.decorator';
import { WorkspaceJoinColumn } from 'src/engine/twenty-orm/decorators/workspace-join-column.decorator';

@WorkspaceEntity({
  standardId: STANDARD_OBJECT_IDS.company,
  namePlural: 'companies',
  labelSingular: msg`Company`,
  labelPlural: msg`Companies`,
  description: msg`A company`,
  icon: 'IconBuildingSkyscraper',
})
export class CompanyWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({
    standardId: COMPANY_STANDARD_FIELD_IDS.name,
    type: FieldMetadataType.TEXT,
    label: msg`Name`,
    description: msg`The company name`,
    icon: 'IconBuildingSkyscraper',
  })
  @WorkspaceIsNullable()
  name: string | null;

  @WorkspaceField({
    standardId: COMPANY_STANDARD_FIELD_IDS.employees,
    type: FieldMetadataType.NUMBER,
    label: msg`Employees`,
    description: msg`Number of employees in the company`,
    icon: 'IconUsers',
  })
  @WorkspaceIsNullable()
  employees: number | null;

  @WorkspaceRelation({
    standardId: COMPANY_STANDARD_FIELD_IDS.people,
    type: RelationType.ONE_TO_MANY,
    label: msg`People`,
    description: msg`People linked to the company.`,
    icon: 'IconUsers',
    inverseSideTarget: () => PersonWorkspaceEntity,
    onDelete: RelationOnDeleteAction.SET_NULL,
  })
  @WorkspaceIsNullable()
  people: Relation<PersonWorkspaceEntity[]>;
}
```

**Note:** Twenty uses workspace entities that extend `BaseWorkspaceEntity` and use custom decorators like `@WorkspaceField` and `@WorkspaceRelation` instead of standard TypeORM decorators. The base entity automatically includes `id`, `createdAt`, `updatedAt`, and `deletedAt` fields.

### Repository Pattern

Twenty uses `WorkspaceRepository` from TwentyORM, which provides workspace-aware queries. Repositories are accessed through the `InjectWorkspaceRepository` decorator:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectWorkspaceRepository } from 'src/engine/twenty-orm/decorators/inject-workspace-repository.decorator';
import { WorkspaceRepository } from 'src/engine/twenty-orm/repository/workspace.repository';

@Injectable()
export class CompanyService {
  constructor(
    @InjectWorkspaceRepository(CompanyWorkspaceEntity)
    private readonly companyRepository: WorkspaceRepository<CompanyWorkspaceEntity>,
  ) {}

  // Find all
  async findAll(): Promise<CompanyWorkspaceEntity[]> {
    return this.companyRepository.find({});
  }

  // Find one
  async findOne(id: string): Promise<CompanyWorkspaceEntity | null> {
    return this.companyRepository.findOne({ where: { id } });
  }

  // Find with relations
  async findWithPeople(id: string): Promise<CompanyWorkspaceEntity | null> {
    return this.companyRepository.findOne({
      where: { id },
      relations: { people: true },
    });
  }

  // Create
  async create(data: Partial<CompanyWorkspaceEntity>): Promise<CompanyWorkspaceEntity> {
    return this.companyRepository.save(data);
  }

  // Update
  async update(id: string, data: Partial<CompanyWorkspaceEntity>): Promise<CompanyWorkspaceEntity> {
    await this.companyRepository.update({ id }, data);
    return this.findOne(id);
  }

  // Delete (soft delete is automatic)
  async delete(id: string): Promise<void> {
    await this.companyRepository.delete({ id });
  }
}
```

**Note:** TwentyORM repositories are workspace-scoped and automatically handle soft deletes. The repository interface is similar to TypeORM but adapted for Twenty's multi-tenant architecture.

### Query Builder

TwentyORM provides workspace-aware query builders through the repository:

```typescript
// Simple query with filters
const companies = await this.companyRepository.find({
  where: {
    employees: { gte: 100 },
  },
  order: { name: 'ASC' },
});

// With relations
const companies = await this.companyRepository.find({
  where: { id },
  relations: { people: true },
});

// With pagination
const companies = await this.companyRepository.find({
  skip: offset,
  take: limit,
});

// Complex queries using select query builder
const queryBuilder = this.companyRepository.createQueryBuilder('company');
const companies = await queryBuilder
  .where('company.employees >= :min', { min: 100 })
  .orderBy('company.name', 'ASC')
  .getMany();
```

**Note:** TwentyORM's query interface is similar to TypeORM but includes workspace isolation and metadata-driven field resolution. For complex queries, you can still access the underlying TypeORM query builder through the repository.

### Transactions

TwentyORM supports transactions through the workspace data source:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectWorkspaceRepository } from 'src/engine/twenty-orm/decorators/inject-workspace-repository.decorator';
import { WorkspaceRepository } from 'src/engine/twenty-orm/repository/workspace.repository';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';

@Injectable()
export class CompanyService {
  constructor(
    @InjectWorkspaceRepository(CompanyWorkspaceEntity)
    private readonly companyRepository: WorkspaceRepository<CompanyWorkspaceEntity>,
    @InjectWorkspaceRepository(PersonWorkspaceEntity)
    private readonly personRepository: WorkspaceRepository<PersonWorkspaceEntity>,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async createCompanyWithPeople(
    workspaceId: string,
    companyData: Partial<CompanyWorkspaceEntity>,
    peopleData: Partial<PersonWorkspaceEntity>[],
  ): Promise<CompanyWorkspaceEntity> {
    const dataSource = await this.globalWorkspaceOrmManager.getDataSourceForWorkspace(workspaceId);

    return dataSource.transaction(async (manager) => {
      // Create company
      const company = await this.companyRepository.save(companyData);

      // Create people linked to company
      const people = await Promise.all(
        peopleData.map(data =>
          this.personRepository.save({
            ...data,
            companyId: company.id,
          })
        )
      );

      return company;
    });
  }
}
```

**Note:** Transactions in TwentyORM are workspace-scoped and use the `GlobalWorkspaceOrmManager` to access the correct workspace data source.

## TwentyORM (Custom ORM)

TwentyORM is a custom ORM layer built on top of TypeORM that provides workspace-aware queries and metadata-driven operations. It's located in `packages/twenty-server/src/engine/twenty-orm/`.

### Key Features

- **Workspace Isolation**: Automatically scopes queries to the correct workspace database
- **Metadata-Driven**: Uses object and field metadata to generate schemas dynamically
- **Custom Decorators**: Provides `@WorkspaceEntity`, `@WorkspaceField`, `@WorkspaceRelation` decorators
- **Repository Pattern**: Extends TypeORM repositories with workspace awareness
- **Entity Manager**: `WorkspaceEntityManager` for workspace-scoped operations

### Architecture

```
twenty-orm/
├── decorators/           # Custom decorators for workspace entities
├── entity-manager/       # Workspace-aware entity manager
├── repository/           # Workspace repository implementation
├── global-workspace-datasource/  # Manages workspace data sources
├── factories/            # Entity schema factories
└── base.workspace-entity.ts  # Base class for all workspace entities
```

### Usage with Repositories

The primary way to interact with TwentyORM is through workspace repositories:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectWorkspaceRepository } from 'src/engine/twenty-orm/decorators/inject-workspace-repository.decorator';
import { WorkspaceRepository } from 'src/engine/twenty-orm/repository/workspace.repository';

@Injectable()
export class CompanyService {
  constructor(
    @InjectWorkspaceRepository(CompanyWorkspaceEntity)
    private readonly companyRepository: WorkspaceRepository<CompanyWorkspaceEntity>,
  ) {}

  async findAll(): Promise<CompanyWorkspaceEntity[]> {
    return this.companyRepository.find({});
  }

  async findOne(id: string): Promise<CompanyWorkspaceEntity | null> {
    return this.companyRepository.findOne({ where: { id } });
  }

  async create(data: Partial<CompanyWorkspaceEntity>): Promise<CompanyWorkspaceEntity> {
    return this.companyRepository.save(data);
  }
}
```

### Module Registration

To use TwentyORM repositories, import the `TwentyORMModule`:

```typescript
import { Module } from '@nestjs/common';
import { TwentyORMModule } from 'src/engine/twenty-orm/twenty-orm.module';

@Module({
  imports: [TwentyORMModule],
  providers: [CompanyService],
})
export class CompanyModule {}
```

## Migrations

Twenty uses TypeORM migrations for the core database schema. Migrations are located in `packages/twenty-server/src/database/typeorm/core/migrations/`.

### Migration Structure

Migrations are organized into subdirectories:
- `common/` - Migrations for all deployments
- `billing/` - Migrations for billing features (when enabled)

### Migration File Example

Here's an actual migration from the codebase:

```typescript
import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddPublicDomainEntity1757013851879 implements MigrationInterface {
  name = 'AddPublicDomainEntity1757013851879';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "core"."publicDomain" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "domain" character varying NOT NULL,
        "isValidated" boolean NOT NULL DEFAULT false,
        "workspaceId" uuid NOT NULL,
        CONSTRAINT "UQ_1311e24fbd049c561c53a274f2a" UNIQUE ("domain"),
        CONSTRAINT "PK_ff55a0f1bc3b6e2c32feff734b1" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."publicDomain"
       ADD CONSTRAINT "FK_7e9ca5fd7aa30b8396ea3d1d6be"
       FOREIGN KEY ("workspaceId")
       REFERENCES "core"."workspace"("id")
       ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."publicDomain" DROP CONSTRAINT "FK_7e9ca5fd7aa30b8396ea3d1d6be"`,
    );
    await queryRunner.query(`DROP TABLE "core"."publicDomain"`);
  }
}
```

### Running Migrations

Migrations are run using TypeORM CLI commands defined in `package.json`:

```bash
# Run migrations in production
yarn database:migrate:prod

# This executes: npx -y typeorm migration:run -d dist/database/typeorm/core/core.datasource
```

**Note:** Twenty uses raw SQL queries in migrations rather than TypeORM's schema builder classes. Migrations target the `core` schema for system-level tables, while workspace-specific tables are managed dynamically through the metadata system.

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
// Workspace entities automatically include soft delete support via BaseWorkspaceEntity
// The deletedAt field is inherited from BaseWorkspaceEntity

// Soft delete (default behavior)
await repository.delete({ id });

// Find including deleted records
await repository.find({
  where: { id },
  withDeleted: true
});
```

**Note:** All workspace entities extend `BaseWorkspaceEntity` which includes `deletedAt` field. Soft deletes are the default behavior in TwentyORM.

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
const companies = await companyRepository.find({});
for (const company of companies) {
  company.people = await personRepository.find({
    where: { companyId: company.id },
  });
}

// ✅ Good - Use relations
const companies = await companyRepository.find({
  relations: { people: true },
});

// ✅ Better - Use DataLoader for GraphQL
// Twenty uses DataLoader in the GraphQL layer to batch and cache queries
const companies = await companyRepository.find({});
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

- [Backend Architecture](./08-backend-architecture.md)
- [GraphQL API](./10-graphql-api.md)
- [System Architecture](./02-system-architecture.md)

---

**Related Documentation:**
- [Technology Stack](./04-technology-stack.md)
- [Deployment](./15-deployment.md)
