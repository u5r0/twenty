# Contributing Guide

Thank you for your interest in contributing to Twenty! This guide will help you get started.

## Ways to Contribute

### 1. Code Contributions
- Bug fixes
- New features
- Performance improvements
- Refactoring

### 2. Documentation
- Improve existing docs
- Add examples
- Fix typos
- Translate content

### 3. Testing
- Write tests
- Report bugs
- Test new features
- Improve test coverage

### 4. Community
- Answer questions on Discord
- Help other contributors
- Share yrience
- Write blog posts

## Getting Started

### 1. Fork the Repository

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/twenty.git
cd twenty

# Add upstream remote
git remote add upstream https://github.com/twentyhq/twenty.git
```

### 2. Set Up Development Environment

Follow the [Development Setup Guide](./03-development-setup.md):

```bash
# Install dependencies
yarn install

# Start services
docker-compose -f packages/twenty-docker/docker-compose.yml up -d postgres redis

# Configure environment
cp packages/twenty-server/.env.example packages/twenty-server/.env
cp packages/twenty-front/.env.example packages/twenty-front/.env

# Run migrations
cd packages/twenty-server
yarn database:migrate

# Start development servers
cd ../..
yarn start
```

### 3. Create a Branch

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/my-feature

# Or bug fix branch
git checkout -b fix/bug-description
```

## Development Workflow

### 1. Make Changes

Follow our [Code Style Guide](./22-code-style.md):

```typescript
// Good: Clear, typed, documented
/**
 * Creates a new company record
 * @param data - Company data
 * @returns Created company
 */
async function createCompany(data: CompanyCreateInput): Promise<Company> {
  return await companyRepository.create(data);
}

// Bad: Unclear, untyped, undocumented
function create(d: any) {
  return repo.create(d);
}
```

### 2. Write Tests

All code changes should include tests:

```typescript
// Unit test
describe('CompanyService', () => {
  it('should create company', async () => {
    const company = await service.create({
      name: 'Acme Corp',
    });
    expect(company.name).toBe('Acme Corp');
  });
});

// Component test
describe('CompanyCard', () => {
  it('should render company name', () => {
    render(<CompanyCard company={mockCompany} />);
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });
});
```

### 3. Run Quality Checks

```bash
# Run tests
yarn test

# Lint code
yarn lint

# Format code
yarn fmt

# Type check
yarn typecheck

# Run all checks
yarn test && yarn lint && yarn typecheck
```

### 4. Commit Changes

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Feature
git commit -m "feat: add company export functionality"

# Bug fix
git commit -m "fix: resolve pagination issue in company list"

# Documentation
git commit -m "docs: update API documentation"

# Refactor
git commit -m "refactor: simplify company service logic"

# Test
git commit -m "test: add tests for company creation"

# Chore
git commit -m "chore: update dependencies"
```

**Commit Message Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

**Example:**
```
feat(companies): add bulk export functionality

- Add export button to company list
- Implement CSV export service
- Add progress indicator

Closes #123
```

### 5. Push Changes

```bash
# Push to your fork
git push origin feature/my-feature
```

### 6. Create Pull Request

1. Go to your fork on GitHub
2. Click "New Pull Request"
3. Select your branch
4. Fill in the PR template
5. Submit for review

## Pull Request Guidelines

### PR Title

Follow the same format as commit messages:

```
feat: add company export functionality
fix: resolve pagination issue
docs: update contributing guide
```

### PR Description

Use the provided template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests pass locally
```

### PR Size

Keep PRs focused and manageable:

- ✅ Small: < 200 lines changed
- ⚠️ Medium: 200-500 lines changed
- ❌ Large: > 500 lines changed (consider splitting)

### Review Process

1. **Automated Checks**
   - CI/CD pipeline runs
   - Tests must pass
   - Linting must pass
   - Build must succeed

2. **Code Review**
   - At least one approval required
   - Address reviewer feedback
   - Update PR as needed

3. **Merge**
   - Squash and merge (default)
   - Delete branch after merge

## Code Style

### TypeScript

```typescript
// Use explicit types
function getUser(id: string): Promise<User> {
  return userRepository.findById(id);
}

// Use interfaces for objects
interface User {
  id: string;
  name: string;
  email: string;
}

// Use enums for constants
enum UserRole {
  Admin = 'ADMIN',
  Member = 'MEMBER',
  Viewer = 'VIEWER',
}

// Use async/await over promises
async function fetchData() {
  const data = await api.get('/data');
  return data;
}
```

### React

```typescript
// Use functional components
function MyComponent({ name }: { name: string }) {
  return <div>{name}</div>;
}

// Use hooks
function MyComponent() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Side effects
  }, []);

  return <div>{count}</div>;
}

// Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething();
}, []);
```

### Naming Conventions

```typescript
// Components: PascalCase
function UserProfile() {}

// Functions: camelCase
function getUserById() {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;

// Interfaces: PascalCase with 'I' prefix (optional)
interface User {}

// Types: PascalCase
type UserRole = 'admin' | 'member';

// Files: kebab-case
// user-profile.tsx
// user-service.ts
```

## Testing Guidelines

### Unit Tests

Test individual functions and components:

```typescript
describe('calculateTotal', () => {
  it('should sum array of numbers', () => {
    expect(calculateTotal([1, 2, 3])).toBe(6);
  });

  it('should return 0 for empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });
});
```

### Integration Tests

Test module interactions:

```typescript
describe('UserService', () => {
  it('should create user and send welcome email', async () => {
    const user = await userService.create({ email: 'test@example.com' });
    expect(user).toBeDefined();
    expect(emailService.send).toHaveBeenCalledWith({
      to: 'test@example.com',
      template: 'welcome',
    });
  });
});
```

### E2E Tests

Test user workflows:

```typescript
test('user can create company', async ({ page }) => {
  await page.goto('/companies');
  await page.click('button:has-text("New Company")');
  await page.fill('[name=name]', 'Acme Corp');
  await page.click('button:has-text("Save")');
  await expect(page.locator('text=Acme Corp')).toBeVisible();
});
```

## Documentation

### Code Comments

```typescript
/**
 * Creates a new company record
 *
 * @param data - Company creation data
 * @param options - Optional creation options
 * @returns The created company
 * @throws {ValidationError} If data is invalid
 *
 * @example
 * ```typescript
 * const company = await createCompany({
 *   name: 'Acme Corp',
 *   industry: 'Technology'
 * });
 * ```
 */
async function createCompany(
  data: CompanyCreateInput,
  options?: CreateOptions
): Promise<Company> {
  // Implementation
}
```

### README Updates

Update relevant README files when:
- Adding new features
- Changing APIs
- Updating dependencies
- Modifying setup process

### Documentation Files

Update docs when:
- Adding new concepts
- Changing architecture
- Adding new guides
- Updating examples

## Common Issues

### Tests Failing

```bash
# Clear cache
nx reset

# Reinstall dependencies
rm -rf node_modules
yarn install

# Run tests again
yarn test
```

### Linting Errors

```bash
# Auto-fix linting issues
yarn lint --fix

# Format code
yarn fmt --write
```

### Type Errors

```bash
# Regenerate GraphQL types
cd packages/twenty-front
yarn graphql:generate

# Check types
yarn typecheck
```

### Merge Conflicts

```bash
# Update your branch
git checkout main
git pull upstream main
git checkout feature/my-feature
git rebase main

# Resolve conflicts
# Edit conflicting files
git add .
git rebase --continue
```

## Getting Help

### Discord
Join our [Discord server](https://discord.gg/cx5n4Jzs57) for:
- Questions
- Discussions
- Real-time help

### GitHub Discussions
Use [GitHub Discussions](https://github.com/twentyhq/twenty/discussions) for:
- Feature proposals
- Architecture discussions
- General questions

### GitHub Issues
Use [GitHub Issues](https://github.com/twentyhq/twenty/issues) for:
- Bug reports
- Feature requests
- Task tracking

## Recognition

Contributors are recognized in:
- GitHub contributors page
- Release notes
- Community highlights
- Annual contributor awards

## Code of Conduct

We follow the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/):

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy towards others

## License

By contributing, you agree that your contributions will be licensed under the AGPL-3.0 License.

## Next Steps

- [Code Style Guide](./22-code-style.md)
- [Pull Request Process](./23-pr-process.md)
- [Development Setup](./03-development-setup.md)

---

**Thank you for contributing to Twenty! 🎉**

