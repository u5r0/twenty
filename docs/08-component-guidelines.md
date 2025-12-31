# Component Guidelines

Best practices for building React components in Twenty.

## Component Design Principles

### 1. Single Responsibility
Each component should do one thing well.

```typescript
// Good - Single responsibility
function UserAvatar({ user }: { user: User }) {
  return (
    <img
      src={user.avatarUrl}
      alt={user.name}
      className="avatar"

}

function UserName({ user }: { user: User }) {
  return <span className="user-name">{user.name}</span>;
}

// Bad - Multiple responsibilities
function UserInfo({ user }: { user: User }) {
  return (
    <div>
      <img src={user.avatarUrl} alt={user.name} />
      <span>{user.name}</span>
      <span>{user.email}</span>
      <button onClick={() => editUser(user)}>Edit</button>
    </div>
  );
}
```

### 2. Composition Over Inheritance
Build complex components from simpler ones.

```typescript
// Good - Composition
function UserCard({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader>
        <UserAvatar user={user} />
        <UserName user={user} />
      </CardHeader>
      <CardBody>
        <UserEmail user={user} />
        <UserPhone user={user} />
      </CardBody>
      <CardFooter>
        <EditButton userId={user.id} />
        <DeleteButton userId={user.id} />
      </CardFooter>
    </Card>
  );
}
```

### 3. Props Over State
Prefer props for data flow when possible.

```typescript
// Good - Controlled component
interface InputProps {
  value: string;
  onChange: (value: string) => void;
}

function Input({ value, onChange }: InputProps) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// Usage
function Form() {
  const [name, setName] = useState('');
  return <Input value={name} onChange={setName} />;
}
```

### 4. Explicit Over Implicit
Be explicit about component behavior.

```typescript
// Good - Explicit loading state
interface UserListProps {
  users: User[];
  loading: boolean;
  error?: Error;
}

function UserList({ users, loading, error }: UserListProps) {
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  if (users.length === 0) return <EmptyState />;

  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}

// Bad - Implicit behavior
function UserList({ users }: { users?: User[] }) {
  if (!users) return <Spinner />; // Is it loading or error?
  return <div>{/* ... */}</div>;
}
```

## Component Types

### 1. Presentational Components

Pure UI components with no business logic.

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onClick,
  children,
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? <Spinner size="small" /> : children}
    </button>
  );
}
```

### 2. Container Components

Handle data fetching and state management.

```typescript
export function UserListContainer() {
  const { users, loading, error, refetch } = useUsers();
  const [selectedId, setSelectedId] = useRecoilState(selectedUserIdState);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;

  return (
    <UserList
      users={users}
      selectedId={selectedId}
      onSelect={setSelectedId}
    />
  );
}
```

### 3. Layout Components

Define page structure and layout.

```typescript
interface PageLayoutProps {
  header?: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function PageLayout({
  header,
  sidebar,
  children,
  footer,
}: PageLayoutProps) {
  return (
    <div className="page-layout">
      {header && <header className="page-header">{header}</header>}
      <div className="page-content">
        {sidebar && <aside className="page-sidebar">{sidebar}</aside>}
        <main className="page-main">{children}</main>
      </div>
      {footer && <footer className="page-footer">{footer}</footer>}
    </div>
  );
}
```

### 4. Higher-Order Components (HOCs)

Wrap components to add functionality.

```typescript
function withAuth<P extends object>(
  Component: ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading } = useAuth();

    if (loading) return <Spinner />;
    if (!user) return <Navigate to="/login" />;

    return <Component {...props} />;
  };
}

// Usage
export default withAuth(DashboardPage);
```

### 5. Render Props Components

Share logic through render props.

```typescript
interface DataLoaderProps<T> {
  query: DocumentNode;
  variables?: any;
  children: (data: T, loading: boolean, error?: Error) => ReactNode;
}

function DataLoader<T>({ query, variables, children }: DataLoaderProps<T>) {
  const { data, loading, error } = useQuery(query, { variables });
  return <>{children(data, loading, error)}</>;
}

// Usage
<DataLoader query={GET_USERS}>
  {(users, loading, error) => {
    if (loading) return <Spinner />;
    if (error) return <ErrorMessage error={error} />;
    return <UserList users={users} />;
  }}
</DataLoader>
```

## Props Design

### Props Interface

```typescript
// Good - Well-defined props
interface UserCardProps {
  user: User;
  variant?: 'compact' | 'detailed';
  showActions?: boolean;
  onEdit?: (user: User) => void;
  onDelete?: (userId: string) => void;
}

// Bad - Unclear props
interface UserCardProps {
  data: any;
  type?: string;
  actions?: boolean;
  callback?: Function;
}
```

### Default Props

```typescript
// Good - Default values in destructuring
function Button({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  children,
}: ButtonProps) {
  return <button>{children}</button>;
}

// Also good - Using defaultProps
Button.defaultProps = {
  variant: 'primary',
  size: 'medium',
  disabled: false,
};
```

### Optional Props

```typescript
interface CardProps {
  title: string;              // Required
  subtitle?: string;          // Optional
  actions?: ReactNode;        // Optional
  onClose?: () => void;       // Optional callback
}

function Card({ title, subtitle, actions, onClose }: CardProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
        {onClose && <button onClick={onClose}>×</button>}
      </div>
      {actions && <div className="card-actions">{actions}</div>}
    </div>
  );
}
```

### Children Props

```typescript
// Simple children
interface CardProps {
  children: ReactNode;
}

// Typed children
interface ListProps {
  children: ReactElement<ItemProps> | ReactElement<ItemProps>[];
}

// Render prop children
interface TabsProps {
  children: (activeTab: string) => ReactNode;
}
```

## State Management

### Local State

Use for UI-only state.

```typescript
function Accordion({ title, children }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="accordion">
      <button onClick={() => setIsOpen(!isOpen)}>
        {title}
      </button>
      {isOpen && <div className="accordion-content">{children}</div>}
    </div>
  );
}
```

### Lifted State

Share state between components.

```typescript
function UserForm() {
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
  });

  return (
    <form>
      <NameInput
        value={formData.name}
        onChange={(name) => setFormData({ ...formData, name })}
      />
      <EmailInput
        value={formData.email}
        onChange={(email) => setFormData({ ...formData, email })}
      />
    </form>
  );
}
```

### Global State (Recoil)

Use for app-wide state.

```typescript
// State definition
export const userState = atom<User | null>({
  key: 'userState',
  default: null,
});

// Component usage
function UserProfile() {
  const [user, setUser] = useRecoilState(userState);

  if (!user) return <LoginPrompt />;

  return <div>{user.name}</div>;
}
```

## Event Handling

### Event Handlers

```typescript
function Form() {
  // Simple handler
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    // Handle submit
  };

  // Handler with parameters
  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  // Async handler
  const handleSave = async () => {
    try {
      await saveData(formData);
      showSuccess('Saved successfully');
    } catch (error) {
      showError('Failed to save');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={(e) => handleFieldChange('name', e.target.value)} />
      <button type="button" onClick={handleSave}>Save</button>
    </form>
  );
}
```

### Callback Props

```typescript
interface ItemProps {
  item: Item;
  onEdit?: (item: Item) => void;
  onDelete?: (itemId: string) => void;
  onSelect?: (itemId: string, selected: boolean) => void;
}

function Item({ item, onEdit, onDelete, onSelect }: ItemProps) {
  return (
    <div>
      <input
        type="checkbox"
        onChange={(e) => onSelect?.(item.id, e.target.checked)}
      />
      <span>{item.name}</span>
      <button onClick={() => onEdit?.(item)}>Edit</button>
      <button onClick={() => onDelete?.(item.id)}>Delete</button>
    </div>
  );
}
```

## Performance Optimization

### React.memo

Prevent unnecessary re-renders.

```typescript
// Memoize component
export const UserCard = memo(function UserCard({ user }: { user: User }) {
  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
});

// With custom comparison
export const UserCard = memo(
  function UserCard({ user }: { user: User }) {
    return <div>{user.name}</div>;
  },
  (prevProps, nextProps) => {
    return prevProps.user.id === nextProps.user.id;
  }
);
```

### useMemo

Memoize expensive computations.

```typescript
function UserList({ users, filter }: UserListProps) {
  // Memoize filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      return user.name.toLowerCase().includes(filter.toLowerCase());
    });
  }, [users, filter]);

  // Memoize sorted users
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [filteredUsers]);

  return (
    <div>
      {sortedUsers.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

### useCallback

Memoize callback functions.

```typescript
function UserList({ users }: { users: User[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Memoize callback
  const handleSelect = useCallback((userId: string, selected: boolean) => {
    setSelectedIds(prev => {
      if (selected) {
        return [...prev, userId];
      } else {
        return prev.filter(id => id !== userId);
      }
    });
  }, []);

  return (
    <div>
      {users.map(user => (
        <UserCard
          key={user.id}
          user={user}
          selected={selectedIds.includes(user.id)}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
}
```

### Code Splitting

Lazy load components.

```typescript
import { lazy, Suspense } from 'react';

// Lazy load component
const UserSettings = lazy(() => import('./UserSettings'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <UserSettings />
    </Suspense>
  );
}
```

## Accessibility

### Semantic HTML

```typescript
// Good - Semantic HTML
function Navigation() {
  return (
    <nav>
      <ul>
        <li><a href="/home">Home</a></li>
        <li><a href="/about">About</a></li>
      </ul>
    </nav>
  );
}

// Bad - Non-semantic
function Navigation() {
  return (
    <div>
      <div onClick={() => navigate('/home')}>Home</div>
      <div onClick={() => navigate('/about')}>About</div>
    </div>
  );
}
```

### ARIA Attributes

```typescript
function Modal({ isOpen, onClose, children }: ModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-hidden={!isOpen}
    >
      <h2 id="modal-title">Modal Title</h2>
      <div>{children}</div>
      <button onClick={onClose} aria-label="Close modal">
        ×
      </button>
    </div>
  );
}
```

### Keyboard Navigation

```typescript
function Dropdown({ items, onSelect }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        onSelect(items[focusedIndex]);
        setIsOpen(false);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div onKeyDown={handleKeyDown}>
      {/* Dropdown content */}
    </div>
  );
}
```

## Error Handling

### Error Boundaries

```typescript
class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### Error States

```typescript
function UserProfile({ userId }: { userId: string }) {
  const { user, loading, error, refetch } = useUser(userId);

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Failed to load user"
        message={error.message}
        onRetry={refetch}
      />
    );
  }

  if (!user) {
    return <NotFound message="User not found" />;
  }

  return <UserCard user={user} />;
}
```

## Testing

### Component Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

## Documentation

### Component Documentation

```typescript
/**
 * Button component for user interactions
 *
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Save
 * </Button>
 * ```
 */
interface ButtonProps {
  /** Button style variant */
  variant?: 'primary' | 'secondary' | 'danger';

  /** Button size */
  size?: 'small' | 'medium' | 'large';

  /** Whether button is disabled */
  disabled?: boolean;

  /** Click handler */
  onClick?: () => void;

  /** Button content */
  children: ReactNode;
}

export function Button(props: ButtonProps) {
  // Implementation
}
```

## Best Practices Summary

1. **Keep components small and focused**
2. **Use TypeScript for type safety**
3. **Prefer composition over inheritance**
4. **Make components reusable**
5. **Handle loading and error states**
6. **Optimize performance with memoization**
7. **Ensure accessibility**
8. **Write tests for components**
9. **Document complex components**
10. **Follow naming conventions**

## Next Steps

- [Frontend Architecture](./07-frontend-architecture.md)
- [State Management](./09-state-management.md)
- [Styling Guide](./10-styling-guide.md)
- [Frontend Testing](./16-frontend-testing.md)

---

**Related Documentation:**
- [Code Style](./22-code-style.md)
- [Technology Stack](./06-technology-stack.md)
