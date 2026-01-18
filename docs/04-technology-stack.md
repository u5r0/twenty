# Technology Stack

Comprehensive overview of technologies used in Twenty and the rationale behind each choice.

## Frontend Stack

### Core Framework

#### React 18
**Why:** Industry-standard UI library with excellent ecosystem

- Component-based architecture
- Virtual DOM for performance
- Hooks for state and lifecycle
- Large community and resources
- Concurrentdering features

```typescript
import { useState, useEffect } from 'react';

function MyComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData().then(setData);
  }, []);

  return <div>{data}</div>;
}
```

#### TypeScript 5.9.2
**Why:** Type safety, better developer experience, fewer runtime errors

- Static type checking
- Enhanced IDE support
- Self-documenting code
- Refactoring confidence
- Catches errors at compile time

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  return fetch(`/api/users/${id}`).then(r => r.json());
}
```

### State Management

#### Recoil 0.7.7
**Why:** Modern state management designed for React

- Minimal boilerplate
- Atomic state updates
- Derived state (selectors)
- Async state support
- Time-travel debugging

```typescript
import { atom, selector, useRecoilState } from 'recoil';

const userState = atom({
  key: 'userState',
  default: null,
});

const userNameSelector = selector({
  key: 'userName',
  get: ({ get }) => get(userState)?.name,
});
```

#### Apollo Client 3.7.17
**Why:** Powerful GraphQL client with caching

- Normalized cache
- Optimistic UI updates
- Automatic cache updates
- Subscription support
- DevTools integration

```typescript
import { useQuery, useMutation } from '@apollo/client';

const { data, loading } = useQuery(GET_COMPANIES);
const [createCompany] = useMutation(CREATE_COMPANY);
```

### Styling

#### Emotion 11.11.0
**Why:** CSS-in-JS with great performance

- Scoped styles
- Dynamic styling
- TypeScript support
- SSR support
- Small bundle size

```typescript
import styled from '@emotion/styled';

const Button = styled.button`
  background: ${props => props.theme.primary};
  padding: 10px 20px;
  border-radius: 4px;
`;
```

#### Linaria 6.2.0
**Why:** Zero-runtime CSS-in-JS

- No runtime overhead
- Static CSS extraction
- TypeScript support
- Familiar CSS syntax

```typescript
import { css } from '@linaria/core';

const button = css`
  background: blue;
  padding: 10px;
`;
```

### Build Tools

#### Vite 7.0.0
**Why:** Fast development and optimized production builds

- Lightning-fast HMR
- Native ESM support
- Optimized bundling
- Plugin ecosystem
- TypeScript support

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
});
```

#### SWC
**Why:** Rust-based compiler for faster builds

- 20x faster than Babel
- TypeScript compilation
- JSX transformation
- Minification

### UI Components

#### Radix UI
**Why:** Unstyled, accessible components

- WAI-ARIA compliant
- Keyboard navigation
- Focus management
- Customizable styling

#### Tabler Icons 3.31.0
**Why:** Comprehensive icon set

- 5000+ icons
- Consistent design
- React components
- Customizable

```typescript
import { IconUser, IconMail } from '@tabler/icons-react';

<IconUser size={24} />
```

### Forms

#### React Hook Form
**Why:** Performant form management

- Minimal re-renders
- Built-in validation
- TypeScript support
- Small bundle size

```typescript
import { useForm } from 'react-hook-form';

const { register, handleSubmit } = useForm();
```

### Routing

#### React Router 6.4.4
**Why:** Standard routing solution for React

- Declarative routing
- Nested routes
- Code splitting
- Navigation guards

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/companies" element={<Companies />} />
</Routes>
```

## Backend Stack

### Core Framework

#### NestJS
**Why:** Enterprise-grade Node.js framework

- TypeScript-first
- Modular architecture
- Dependency injection
- Extensive ecosystem
- Built-in testing support

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```

### API Layer

#### GraphQL Yoga
**Why:** Modern GraphQL server

- Schema-first approach
- Subscription support
- Plugin system
- Performance optimized
- Easy integration

```typescript
import { createYoga } from 'graphql-yoga';

const yoga = createYoga({
  schema,
  context: ({ req }) => ({ user: req.user }),
});
```

### Database

#### PostgreSQL 15
**Why:** Robust relational database

- ACID compliance
- JSON support
- Full-text search
- Extensible
- Mature ecosystem

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### TypeORM
**Why:** TypeScript ORM for SQL databases

- TypeScript support
- Active Record/Data Mapper
- Migrations
- Relations
- Query builder

```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @OneToMany(() => Company, company => company.owner)
  companies: Company[];
}
```

#### TwentyORM (Custom)
**Why:** Workspace-aware ORM layer

- Multi-tenant support
- Metadata-driven queries
- Type safety
- Automatic schema resolution

```typescript
const companies = await twentyOrm
  .workspace(workspaceId)
  .findMany('company', {
    where: { industry: 'Technology' }
  });
```

#### ClickHouse
**Why:** Analytics database

- Column-oriented storage
- Fast aggregations
- Compression
- Scalable

### Caching & Jobs

#### Redis 7
**Why:** In-memory data store

- Fast key-value storage
- Pub/sub messaging
- Session storage
- Cache layer

```typescript
await redis.set('user:123', JSON.stringify(user));
const cached = await redis.get('user:123');
```

#### BullMQ
**Why:** Robust job queue

- Redis-based
- Delayed jobs
- Job priorities
- Retry logic
- Progress tracking

```typescript
const queue = new Queue('emails');

await queue.add('send-welcome', {
  email: 'user@example.com',
  name: 'John'
});
```

### Authentication

#### Passport
**Why:** Authentication middleware

- Strategy-based
- Multiple providers
- Session support
- JWT support

```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Request() req) {
  return req.user;
}
```

## Testing Stack

### Unit Testing

#### Jest 29.7.0
**Why:** Comprehensive testing framework

- Fast parallel execution
- Snapshot testing
- Mocking utilities
- Coverage reports

```typescript
describe('UserService', () => {
  it('should create user', async () => {
    const user = await service.create({ name: 'John' });
    expect(user.name).toBe('John');
  });
});
```

#### React Testing Library
**Why:** User-centric testing

- Tests user behavior
- Accessibility-focused
- Simple API
- Best practices

```typescript
import { render, screen } from '@testing-library/react';

test('renders button', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### Component Testing

#### Storybook 8.6.14
**Why:** Component development environment

- Isolated development
- Visual testing
- Documentation
- Interaction testing

```typescript
export default {
  title: 'Components/Button',
  component: Button,
};

export const Primary = {
  args: {
    variant: 'primary',
    children: 'Click me',
  },
};
```

### E2E Testing

#### Playwright
**Why:** Modern browser automation

- Cross-browser testing
- Auto-wait
- Network interception
- Parallel execution

```typescript
test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name=email]', 'user@example.com');
  await page.fill('[name=password]', 'password');
  await page.click('button[type=submit]');
  await expect(page).toHaveURL('/dashboard');
});
```

## Development Tools

### Monorepo Management

#### Nx 22.0.3
**Why:** Smart monorepo tools

- Task caching
- Dependency graph
- Code generation
- Affected commands

```bash
nx affected:test
nx graph
```

### Code Quality

#### ESLint 9.32.0
**Why:** JavaScript linter

- Code consistency
- Error prevention
- Custom rules
- Auto-fix

```javascript
module.exports = {
  extends: ['eslint:recommended'],
  rules: {
    'no-console': 'warn',
  },
};
```

#### Prettier 3.1.1
**Why:** Code formatter

- Consistent formatting
- Opinionated
- Editor integration
- Fast

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2
}
```

### Package Management

#### Yarn 4.9.2
**Why:** Fast, reliable package manager

- Plug'n'Play mode
- Workspaces support
- Zero-installs
- Offline cache

```yaml
# .yarnrc.yml
nodeLinker: node-modules
yarnPath: .yarn/releases/yarn-4.9.2.cjs
```

## Infrastructure

### Containerization

#### Docker
**Why:** Consistent environments

- Reproducible builds
- Isolated services
- Easy deployment
- Multi-stage builds

```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build
CMD ["yarn", "start"]
```

### Orchestration

#### Kubernetes
**Why:** Container orchestration

- Auto-scaling
- Self-healing
- Load balancing
- Rolling updates

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: twenty-server
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: server
        image: twenty/server:latest
```

## Monitoring & Observability

### Error Tracking

#### Sentry
**Why:** Error monitoring

- Real-time alerts
- Stack traces
- Release tracking
- Performance monitoring

```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Analytics

#### Custom Analytics
**Why:** User behavior tracking

- Event tracking
- User flows
- Feature usage
- Performance metrics

## Why These Choices?

### Modern & Maintainable
- TypeScript throughout for type safety
- React and NestJS are industry standards
- Active communities and ecosystems

### Performance
- Vite for fast development
- SWC for fast compilation
- Redis for caching
- ClickHouse for analytics

### Developer Experience
- Nx for monorepo management
- Storybook for component development
- Jest for testing
- ESLint/Prettier for code quality

### Scalability
- PostgreSQL for reliable data storage
- Redis for distributed caching
- BullMQ for job processing
- Kubernetes for orchestration

### Open Source
- All technologies are open source
- Large communities
- Well-documented
- Battle-tested

## Version Management

All versions are locked in `package.json` and `yarn.lock` to ensure consistency across environments.

## Next Steps

- [Frontend Architecture](./07-frontend-architecture.md)
- [Backend Architecture](./11-backend-architecture.md)
- [Testing Strategy](./15-testing-strategy.md)

---

**Related Documentation:**
- [System Architecture](./04-system-architecture.md)
- [Development Setup](./03-development-setup.md)

