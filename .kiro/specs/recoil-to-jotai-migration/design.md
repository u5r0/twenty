# Design Document: Recoil to Jotai Migration

## Overview

This document outlines the design for migrating Twenty's state management from Recoil to Jotai. The migration is necessary because Recoil has been archived by Meta and does not support React 19. Jotai provides a modern, lightweight alternative with similar atomic state management patterns and full React 19 compatibility.

**Key Design Principles:**
1. **Minimal Changes**: Preserve existing naming conventions, file structures, and patterns
2. **Incremental Migration**: Support gradual migration module-by-module
3. **Type Safety**: Maintain full TypeScript support throughout
4. **Performance**: Match or exceed current performance
5. **Developer Experience**: Maintain or improve debugging and development workflows

## Architecture

### Current State Management Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend State                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Recoil (UI State)                                 │ │
│  │  - Atoms (simple state)                            │ │
│  │  - Selectors (derived state)                       │ │
│  │  - Atom Families (parameterized state)             │ │
│  │  - Component-scoped state                          │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Apollo Client Cache (Server State)                │ │
│  │  - GraphQL query results                           │ │
│  │  - Normalized cache                                │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Target State Management Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend State                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Jotai (UI State)                                  │ │
│  │  - Atoms (simple state)                            │ │
│  │  - Derived Atoms (computed state)                  │ │
│  │  - Atom Families (parameterized state)             │ │
│  │  - Provider-scoped state                           │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Apollo Client Cache (Server State) - UNCHANGED    │ │
│  │  - GraphQL query results                           │ │
│  │  - Normalized cache                                │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Core Utility Functions

#### createState (Recoil → Jotai)

**Current Implementation (Recoil):**
```typescript
// packages/twenty-ui/src/utilities/state/utils/createState.ts
import { atom, type AtomEffect } from 'recoil';

export const createState = <ValueType>({
  key,
  defaultValue,
  effects,
}: {
  key: string;
  defaultValue: ValueType;
  effects?: ReadonlyArray<AtomEffect<ValueType>>;
}) => {
  const recoilState = atom<ValueType>({
    key,
    default: defaultValue,
    effects,
  });
  return recoilState;
};
```

**Target Implementation (Jotai):**
```typescript
// packages/twenty-ui/src/utilities/state/utils/createState.ts
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const createState = <ValueType>({
  key,
  defaultValue,
  effects,
}: {
  key: string;
  defaultValue: ValueType;
  effects?: ReadonlyArray<AtomEffect<ValueType>>;
}) => {
  // If effects include storage, use atomWithStorage
  const hasStorageEffect = effects?.some(effect =>
    effect.toString().includes('localStorage') ||
    effect.toString().includes('sessionStorage')
  );

  if (hasStorageEffect) {
    // Extract storage key and type from effects
    return atomWithStorage<ValueType>(key, defaultValue);
  }

  // Standard atom
  const jotaiAtom = atom<ValueType>(defaultValue);
  jotaiAtom.debugLabel = key; // For debugging
  return jotaiAtom;
};

// Type alias for compatibility during migration
type AtomEffect<T> = (options: {
  setSelf: (value: T) => void;
  onSet: (callback: (newValue: T, oldValue: T) => void) => void;
}) => void;
```

**Migration Strategy:**
- Keep the same function name and signature
- Map Recoil effects to Jotai equivalents
- Use `atomWithStorage` for persistence effects
- Add `debugLabel` for DevTools support
- Maintain TypeScript types

#### createFamilyState (Recoil → Jotai)

**Current Implementation (Recoil):**
```typescript
// packages/twenty-front/src/modules/ui/utilities/state/utils/createFamilyState.ts
import { type AtomEffect, atomFamily, type SerializableParam } from 'recoil';

export const createFamilyState = <
  ValueType,
  FamilyKey extends SerializableParam,
>({
  key,
  defaultValue,
  effects,
}: {
  key: string;
  defaultValue: ValueType;
  effects?: ReadonlyArray<AtomEffect<ValueType>>;
}) => {
  return atomFamily<ValueType, FamilyKey>({
    key,
    default: defaultValue,
    effects,
  });
};
```

**Target Implementation (Jotai):**
```typescript
// packages/twenty-front/src/modules/ui/utilities/state/utils/createFamilyState.ts
import { atomFamily } from 'jotai/utils';

export const createFamilyState = <
  ValueType,
  FamilyKey extends string | number,
>({
  key,
  defaultValue,
  effects,
}: {
  key: string;
  defaultValue: ValueType;
  effects?: ReadonlyArray<AtomEffect<ValueType>>;
}) => {
  return atomFamily<FamilyKey, ValueType>(
    (param: FamilyKey) => {
      const familyAtom = atom<ValueType>(defaultValue);
      familyAtom.debugLabel = `${key}(${param})`;
      return familyAtom;
    },
    (a, b) => a === b // Equality function
  );
};

// Type alias for compatibility
type AtomEffect<T> = any; // Simplified for migration
```

**Migration Strategy:**
- Keep the same function name and signature
- Use Jotai's `atomFamily` from `jotai/utils`
- Maintain parameter-based atom creation
- Add debug labels for each family instance
- Preserve type safety

#### createComponentState (Recoil → Jotai)

**Current Implementation (Recoil):**
```typescript
// packages/twenty-front/src/modules/ui/utilities/state/component-state/utils/createComponentState.ts
import { type AtomEffect, atomFamily } from 'recoil';

export const createComponentState = <ValueType>({
  key,
  defaultValue,
  componentInstanceContext,
  effects,
}: CreateComponentInstanceStateArgs<ValueType>): ComponentState<ValueType> => {
  if (isDefined(componentInstanceContext)) {
    globalComponentInstanceContextMap.set(key, componentInstanceContext);
  }

  return {
    type: 'ComponentState',
    key,
    atomFamily: atomFamily<ValueType, ComponentStateKey>({
      key,
      default: defaultValue,
      effects: effects,
    }),
  } satisfies ComponentState<ValueType>;
};
```

**Target Implementation (Jotai):**
```typescript
// packages/twenty-front/src/modules/ui/utilities/state/component-state/utils/createComponentState.ts
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';

export const createComponentState = <ValueType>({
  key,
  defaultValue,
  componentInstanceContext,
  effects,
}: CreateComponentInstanceStateArgs<ValueType>): ComponentState<ValueType> => {
  if (isDefined(componentInstanceContext)) {
    globalComponentInstanceContextMap.set(key, componentInstanceContext);
  }

  return {
    type: 'ComponentState',
    key,
    atomFamily: atomFamily<ComponentStateKey, ValueType>(
      (componentKey: ComponentStateKey) => {
        const componentAtom = atom<ValueType>(defaultValue);
        componentAtom.debugLabel = `${key}(${componentKey.instanceId})`;
        return componentAtom;
      },
      (a, b) => a.instanceId === b.instanceId
    ),
  } satisfies ComponentState<ValueType>;
};
```

**Migration Strategy:**
- Preserve component-scoped state pattern
- Use atomFamily for component instance isolation
- Maintain globalComponentInstanceContextMap
- Keep the same ComponentState interface
- No changes to consuming code

### 2. Hook Migrations

#### useRecoilState → useAtom

**Pattern:**
```typescript
// Before (Recoil)
import { useRecoilState } from 'recoil';
const [value, setValue] = useRecoilState(myState);

// After (Jotai)
import { useAtom } from 'jotai';
const [value, setValue] = useAtom(myState);
```

#### useRecoilValue → useAtomValue

**Pattern:**
```typescript
// Before (Recoil)
import { useRecoilValue } from 'recoil';
const value = useRecoilValue(myState);

// After (Jotai)
import { useAtomValue } from 'jotai';
const value = useAtomValue(myState);
```

#### useSetRecoilState → useSetAtom

**Pattern:**
```typescript
// Before (Recoil)
import { useSetRecoilState } from 'recoil';
const setValue = useSetRecoilState(myState);

// After (Jotai)
import { useSetAtom } from 'jotai';
const setValue = useSetAtom(myState);
```

#### useRecoilCallback → Custom Pattern

**Pattern:**
```typescript
// Before (Recoil)
import { useRecoilCallback } from 'recoil';
const callback = useRecoilCallback(({ snapshot, set }) => async () => {
  const value = await snapshot.getPromise(myState);
  set(otherState, value);
});

// After (Jotai)
import { useSetAtom, useAtomValue } from 'jotai';
import { useCallback } from 'react';

const getValue = useAtomValue(myState);
const setOtherValue = useSetAtom(otherState);
const callback = useCallback(async () => {
  const value = getValue;
  setOtherValue(value);
}, [getValue, setOtherValue]);
```

### 3. Selector Migration

#### Simple Selectors → Derived Atoms

**Pattern:**
```typescript
// Before (Recoil)
import { selector } from 'recoil';

const doubledState = selector({
  key: 'doubledState',
  get: ({ get }) => {
    const value = get(numberState);
    return value * 2;
  },
});

// After (Jotai)
import { atom } from 'jotai';

const doubledState = atom((get) => {
  const value = get(numberState);
  return value * 2;
});
doubledState.debugLabel = 'doubledState';
```

#### Async Selectors → Async Atoms

**Pattern:**
```typescript
// Before (Recoil)
import { selector } from 'recoil';

const userDataState = selector({
  key: 'userDataState',
  get: async ({ get }) => {
    const userId = get(userIdState);
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  },
});

// After (Jotai)
import { atom } from 'jotai';

const userDataState = atom(async (get) => {
  const userId = get(userIdState);
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
});
userDataState.debugLabel = 'userDataState';
```

#### Selector Families → Derived Atom Families

**Pattern:**
```typescript
// Before (Recoil)
import { selectorFamily } from 'recoil';

const userByIdState = selectorFamily({
  key: 'userByIdState',
  get: (userId: string) => ({ get }) => {
    const users = get(usersState);
    return users.find(u => u.id === userId);
  },
});

// After (Jotai)
import { atomFamily } from 'jotai/utils';

const userByIdState = atomFamily((userId: string) =>
  atom((get) => {
    const users = get(usersState);
    return users.find(u => u.id === userId);
  })
);
```

### 4. Component-Scoped State

#### useRecoilComponentState → useAtom with Provider

**Current Pattern:**
```typescript
// Before (Recoil)
const [value, setValue] = useRecoilComponentState(myComponentState);
```

**Target Pattern:**
```typescript
// After (Jotai) - Internal implementation stays the same
const [value, setValue] = useRecoilComponentState(myComponentState);
// No changes to consuming code!
```

**Implementation:**
```typescript
// packages/twenty-front/src/modules/ui/utilities/state/component-state/hooks/useRecoilComponentState.ts
import { useAtom } from 'jotai';

export const useRecoilComponentState = <StateType>(
  componentState: ComponentState<StateType>,
): [StateType, SetterOrUpdater<StateType>] => {
  const instanceId = useContext(ComponentInstanceContext);
  const familyAtom = componentState.atomFamily({ instanceId });
  return useAtom(familyAtom);
};
```

### 5. State Persistence

#### localStorage Effects → atomWithStorage

**Pattern:**
```typescript
// Before (Recoil)
import { atom } from 'recoil';
import { localStorageEffect } from '~/utils/recoil/localStorageEffect';

const myState = atom({
  key: 'myState',
  default: 'default value',
  effects: [localStorageEffect('myState')],
});

// After (Jotai)
import { atomWithStorage } from 'jotai/utils';

const myState = atomWithStorage('myState', 'default value');
myState.debugLabel = 'myState';
```

## Data Models

### Atom Types

```typescript
// Jotai atom types
import { type Atom, type WritableAtom, type PrimitiveAtom } from 'jotai';

// Simple atom (read-write)
type SimpleAtom<T> = PrimitiveAtom<T>;

// Derived atom (read-only)
type DerivedAtom<T> = Atom<T>;

// Async atom
type AsyncAtom<T> = Atom<Promise<T>>;

// Atom family
type AtomFamily<Param, Value> = (param: Param) => PrimitiveAtom<Value>;
```

### Component State Types

```typescript
// Keep existing types, update internal implementation
export type ComponentState<StateType> = {
  type: 'ComponentState';
  key: string;
  atomFamily: AtomFamily<ComponentStateKey, StateType>; // Jotai atomFamily
};

export type ComponentFamilyState<StateType, FamilyKey> = {
  type: 'ComponentFamilyState';
  key: string;
  atomFamily: AtomFamily<
    { instanceId: string; familyKey: FamilyKey },
    StateType
  >;
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: State Value Preservation
*For any* atom migrated from Recoil to Jotai, reading the atom value should return the same value as before migration
**Validates: Requirements 2.5, 14.1**

### Property 2: State Update Consistency
*For any* atom, updating the value through Jotai hooks should trigger the same re-renders as Recoil hooks
**Validates: Requirements 3.6, 14.2**

### Property 3: Atom Family Instance Isolation
*For any* atom family with different parameters, each instance should maintain independent state
**Validates: Requirements 5.5, 14.3**

### Property 4: Component State Scoping
*For any* component-scoped atom, different component instances should have isolated state
**Validates: Requirements 4.3, 14.7**

### Property 5: Async State Resolution
*For any* async atom, the resolved value should match the async selector's resolved value
**Validates: Requirements 6.3, 14.6**

### Property 6: Storage Persistence Round-trip
*For any* atom with storage persistence, writing then reading from storage should return the same value
**Validates: Requirements 7.4, 14.5**

### Property 7: Derived State Computation
*For any* derived atom, the computed value should match the selector's computed value
**Validates: Requirements 14.2**

### Property 8: Hook API Compatibility
*For any* component using state hooks, replacing Recoil hooks with Jotai hooks should not change behavior
**Validates: Requirements 3.1-3.5, 14.4**

## Error Handling

### Migration Errors

1. **Missing Atom Definition**
   - Error: Atom not found during migration
   - Solution: Ensure all atoms are migrated before removing Recoil

2. **Type Mismatch**
   - Error: TypeScript type errors after migration
   - Solution: Update type definitions, use type assertions if needed

3. **Storage Key Conflicts**
   - Error: localStorage/sessionStorage key collisions
   - Solution: Maintain same keys as Recoil for compatibility

4. **Async State Errors**
   - Error: Unhandled promise rejections
   - Solution: Wrap async atoms with error boundaries

### Runtime Errors

1. **Provider Missing**
   - Error: Atom accessed outside Provider
   - Solution: Ensure Provider wraps component tree

2. **Circular Dependencies**
   - Error: Atoms depend on each other circularly
   - Solution: Refactor to break circular dependencies

## Testing Strategy

### Unit Testing

**Test atom creation:**
```typescript
describe('createState', () => {
  it('should create a Jotai atom with correct default value', () => {
    const testAtom = createState({
      key: 'testAtom',
      defaultValue: 'test',
    });

    const store = createStore();
    expect(store.get(testAtom)).toBe('test');
  });
});
```

**Test hook behavior:**
```typescript
describe('useAtom', () => {
  it('should read and write atom values', () => {
    const testAtom = atom('initial');
    const { result } = renderHook(() => useAtom(testAtom));

    expect(result.current[0]).toBe('initial');

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
  });
});
```

### Integration Testing

**Test component state:**
```typescript
describe('Component State', () => {
  it('should isolate state between component instances', () => {
    const TestComponent = ({ id }: { id: string }) => {
      const [value, setValue] = useRecoilComponentState(testComponentState);
      return <div data-testid={id}>{value}</div>;
    };

    render(
      <>
        <TestComponent id="instance1" />
        <TestComponent id="instance2" />
      </>
    );

    // Each instance should have independent state
  });
});
```

### Property-Based Testing

**Test state consistency:**
```typescript
import { fc } from 'fast-check';

describe('State Consistency Property', () => {
  it('should maintain value after set', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        const testAtom = atom(null);
        const store = createStore();

        store.set(testAtom, value);
        const retrieved = store.get(testAtom);

        return retrieved === value;
      })
    );
  });
});
```

## Migration Implementation Plan

### Phase 1: Preparation (Week 1)

1. **Install Jotai**
   - Add `jotai` and `jotai-devtools` to dependencies
   - Verify compatibility with React 19.2

2. **Create Compatibility Layer**
   - Update `createState` to use Jotai internally
   - Update `createFamilyState` to use Jotai internally
   - Update `createComponentState` to use Jotai internally
   - Keep same exports and interfaces

3. **Update Hook Wrappers**
   - Update `useRecoilComponentState` to use `useAtom`
   - Update `useSetRecoilComponentState` to use `useSetAtom`
   - Update `useRecoilComponentValue` to use `useAtomValue`
   - Keep same function names

### Phase 2: Core Migration (Week 2-3)

1. **Migrate Utility Functions**
   - Migrate `createState` implementation
   - Migrate `createFamilyState` implementation
   - Migrate `createComponentState` implementation
   - Run tests after each migration

2. **Migrate Simple Atoms**
   - Identify all simple atoms
   - Convert to Jotai atoms
   - Update imports
   - Verify functionality

3. **Migrate Selectors**
   - Identify all selectors
   - Convert to derived atoms
   - Update dependencies
   - Verify computations

### Phase 3: Advanced Features (Week 4)

1. **Migrate Atom Families**
   - Convert atomFamily definitions
   - Convert selectorFamily definitions
   - Update usage sites
   - Verify parameterization

2. **Migrate Async State**
   - Convert async selectors
   - Add error boundaries if needed
   - Update loading states
   - Verify async behavior

3. **Migrate State Persistence**
   - Convert localStorage effects
   - Convert sessionStorage effects
   - Verify persistence
   - Test hydration

### Phase 4: Testing & Validation (Week 5)

1. **Run Full Test Suite**
   - Unit tests
   - Integration tests
   - E2E tests
   - Visual regression tests

2. **Performance Testing**
   - Measure render counts
   - Measure state update performance
   - Compare with Recoil baseline
   - Optimize if needed

3. **Manual Testing**
   - Test all major features
   - Test state persistence
   - Test component isolation
   - Test async operations

### Phase 5: Cleanup (Week 6)

1. **Remove Recoil**
   - Remove Recoil dependency
   - Remove Recoil imports
   - Remove Recoil-specific code
   - Update documentation

2. **Optimize Bundle**
   - Tree-shake unused code
   - Measure bundle size
   - Verify production build
   - Deploy to staging

## DevTools Integration

### Jotai DevTools Setup

```typescript
// packages/twenty-front/src/App.tsx
import { DevTools } from 'jotai-devtools';
import 'jotai-devtools/styles.css';

function App() {
  return (
    <>
      {process.env.NODE_ENV === 'development' && <DevTools />}
      <YourApp />
    </>
  );
}
```

### Debug Labels

```typescript
// Add debug labels to all atoms for better DevTools experience
const myAtom = atom('default');
myAtom.debugLabel = 'myAtom';

const myDerivedAtom = atom((get) => get(myAtom).toUpperCase());
myDerivedAtom.debugLabel = 'myDerivedAtom';
```

## Performance Considerations

### Bundle Size

- **Recoil**: ~14KB gzipped
- **Jotai**: ~3KB gzipped
- **Savings**: ~11KB reduction

### Runtime Performance

- Jotai uses WeakMap for atom storage (faster lookups)
- Jotai has smaller runtime overhead
- Jotai's dependency tracking is more efficient

### Optimization Strategies

1. **Atom Splitting**: Split large atoms into smaller ones
2. **Lazy Atoms**: Use `atomWithLazy` for expensive computations
3. **Atom Families**: Use for parameterized state to avoid duplication
4. **Memoization**: Jotai automatically memoizes derived atoms

## Documentation Updates

### Developer Guide

1. **State Management Overview**
   - Update to describe Jotai instead of Recoil
   - Explain atomic state management principles
   - Show common patterns

2. **API Reference**
   - Document `createState`
   - Document `createFamilyState`
   - Document `createComponentState`
   - Document all hooks

3. **Migration Guide**
   - Recoil to Jotai mapping
   - Common patterns
   - Troubleshooting

### Code Examples

Update all code examples in documentation to use Jotai:
- State creation examples
- Hook usage examples
- Async state examples
- Component state examples

## Rollback Plan

### If Migration Fails

1. **Revert Commits**
   - Git revert to pre-migration state
   - Restore Recoil dependency
   - Restore Recoil code

2. **Partial Rollback**
   - Keep compatibility layer
   - Revert specific modules
   - Fix issues incrementally

3. **Hybrid Approach**
   - Run Recoil and Jotai side-by-side
   - Migrate gradually over longer period
   - Maintain both until stable

## Success Criteria

1. ✅ All tests passing
2. ✅ No Recoil dependencies remaining
3. ✅ Bundle size reduced
4. ✅ Performance maintained or improved
5. ✅ DevTools working
6. ✅ Documentation updated
7. ✅ Team trained on Jotai patterns
8. ✅ Production deployment successful

---

**Next Steps:**
- Review and approve design
- Create implementation tasks
- Begin Phase 1 preparation

