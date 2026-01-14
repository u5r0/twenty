# Implementation Plan: Recoil to Jotai Migration

## Overview

This implementation plan provides a step-by-step guide for migrating Twenty's state management from Recoil to Jotai. The migration is structured in phases to ensure the application remains functional throughout the process.

## Tasks

- [ ] 1. Phase 1: Preparation and Setup
  - Install Jotai dependencies and create compatibility layer
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 1.1 Install Jotai dependencies
  - Add `jotai` (latest stable) to dependencies in root package.json
  - Add `jotai` (latest stable) to packages/twenty-front/package.json
  - Add `jotai` (latest stable) to packages/twenty-ui/package.json
  - Add `jotai-devtools` (latest stable) to devDependencies
  - Run `yarn install` to install new dependencies
  - Verify Jotai is compatible with React 19.2
  - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [ ]* 1.2 Set up Jotai DevTools
  - Import DevTools in packages/twenty-front/src/App.tsx
  - Add conditional rendering for development mode only
  - Import DevTools CSS styles
  - Test DevTools in development environment
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 1.3 Update createState utility for Jotai
  - Modify packages/twenty-ui/src/utilities/state/utils/createState.ts
  - Import `atom` from 'jotai' instead of 'recoil'
  - Import `atomWithStorage` from 'jotai/utils' for persistence
  - Update implementation to use Jotai atom creation
  - Add debugLabel to atoms for DevTools
  - Handle effects parameter (map to atomWithStorage for storage effects)
  - Keep same function signature and exports
  - _Requirements: 2.1, 2.5, 2.6, 7.2, 7.3_

- [ ]* 1.4 Write unit tests for createState migration
  - Test atom creation with default values
  - Test atom with storage persistence
  - Test debugLabel assignment
  - Verify TypeScript types
  - _Requirements: 10.4, 14.1_

- [ ] 1.5 Update createFamilyState utility for Jotai
  - Modify packages/twenty-front/src/modules/ui/utilities/state/utils/createFamilyState.ts
  - Import `atomFamily` from 'jotai/utils'
  - Update implementation to use Jotai atomFamily
  - Add debugLabel to family atoms
  - Implement equality function for parameter comparison
  - Keep same function signature and exports
  - _Requirements: 2.3, 5.1, 5.2, 5.5_

- [ ]* 1.6 Write unit tests for createFamilyState migration
  - Test atom family creation
  - Test parameter-based atom instances
  - Test instance isolation
  - Verify caching behavior
  - _Requirements: 10.4, 14.3_

- [ ] 1.7 Update createComponentState utility for Jotai
  - Modify packages/twenty-front/src/modules/ui/utilities/state/component-state/utils/createComponentState.ts
  - Import `atom` and `atomFamily` from Jotai
  - Update atomFamily implementation for component scoping
  - Maintain globalComponentInstanceContextMap usage
  - Add debugLabel with component instance ID
  - Keep same ComponentState interface
  - _Requirements: 2.1, 4.1, 4.2, 4.3, 4.4_

- [ ]* 1.8 Write unit tests for createComponentState migration
  - Test component state creation
  - Test component instance isolation
  - Test globalComponentInstanceContextMap integration
  - _Requirements: 10.4, 14.7_

- [ ] 1.9 Update createComponentFamilyState utility for Jotai
  - Modify packages/twenty-front/src/modules/ui/utilities/state/component-state/utils/createComponentFamilyState.ts
  - Update to use Jotai atomFamily
  - Maintain component and family parameter handling
  - Add debugLabel with both component and family identifiers
  - _Requirements: 2.4, 4.1, 5.3_

- [ ] 2. Phase 2: Hook Wrapper Migration
  - Update all hook wrappers to use Jotai hooks internally
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 2.1 Update useRecoilComponentState hook
  - Modify packages/twenty-front/src/modules/ui/utilities/state/component-state/hooks/useRecoilComponentState.ts
  - Import `useAtom` from 'jotai' instead of 'recoil'
  - Update implementation to use Jotai's useAtom
  - Keep same function name and signature
  - Maintain ComponentInstanceContext usage
  - _Requirements: 3.1, 4.3_

- [ ] 2.2 Update useSetRecoilComponentState hook
  - Modify packages/twenty-front/src/modules/ui/utilities/state/component-state/hooks/useSetRecoilComponentState.ts
  - Import `useSetAtom` from 'jotai'
  - Update implementation to use Jotai's useSetAtom
  - Keep same function name and signature
  - _Requirements: 3.3_

- [ ] 2.3 Update useRecoilComponentValue hook
  - Modify packages/twenty-front/src/modules/ui/utilities/state/component-state/hooks/useRecoilComponentValue.ts
  - Import `useAtomValue` from 'jotai'
  - Update implementation to use Jotai's useAtomValue
  - Keep same function name and signature
  - _Requirements: 3.2_

- [ ] 2.4 Update useRecoilComponentFamilyState hook
  - Modify packages/twenty-front/src/modules/ui/utilities/state/component-state/hooks/useRecoilComponentFamilyState.ts
  - Import `useAtom` from 'jotai'
  - Update to work with Jotai atom families
  - Maintain family parameter handling
  - _Requirements: 3.1, 5.4_

- [ ] 2.5 Update useSetRecoilComponentFamilyState hook
  - Modify packages/twenty-front/src/modules/ui/utilities/state/component-state/hooks/useSetRecoilComponentFamilyState.ts
  - Import `useSetAtom` from 'jotai'
  - Update to work with Jotai atom families
  - _Requirements: 3.3, 5.4_

- [ ] 2.6 Update useRecoilComponentCallbackState hook
  - Modify packages/twenty-front/src/modules/ui/utilities/state/component-state/hooks/useRecoilComponentCallbackState.ts
  - Refactor to use Jotai patterns (useAtomValue, useSetAtom, useCallback)
  - Replace Recoil's snapshot API with Jotai equivalents
  - _Requirements: 3.4_

- [ ] 2.7 Update useRecoilComponentFamilyCallbackState hook
  - Modify packages/twenty-front/src/modules/ui/utilities/state/component-state/hooks/useRecoilComponentFamilyCallbackState.ts
  - Refactor to use Jotai patterns with family atoms
  - _Requirements: 3.4, 5.4_

- [ ]* 2.8 Write integration tests for hook wrappers
  - Test useRecoilComponentState behavior
  - Test component instance isolation
  - Test hook wrapper compatibility
  - _Requirements: 10.1, 10.2, 10.4, 14.4_

- [ ] 3. Checkpoint - Verify Compatibility Layer
  - Run all existing tests to ensure compatibility layer works
  - Verify no breaking changes to consuming code
  - Check TypeScript compilation
  - Test in development environment

- [ ] 4. Phase 3: Migrate Simple Atoms
  - Convert simple Recoil atoms to Jotai atoms
  - _Requirements: 2.1, 2.5, 2.6, 14.1_

- [ ] 4.1 Identify all simple atom definitions
  - Search codebase for `atom({` from 'recoil'
  - Create list of all simple atoms (non-family, non-selector)
  - Document atom locations and dependencies
  - _Requirements: 14.1_

- [ ] 4.2 Migrate UI state atoms (packages/twenty-ui)
  - Update packages/twenty-ui/src/display/icon/states/iconsState.ts
  - Update packages/twenty-ui/src/display/avatar/components/states/isInvalidAvatarUrlState.ts
  - Change imports from 'recoil' to 'jotai'
  - Update atom creation to use Jotai syntax
  - Add debugLabel to each atom
  - _Requirements: 2.1, 2.5, 2.6_

- [ ] 4.3 Migrate navigation state atoms
  - Update packages/twenty-front/src/modules/ui/navigation/states/*.ts files
  - Convert navigationDrawerWidthState
  - Convert navigationDrawerExpandedMemorizedState
  - Convert isAdvancedModeEnabledState
  - Convert multiWorkspaceDropdownState
  - Convert currentFavoriteFolderIdState
  - _Requirements: 2.1, 2.5, 2.6_

- [ ] 4.4 Migrate theme state atoms
  - Update packages/twenty-front/src/modules/ui/theme/states/persistedColorSchemeState.ts
  - Convert to use atomWithStorage for localStorage persistence
  - _Requirements: 2.1, 7.2, 7.3, 7.4_

- [ ] 4.5 Migrate workflow state atoms
  - Update workflow-related atom files
  - Convert workflowAiAgentActionAgentState
  - Convert workflowAiAgentPermissionsIsAddingPermissionState
  - Convert workflowAiAgentPermissionsSelectedObjectIdState
  - _Requirements: 2.1, 2.5, 2.6_

- [ ] 4.6 Migrate command menu state atoms
  - Update command menu state files
  - Convert isCommandMenuOpenedState
  - _Requirements: 2.1, 2.5, 2.6_

- [ ] 4.7 Migrate drag-select state atoms
  - Update packages/twenty-front/src/modules/ui/utilities/drag-select/states/*.ts
  - Convert isDragSelectionStartEnabledState
  - _Requirements: 2.1, 2.5, 2.6_

- [ ]* 4.8 Write tests for migrated simple atoms
  - Test atom value reads
  - Test atom value writes
  - Test default values
  - Test storage persistence where applicable
  - _Requirements: 10.4, 14.1_

- [ ] 5. Phase 4: Migrate Selectors to Derived Atoms
  - Convert Recoil selectors to Jotai derived atoms
  - _Requirements: 2.2, 14.2_

- [ ] 5.1 Identify all selector definitions
  - Search codebase for `selector({` from 'recoil'
  - Search codebase for `selectorFamily({` from 'recoil'
  - Create list of all selectors and their dependencies
  - _Requirements: 14.2_

- [ ] 5.2 Migrate simple selectors to derived atoms
  - Convert selector definitions to atom((get) => ...) syntax
  - Update get() calls to use Jotai's get
  - Add debugLabel to derived atoms
  - Maintain computation logic
  - _Requirements: 2.2_

- [ ] 5.3 Migrate view-related selectors
  - Update packages/twenty-front/src/modules/views/states/selectors/*.ts
  - Convert coreViewFromViewIdFamilySelector
  - Convert other view selectors
  - _Requirements: 2.2, 2.4_

- [ ] 5.4 Migrate workflow selectors
  - Update packages/twenty-front/src/modules/workflow/states/selectors/*.ts
  - Convert stepsOutputSchemaFamilySelector
  - Convert other workflow selectors
  - _Requirements: 2.2, 2.4_

- [ ]* 5.5 Write tests for migrated selectors
  - Test derived atom computations
  - Test dependency tracking
  - Test memoization
  - _Requirements: 10.4, 14.2_

- [ ] 6. Phase 5: Migrate Async Selectors
  - Convert async Recoil selectors to Jotai async atoms
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 14.6_

- [ ] 6.1 Identify all async selector definitions
  - Search for async selectors (async get functions)
  - Document async dependencies and error handling
  - _Requirements: 6.1_

- [ ] 6.2 Migrate async selectors to async atoms
  - Convert to atom(async (get) => ...) syntax
  - Preserve async logic and error handling
  - Add debugLabel
  - _Requirements: 6.2, 6.3_

- [ ] 6.3 Add error boundaries for async atoms
  - Wrap components using async atoms with ErrorBoundary
  - Handle loading states with Suspense
  - _Requirements: 6.4_

- [ ]* 6.4 Write tests for async atoms
  - Test async resolution
  - Test error handling
  - Test loading states
  - _Requirements: 10.4, 14.6_

- [ ] 7. Phase 6: Migrate Atom Families
  - Convert Recoil atom families to Jotai atom families
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 14.3_

- [ ] 7.1 Migrate simple atom families
  - Convert atomFamily definitions
  - Update parameter handling
  - Maintain instance caching
  - Add debugLabel with parameter
  - _Requirements: 5.1, 5.2, 5.5_

- [ ] 7.2 Migrate selector families to derived atom families
  - Convert selectorFamily to atomFamily with derived atoms
  - Maintain computation logic
  - Update parameter handling
  - _Requirements: 5.3, 5.4_

- [ ] 7.3 Migrate component family state
  - Update component-scoped atom families
  - Maintain component instance + family parameter isolation
  - _Requirements: 4.1, 5.1_

- [ ]* 7.4 Write tests for atom families
  - Test parameter-based instance creation
  - Test instance isolation
  - Test caching behavior
  - _Requirements: 10.4, 14.3_

- [ ] 8. Phase 7: Migrate State Persistence
  - Convert Recoil atom effects to Jotai persistence patterns
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 14.5_

- [ ] 8.1 Identify atoms with localStorage effects
  - Search for localStorageEffect usage
  - Document storage keys and serialization
  - _Requirements: 7.1_

- [ ] 8.2 Convert localStorage atoms to atomWithStorage
  - Replace atom + effect with atomWithStorage
  - Maintain storage keys for compatibility
  - Preserve serialization/deserialization
  - _Requirements: 7.2, 7.4, 7.5_

- [ ] 8.3 Convert sessionStorage atoms
  - Use atomWithStorage with sessionStorage
  - Maintain storage keys
  - _Requirements: 7.3, 7.4, 7.5_

- [ ]* 8.4 Write tests for state persistence
  - Test localStorage round-trip
  - Test sessionStorage round-trip
  - Test hydration on load
  - _Requirements: 10.4, 14.5_

- [ ] 9. Checkpoint - Run Full Test Suite
  - Run all unit tests
  - Run all integration tests
  - Fix any failing tests
  - Verify no regressions

- [ ] 10. Phase 8: Update Direct Hook Usage
  - Update components that directly import Recoil hooks
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 10.1 Find direct useRecoilState imports
  - Search for `import { useRecoilState } from 'recoil'`
  - Create list of files to update
  - _Requirements: 3.1_

- [ ] 10.2 Replace useRecoilState with useAtom
  - Update imports to `import { useAtom } from 'jotai'`
  - Replace useRecoilState calls with useAtom
  - Verify behavior is unchanged
  - _Requirements: 3.1_

- [ ] 10.3 Replace useRecoilValue with useAtomValue
  - Update imports to `import { useAtomValue } from 'jotai'`
  - Replace useRecoilValue calls with useAtomValue
  - _Requirements: 3.2_

- [ ] 10.4 Replace useSetRecoilState with useSetAtom
  - Update imports to `import { useSetAtom } from 'jotai'`
  - Replace useSetRecoilState calls with useSetAtom
  - _Requirements: 3.3_

- [ ] 10.5 Refactor useRecoilCallback usage
  - Replace with useAtomValue, useSetAtom, and useCallback
  - Maintain callback logic
  - _Requirements: 3.4_

- [ ] 10.6 Handle useRecoilValueLoadable
  - Replace with async atoms and Suspense
  - Add error boundaries
  - _Requirements: 3.5_

- [ ] 11. Phase 9: Update Testing Infrastructure
  - Update test utilities and helpers for Jotai
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [ ] 11.1 Create Jotai test Provider wrapper
  - Create test utility for wrapping components with Jotai Provider
  - Support setting initial atom values
  - _Requirements: 10.1, 10.2_

- [ ] 11.2 Update test utilities
  - Update packages/twenty-front/src/testing utilities
  - Add helpers for mocking atom values
  - _Requirements: 10.3_

- [ ] 11.3 Update Storybook decorators
  - Add Jotai Provider decorator for stories
  - Support initial atom values in stories
  - _Requirements: 19.1, 19.2, 19.3_

- [ ] 11.4 Update all component tests
  - Update test imports
  - Use new Jotai test utilities
  - Verify all tests pass
  - _Requirements: 10.4, 10.5_

- [ ]* 11.5 Document Jotai testing patterns
  - Create testing guide for Jotai
  - Provide examples
  - _Requirements: 10.6, 15.7_

- [ ] 12. Phase 10: Performance Optimization
  - Optimize Jotai usage for performance
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 12.1 Profile render performance
  - Use React DevTools Profiler
  - Measure render counts before and after
  - Identify performance bottlenecks
  - _Requirements: 11.6_

- [ ] 12.2 Optimize atom splitting
  - Split large atoms into smaller ones
  - Reduce unnecessary re-renders
  - _Requirements: 11.1_

- [ ] 12.3 Add lazy atoms where beneficial
  - Use atomWithLazy for expensive computations
  - _Requirements: 11.2_

- [ ] 12.4 Verify memoization
  - Ensure derived atoms are properly memoized
  - _Requirements: 11.3_

- [ ] 12.5 Measure bundle size
  - Compare bundle size before and after migration
  - Verify Jotai bundle is smaller than Recoil
  - _Requirements: 17.3, 17.4, 17.5_

- [ ] 13. Phase 11: Update ESLint Rules
  - Update linting rules for Jotai
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [ ] 13.1 Remove Recoil-specific ESLint rules
  - Remove tools/eslint-rules/rules/matching-state-variable.ts Recoil checks
  - Update rule tests
  - _Requirements: 16.1_

- [ ] 13.2 Add Jotai naming conventions
  - Enforce consistent atom naming (e.g., *State suffix)
  - _Requirements: 16.3_

- [ ] 13.3 Add unused atom detection
  - Create rule to detect unused atoms
  - _Requirements: 16.4_

- [ ] 13.4 Run ESLint on entire codebase
  - Fix any linting errors
  - _Requirements: 16.6_

- [ ] 14. Phase 12: Documentation Updates
  - Update all documentation to reflect Jotai usage
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8_

- [ ] 14.1 Update state management documentation
  - Update docs/09-state-management.md
  - Replace Recoil examples with Jotai examples
  - Explain atomic state management with Jotai
  - _Requirements: 15.1, 15.2, 15.3, 15.8_

- [ ] 14.2 Create Jotai migration guide
  - Document Recoil to Jotai mapping
  - Provide migration examples
  - Include troubleshooting section
  - _Requirements: 15.6_

- [ ] 14.3 Update API documentation
  - Document createState API
  - Document createFamilyState API
  - Document createComponentState API
  - Document all hooks
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 14.4 Update component guidelines
  - Update docs/08-component-guidelines.md
  - Show Jotai usage patterns
  - _Requirements: 15.8_

- [ ] 14.5 Document Jotai DevTools usage
  - Create guide for using Jotai DevTools
  - Show debugging techniques
  - _Requirements: 15.7_

- [ ] 15. Checkpoint - Final Validation
  - Run complete test suite
  - Perform manual testing
  - Verify all features work correctly

- [ ] 16. Phase 13: Remove Recoil
  - Remove all Recoil dependencies and code
  - _Requirements: 1.3, 17.2_

- [ ] 16.1 Remove Recoil from package.json files
  - Remove from root package.json
  - Remove from packages/twenty-front/package.json
  - Remove from packages/twenty-ui/package.json
  - _Requirements: 1.3_

- [ ] 16.2 Remove Recoil imports
  - Search for any remaining `from 'recoil'` imports
  - Remove or replace with Jotai imports
  - _Requirements: 17.2_

- [ ] 16.3 Remove Recoil-specific utilities
  - Remove ~/utils/recoil/localStorageEffect.ts if exists
  - Remove other Recoil-specific helpers
  - _Requirements: 17.2_

- [ ] 16.4 Run yarn install
  - Clean install to remove Recoil from node_modules
  - Verify application builds without Recoil
  - _Requirements: 1.3_

- [ ] 17. Phase 14: Production Deployment
  - Deploy to staging and production
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

- [ ] 17.1 Build production bundle
  - Run production build
  - Verify no build errors
  - Check bundle size
  - _Requirements: 17.1, 20.1_

- [ ] 17.2 Deploy to staging environment
  - Deploy to staging
  - Run smoke tests
  - Verify all features work
  - _Requirements: 20.4_

- [ ] 17.3 Monitor staging performance
  - Check performance metrics
  - Monitor error rates
  - Verify state persistence
  - _Requirements: 20.2, 20.5_

- [ ] 17.4 Deploy to production
  - Deploy to production
  - Monitor closely for issues
  - _Requirements: 20.4_

- [ ] 17.5 Post-deployment verification
  - Verify all features work in production
  - Check performance metrics
  - Monitor error rates
  - Verify state persistence across page reloads
  - Test concurrent state updates
  - _Requirements: 20.2, 20.3, 20.4, 20.5, 20.6_

- [ ] 18. Final Checkpoint - Migration Complete
  - All tests passing ✅
  - No Recoil dependencies ✅
  - Bundle size reduced ✅
  - Performance maintained or improved ✅
  - DevTools working ✅
  - Documentation updated ✅
  - Production deployment successful ✅

## Notes

- Tasks marked with `*` are optional test tasks that can be skipped for faster migration
- Each phase should be completed before moving to the next
- Run tests after each major change
- Keep the application functional at each checkpoint
- The migration can be paused at any checkpoint if needed
- Estimated timeline: 6 weeks with 1-2 developers
