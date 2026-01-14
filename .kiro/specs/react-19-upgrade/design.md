# Design Document: React 19.2 Upgrade

## Overview

This document outlines the design for upgrading Twenty from React 18.2.0 to React 19.2. The upgrade is necessary to access the latest React features, performance improvements, and security updates. However, a critical blocker exists: **Recoil does not support React 19** and has been archived by Meta.

**Solution Strategy:**
The React 19 upgrade **must be performed in conjunction with** the Recoil to Jotai migration. This design document focuses on the React upgrade aspects, with the understanding that Jotai migration happens first or in parallel.

**Key Design Principles:**
1. **Dependency Order**: Migrate to Jotai before or during React 19 upgrade
2. **Minimal Breaking Changes**: Preserve existing code patterns where possible
3. **Incremental Validation**: Test at each step
4. **Type Safety**: Maintain full TypeScript support
5. **Performance**: Match or exceed current performance

## Architecture

### Current Architecture (React 18.2.0)

```
┌─────────────────────────────────────────────────────────┐
│                    React 18.2.0                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Frontend (packages/twenty-front)                  │ │
│  │  - React 18.2.0                                    │ │
│  │  - Recoil 0.7.7 (BLOCKER - no React 19 support)   │ │
│  │  - Apollo Client 3.7.17                            │ │
│  │  - React Router 6.4.4                              │ │
│  │  - Emotion 11.11.1                                 │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌───────────────
            React 19.2                            │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Frontend (packages/twenty-front)                  │ │
│  │  - React 19.2.0 ✅                                 │ │
│  │  - Jotai 2.10.0 ✅ (React 19 compatible)           │ │
│  │  - Apollo Client 3.12+ ✅                          │ │
│  │  - React Router 6.28+ ✅                           │ │
│  │  - Emotion 11.14+ ✅                               │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │  UI Library (packages/twenty-ui)                   │ │
│  │  - React 19.2.0 ✅                                 │ │
│  │  - Jotai 2.10.0 ✅                                 │ │
│  │  - Emotion 11.14+ ✅                               │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Dependency Updates

#### React Core

**Current:**
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "@types/react": "^18.2.39",
  "@types/react-dom": "^18.2.15"
}
```

**Target:**
```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "@types/react": "latest",  // Install latest stable
  "@types/react-dom": "latest"  // Install latest stable
}
```

#### State Management (CRITICAL)

**Current (BLOCKER):**
```json
{
  "recoil": "^0.7.7"  // ❌ Does NOT support React 19, archived
}
```

**Target:**
```json
{
  "jotai": "latest",  // ✅ React 19 compatible (install latest stable)
  "jotai-devtools": "latest"  // Install latest stable
}
```

**Migration Requirement:**
- Recoil to Jotai migration MUST be completed before or during React 19 upgrade
- See `.kiro/specs/recoil-to-jotai-migration/` for full migration plan

#### Testing Libraries

**Current:**
```json
{
  "@testing-library/react": "^16.3.0"
}
```

**Target:**
```json
{
  "@testing-library/react": "^16.3.0"  // Already React 19 compatible
}
```

#### Build Tools

**Current:**
```json
{
  "@vitejs/plugin-react-swc": "3.11.0"
}
```

**Target:**
```json
{
  "@vitejs/plugin-react-swc": "^3.11.0"  // Already React 19 compatible
}
```

#### Styling

**Current:**
```json
{
  "@emotion/react": "^11.11.1",
  "@emotion/styled": "^11.11.0"
}
```

**Target:**
```json
{
  "@emotion/react": "^11.14.0",  // React 19 compatible
  "@emotion/styled": "^11.14.0"
}
```

#### GraphQL Client

**Current:**
```json
{
  "@apollo/client": "^3.7.17"
}
```

**Target:**
```json
{
  "@apollo/client": "^3.12.0"  // React 19 compatible
}
```

#### Router

**Current:**
```json
{
  "react-router-dom": "^6.4.4"
}
```

**Target:**
```json
{
  "react-router-dom": "^6.28.0"  // React 19 compatible
}
```

#### Storybook

**Current:**
```json
{
  "@storybook/react-vite": "^10.1.11",
  "storybook": "^10.1.11"
}
```

**Target:**
```json
{
  "@storybook/react-vite": "^10.1.11",  // Already React 19 compatible
  "storybook": "^10.1.11"
}
```

### 2. Code Migrations

#### forwardRef → ref Prop

**Pattern:**
```typescript
// Before (React 18)
import { forwardRef } from 'react';

const MyComponent = forwardRef<HTMLDivElement, MyProps>(
  ({ children, ...props }, ref) => {
    return <div ref={ref} {...props}>{children}</div>;
  }
);

// After (React 19)
interface MyProps {
  children: React.ReactNode;
  ref?: React.Ref<HTMLDivElement>;  // ref is now a regular prop
}

const MyComponent = ({ children, ref, ...props }: MyProps) => {
  return <div ref={ref} {...props}>{children}</div>;
};
```

**Migration Strategy:**
- Search for all `forwardRef` usage
- Convert to regular function components with ref prop
- Update TypeScript types to include ref in props
- Test each component after migration

#### Context.Provider → Context

**Pattern:**
```typescript
// Before (React 18)
const MyContext = createContext<MyValue>(defaultValue);

function App() {
  return (
    <MyContext.Provider value={value}>
      <Children />
    </MyContext.Provider>
  );
}

// After (React 19)
const MyContext = createContext<MyValue>(defaultValue);

function App() {
  return (
    <MyContext value={value}>
      <Children />
    </MyContext>
  );
}
```

**Migration Strategy:**
- Search for all `.Provider` usage
- Replace with direct Context component
- Maintain all props and children
- Test context functionality

### 3. TypeScript Updates

#### Ref Types

**Before:**
```typescript
interface ComponentProps {
  // ref not in props
}

const Component = forwardRef<HTMLElement, ComponentProps>((props, ref) => {
  // ...
});
```

**After:**
```typescript
interface ComponentProps {
  ref?: React.Ref<HTMLElement>;  // ref is now a prop
}

const Component = ({ ref, ...props }: ComponentProps) => {
  // ...
};
```

#### New Hook Types

React 19 introduces new hooks that need TypeScript support:

```typescript
// useActionState
const [state, formAction, isPending] = useActionState(
  async (previousState: State, formData: FormData) => {
    // async action
    return newState;
  },
  initialState
);

// useFormStatus
const { pending, data, method, action } = useFormStatus();

// useOptimistic
const [optimisticState, setOptimisticState] = useOptimistic(
  currentState,
  (state, optimisticValue) => {
    // compute optimistic state
    return newState;
  }
);

// use (for promises and context)
const value = use(promise);
const contextValue = use(MyContext);
```

## Data Models

### Dependency Compatibility Matrix

**Full Audit:** See `.kiro/specs/react-19-upgrade/COMPATIBILITY_AUDIT.md` for comprehensive analysis of 45+ React packages.

#### Critical Packages

| Package | Current Version | Target Version | React 19 Status | Priority |
|---------|----------------|----------------|-----------------|----------|
| react | 18.2.0 | 19.2.0 | 🔄 **UPGRADE TARGET** | Critical |
| react-dom | 18.2.0 | 19.2.0 | 🔄 **UPGRADE TARGET** | Critical |
| recoil | 0.7.7 | REMOVE | ❌ **BLOCKER** | Critical |
| jotai | N/A | latest | ✅ Compatible | Critical |

#### High Priority - Requires Verification

| Package | Current Version | Target Version | React 19 Status | Notes |
|---------|----------------|----------------|-----------------|-------|
| @tiptap/react | 3.4.2 | latest | ⚠️ **VERIFY** | GitHub issue #6110 reports ReactRenderer issues |
| @hello-pangea/dnd | 16.2.0 | latest | ⚠️ **VERIFY** | React 18 confirmed, React 19 unclear |
| react-data-grid | 7.0.0-beta.13 | stable | ⚠️ **VERIFY** | Update from beta first |
| react-error-boundary | 4.0.11 | latest | ⚠️ **TEST** | Critical for error handling |

#### Already Compatible - Safe to Update

| Package | Current Version | Target Version | React 19 Status |
|---------|----------------|----------------|-----------------|
| @apollo/client | 3.7.17 | latest | ✅ Compatible |
| react-router-dom | 6.4.4 | latest | ✅ Compatible |
| @emotion/react | 11.11.1 | latest | ✅ Compatible |
| @emotion/styled | 11.11.0 | latest | ✅ Compatible |
| framer-motion | 11.18.0 | latest | ✅ Compatible |
| react-hook-form | 7.45.1 | latest | ✅ Compatible |
| @sentry/react | 10.27.0 | latest | ✅ Compatible |
| @vitejs/plugin-react-swc | 3.11.0 | latest | ✅ Compatible |
| @testing-library/react | 16.3.0 | latest | ✅ Compatible |
| @storybook/react-vite | 10.1.11 | latest | ✅ Compatible |

#### Needs Testing (35+ packages)

See COMPATIBILITY_AUDIT.md for complete list including:
- @blocknote/react, @graphiql/react, @lingui/react
- @monaco-editor/react, @nivo/*, @xyflow/react
- react-datepicker, react-dropzone, react-helmet-async
- react-markdown, react-phone-number-input, and more

**Summary Statistics:**
- Total React Packages: 45+
- Critical Blockers: 1 (Recoil)
- High Priority Verification: 3 (@tiptap/react, @hello-pangea/dnd, react-data-grid)
- Needs Testing: 35+
- Already Compatible: 10+

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Dependency Version Consistency
*For any* workspace package, React and React-DOM versions should be identical across all packages
**Validates: Requirements 1.6**

### Property 2: Component Rendering Equivalence
*For any* component, rendering with React 19 should produce the same output as React 18
**Validates: Requirements 14.4**

### Property 3: Ref Forwarding Preservation
*For any* component using refs, migrating from forwardRef to ref prop should maintain ref functionality
**Validates: Requirements 3.4**

### Property 4: Context Value Propagation
*For any* Context, migrating from Context.Provider to Context should maintain value propagation to consumers
**Validates: Requirements 4.4**

### Property 5: Type Safety Preservation
*For any* TypeScript file, upgrading React types should not introduce new type errors unrelated to intentional API changes
**Validates: Requirements 5.5**

### Property 6: Build Success
*For any* build configuration (development, production), the build should complete successfully with React 19
**Validates: Requirements 6.1, 6.4**

### Property 7: Test Suite Passing
*For any* test suite (unit, integration, e2e), all tests should pass with React 19
**Validates: Requirements 7.1, 7.2**

### Property 8: Hot Module Replacement
*For any* component edit in development, HMR should apply changes without full page reload
**Validates: Requirements 13.1, 13.2**

## Error Handling

### Dependency Conflicts

**Error: Peer dependency conflict**
```
npm ERR! peer dep missing: react@^18.0.0, required by recoil@0.7.7
```

**Solution:**
- This confirms Recoil is incompatible with React 19
- Must complete Jotai migration first
- Use `yarn install --ignore-peer-dependencies` temporarily if needed during transition

### Type Errors

**Error: Property 'ref' does not exist on type 'ComponentProps'**
```typescript
// After removing forwardRef
<MyComponent ref={myRef} />  // Type error
```

**Solution:**
- Add ref to component props interface
- Update component signature to accept ref prop

### Build Errors

**Error: Invalid hook call**
```
Error: Invalid hook call. Hooks can only be called inside of the body of a function component.
```

**Solution:**
- Ensure all React packages are on version 19
- Clear node_modules and reinstall
- Check for duplicate React installations

## Testing Strategy

### Unit Testing

**Test dependency versions:**
```typescript
describe('React version', () => {
  it('should be React 19', () => {
    const React = require('react');
    expect(React.version).toMatch(/^19\./);
  });
});
```

**Test ref prop migration:**
```typescript
describe('Component with ref', () => {
  it('should forward ref correctly', () => {
    const ref = createRef<HTMLDivElement>();
    render(<MyComponent ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
```

**Test Context migration:**
```typescript
describe('Context', () => {
  it('should provide value to consumers', () => {
    const { getByText } = render(
      <MyContext value="test">
        <Consumer />
      </MyContext>
    );
    expect(getByText('test')).toBeInTheDocument();
  });
});
```

### Integration Testing

**Test full application:**
```typescript
describe('Application', () => {
  it('should render without errors
', () => {
    const { container } = render(<App />);
    expect(container).toBeInTheDocument();
  });

  it('should handle navigation', () => {
    const { getByText } = render(<App />);
    fireEvent.click(getByText('Navigate'));
    expect(window.location.pathname).toBe('/target');
  });
});
```

### E2E Testing

**Test critical user flows:**
```typescript
test('user can create a company', async ({ page }) => {
  await page.goto('/companies');
  await page.click('button:has-text("New Company")');
  await page.fill('input[name="name"]', 'Acme Corp');
  await page.click('button:has-text("Save")');
  await expect(page.locator('text=Acme Corp')).toBeVisible();
});
```

## Migration Implementation Plan

### Prerequisites

**CRITICAL: Recoil to Jotai Migration**
- The Recoil to Jotai migration MUST be completed before React 19 upgrade
- See `.kiro/specs/recoil-to-jotai-migration/` for full plan
- Estimated timeline: 6 weeks

**CRITICAL: Compatibility Verification**
- Complete compatibility audit has identified 45+ React packages
- See `.kiro/specs/react-19-upgrade/COMPATIBILITY_AUDIT.md` for full analysis
- High priority packages need verification before migration:
  - @tiptap/react (rich text editor)
  - @hello-pangea/dnd (drag & drop)
  - react-data-grid (update from beta to stable)

### Phase 0: Pre-Migration Verification (Week 0)

1. **Verify High Priority Packages**
   - Research @tiptap/react React 19 compatibility (GitHub issue #6110)
   - Research @hello-pangea/dnd React 19 compatibility
   - Update react-data-grid from beta to stable version
   - Test critical packages in isolated environment

2. **Update Compatible Packages**
   - Update all "Already Compatible" packages to latest
   - Run tests after each update
   - Fix any breaking changes
   - See COMPATIBILITY_AUDIT.md for update commands

3. **Establish Baseline**
   - Run full test suite and document results
   - Create visual regression baseline with Storybook
   - Test all critical user flows manually
   - Document current bundle sizes and performance metrics

### Phase 1: Preparation (After Jotai Migration)

1. **Create Feature Branch**
   - Branch from main after Jotai migration is complete
   - Name: `feat/react-19-upgrade`

2. **Audit Dependencies**
   - Run `yarn why react` to find all React dependencies
   - Check peer dependencies for React 19 compatibility
   - Document any incompatible packages

3. **Update Package Versions**
   - Update React core packages to 19.2.0
   - Update @types/react and @types/react-dom
   - Update peer dependencies (Apollo, Router, Emotion, etc.)

### Phase 2: Core Migration (Week 1)

1. **Update Root package.json**
   - Update React versions
   - Update peer dependency versions
   - Run `yarn install`

2. **Update packages/twenty-front/package.json**
   - Update React versions
   - Update peer dependencies
   - Run `yarn install`

3. **Update packages/twenty-ui/package.json**
   - Update React versions
   - Update peer dependencies
   - Run `yarn install`

4. **Fix TypeScript Errors**
   - Run `yarn tsc --noEmit`
   - Fix type errors related to React 19 changes
   - Update component prop types

### Phase 3: Code Migrations (Week 2)

1. **Migrate forwardRef Components**
   - Search for `forwardRef` usage
   - Convert to ref prop pattern
   - Update TypeScript types
   - Test each component

2. **Migrate Context.Provider**
   - Search for `.Provider` usage
   - Replace with direct Context component
   - Test context functionality

3. **Update Ref Callbacks**
   - Search for ref callback cleanup patterns
   - Ensure cleanup functions are properly returned
   - Test ref lifecycle

### Phase 4: Testing (Week 3)

1. **Run Unit Tests**
   - `yarn test`
   - Fix failing tests
   - Update test utilities if needed

2. **Run Integration Tests**
   - `yarn test:integration`
   - Fix failing tests

3. **Run E2E Tests**
   - `yarn test:e2e`
   - Fix failing tests

4. **Manual Testing**
   - Test all major features
   - Test in different browsers
   - Test responsive layouts

### Phase 5: Build and Deploy (Week 4)

1. **Test Development Build**
   - `yarn dev`
   - Verify HMR works
   - Test in development mode

2. **Test Production Build**
   - `yarn build`
   - Verify bundle sizes
   - Test production bundle locally

3. **Deploy to Staging**
   - Deploy to staging environment
   - Run smoke tests
   - Monitor for errors

4. **Deploy to Production**
   - Deploy to production
   - Monitor closely
   - Be ready to rollback if needed

## Performance Considerations

### Bundle Size

**Expected Changes:**
- React 19 is slightly smaller than React 18
- Jotai is ~11KB smaller than Recoil
- Overall bundle size should decrease

**Measurement:**
```bash
# Before
yarn build
ls -lh packages/twenty-front/build/assets/*.js

# After
yarn build
ls -lh packages/twenty-front/build/assets/*.js
```

### Runtime Performance

**React 19 Improvements:**
- Better concurrent rendering
- Improved automatic batching
- Faster hydration
- More efficient reconciliation

**Monitoring:**
- Use React DevTools Profiler
- Measure render times
- Monitor re-render counts
- Check for performance regressions

## Documentation Updates

### Developer Guide

1. **Update React Version References**
   - Change all "React 18" to "React 19"
   - Update code examples

2. **Document New Patterns**
   - Ref prop pattern (no forwardRef)
   - Simplified Context pattern
   - New hooks (useActionState, useFormStatus, useOptimistic, use)

3. **Update Component Guidelines**
   - Show React 19 best practices
   - Update ref handling examples
   - Update context usage examples

### Migration Guide

Create a migration guide documenting:
- React 18 to React 19 changes
- forwardRef migration steps
- Context.Provider migration steps
- Common issues and solutions

## Rollback Plan

### If React 19 Upgrade Fails

1. **Revert Git Commits**
   - `git revert <commit-range>`
   - Restore React 18 versions

2. **Restore Dependencies**
   - Revert package.json changes
   - Run `yarn install`
   - Verify application works

3. **Redeploy Previous Version**
   - Deploy last known good version
   - Monitor for stability

### Partial Rollback

If only specific issues arise:
- Keep React 19 for most packages
- Temporarily pin problematic dependencies
- Fix issues incrementally

## Success Criteria

1. ✅ All dependencies updated to React 19 compatible versions
2. ✅ Jotai migration completed (prerequisite)
3. ✅ All forwardRef components migrated
4. ✅ All Context.Provider usages migrated
5. ✅ All TypeScript errors resolved
6. ✅ All tests passing
7. ✅ Development build works with HMR
8. ✅ Production build succeeds
9. ✅ Bundle size maintained or reduced
10. ✅ Performance maintained or improved
11. ✅ Staging deployment successful
12. ✅ Production deployment successful
13. ✅ Documentation updated

## React 19 Feature Adoption (Phase 2)

**Note:** This section outlines potential React 19 features for future adoption AFTER the core migration is stable.

### Recommended Features for Twenty

1. **useActionState for Forms**
   - Benefit: Simplified form state management
   - Use case: Company/People creation forms
   - Complexity: Low
   - ROI: Medium

2. **useOptimistic for Mutations**
   - Benefit: Better perceived performance
   - Use case: CRM record updates
   - Complexity: Medium
   - ROI: High

3. **Resource Preloading**
   - Benefit: Faster page loads
   - Use case: Critical assets, fonts, icons
   - Complexity: Low
   - ROI: Medium

4. **Document Metadata**
   - Benefit: Simplified SEO management
   - Use case: Multi-tenant page titles/meta tags
   - Complexity: Low
   - ROI: Low

5. **Enhanced Suspense**
   - Benefit: Better loading states
   - Use case: Async data loading
   - Complexity: Medium
   - ROI: Medium

**Recommendation:** Evaluate these features after React 19 migration is stable and team is comfortable with React 19.

---

**Next Steps:**
1. Complete Jotai migration (prerequisite)
2. Review and approve this design
3. Create implementation tasks
4. Begin React 19 upgrade

