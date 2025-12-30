# Backend Architecture

Comprehensive guide to Twenty's backend architecture, built with NestJS, GraphQL, and PostgreSQL.

##iew

Twenty's backend is built with:
- **NestJS** - TypeScript framework
- **GraphQL Yoga** - GraphQL server
- **TypeORM** - Database ORM
- **TwentyORM** - Custom workspace-aware ORM
- **PostgreSQL** - Primary database
- **Redis** - Caching and job queue
- **BullMQ** - Job processing

## Project Structure

```
packages/twenty-server/
├── src/
│   ├── engine/                    # Core engine
│   │   ├── api/                   # GraphQL API layer
│   │   │   ├── graphql/           # GraphQL setup
│   │   │   ├── rest/              # REST API
│   │   │   └── websocket/         # WebSocket support
│   │   ├── metadata/              # Metadata management
│   │   │   ├── metadata-engine/   # Metadata engine
│   │   │   ├── object-metadata/   # Object definitions
│   │   │   └── field-metadata/    # Field definitions
│   │   ├── workspace/             # Workspace management
│   │   │   ├── workspace-manager/ # Workspace operations
│   │   │   ├── workspace-schema/  # Schema management
│   │   │   └── workspace-query/   # Query builder
│   │   ├── twenty-orm/            # Custom ORM
│   │   │   ├── repository/        # Repository pattern
│   │   │   ├── query-builder/     # Query builder
│   │   │   └── decorators/        # ORM decorators
│   │   └── core-modules/          # Core modules
│   ├── modules/                   # Business logic modules
│   │   ├── auth/                  # Authentication
│   │   ├── user/                  # User management
│   │   ├── workspace/             # Workspace operations
│   │   ├── workflow/              # Workflow automation
│   │   ├── messaging/             # Email/messaging
│   │   ├── calendar/              # Calendar integration
│   │   ├── file/                  # File management
│   │   ├── webhook/               # Webhooks
│   │   └── ...
│   ├── database/                  # Database layer
│   │   ├── migrations/            # TypeORM migrations
│   │   ├── seeds/                 # Database seeds
│   │   └── typeorm.config.ts      # TypeORM configuration
│   ├── integrations/              # External integrations
│   │   ├── google/                # Google integration
│   │   ├── microsoft/             # Microsoft integration
│   │   └── ...
│   ├── utils/                     # Utility functions
│   ├── decorators/                # Custom decorators
│   ├── guards/                    # Auth guards
│   ├── interceptors/              # Interceptors
│   ├── filters/                   # Exception filters
│   ├── app.module.ts              # Root module
│   └── main.ts                    # Application entry
├── test/                          # Integration tests
├── scripts/                       # Utility scripts
└── package.json                   # Dependencies
```

## Module Architecture

### NestJS Module Pattern

```typescript
// modules/company/company.module.ts
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

```typescript
// modules/company/company.service.ts
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

```typescript
// modules/company/company.resolver.ts
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

@Resolver(() => Company)
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class CompanyResolver {
  constructor(private companyService: CompanyService) {}

  @Query(() => [Company])
  async companies(
    @Args('filter', { nullable: true }) filter?: CompanyFilter,
    @Workspace() workspace: WorkspaceEntity,
  ): Promise<Company[]> {
    return this.companyService.findAll(workspace.id, filter);
  }

  @Query(() => Company)
  async company(
    @Args('id') id: string,
    @Workspace() workspace: WorkspaceEntity,
  ): Promise<Company> {
    return this.companyService.findOne(id, workspace.id);
  }

  @Mutation(() => Company)
  async createCompany(
    @Args('data') data: CreateCompanyInput,
    @Workspace() workspace: WorkspaceEntity,
  ): Promise<Company> {
    return this.companyService.create(data, workspace.id);
  }

  @Mutation(() => Company)
  async updateCompany(
    @Args('id') id: string,
    @Args('data') data: UpdateCompanyInput,
    @Workspace() workspace: WorkspaceEntity,
  ): Promise<Company> {
    return this.companyService.update(id, data, workspace.id);
  }

  @Mutation(() => Boolean)
  async deleteCompany(
    @Args('id') id: string,
    @Workspace() workspace: WorkspaceEntity,
  ): Promise<boolean> {
    return this.companyService.delete(id, workspace.id);
  }

  // Field resolvers
  @ResolveField(() => [Person])
  async people(
    @Parent() company: Company,
    @Workspace() workspace: WorkspaceEntity,
  ): Promise<Person[]> {
    return this.personService.findByCompany(company.id, workspace.id);
  }
}
```

### REST Controller (Optional)

```typescript
// modules/company/company.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';

@Controller('companies')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  @Get()
  async findAll(@Workspace() workspace: WorkspaceEntity) {
    return this.companyService.findAll(workspace.id);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Workspace() workspace: WorkspaceEntity,
  ) {
    return this.companyService.findOne(id, workspace.id);
  }

  @Post()
  async create(
    @Body() data: CreateCompanyDto,
    @Workspace() workspace: WorkspaceEntity,
  ) {
    return this.companyService.create(data, workspace.id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateCompanyDto,
    @Workspace() workspace: WorkspaceEntity,
  ) {
    return this.companyService.update(id, data, workspace.id);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Workspace() workspace: WorkspaceEntity,
  ) {
    return this.companyService.delete(id, workspace.id);
  }
}
```

## Database Layer

### TypeORM Entities

```typescript
// database/entities/company.entity.ts
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

```typescript
// modules/company/company.repository.ts
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

```typescript
// engine/twenty-orm/twenty-orm.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class TwentyORM {
  constructor(
    private dataSource: DataSource,
    private metadataService: MetadataService,
  ) {}

  workspace(workspaceId: string) {
    return new WorkspaceQueryBuilder(
      this.dataSource,
      this.metadataService,
      workspaceId,
    );
  }
}

// Usage
const companies = await twentyOrm
  .workspace(workspaceId)
  .findMany('company', {
    where: { industry: 'Technology' },
    include: { people: true },
  });
```

### Migrations

```typescript
// database/migrations/1234567890-CreateCompanies.ts
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

```typescript
// modules/company/dto/company.object.ts
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

```typescript
// modules/company/dto/create-company.input.ts
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

```typescript
// modules/company/dto/company-filter.input.ts
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

```typescript
// modules/auth/strategies/jwt.strategy.ts
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

```typescript
// guards/jwt-auth.guard.ts
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

// guards/workspace.guard.ts
@Injectable()
export class WorkspaceGuard implements CanActivate {
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

```typescript
// decorators/workspace.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const Workspace = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.workspace;
  },
);

// decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.user;
  },
);
```

## Job Queue (BullMQ)

### Queue Setup

```typescript
// modules/email/email-queue.module.ts
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
  providers: [EmailProcessor, EmailService],
  exports: [BullModule],
})
export class EmailQueueModule {}
```

### Producer

```typescript
// modules/email/email.service.ts
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class EmailService {
  constructor(
    @InjectQueue('email') private emailQueue: Queue,
  ) {}

  async sendWelcomeEmail(user: User): Promise<void> {
    await this.emailQueue.add('welcome', {
      email: user.email,
      name: user.name,
    });
  }

  async sendPasswordReset(user: User, token: string): Promise<void> {
    await this.emailQueue.add(
      'password-reset',
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
// modules/email/email.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('email')
export class EmailProcessor {
  constructor(private emailSender: EmailSender) {}

  @Process('welcome')
  async handleWelcomeEmail(job: Job) {
    const { email, name } = job.data;

    await this.emailSender.send({
      to: email,
      subject: 'Welcome to Twenty!',
      template: 'welcome',
      context: { name },
    });
  }

  @Process('password-reset')
  async handlePasswordReset(job: Job) {
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

### Redis Cache

```typescript
// modules/cache/cache.module.ts
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      ttl: 60 * 60, // 1 hour
    }),
  ],
})
export class AppCacheModule {}
```

### Cache Usage

```typescript
// modules/company/company.service.ts
import { CACHE_MANAGER, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CompanyService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private companyRepository: CompanyRepository,
  ) {}

  async findOne(id: string, workspaceId: string): Promise<Company> {
    const cacheKey = `company:${workspaceId}:${id}`;

    // Try cache first
    const cached = await this.cacheManager.get<Company>(cacheKey);
    if (cached) return cached;

    // Fetch from database
    const company = await this.companyRepository.findOne({
      where: { id, workspaceId },
    });

    // Store in cache
    await this.cacheManager.set(cacheKey, company, { ttl: 300 });

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
    await this.cacheManager.del(cacheKey);

    return company;
  }
}
```

## WebSocket Support

### Gateway

```typescript
// modules/realtime/realtime.gateway.ts
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

### Exception Filters

```typescript
// filters/http-exception.filter.ts
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

### Logger Service

```typescript
// utils/logger.service.ts
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

See [Backend Testing Guide](./17-backend-testing.md) for detailed testing strategies.

## Next Steps

- [Database & ORM](./12-database-orm.md)
- [GraphQL API](./13-graphql-api.md)
- [Authentication](./14-auth.md)
- [Backend Testing](./17-backend-testing.md)

---

**Related Documentation:**
- [System Architecture](./04-system-architecture.md)
- [Technology Stack](./06-technology-stack.md)
- [Frontend Architecture](./07-frontend-architecture.md)

