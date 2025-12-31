# Styling Guide

Complete guide to styling components in Twenty using Emotion and Linaria.

## Styling Approaches

Twenty uses two CSS-in-JS solutions:

1. **Emotion** - Runtime CSS-in-JS for dynamic styles
2. **Linaria** - Zero-runtime CSS-in-JS for static styles

## Emotion

### Styled Components

Create styled components with the `styled` API.

```typescript
import styled from '@emotion/styled';

// Basic styled component
const Button = styled.button`
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  background: #5E35B1;
  color: white;

  &:hover {
    background: #7E57C2;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// With props
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
}

const Button = styled.button<ButtonProps>`
  padding: ${props => {
    switch (props.size) {
      case 'small': return '6px 12px';
      case 'large': return '14px 28px';
      default: return '10px 20px';
    }
  }};

  background: ${props => {
    switch (props.variant) {
      case 'secondary': return '#757575';
      case 'danger': return '#F44336';
      default: return '#5E35B1';
    }
  }};

  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  color: white;

  &:hover {
    opacity: 0.9;
  }
`;

// Usage
<Button variant="primary" size="medium">
  Click me
</Button>
```

### CSS Prop

Use the `css` prop for inline styles.

```typescript
import { css } from '@emotion/react';

function MyComponent() {
  return (
    <div
      css={css`
        display: flex;
        gap: 16px;
        padding: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      `}
    >
      <span>Content</span>
    </div>
  );
}

// With props
function Card({ highlighted }: { highlighted: boolean }) {
  return (
    <div
      css={css`
        padding: 20px;
        border: 2px solid ${highlighted ? '#5E35B1' : '#E0E0E0'};
        background: ${highlighted ? '#F3E5F5' : 'white'};
      `}
    >
      Content
    </div>
  );
}
```

### Theme

Access theme values in styled components.

```typescript
import { useTheme } from '@emotion/react';

// Theme definition
export const theme = {
  colors: {
    primary: '#5E35B1',
    secondary: '#7E57C2',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    text: '#212121',
    textSecondary: '#757575',
    background: '#FFFFFF',
    backgroundSecondary: '#F5F5F5',
    border: '#E0E0E0',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '24px',
      xxl: '32px',
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 2px 4px rgba(0, 0, 0, 0.1)',
    lg: '0 4px 8px rgba(0, 0, 0, 0.15)',
    xl: '0 8px 16px rgba(0, 0, 0, 0.2)',
  },
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px',
  },
};

// Using theme in styled components
const Button = styled.button`
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.primary};
  color: white;
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.md};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: ${props => props.theme.shadows.md};

  &:hover {
    background: ${props => props.theme.colors.secondary};
  }
`;

// Using theme with hook
function MyComponent() {
  const theme = useTheme();

  return (
    <div
      css={css`
        padding: ${theme.spacing.lg};
        background: ${theme.colors.background};
      `}
    >
      Content
    </div>
  );
}
```

### Global Styles

Define global styles.

```typescript
import { Global, css } from '@emotion/react';

export function GlobalStyles() {
  return (
    <Global
      styles={css`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html,
        body {
          font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 16px;
          line-height: 1.5;
          color: #212121;
          background: #FFFFFF;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        button {
          font-family: inherit;
        }

        input,
        textarea,
        select {
          font-family: inherit;
          font-size: inherit;
        }
      `}
    />
  );
}

// Usage in App
function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <Router />
    </ThemeProvider>
  );
}
```

## Linaria

### Static Styles

Use Linaria for static styles that don't change.

```typescript
import { css } from '@linaria/core';
import { styled } from '@linaria/react';

// CSS class
const container = css`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 20px;
`;

function MyComponent() {
  return (
    <div className={container}>
      <div>Item 1</div>
      <div>Item 2</div>
      <div>Item 3</div>
    </div>
  );
}

// Styled component
const Card = styled.div`
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

// With props (limited support)
const Button = styled.button<{ variant: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  border-radius: 4px;
  border: none;
  cursor: pointer;

  ${props => props.variant === 'primary' && `
    background: #5E35B1;
    color: white;
  `}

  ${props => props.variant === 'secondary' && `
    background: #757575;
    color: white;
  `}
`;
```

### When to Use Linaria

Use Linaria for:
- Static styles that don't change
- Performance-critical components
- Styles that can be extracted at build time

```typescript
// ✅ Good for Linaria - Static styles
const header = css`
  display: flex;
  justify-content: space-between;
  padding: 20px;
  background: white;
  border-bottom: 1px solid #E0E0E0;
`;

// ❌ Bad for Linaria - Dynamic styles
const button = css`
  background: ${props.color}; // Won't work with Linaria
`;
```

## Common Patterns

### Layout Components

```typescript
import styled from '@emotion/styled';

// Flex container
export const Flex = styled.div<{
  direction?: 'row' | 'column';
  align?: string;
  justify?: string;
  gap?: string;
}>`
  display: flex;
  flex-direction: ${props => props.direction || 'row'};
  align-items: ${props => props.align || 'stretch'};
  justify-content: ${props => props.justify || 'flex-start'};
  gap: ${props => props.gap || '0'};
`;

// Grid container
export const Grid = styled.div<{
  columns?: number;
  gap?: string;
}>`
  display: grid;
  grid-template-columns: repeat(${props => props.columns || 1}, 1fr);
  gap: ${props => props.gap || '16px'};
`;

// Container
export const Container = styled.div<{
  maxWidth?: string;
}>`
  width: 100%;
  max-width: ${props => props.maxWidth || '1200px'};
  margin: 0 auto;
  padding: 0 20px;
`;

// Usage
<Container maxWidth="1400px">
  <Flex direction="column" gap="20px">
    <header>Header</header>
    <Grid columns={3} gap="24px">
      <Card>Item 1</Card>
      <Card>Item 2</Card>
      <Card>Item 3</Card>
    </Grid>
  </Flex>
</Container>
```

### Card Component

```typescript
import styled from '@emotion/styled';

export const Card = styled.div<{
  padding?: string;
  hoverable?: boolean;
}>`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: ${props => props.padding || '20px'};
  transition: box-shadow 0.2s ease;

  ${props => props.hoverable && `
    cursor: pointer;

    &:hover {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
  `}
`;

export const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #E0E0E0;
`;

export const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #212121;
  margin: 0;
`;

export const CardBody = styled.div`
  color: #757575;
  line-height: 1.6;
`;

// Usage
<Card hoverable>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <button>Action</button>
  </CardHeader>
  <CardBody>
    Card content goes here
  </CardBody>
</Card>
```

### Button Variants

```typescript
import styled from '@emotion/styled';
import { css } from '@emotion/react';

const baseButtonStyles = css`
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  font-size: 14px;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const PrimaryButton = styled.button`
  ${baseButtonStyles}
  background: #5E35B1;
  color: white;

  &:hover:not(:disabled) {
    background: #7E57C2;
  }
`;

export const SecondaryButton = styled.button`
  ${baseButtonStyles}
  background: transparent;
  color: #5E35B1;
  border: 1px solid #5E35B1;

  &:hover:not(:disabled) {
    background: #F3E5F5;
  }
`;

export const DangerButton = styled.button`
  ${baseButtonStyles}
  background: #F44336;
  color: white;

  &:hover:not(:disabled) {
    background: #E53935;
  }
`;

export const IconButton = styled.button`
  ${baseButtonStyles}
  padding: 8px;
  background: transparent;
  color: #757575;

  &:hover:not(:disabled) {
    background: #F5F5F5;
  }
`;
```

### Form Components

```typescript
import styled from '@emotion/styled';

export const FormGroup = styled.div`
  margin-bottom: 20px;
`;

export const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #212121;
  font-size: 14px;
`;

export const Input = styled.input<{ error?: boolean }>`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${props => props.error ? '#F44336' : '#E0E0E0'};
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.error ? '#F44336' : '#5E35B1'};
  }

  &::placeholder {
    color: #BDBDBD;
  }
`;

export const TextArea = styled.textarea<{ error?: boolean }>`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${props => props.error ? '#F44336' : '#E0E0E0'};
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.error ? '#F44336' : '#5E35B1'};
  }
`;

export const Select = styled.select<{ error?: boolean }>`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${props => props.error ? '#F44336' : '#E0E0E0'};
  border-radius: 4px;
  font-size: 14px;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${props => props.error ? '#F44336' : '#5E35B1'};
  }
`;

export const ErrorMessage = styled.span`
  display: block;
  margin-top: 4px;
  color: #F44336;
  font-size: 12px;
`;

// Usage
<FormGroup>
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="Enter your email"
    error={!!errors.email}
  />
  {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
</FormGroup>
```

## Responsive Design

### Media Queries

```typescript
import styled from '@emotion/styled';

const breakpoints = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
};

const media = {
  mobile: `@media (max-width: ${breakpoints.mobile})`,
  tablet: `@media (max-width: ${breakpoints.tablet})`,
  desktop: `@media (max-width: ${breakpoints.desktop})`,
  wide: `@media (min-width: ${breakpoints.wide})`,
};

// Responsive component
const Container = styled.div`
  padding: 40px;

  ${media.desktop} {
    padding: 30px;
  }

  ${media.tablet} {
    padding: 20px;
  }

  ${media.mobile} {
    padding: 16px;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;

  ${media.desktop} {
    grid-template-columns: repeat(3, 1fr);
  }

  ${media.tablet} {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  ${media.mobile} {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;
```

## Animations

### Transitions

```typescript
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

// Fade in animation
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const FadeInDiv = styled.div`
  animation: ${fadeIn} 0.3s ease-out;
`;

// Spin animation
const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #E0E0E0;
  border-top-color: #5E35B1;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

// Slide in animation
const slideIn = keyframes`
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
`;

const Sidebar = styled.aside`
  animation: ${slideIn} 0.3s ease-out;
`;
```

## Best Practices

### 1. Use Theme Values

```typescript
// ✅ Good - Use theme
const Button = styled.button`
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.primary};
`;

// ❌ Bad - Hardcoded values
const Button = styled.button`
  padding: 16px;
  background: #5E35B1;
`;
```

### 2. Avoid Inline Styles

```typescript
// ✅ Good - Styled component
const Button = styled.button`
  padding: 10px 20px;
  background: #5E35B1;
`;

// ❌ Bad - Inline styles
<button style={{ padding: '10px 20px', background: '#5E35B1' }}>
  Click me
</button>
```

### 3. Compose Styles

```typescript
// ✅ Good - Compose styles
const baseButton = css`
  padding: 10px 20px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
`;

const PrimaryButton = styled.button`
  ${baseButton}
  background: #5E35B1;
  color: white;
`;

const SecondaryButton = styled.button`
  ${baseButton}
  background: #757575;
  color: white;
`;
```

### 4. Use Semantic Names

```typescript
// ✅ Good - Semantic names
const PrimaryButton = styled.button``;
const DangerButton = styled.button``;

// ❌ Bad - Generic names
const BlueButton = styled.button``;
const RedButton = styled.button``;
```

### 5. Keep Styles Close to Components

```typescript
// ✅ Good - Styles in same file
// Button.tsx
const StyledButton = styled.button``;

export function Button() {
  return <StyledButton>Click me</StyledButton>;
}

// ❌ Bad - Styles in separate file
// styles.ts
export const StyledButton = styled.button``;

// Button.tsx
import { StyledButton } from './styles';
```

## Next Steps

- [Component Guidelines](./08-component-guidelines.md)
- [Frontend Architecture](./07-frontend-architecture.md)
- [Code Style](./22-code-style.md)

---

**Related Documentation:**
- [Technology Stack](./06-technology-stack.md)
- [State Management](./09-state-management.md)
