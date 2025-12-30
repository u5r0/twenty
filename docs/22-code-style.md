# Code Style Guide

Coding standards and conventions for the Twenty project.

## General Principles

1. **Readability First** - Code is read more than written
2. **Consistency** - Follow existing patterns
3. **Simplicity** - Prefer simple solutions
4. **Type Safety** - Use TypeScript features
5. **Documentation** - Comment complex logic

## TypeScript

### Naming Conventions

**Variables and Functions: camelCase**
```typescript
// Good
const userName = 'John';
function getUserById(id: string) {}

// Bad
const user_name = 'John';
const UserName = 'John';
function get_user_by_id(id: string) {}
```

**Classes and Interfaces: PascalCase**
```typescript
// Good
class UserService {}
interface UserData {}

// Bad
class userService {}
interface userData {}
```

**Constants: UPPER_SNAKE_CASE**
```typescript
// Good
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';

// Bad
const maxRetryCount = 3;
const apiBaseUrl = 'https://api.example.com';
```

**Private Properties:x with underscore (optional)**
```typescript
class UserService {
  private _cache: Map<string, User>;

  // Or without underscore (also acceptable)
  private cache: Map<string, User>;
}
```

**Type Aliases: PascalCase**
```typescript
// Good
type UserId = string;
type UserRole = 'admin' | 'member' | 'viewer';

// Bad
type userId = string;
type user_role = 'admin' | 'member' | 'viewer';
```

### Type Annotations

**Always use explicit types for function parameters and return values:**
```typescript
// Good
function getUser(id: string): Promise<User> {
  return userRepository.findById(id);
}

// Bad
function getUser(id) {
  return userRepository.findById(id);
}
```

**Use type inference for simple variables:**
```typescript
// Good
const count = 0; // inferred as number
const name = 'John'; // inferred as string

// Unnecessary
const count: number = 0;
const name: string = 'John';
```

**Use interfaces for object shapes:**
```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

// Avoid (use interface instead)
type User = {
  id: string;
  name: string;
  email: string;
};
```

**Use type for unions and intersections:**
```typescript
// Good
type UserRole = 'admin' | 'member' | 'viewer';
type AdminUser = User & { role: 'admin' };

// Less ideal
interface UserRole {} // Can't represent unions
```

### Async/Await

**Prefer async/await over promises:**
```typescript
// Good
async function getUser(id: string): Promise<User> {
  const user = await userRepository.findById(id);
  return user;
}

// Avoid
function getUser(id: string): Promise<User> {
  return userRepository.findById(id).then(user => user);
}
```

**Handle errors properly:**
```typescript
// Good
async function getUser(id: string): Promise<User> {
  try {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  } catch (error) {
    logger.error('Failed to get user', { id, error });
    throw error;
  }
}

// Bad
async function getUser(id: string): Promise<User> {
  const user = await userRepository.findById(id);
  return user; // No error handling
}
```

### Array Methods

**Use array methods over loops:**
```typescript
// Good
const names = users.map(user => user.name);
const adults = users.filter(user => user.age >= 18);
const total = numbers.reduce((sum, n) => sum + n, 0);

// Avoid
const names = [];
for (const user of users) {
  names.push(user.name);
}
```

### Optional Chaining and Nullish Coalescing

```typescript
// Good
const userName = user?.profile?.name ?? 'Anonymous';
const count = data?.items?.length ?? 0;

// Avoid
const userName = user && user.profile && user.profile.name || 'Anonymous';
const count = data && data.items && data.items.length || 0;
```

### Destructuring

```typescript
// Good
const { id, name, email } = user;
const [first, second, ...rest] = items;

// Avoid
const id = user.id;
const name = user.name;
const email = user.email;
```

## React

### Component Structure

```typescript
// Good structure
import { useState, useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { Button } from '@/twenty-ui';
import { userState } from '../states/userState';
import { useUser } from '../hooks/useUser';

interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export function UserProfile({ userId, onUpdate }: UserProfileProps) {
  // Hooks
  const [user, setUser] = useRecoilState(userState);
  const { updateUser, loading } = useUser();

  // Local state
  const [isEditing, setIsEditing] = useState(false);

  // Effects
  useEffect(() => {
    // Load user data
  }, [userId]);

  // Event handlers
  const handleSave = async () => {
    await updateUser(user);
    onUpdate?.(user);
    setIsEditing(false);
  };

  // Render
  if (loading) return <Spinner />;

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

### Functional Components

**Always use functional components:**
```typescript
// Good
function MyComponent({ name }: { name: string }) {
  return <div>{name}</div>;
}

// Avoid (class components)
class MyComponent extends React.Component {
  render() {
    return <div>{this.props.name}</div>;
  }
}
```

### Props

**Use interfaces for props:**
```typescript
// Good
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

function Button({ variant = 'primary', size = 'medium', ...props }: ButtonProps) {
  return <button {...props} />;
}

// Bad
function Button(props: any) {
  return <button {...props} />;
}
```

### Hooks

**Custom hooks start with 'use':**
```typescript
// Good
function useUser(id: string) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUser(id).then(setUser);
  }, [id]);

  return user;
}

// Bad
function getUserData(id: string) {
  // ...
}
```

**Follow hooks rules:**
```typescript
// Good
function MyComponent() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Effect logic
  }, [count]);

  return <div>{count}</div>;
}

// Bad
function MyComponent() {
  if (condition) {
    const [count, setCount] = useState(0); // Conditional hook!
  }

  return <div>...</div>;
}
```

### Event Handlers

**Prefix with 'handle':**
```typescript
// Good
function MyComponent() {
  const handleClick = () => {
    console.log('Clicked');
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    // Submit logic
  };

  return (
    <form onSubmit={handleSubmit}>
      <button onClick={handleClick}>Click</button>
    </form>
  );
}
```

### Conditional Rendering

```typescript
// Good
function MyComponent({ user }: { user: User | null }) {
  if (!user) return <LoginPrompt />;

  return (
    <div>
      {user.isAdmin && <AdminPanel />}
      {user.notifications.length > 0 && (
        <NotificationBadge count={user.notifications.length} />
      )}
    </div>
  );
}

// Avoid
function MyComponent({ user }: { user: User | null }) {
  return (
    <div>
      {user ? (
        user.isAdmin ? (
          <AdminPanel />
        ) : null
      ) : (
        <LoginPrompt />
      )}
    </div>
  );
}
```

## NestJS

### Module Structure

```typescript
// Good
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
```

### Service Pattern

```typescript
// Good
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async create(data: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }
}
```

### DTOs and Validation

```typescript
// Good
import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
```

## File Organization

### File Naming

**Components: PascalCase.tsx**
```
UserProfile.tsx
CompanyCard.tsx
SettingsPanel.tsx
```

**Utilities: camelCase.ts**
```
formatDate.ts
validateEmail.ts
apiClient.ts
```

**Types: PascalCase.ts or camelCase.types.ts**
```
User.ts
Company.ts
user.types.ts
```

**Tests: *.test.ts or *.spec.ts**
```
UserProfile.test.tsx
userService.spec.ts
```

### Directory Structure

```
module/
├── components/          # React components
├── hooks/              # Custom hooks
├── states/             # Recoil state
├── graphql/            # GraphQL queries/mutations
├── types/              # TypeScript types
├── utils/              # Utility functions
├── constants/          # Constants
└── __tests__/          # Tests
```

## Comments and Documentation

### JSDoc Comments

```typescript
/**
 * Fetches a user by ID
 *
 * @param id - The user ID
 * @returns The user object
 * @throws {NotFoundException} If user not found
 *
 * @example
 * ```typescript
 * const user = await getUser('123');
 * console.log(user.name);
 * ```
 */
async function getUser(id: string): Promise<User> {
  // Implementation
}
```

### Inline Comments

```typescript
// Good - Explain why, not what
// Use exponential backoff to avoid overwhelming the API
const delay = Math.pow(2, retryCount) * 1000;

// Bad - Obvious comment
// Set delay to 2 to the power of retryCount times 1000
const delay = Math.pow(2, retryCount) * 1000;
```

### TODO Comments

```typescript
// TODO: Implement caching for better performance
// FIXME: Handle edge case when user has no email
// HACK: Temporary workaround until API is fixed
```

## Formatting

### Indentation

- Use 2 spaces for indentation
- No tabs

### Line Length

- Maximum 100 characters per line
- Break long lines logically

### Quotes

- Use single quotes for strings
- Use backticks for template literals

```typescript
// Good
const name = 'John';
const greeting = `Hello, ${name}!`;

// Bad
const name = "John";
const greeting = 'Hello, ' + name + '!';
```

### Semicolons

- Always use semicolons

```typescript
// Good
const x = 1;
const y = 2;

// Bad
const x = 1
const y = 2
```

### Trailing Commas

- Use trailing commas in multi-line arrays and objects

```typescript
// Good
const user = {
  name: 'John',
  email: 'john@example.com',
};

const items = [
  'item1',
  'item2',
  'item3',
];

// Bad
const user = {
  name: 'John',
  email: 'john@example.com'
};
```

## ESLint Configuration

```javascript
// eslint.config.mjs
export default {
  rules: {
    // TypeScript
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',

    // React
    'react/prop-types': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // General
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
  },
};
```

## Prettier Configuration

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100,
  "arrowParens": "avoid"
}
```

## Git Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

### Examples

```
feat(companies): add export functionality

- Add export button to company list
- Implement CSV export service
- Add progress indicator

Closes #123
```

```
fix(auth): resolve token expiration issue

The refresh token was not being properly validated,
causing users to be logged out prematurely.

Fixes #456
```

## Best Practices

### DRY (Don't Repeat Yourself)

```typescript
// Good
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

const price1 = formatCurrency(100);
const price2 = formatCurrency(200);

// Bad
const price1 = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
}).format(100);

const price2 = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
}).format(200);
```

### KISS (Keep It Simple, Stupid)

```typescript
// Good
function isAdult(age: number): boolean {
  return age >= 18;
}

// Bad
function isAdult(age: number): boolean {
  if (age >= 18) {
    return true;
  } else {
    return false;
  }
}
```

### YAGNI (You Aren't Gonna Need It)

Don't add functionality until it's needed.

### Single Responsibility

Each function/class should do one thing well.

```typescript
// Good
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sendEmail(to: string, subject: string, body: string): Promise<void> {
  // Send email logic
}

// Bad
function validateAndSendEmail(email: string, subject: string, body: string): Promise<void> {
  // Validate AND send - doing too much!
}
```

## Tools

### VS Code Extensions

- ESLint
- Prettier
- TypeScript
- GraphQL
- Jest Runner

### Pre-commit Hooks

```bash
# Install Husky
yarn add -D husky

# Set up hooks
npx husky install
npx husky add .husky/pre-commit "yarn lint && yarn test"
```

## Next Steps

- [Contributing Guide](./21-contributing.md)
- [Pull Request Process](./23-pr-process.md)
- [Testing Strategy](./15-testing-strategy.md)

---

**Related Documentation:**
- [Frontend Architecture](./07-frontend-architecture.md)
- [Backend Architecture](./11-backend-architecture.md)

