# Backend Architecture

Comprehensive guide to Twenty's backend architecture, built with NestJS, GraphQL, and PostgreSQL.

## Overview

Twenty's backend is built with:
- **NestJS** - TypeScript framework
- **GraphQL Yoga** - GraphQL server
- **TypeORM** - Database ORM
- **TwentyORM** - Custom workspace-aware ORM
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage
- **BullMQ** - Job processing (via custom MessageQueue abstraction)

## Project Structure

```
packages/twenty-server/
├── src/
│   ├── engine/                    # Core engine
│   │   ├── api/                   # GraphQL API layer
│   │   │   ├── graphql/           # GraphQL setup
│   │   │   ├── rest/              # REST API
│   │   │   ├── mcp/               # Model Context Protocol
│   │   │   └── common/            # Common API utilities
│   │   ├── metadata-modules/      # Metadata management
│   │   │   ├── object-metadata/   # Object definitions
│   │   │   ├── field-metadata/    # Field definitions
│   │   │   ├── data-source/       # Data source management
│   │   │   └── ...                # Many other metadata modules
│   │   ├── workspace-manager/     # Workspace management
│   │   ├── workspace-datasource/  # Workspace data source
│   │   ├── workspace-cache/       # Workspace caching
│   │   ├── twenty-orm/            # Custom ORM
│   │   │   ├── repository/        # Repository pattern
│   │   │   ├── entity-manager/    # Entity manager
│   │   │   └── decorators/        # ORM decorators
│   │   ├── core-modules/          # Core modules
│   │   │   ├── auth/              # Authentication
│   │   │   ├── user/              # User management
│   │   │   ├── workspace/         # Workspace operations
│   │   │   ├── messaging/         # Email/messaging
│   │   │   ├── calendar/          # Calendar integration
│   │   │   ├── file/              # File management
│   │   │   ├── webhook/           # Webhooks
│   │   │   ├── message-queue/     # Job queue abstraction
│   │   │   └── ...                # Many other core modules
│   │   ├── decorators/            # Custom decorators
│   │   │   ├── auth/              # Auth decorators
│   │   │   ├── metadata/          # Metadata decorators
│   │   │   └── observability/     # Observability decorators
│   │   ├── guards/                # Auth guards
│   │   ├── middlewares/           # Middlewares
│   │   └── utils/                 # Engine utilities
│   ├── modules/                   # Business logic modules
│   │   ├── company/               # Company module
│   │   ├── person/                # Person module
│   │   ├── opportunity/           # Opportunity module
│   │   ├── workflow/              # Workflow automation
│   │   ├── messaging/             # Messaging module
│   │   ├── calendar/              # Calendar module
│   │   └── ...                    # Other business modules
│   ├── database/                  # Database layer
│   │   ├── typeorm/               # TypeORM configuration
│   │   │   └── core/              # Core database
│   │   │       └── migrations/    # TypeORM migrations
│   │   ├── clickHouse/            # ClickHouse database
│   │   └── commands/              # Database commands
│   ├── command/                   # CLI commands
│   ├── queue-worker/              # Queue worker entry point
│   ├── utils/                     # Utility functions
│   ├── filters/                   # Exception filters
│   ├── app.module.ts              # Root module
│   └── main.ts                    # Application entry
├── test/                          # Integration tests
├── scripts/                       # Utility scripts
└── package.json                   # Dependencies
```

## Module Architecture

### NestJS Module Pattern

Note: The example below shows a typical NestJS module pattern. In Twenty's actual codebase, most business logic modules (like company, person, opportunity) are defined as standard objects in the metadata system rather than traditional NestJS modules. Core functionality is in `src/engine/core-modules/`.

```typescript
// Example NestJS module pattern (used in core-modules)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, Person]),
  ],
  controllers: [CompanyController],
  providers: [
    CompanyService,
    CompanyResolver,
    CompanyRepository,
  ],
  exports: [CompanyService],
})
export class CompanyModule {}
```

### Service Layer

Note: This is a conceptual example. Twenty uses a metadata-driven approach where most CRUD operations are handled through the metadata engine and TwentyORM.

```typescript
// Example service pattern
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  async findAll(workspaceId: string): Promise<Company[]> {
    return this.companyRepository.find({
      where: { workspaceId },
    });
  }

  async findOne(id: string, workspaceId: string): Promise<Company> {
    return this.companyRepository.findOne({
      where: { id, workspaceId },
    });
  }

  async create(
    data: CreateCompanyInput,
    workspaceId: string,
  ): Promise<Company> {
    const company = this.companyRepository.create({
      ...data,
      workspaceId,
    });
    return this.companyRepository.save(company);
  }

  async update(
    id: string,
    data: UpdateCompanyInput,
    workspaceId: string,
  ): Promise<Company> {
    await this.companyRepository.update(
      { id, workspaceId },
      data,
    );
    return this.findOne(id, workspaceId);
  }

  async delete(id: string, workspaceId: string): Promise<boolean> {
    const result = await this.companyRepository.softDelete({
      id,
      workspaceId,
    });
    return result.affected > 0;
  }
}
```

### GraphQL Resolver

Note: This is a conceptual example. Twenty's GraphQL resolvers are dynamically generated through the metadata engine.

```typescript
// Example resolver pattern
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';

@Resolver(() => Company)
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
export class CompanyResolver {
  constructor(private companyService: CompanyService) {}

  @Query(() => [Company])
  async companies(
    @Args('filter', { nullable: true }) filter?: CompanyFilter,
    @AuthWorkspace() workspace: Workspace,
  ): Promise<Company[]> {
    return this.companyService.findAll(workspace.id, filter);
  }

  @Query(() => Company)
  async company(
    @Args('id') id: string,
    @AuthWorkspace() workspace: Workspace,
  ): Promise<Company> {
    return this.companyService.findOne(id, workspace.id);
  }

  @Mutation(() => Company)
  async createCompany(
    @Args('data') data: CreateCompanyInput,
    @AuthWorkspace() workspace: Workspace,
  ): Promise<Company> {
    return this.companyService.create(data, workspace.id);
  }

  @Mutation(() => Company)
  async updateCompany(
    @Args('id') id: string,
    @Args('data') data: UpdateCompanyInput,
    @AuthWorkspace() workspace: Workspace,
  ): Promise<Company> {
    return this.companyService.update(id, data, workspace.id);
  }

  @Mutation(() => Boolean)
  async deleteCompany(
    @Args('id') id: string,
    @AuthWorkspace() workspace: Workspace,
  ): Promise<boolean> {
    return this.companyService.delete(id, workspace.id);
  }

  // Field resolvers
  @ResolveField(() => [Person])
  async people(
    @Parent() company: Company,
    @AuthWorkspace() workspace: Workspace,
  ): Promise<Person[]> {
    return this.personService.findByCompany(company.id, workspace.id);
  }
}
```

### REST Controller (Optional)

Note: This is a conceptual example. Twenty primarily uses GraphQL for its API.

```typescript
// Example REST controller pattern
import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';

@Controller('companies')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  @Get()
  async findAll(@AuthWorkspace() workspace: Workspace) {
    return this.companyService.findAll(workspace.id);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @AuthWorkspace() workspace: Workspace,
  ) {
    return this.companyService.findOne(id, workspace.id);
  }

  @Post()
  async create(
    @Body() data: CreateCompanyDto,
    @AuthWorkspace() workspace: Workspace,
  ) {
    return this.companyService.create(data, workspace.id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateCompanyDto,
    @AuthWorkspace() workspace: Workspace,
  ) {
    return this.companyService.update(id, data, workspace.id);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @AuthWorkspace() workspace: Workspace,
  ) {
    return this.companyService.delete(id, workspace.id);
  }
}
```

## Database Layer

### TypeORM Entities

Note: This is a conceptual example. Twenty uses a metadata-driven approach where entities are dynamically generated.

```typescript
// Example entity pattern
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  domainName: string;

  @Column({ type: 'int', nullable: true })
  employees: number;

  @Column({ nullable: true })
  industry: string;

  @Column()
  workspaceId: string;

  @ManyToOne(() => Workspace)
  workspace: Workspace;

  @OneToMany(() => Person, person => person.company)
  people: Person[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}
```

### Repository Pattern

Note: This is a conceptual example showing TypeORM repository pattern.

```typescript
// Example repository pattern
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class CompanyRepository extends Repository<Company> {
  constructor(private dataSource: DataSource) {
    super(Company, dataSource.createEntityManager());
  }

  async findByIndustry(
    industry: string,
    workspaceId: string,
  ): Promise<Company[]> {
    return this.createQueryBuilder('company')
      .where('company.industry = :industry', { industry })
      .andWhere('company.workspaceId = :workspaceId', { workspaceId })
      .getMany();
  }

  async findWithPeople(id: string, workspaceId: string): Promise<Company> {
    return this.createQueryBuilder('company')
      .leftJoinAndSelect('company.people', 'people')
      .where('company.id = :id', { id })
      .andWhere('company.workspaceId = :workspaceId', { workspaceId })
      .getOne();
  }

  async countByIndustry(workspaceId: string): Promise<Record<string, number>> {
    const results = await this.createQueryBuilder('company')
      .select('company.industry', 'industry')
      .addSelect('COUNT(*)', 'count')
      .where('company.workspaceId = :workspaceId', { workspaceId })
      .groupBy('company.industry')
      .getRawMany();

    return results.reduce((acc, { industry, count }) => {
      acc[industry] = parseInt(count);
      return acc;
    }, {});
  }
}
```

### TwentyORM (Custom ORM)

Twenty uses a custom ORM built on top of TypeORM that provides workspace-aware data access.

```typescript
// Example TwentyORM usage pattern
// Actual implementation is in src/engine/twenty-orm/

// Usage example
const companies = await twentyOrm
  .getRepository('company')
  .find({
    where: { industry: 'Technology' },
  });
```

### Migrations

Migrations are located in `src/database/typeorm/core/migrations/`.

```typescript
// Example migration pattern
// Actual migrations in src/database/typeorm/core/migrations/
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateCompanies1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'companies',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'domainName',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'employees',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'industry',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'workspaceId',
            type: 'uuid',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['workspaceId'],
            referencedTableName: 'workspaces',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        indices: [
          {
            columnNames: ['workspaceId'],
          },
          {
            columnNames: ['industry'],
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('companies');
  }
}
```

## GraphQL Schema

### Type Definitions

Note: This is a conceptual example. Twenty's GraphQL types are dynamically generated through the metadata engine.

```typescript
// Example GraphQL object type
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class Company {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  domainName?: string;

  @Field(() => Int, { nullable: true })
  employees?: number;

  @Field({ nullable: true })
  industry?: string;

  @Field(() => [Person])
  people: Person[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
```

### Input Types

Note: This is a conceptual example. Twenty's GraphQL input types are dynamically generated.

```typescript
// Example input types
import { InputType, Field, Int } from '@nestjs/graphql';
import { IsString, IsOptional, IsInt, Min } from 'class-validator';

@InputType()
export class CreateCompanyInput {
  @Field()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  domainName?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(0)
  @IsOptional()
  employees?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  industry?: string;
}

@InputType()
export class UpdateCompanyInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  domainName?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(0)
  @IsOptional()
  employees?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  industry?: string;
}
```

### Filter Types

Note: This is a conceptual example. Twenty's filter system is more sophisticated and handled through the metadata engine.

```typescript
// Example filter types
import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class CompanyFilter {
  @Field({ nullable: true })
  name?: StringFilter;

  @Field({ nullable: true })
  industry?: StringFilter;

  @Field(() => IntFilter, { nullable: true })
  employees?: IntFilter;

  @Field(() => [CompanyFilter], { nullable: true })
  AND?: CompanyFilter[];

  @Field(() => [CompanyFilter], { nullable: true })
  OR?: CompanyFilter[];
}

@InputType()
export class StringFilter {
  @Field({ nullable: true })
  eq?: string;

  @Field({ nullable: true })
  contains?: string;

  @Field({ nullable: true })
  startsWith?: string;

  @Field({ nullable: true })
  endsWith?: string;

  @Field(() => [String], { nullable: true })
  in?: string[];
}

@InputType()
export class IntFilter {
  @Field(() => Int, { nullable: true })
  eq?: number;

  @Field(() => Int, { nullable: true })
  gt?: number;

  @Field(() => Int, { nullable: true })
  gte?: number;

  @Field(() => Int, { nullable: true })
  lt?: number;

  @Field(() => Int, { nullable: true })
  lte?: number;
}
```

## Authentication & Authorization

### JWT Strategy

Located in `src/engine/core-modules/auth/strategies/jwt.auth.strategy.ts`.

```typescript
// Example JWT strategy pattern
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      email: payload.email,
      workspaceId: payload.workspaceId,
    };
  }
}
```

### Auth Guards

Guards are located in `src/engine/guards/`.

```typescript
// Example JWT auth guard
// Actual implementation in src/engine/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}

// Example workspace auth guard
// Actual implementation in src/engine/guards/workspace-auth.guard.ts
@Injectable()
export class WorkspaceAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();

    const user = req.user;
    if (!user) return false;

    const workspace = await this.workspaceService.findOne(user.workspaceId);
    if (!workspace) return false;

    req.workspace = workspace;
    return true;
  }
}
```

### Custom Decorators

Decorators are located in `src/engine/decorators/auth/`.

```typescript
// Example workspace decorator
// Actual implementation in src/engine/decorators/auth/auth-workspace.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const AuthWorkspace = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.workspace;
  },
);

// Example current user decorator
// Actual implementation in src/engine/decorators/auth/auth-user.decorator.ts
export const AuthUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.user;
  },
);
```

## Job Queue (BullMQ)

Twenty uses BullMQ for job processing through a custom MessageQueue abstraction located in `src/engine/core-modules/message-queue/`.

### Queue Setup

```typescript
// Example message queue usage
// Actual implementation in src/engine/core-modules/message-queue/
import { MessageQueueModule } from 'src/engine/core-modules/message-queue/message-queue.module';

@Module({
  imports: [
    MessageQueueModule.register({
      driver: 'bullmq',
      // configuration
    }),
  ],
  providers: [EmailService],
})
export class EmailModule {}
```

### Producer

```typescript
// Example job producer using MessageQueueService
import { Injectable } from '@nestjs/common';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';

@Injectable()
export class EmailService {
  constructor(
    private messageQueueService: MessageQueueService,
  ) {}

  async sendWelcomeEmail(user: User): Promise<void> {
    await this.messageQueueService.add('welcome-email', {
      email: user.email,
      name: user.name,
    });
  }

  async sendPasswordReset(user: User, token: string): Promise<void> {
    await this.messageQueueService.add(
      'password-reset-email',
      {
        email: user.email,
        token,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );
  }
}
```

### Consumer

```typescript
// Example job consumer
// Jobs are processed using the @Processor decorator pattern
import { Processor, Process } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';

@Processor('email-queue')
export class EmailProcessor {
  constructor(private emailSender: EmailSender) {}

  @Process('welcome-email')
  async handleWelcomeEmail(job: { data: { email: string; name: string } }) {
    const { email, name } = job.data;

    await this.emailSender.send({
      to: email,
      subject: 'Welcome to Twenty!',
      template: 'welcome',
      context: { name },
    });
  }

  @Process('password-reset-email')
  async handlePasswordReset(job: { data: { email: string; token: string } }) {
    const { email, token } = job.data;

    await this.emailSender.send({
      to: email,
      subject: 'Reset Your Password',
      template: 'password-reset',
      context: { token },
    });
  }
}
```

## Caching

Twenty uses Redis for caching through the cache-storage module in `src/engine/core-modules/cache-storage/`.

### Redis Cache

```typescript
// Example cache module setup
// Actual implementation in src/engine/core-modules/cache-storage/
import { CacheStorageModule } from 'src/engine/core-modules/cache-storage/cache-storage.module';

@Module({
  imports: [
    CacheStorageModule,
  ],
})
export class AppModule {}
```

### Cache Usage

```typescript
// Example cache usage pattern
import { Injectable, Inject } from '@nestjs/common';
import { CacheStorageService } from 'src/engine/core-modules/cache-storage/cache-storage.service';

@Injectable()
export class CompanyService {
  constructor(
    private cacheStorageService: CacheStorageService,
    private companyRepository: CompanyRepository,
  ) {}

  async findOne(id: string, workspaceId: string): Promise<Company> {
    const cacheKey = `company:${workspaceId}:${id}`;

    // Try cache first
    const cached = await this.cacheStorageService.get<Company>(cacheKey);
    if (cached) return cached;

    // Fetch from database
    const company = await this.companyRepository.findOne({
      where: { id, workspaceId },
    });

    // Store in cache
    await this.cacheStorageService.set(cacheKey, company, 300);

    return company;
  }

  async update(
    id: string,
    data: UpdateCompanyInput,
    workspaceId: string,
  ): Promise<Company> {
    const company = await this.companyRepository.update(
      { id, workspaceId },
      data,
    );

    // Invalidate cache
    const cacheKey = `company:${workspaceId}:${id}`;
    await this.cacheStorageService.del(cacheKey);

    return company;
  }
}
```

## WebSocket Support

Note: This section describes a conceptual WebSocket implementation. Verify actual implementation in the codebase.

### Gateway

```typescript
// Example WebSocket gateway pattern
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-workspace')
  handleJoinWorkspace(client: Socket, workspaceId: string) {
    client.join(`workspace:${workspaceId}`);
  }

  emitToWorkspace(workspaceId: string, event: string, data: any) {
    this.server.to(`workspace:${workspaceId}`).emit(event, data);
  }
}
```

## Error Handling

Exception filters are located in `src/filters/`.

### Exception Filters

```typescript
// Example exception filter
// Actual implementation in src/filters/unhandled-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message,
    });
  }
}
```

## Logging

Logging is handled through the logger module in `src/engine/core-modules/logger/`.

### Logger Service

```typescript
// Example logger usage
// Actual implementation in src/engine/core-modules/logger/
import { Injectable, LoggerService } from '@nestjs/common';

@Injectable()
export class CustomLogger implements LoggerService {
  log(message: string, context?: string) {
    console.log(`[${context}] ${message}`);
  }

  error(message: string, trace?: string, context?: string) {
    console.error(`[${context}] ${message}`, trace);
  }

  warn(message: string, context?: string) {
    console.warn(`[${context}] ${message}`);
  }

  debug(message: string, context?: string) {
    console.debug(`[${context}] ${message}`);
  }

  verbose(message: string, context?: string) {
    console.log(`[${context}] ${message}`);
  }
}
```

## Testing

See [Backend Testing Guide](./14-backend-testing.md) for detailed testing strategies.

## Next Steps

- [Database & ORM](./09-database-orm.md)
- [GraphQL API](./10-graphql-api.md)
- [Authentication](./11-auth.md)
- [Backend Testing](./14-backend-testing.md)

---

**Related Documentation:**
- [System Architecture](./02-system-architecture.md)
- [Technology Stack](./04-technology-stack.md)
- [Frontend Architecture](./05-frontend-architecture.md)

