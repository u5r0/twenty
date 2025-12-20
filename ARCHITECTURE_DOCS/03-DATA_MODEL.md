# Server-Side Data Model

## Overview

Twenty's server maintains a sophisticated data model supporting a customizable CRM. The architecture separates **metadata** (schema definitions) from **data** (actual records), enabling dynamic object creation and field customization.

---

## Database Architecture

### Multi-Database Strategy

```
┌─────────────────────────────────────┐
│    PostgreSQL (Primary Storage)     │
├──────────┬──────────────────────────┤
│  Core    │  Workspace Schemas       │
│ Schema   │  (one per workspace)     │
│          │                          │
│ - Users  │ - Companies              │
│ - Tokens │ - Contacts               │
│ - Config │ - Opportunities          │
│ - Roles  │ - Custom Objects         │
│ - Perms  │ - Relationships          │
└──────────┴──────────────────────────┘

┌──────────────────────────────────┐
│   ClickHouse (Analytics/Events)  │
│                                  │
│ - Activity Events                │
│ - Audit Logs                     │
│ - Time-Series Data               │
│ - Aggregations                   │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│   Redis (Cache/Sessions)         │
│                                  │
│ - Session Data                   │
│ - Object Cache                   │
│ - Permission Cache               │
│ - Queue/Jobs                     │
└──────────────────────────────────┘
```

### Core Schema (System Database)

Stores workspace-agnostic data:

```sql
-- User Management
CREATE TABLE "core"."user" (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  firstName VARCHAR,
  lastName VARCHAR,
  passwordHash VARCHAR,
  isEmailVerified BOOLEAN DEFAULT FALSE,
  canImpersonate BOOLEAN DEFAULT FALSE,
  disabled BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  deletedAt TIMESTAMP
);

-- Workspace Management
CREATE TABLE "core"."workspace" (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  displayName VARCHAR,
  domainName VARCHAR UNIQUE,
  logo VARCHAR,
  activationStatus VARCHAR,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- User Workspace Membership
CREATE TABLE "core"."userWorkspace" (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL REFERENCES "user"(id),
  workspaceId UUID NOT NULL REFERENCES "workspace"(id),
  acceptedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  UNIQUE(userId, workspaceId)
);

-- Authentication & Tokens
CREATE TABLE "core"."appToken" (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  token VARCHAR UNIQUE NOT NULL,
  userWorkspaceId UUID NOT NULL,
  expiresAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- SSO Configuration
CREATE TABLE "core"."workspaceSSOIdentityProvider" (
  id UUID PRIMARY KEY,
  workspaceId UUID NOT NULL REFERENCES "workspace"(id),
  type VARCHAR CHECK (type IN ('OIDC', 'SAML')),
  status VARCHAR CHECK (status IN ('Active', 'Inactive', 'Error')),
  issuer VARCHAR NOT NULL,
  clientID VARCHAR,
  clientSecret VARCHAR,
  ssoURL VARCHAR,
  certificate VARCHAR,
  fingerprint VARCHAR,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- Role-Based Access Control
CREATE TABLE "core"."role" (
  id UUID PRIMARY KEY,
  workspaceId UUID NOT NULL REFERENCES "workspace"(id),
  name VARCHAR NOT NULL,
  description VARCHAR,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "core"."roleTarget" (
  id UUID PRIMARY KEY,
  roleId UUID NOT NULL REFERENCES "role"(id),
  userWorkspaceId UUID REFERENCES "userWorkspace"(id),
  agentId UUID,
  apiKeyId UUID,
  createdAt TIMESTAMP DEFAULT NOW(),
  UNIQUE(userWorkspaceId, roleId, agentId, apiKeyId)
);

-- Permissions
CREATE TABLE "core"."objectPermission" (
  id UUID PRIMARY KEY,
  roleId UUID NOT NULL,
  objectMetadataId UUID NOT NULL,
  canReadObjectRecords BOOLEAN,
  canCreateObjectRecords BOOLEAN,
  canEditObjectRecords BOOLEAN,
  canDeleteObjectRecords BOOLEAN,
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "core"."fieldPermission" (
  id UUID PRIMARY KEY,
  objectPermissionId UUID NOT NULL,
  fieldMetadataId UUID NOT NULL,
  canEditFieldRecords BOOLEAN,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

---

## Metadata Schema (Dynamic Object Definitions)

Stores the structure of data objects:

```sql
CREATE TABLE "core"."objectMetadata" (
  id UUID PRIMARY KEY,
  workspaceId UUID NOT NULL,
  dataSourceId UUID NOT NULL,
  nameSingular VARCHAR NOT NULL,      -- "company"
  namePlural VARCHAR NOT NULL,        -- "companies"
  labelSingular VARCHAR NOT NULL,     -- "Company"
  labelPlural VARCHAR NOT NULL,       -- "Companies"
  description TEXT,
  icon VARCHAR,
  isCustom BOOLEAN DEFAULT FALSE,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  UNIQUE(nameSingular, workspaceId),
  UNIQUE(namePlural, workspaceId)
);

CREATE TABLE "core"."fieldMetadata" (
  id UUID PRIMARY KEY,
  workspaceId UUID NOT NULL,
  objectMetadataId UUID NOT NULL REFERENCES "objectMetadata"(id),
  name VARCHAR NOT NULL,              -- "firstName"
  label VARCHAR NOT NULL,             -- "First Name"
  description TEXT,
  icon VARCHAR,
  type VARCHAR NOT NULL,              -- "TEXT", "NUMBER", "DATE", etc
  defaultValue VARCHAR,
  isCustom BOOLEAN DEFAULT FALSE,
  isActive BOOLEAN DEFAULT TRUE,
  isNullable BOOLEAN DEFAULT TRUE,
  isUnique BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  UNIQUE(name, objectMetadataId)
);

CREATE TABLE "core"."relationMetadata" (
  id UUID PRIMARY KEY,
  workspaceId UUID NOT NULL,
  fromObjectMetadataId UUID NOT NULL,
  toObjectMetadataId UUID NOT NULL,
  relationType VARCHAR NOT NULL,      -- "ONE_TO_MANY", "MANY_TO_ONE", etc
  createdAt TIMESTAMP DEFAULT NOW()
);

-- View Definitions
CREATE TABLE "core"."view" (
  id UUID PRIMARY KEY,
  workspaceId UUID NOT NULL,
  objectMetadataId UUID NOT NULL,
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL,              -- "TABLE", "KANBAN", "CALENDAR"
  position INT,
  isLocked BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "core"."viewField" (
  id UUID PRIMARY KEY,
  viewId UUID NOT NULL REFERENCES "view"(id),
  fieldMetadataId UUID NOT NULL,
  position INT,
  isVisible BOOLEAN DEFAULT TRUE,
  size INT,
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "core"."viewFilter" (
  id UUID PRIMARY KEY,
  viewId UUID NOT NULL,
  fieldMetadataId UUID NOT NULL,
  operand VARCHAR NOT NULL,           -- "eq", "contains", "gt", etc
  value VARCHAR NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "core"."viewSort" (
  id UUID PRIMARY KEY,
  viewId UUID NOT NULL,
  fieldMetadataId UUID NOT NULL,
  direction VARCHAR NOT NULL,         -- "ASC", "DESC"
  position INT,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

---

## Workspace Data Schema (Dynamic Per Workspace)

Each workspace gets its own schema with object tables:

```sql
-- Workspace Schema: workspace_abc123def

-- Standard CRM Objects
CREATE TABLE "workspace_abc123def"."company" (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  domainName VARCHAR,
  accountOwnerId UUID,
  revenue BIGINT,
  employees INT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  deletedAt TIMESTAMP
);

CREATE TABLE "workspace_abc123def"."person" (
  id UUID PRIMARY KEY,
  firstName VARCHAR,
  lastName VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  linkedinUrl VARCHAR,
  xUrl VARCHAR,
  jobTitle VARCHAR,
  companyId UUID REFERENCES "company"(id),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  deletedAt TIMESTAMP
);

CREATE TABLE "workspace_abc123def"."opportunity" (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  amount BIGINT,
  stage VARCHAR,                      -- "QUALIFIED", "PROPOSAL", "WON", etc
  probability DECIMAL(3,2),
  expectedCloseDate DATE,
  companyId UUID REFERENCES "company"(id),
  ownerId UUID,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  deletedAt TIMESTAMP
);

-- Relationship Tables
CREATE TABLE "workspace_abc123def"."company_to_person" (
  companyId UUID REFERENCES "company"(id),
  personId UUID REFERENCES "person"(id),
  PRIMARY KEY (companyId, personId)
);

-- Audit/Timeline
CREATE TABLE "workspace_abc123def"."timelineEvent" (
  id UUID PRIMARY KEY,
  objectType VARCHAR NOT NULL,
  objectId UUID NOT NULL,
  action VARCHAR NOT NULL,            -- "CREATE", "UPDATE", "DELETE"
  changes JSONB,
  createdBy UUID NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Custom Fields (Dynamic)
CREATE TABLE "workspace_abc123def"."objectCustomField" (
  id UUID PRIMARY KEY,
  objectType VARCHAR NOT NULL,        -- "company", "person", etc
  fieldName VARCHAR NOT NULL,         -- custom field name
  fieldValue JSONB,                   -- stores any type of value
  objectId UUID NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

---

## TypeORM Entity Structure

### Core Entities

```typescript
// User Entity (Core Schema)
@Entity({ name: 'user', schema: 'core' })
@ObjectType('User')
export class UserEntity {
  @IDField(() => UUIDScalarType)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  email: string;

  @Field()
  @Column()
  firstName: string;

  @Field()
  @Column()
  lastName: string;

  @OneToMany(() => UserWorkspaceEntity, uw => uw.user)
  userWorkspaces: Relation<UserWorkspaceEntity[]>;

  @OneToMany(() => AppTokenEntity, at => at.user)
  appTokens: Relation<AppTokenEntity[]>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}

// Workspace Entity
@Entity({ name: 'workspace', schema: 'core' })
@ObjectType('Workspace')
export class WorkspaceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  displayName?: string;

  @OneToMany(() => UserWorkspaceEntity, uw => uw.workspace)
  userWorkspaces: Relation<UserWorkspaceEntity[]>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Object Metadata Entity
@Entity('objectMetadata')
export class ObjectMetadataEntity
  implements Required<ObjectMetadataEntity>
{
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  nameSingular: string;

  @Column({ nullable: false })
  namePlural: string;

  @Column({ nullable: false })
  labelSingular: string;

  @Column({ nullable: false })
  labelPlural: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ type: 'uuid' })
  workspaceId: string;

  @OneToMany(
    () => FieldMetadataEntity,
    fieldMetadata => fieldMetadata.object
  )
  fields: Relation<FieldMetadataEntity[]>;

  @OneToMany(
    () => ViewEntity,
    view => view.objectMetadata
  )
  views: Relation<ViewEntity[]>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Field Metadata Entity
@Entity('fieldMetadata')
export class FieldMetadataEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  label: string;

  @Column()
  type: FieldMetadataType;  // TEXT, NUMBER, DATE, ENUM, etc

  @Column({ type: 'uuid' })
  objectMetadataId: string;

  @ManyToOne(
    () => ObjectMetadataEntity,
    objectMetadata => objectMetadata.fields
  )
  object: Relation<ObjectMetadataEntity>;

  @Column({ type: 'jsonb', nullable: true })
  options?: FieldMetadataOptions;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## TwentyORM: Custom ORM Layer

Twenty implements a custom ORM wrapper around TypeORM to handle workspace-specific queries.

### Purpose
- Abstract workspace schema switching
- Unified interface for querying data objects
- Automatic schema resolution
- Support for custom fields

### Usage Pattern

```typescript
@Injectable()
export class CompanyService {
  constructor(
    private twentyORMManager: TwentyORMEntityManager,
  ) {}

  async getCompanies(workspaceId: string): Promise<Company[]> {
    const repository = this.twentyORMManager.getRepository(
      'company',
      workspaceId
    );

    return repository.find({
      relations: ['opportunities', 'people'],
      where: { deletedAt: IsNull() }
    });
  }

  async createCompany(
    workspaceId: string,
    data: CreateCompanyInput
  ): Promise<Company> {
    const repository = this.twentyORMManager.getRepository(
      'company',
      workspaceId
    );

    const company = repository.create(data);
    return repository.save(company);
  }
}
```

### Key Features
1. **Dynamic Table Access** - Automatically routes to correct workspace schema
2. **Type Safety** - Generated types from metadata
3. **Relation Loading** - Handles relationship queries
4. **Custom Field Support** - Queries custom fields transparently
5. **Audit Trail** - Automatic change tracking

---

## Standard Field Types

### Supported Field Types

| Type | Storage | GraphQL Type | Example |
|------|---------|-------------|---------|
| TEXT | VARCHAR | String | "John Doe" |
| PHONE | VARCHAR | String | "+1234567890" |
| EMAIL | VARCHAR | String | "john@example.com" |
| NUMBER | NUMERIC | Float | 100.50 |
| DECIMAL | DECIMAL(10,2) | Float | 1000.99 |
| BOOLEAN | BOOLEAN | Boolean | true |
| DATE | DATE | DateTime | "2024-01-15" |
| DATETIME | TIMESTAMP | DateTime | "2024-01-15T10:30:00Z" |
| CURRENCY | NUMERIC | Float | 50000.00 |
| SELECT | VARCHAR | String | "CLOSED_WON" |
| MULTI_SELECT | TEXT ARRAY | [String] | ["tag1", "tag2"] |
| LINK | JSONB | Link | { title, url } |
| LINKS | JSONB ARRAY | [Link] | Multiple links |
| RELATION | UUID (FK) | Object | Company ID |
| RELATION_MULTI | JOIN TABLE | [Object] | Multiple companies |
| FORMULA | GENERATED | Calculated | Dynamic calculation |
| JSON | JSONB | JSON | Any JSON object |
| RATING | INT CHECK | Int | 1-5 |
| POSITION | FLOAT | Float | 0.5 |
| RICH_TEXT | TEXT | String | HTML formatted |
| FILE | JSONB | File | { name, size, url } |
| ACTIVITY | JSONB ARRAY | [Activity] | Task references |

---

## Relationships

### One-to-Many (1:N)
```typescript
// Company has many Contacts
@OneToMany(() => PersonEntity, person => person.company)
people: Relation<PersonEntity[]>;

// Contact belongs to Company
@ManyToOne(() => CompanyEntity, company => company.people)
company: Relation<CompanyEntity>;
```

### Many-to-Many (N:M)
```typescript
// Join table approach
@Entity()
export class CompanyToPersonEntity {
  @ManyToOne(() => CompanyEntity)
  company: Relation<CompanyEntity>;

  @ManyToOne(() => PersonEntity)
  person: Relation<PersonEntity>;
}
```

### Polymorphic Relations
For activities, notes, tasks (apply to multiple object types):
```typescript
// Timeline event can reference any object
@Entity()
export class TimelineEventEntity {
  @Column()
  relatedObjectType: string;  // "company", "person", etc

  @Column({ type: 'uuid' })
  relatedObjectId: string;

  // Runtime resolution of related object
}
```

---

## Data Access Patterns

### Repository Pattern
```typescript
@Injectable()
export class CompanyRepository {
  constructor(
    @InjectRepository(CompanyEntity)
    private repo: Repository<CompanyEntity>,
  ) {}

  findById(id: string): Promise<Company> {
    return this.repo.findOne({ where: { id } });
  }

  findWithRelations(id: string): Promise<Company> {
    return this.repo.findOne({
      where: { id },
      relations: ['opportunities', 'people'],
      loadRelationIds: { relations: ['owner'] }
    });
  }

  async create(data: CreateCompanyInput): Promise<Company> {
    const company = this.repo.create(data);
    return this.repo.save(company);
  }
}
```

### Query Builder Pattern
```typescript
const companies = await companyRepository
  .createQueryBuilder('company')
  .leftJoinAndSelect('company.opportunities', 'opportunities')
  .leftJoinAndSelect('company.people', 'people')
  .where('company.revenue > :revenue', { revenue: 100000 })
  .andWhere('company.deletedAt IS NULL')
  .orderBy('company.createdAt', 'DESC')
  .limit(10)
  .getMany();
```

### DataLoader Pattern (N+1 Prevention)
```typescript
// GraphQL resolver
@Resolver(() => CompanyType)
export class CompanyResolver {
  @ResolveField(() => [PersonType])
  async people(
    @Parent() company: Company,
    @Loader(PersonLoader) loader: DataLoader<UUID, Person[]>
  ): Promise<Person[]> {
    // DataLoader batches queries
    return loader.load(company.id);
  }
}
```

---

## Soft Deletes & Auditing

### Soft Delete Pattern
```typescript
// Tables use deletedAt timestamp
@DeleteDateColumn()
deletedAt?: Date;

// Queries exclude soft-deleted records
const companies = await repo.find({
  where: { deletedAt: IsNull() }
});
```

### Audit Trail
```typescript
@Entity()
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  entityType: string;  // "Company", "Person", etc

  @Column({ type: 'uuid' })
  entityId: string;

  @Column()
  action: 'CREATE' | 'UPDATE' | 'DELETE';

  @Column({ type: 'jsonb' })
  changes: Record<string, { old: any; new: any }>;

  @Column({ type: 'uuid' })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}

// Auto-tracked via subscribers
@EventSubscriber()
export class AuditSubscriber
  implements EntitySubscriberInterface<BaseEntity>
{
  afterUpdate(event: UpdateEvent<any>) {
    // Log changes automatically
    const changes = this.detectChanges(event);
    // Save to audit table
  }
}
```

---

## Performance Optimization

### Indexing Strategy
```sql
-- Foreign key indexes
CREATE INDEX idx_person_company_id ON company(id);
CREATE INDEX idx_opportunity_company_id ON opportunity(companyId);

-- Query performance
CREATE INDEX idx_company_deleted_at ON company(deletedAt);
CREATE INDEX idx_person_email ON person(email);

-- Composite indexes
CREATE INDEX idx_opportunity_stage_owner
  ON opportunity(stage, ownerId);
```

### Query Optimization
- Use `select` to limit fields
- Eager load related data
- Use DataLoaders for batch queries
- Index frequently filtered fields
- Archive old data to ClickHouse

---

## Data Integrity

### Constraints
```typescript
@Entity()
export class CompanyEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: false })
  domainName: string;

  @ManyToOne()
  @JoinColumn()
  owner: Relation<PersonEntity>;  // Foreign key constraint
}
```

### Cascading
```typescript
@ManyToOne(() => CompanyEntity, {
  onDelete: 'CASCADE',  // Delete company → delete related records
  onUpdate: 'CASCADE'
})
company: Relation<CompanyEntity>;
```

---

## Migration Strategy

### Creating New Fields
```typescript
// Generate migration
yarn typeorm migration:generate -n AddCompanyRevenue

// Migration file
export class AddCompanyRevenue implements MigrationInterface {
  async up(queryRunner: QueryRunner) {
    await queryRunner.addColumn(
      'company',
      new TableColumn({
        name: 'revenue',
        type: 'bigint',
        isNullable: true
      })
    );
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.dropColumn('company', 'revenue');
  }
}

// Update metadata
await objectMetadataService.createField({
  objectId: 'company',
  name: 'revenue',
  type: 'NUMBER',
  label: 'Revenue'
});
```

---

## Best Practices

1. **Always use TwentyORM** for workspace data queries
2. **Leverage TypeORM relations** for type safety
3. **Use DataLoaders** to prevent N+1 queries
4. **Index frequently queried fields**
5. **Implement soft deletes** for audit trails
6. **Use migrations** for schema changes
7. **Normalize data** at database design
8. **Cache metadata** in memory
9. **Use transactions** for multi-step operations
10. **Monitor query performance** regularly
