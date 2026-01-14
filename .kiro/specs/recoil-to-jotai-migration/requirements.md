# Requirements Document: Recoil to Jotai Migration

## Introduction

This document outlines the requirements for migrating the Twenty CRM application from Recoil to Jotai for state management. This migration is necessary because Recoil has been archived by Meta (January 1, 2025) and does not support React 19. Jotai provides a modern, lightweight, and React 19-compatible alternative with similar atomic state management patterns.

## Glossary

- **Twenty_Application**: The complete Twenty CRM monorepo application including frontend and UI library
- **Recoil**: The current state management library (archived, no React 19 support)
- **Jotai**: The target state management library (active, React 19 compatible)
- **Atom**: A unit of state in both Recoil and Jotai
- **Selector**: A derived state computation (Recoil term, similar to Jotai's derived atoms)
- **Atom_Family**: Parameterized atoms that create atom instances based on parameters
- **State_Hook**: React hooks for reading and writing state (useRecoilState → useAtom)
- **State_Migration**: The process of converting Recoil state to Jotai state
- **Component_Refactor**: Updating components to use Jotai hooks instead of Recoil hooks
- **Apollo_Client**: GraphQL client that manages server state (separate from Jotai)
- **UI_State**: Client-side UI state managed by Jotai (filters, selections, view settings)
- **Server_State**: Server data managed by Apollo Client cache

## Requirements

### Requirement 1: Jotai Library Integration

**User Story:** As a developer, I want to install an
 THE Configuration SHALL ensure Jotai works with the existing Vite build system

### Requirement 2: Atom Migration Strategy

**User Story:** As a developer, I want a clear mapping between Recoil atoms and Jotai atoms, so that state migration is systematic and predictable.

#### Acceptance Criteria

1. THE Migration_Strategy SHALL document the mapping from Recoil atom() to Jotai atom()
2. THE Migration_Strategy SHALL document the mapping from Recoil selector() to Jotai derived atoms
3. THE Migration_Strategy SHALL document the mapping from Recoil atomFamily() to Jotai atomFamily()
4. THE Migration_Strategy SHALL document the mapping from Recoil selectorFamily() to Jotai derived atom families
5. THE Migration_Strategy SHALL preserve atom default values during migration
6. THE Migration_Strategy SHALL preserve atom keys/identifiers for debugging

### Requirement 3: Hook Migration

**User Story:** As a developer, I want to migrate Recoil hooks to Jotai hooks, so that components can read and write state using Jotai.

#### Acceptance Criteria

1. THE Migration_Tool SHALL convert useRecoilState to useAtom
2. THE Migration_Tool SHALL convert useRecoilValue to useAtomValue
3. THE Migration_Tool SHALL convert useSetRecoilState to useSetAtom
4. THE Migration_Tool SHALL convert useRecoilCallback to Jotai's equivalent patterns
5. THE Migration_Tool SHALL convert useRecoilValueLoadable to Jotai's async atom patterns
6. THE Migration_Tool SHALL preserve hook dependencies and memoization

### Requirement 4: Scoped State Migration

**User Story:** As a developer, I want to migrate Recoil's scoped state patterns to Jotai equivalents, so that component-specific state isolation is maintained.

#### Acceptance Criteria

1. THE Migration_Strategy SHALL identify all uses of Recoil scoped atoms
2. THE Migration_Strategy SHALL convert scoped atoms to Jotai Provider-based scoping
3. THE Migration_Strategy SHALL maintain state isolation between component instances
4. THE Migration_Strategy SHALL preserve parent-child state relationships
5. THE Migration_Strategy SHALL document Jotai Provider usage patterns

### Requirement 5: Atom Family Migration

**User Story:** As a developer, I want to migrate Recoil atom families to Jotai atom families, so that parameterized state continues to work correctly.

#### Acceptance Criteria

1. THE Migration_Tool SHALL identify all atomFamily definitions
2. THE Migration_Tool SHALL convert Recoil atomFamily to Jotai atomFamily
3. THE Migration_Tool SHALL identify all selectorFamily definitions
4. THE Migration_Tool SHALL convert Recoil selectorFamily to Jotai derived atom families
5. THE Migration_Tool SHALL preserve parameter types and default value functions
6. THE Migration_Tool SHALL maintain atom family instance caching behavior

### Requirement 6: Async State Migration

**User Story:** As a developer, I want to migrate async selectors to Jotai async atoms, so that asynchronous state computations continue to work.

#### Acceptance Criteria

1. THE Migration_Strategy SHALL identify all async Recoil selectors
2. THE Migration_Strategy SHALL convert async selectors to Jotai async atoms
3. THE Migration_Strategy SHALL preserve error handling for async operations
4. THE Migration_Strategy SHALL maintain loading states during async operations
5. THE Migration_Strategy SHALL integrate with React Suspense where appropriate
6. THE Migration_Strategy SHALL preserve async selector dependencies

### Requirement 7: State Persistence Migration

**User Story:** As a developer, I want to migrate Recoil atom effects to Jotai equivalents, so that state persistence continues to work.

#### Acceptance Criteria

1. THE Migration_Strategy SHALL identify all Recoil atom effects
2. THE Migration_Strategy SHALL convert localStorage persistence effects to Jotai patterns
3. THE Migration_Strategy SHALL convert sessionStorage persistence effects to Jotai patterns
4. THE Migration_Strategy SHALL preserve state hydration on application load
5. THE Migration_Strategy SHALL maintain state serialization/deserialization logic
6. THE Migration_Strategy SHALL use jotai-effect or custom solutions for side effects

### Requirement 8: DevTools Integration

**User Story:** As a developer, I want Jotai DevTools for debugging, so that I can inspect and debug state during development.

#### Acceptance Criteria

1. THE Development_Environment SHALL integrate jotai-devtools
2. THE DevTools SHALL display all atoms and their current values
3. THE DevTools SHALL show atom dependency graphs
4. THE DevTools SHALL support time-travel debugging
5. THE DevTools SHALL work in development mode only
6. THE DevTools SHALL not impact production bundle size

### Requirement 9: TypeScript Type Safety

**User Story:** As a developer, I want full TypeScript support for Jotai state, so that type safety is maintained throughout the migration.

#### Acceptance Criteria

1. THE Type_System SHALL infer atom value types correctly
2. THE Type_System SHALL enforce type safety for atom reads and writes
3. THE Type_System SHALL support generic atom families with proper type inference
4. THE Type_System SHALL validate async atom return types
5. THE Type_System SHALL provide autocomplete for atom values
6. THE Type_System SHALL report type errors for incorrect state usage

### Requirement 10: Testing Infrastructure Updates

**User Story:** As a developer, I want updated testing utilities for Jotai, so that component tests continue to work after migration.

#### Acceptance Criteria

1. THE Testing_Infrastructure SHALL provide Jotai Provider wrappers for tests
2. THE Testing_Infrastructure SHALL support setting initial atom values in tests
3. THE Testing_Infrastructure SHALL allow mocking atom values during tests
4. THE Testing_Infrastructure SHALL maintain existing test coverage
5. THE Testing_Infrastructure SHALL update test utilities to use Jotai patterns
6. THE Testing_Infrastructure SHALL document Jotai testing best practices

### Requirement 11: Performance Optimization

**User Story:** As a developer, I want Jotai state management to perform as well as or better than Recoil, so that application performance is maintained or improved.

#### Acceptance Criteria

1. THE Performance_System SHALL minimize unnecessary re-renders
2. THE Performance_System SHALL use Jotai's atomic updates efficiently
3. THE Performance_System SHALL leverage Jotai's built-in memoization
4. THE Performance_System SHALL maintain or improve state update performance
5. THE Performance_System SHALL maintain or reduce bundle size compared to Recoil
6. THE Performance_System SHALL profile and optimize critical state paths

### Requirement 12: Apollo Client Integration

**User Story:** As a developer, I want Jotai to work seamlessly with Apollo Client, so that UI state and server state remain properly separated.

#### Acceptance Criteria

1. THE State_System SHALL maintain clear separation between Jotai (UI state) and Apollo (server state)
2. THE State_System SHALL allow Jotai atoms to derive from Apollo cache when needed
3. THE State_System SHALL prevent state duplication between Jotai and Apollo
4. THE State_System SHALL maintain existing Apollo Client patterns
5. THE State_System SHALL document when to use Jotai vs Apollo for state

### Requirement 13: Incremental Migration Support

**User Story:** As a developer, I want to migrate incrementally, so that the application remains functional during the migration process.

#### Acceptance Criteria

1. THE Migration_Strategy SHALL support running Recoil and Jotai side-by-side temporarily
2. THE Migration_Strategy SHALL allow migrating modules one at a time
3. THE Migration_Strategy SHALL provide a migration checklist for tracking progress
4. THE Migration_Strategy SHALL identify module dependencies for migration ordering
5. THE Migration_Strategy SHALL ensure the application builds and runs at each migration step
6. THE Migration_Strategy SHALL maintain test coverage throughout migration

### Requirement 14: State Migration Validation

**User Story:** As a developer, I want to validate that migrated state behaves identically to Recoil state, so that no functionality is lost during migration.

#### Acceptance Criteria

1. THE Validation_System SHALL verify all atoms are migrated
2. THE Validation_System SHALL verify all selectors are migrated
3. THE Validation_System SHALL verify all atom families are migrated
4. THE Validation_System SHALL verify all hooks are updated
5. THE Validation_System SHALL verify state persistence works correctly
6. THE Validation_System SHALL verify async state operations work correctly
7. THE Validation_System SHALL verify scoped state works correctly
8. THE Validation_System SHALL run all existing tests successfully

### Requirement 15: Documentation Updates

**User Story:** As a developer, I want updated documentation for Jotai state management, so that the team can effectively use Jotai patterns.

#### Acceptance Criteria

1. THE Documentation SHALL describe Jotai atom patterns
2. THE Documentation SHALL describe Jotai derived atom patterns
3. THE Documentation SHALL describe Jotai atom family patterns
4. THE Documentation SHALL describe Jotai async atom patterns
5. THE Documentation SHALL describe Jotai Provider usage for scoping
6. THE Documentation SHALL provide migration examples from Recoil to Jotai
7. THE Documentation SHALL document Jotai DevTools usage
8. THE Documentation SHALL update state management architecture documentation

### Requirement 16: Code Quality and Linting

**User Story:** As a developer, I want ESLint rules updated for Jotai, so that code quality is maintained with Jotai patterns.

#### Acceptance Criteria

1. THE Linting_System SHALL remove Recoil-specific ESLint rules
2. THE Linting_System SHALL add Jotai-specific ESLint rules if available
3. THE Linting_System SHALL enforce consistent Jotai naming conventions
4. THE Linting_System SHALL detect unused atoms
5. THE Linting_System SHALL detect incorrect hook usage
6. THE Linting_System SHALL maintain existing code quality standards

### Requirement 17: Bundle Size Optimization

**User Story:** As a developer, I want to minimize bundle size impact, so that the application loads quickly after migration.

#### Acceptance Criteria

1. THE Build_System SHALL tree-shake unused Jotai utilities
2. THE Build_System SHALL remove all Recoil code after migration
3. THE Build_System SHALL measure bundle size before and after migration
4. THE Build_System SHALL ensure Jotai bundle size is smaller than or equal to Recoil
5. THE Build_System SHALL optimize Jotai imports for minimal bundle impact

### Requirement 18: Migration Tooling

**User Story:** As a developer, I want automated migration tools, so that the migration process is faster and less error-prone.

#### Acceptance Criteria

1. THE Migration_Tool SHALL provide codemod scripts for common patterns
2. THE Migration_Tool SHALL identify all Recoil imports automatically
3. THE Migration_Tool SHALL suggest Jotai equivalents for Recoil patterns
4. THE Migration_Tool SHALL generate migration reports showing progress
5. THE Migration_Tool SHALL validate migrated code for common issues
6. THE Migration_Tool SHALL provide rollback capabilities if needed

### Requirement 19: Storybook Integration

**User Story:** As a developer, I want Storybook to work with Jotai, so that component stories continue to function after migration.

#### Acceptance Criteria

1. THE Storybook_System SHALL render components with Jotai state correctly
2. THE Storybook_System SHALL provide Jotai Provider decorators for stories
3. THE Storybook_System SHALL allow setting initial atom values in stories
4. THE Storybook_System SHALL support Jotai DevTools in Storybook
5. THE Storybook_System SHALL maintain all existing component stories

### Requirement 20: Production Deployment Safety

**User Story:** As a deployment engineer, I want to ensure Jotai works correctly in production, so that users experience no regressions.

#### Acceptance Criteria

1. THE Production_Build SHALL generate valid optimized bundles with Jotai
2. THE Production_Build SHALL maintain or improve performance metrics
3. THE Production_Build SHALL not introduce runtime errors
4. WHEN deployed to production, THE Twenty_Application SHALL function identically to the Recoil version
5. THE Production_Build SHALL maintain state persistence across page reloads
6. THE Production_Build SHALL handle concurrent state updates correctly
