# Implementation Tasks: React 19.2 Upgrade

## Overview

This document provides a detailed, step-by-step implementation plan for upgrading Twenty from React 18.2.0 to React 19.2.0.

**Prerequisites:**
- ✅ Recoil to Jotai migration completed
- ✅ All tests passing on current setup
- ✅ Compatibility audit reviewed

**Timeline:** 5 weeks (after Jotai migration)
**Estimated Effort:** 120-160 hours

## Phase 0: Pre-Migration Verification (Week 0)

### Checkpoint 0.1: High Priority Package Verification

**Tasks:**

#### Task 0.1.1: Research @tiptap/react Compatibility
- **Requirement:** REQ-1.1, REQ-1.2
- **Description:** Verify @tiptap/react works with React 19
- **Steps:**
  1. Check GitHub issue #6110 for React 19 status
  2. Check @tiptap/react changelog for React 19 support
  3. Create test branch with React 19 and @tiptap/react
  4. Test rich text editor functionality
  5. Document findings and workarounds if needed
- **Validation:** Rich text editor works without errors
- **Estimated Time:** 4 hours

#### Task 0.1.2: Research @hello-pangea/dnd Compatibility
- **Requirement:** REQ-1.1, REQ-1.2
- **Description:** Verify drag-and-drop library works with React 19
- **Steps:**
  1. Check @hello-pangea/dnd repository for React 19 support
  2. Check for React 19 compatible forks or alternatives
  3. Create test branch with React 19 and @hello-pangea/dnd
  4. Test kanban drag-drop functionality
  5. Document findings and alternatives if needed
- **Validation:** Drag-drop works without errors
- **Estimated Time:** 4 hours


#### Task 0.1.3: Update react-data-grid from Beta
- **Requirement:** REQ-1.1, REQ-1.2
- **Description:** Update react-data-grid to stable version
- **Steps:**
  1. Check react-data-grid for latest stable version
  2. Update package.json to stable version
  3. Run `yarn install`
  4. Test data grid functionality
  5. Fix any breaking changes
- **Validation:** Data grids render and function correctly
- **Estimated Time:** 3 hours

#### Task 0.1.4: Test react-error-boundary
- **Requirement:** REQ-1.1, REQ-1.2
- **Description:** Verify error boundaries work with React 19
- **Steps:**
  1. Create test branch with React 19
  2. Test error boundary functionality
  3. Verify errors are caught and reported to Sentry
  4. Test error recovery flows
- **Validation:** Error boundaries catch and handle errors correctly
- **Estimated Time:** 2 hours

### Checkpoint 0.2: Update Compatible Packages

**Tasks:**

#### Task 0.2.1: Update Apollo Client
- **Requirement:** REQ-1.1, REQ-1.3
- **Description:** Update @apollo/client to latest
- **Steps:**
  1. Run `yarn workspace twenty-front add @apollo/client@latest`
  2. Run `yarn workspace root add @apollo/client@latest`
  3. Run tests: `yarn test`
  4. Fix any breaking changes
- **Validation:** All tests pass, GraphQL queries work
- **Estimated Time:** 2 hours

#### Task 0.2.2: Update Emotion
- **Requirement:** REQ-1.1, REQ-1.3
- **Description:** Update @emotion packages to latest
- **Steps:**
  1. Run update commands for all workspaces (see COMPATIBILITY_AUDIT.md)
  2. Run tests: `yarn test`
  3. Test styled components render correctly
- **Validation:** All tests pass, styles render correctly
- **Estimated Time:** 2 hours

#### Task 0.2.3: Update React Router
- **Requirement:** REQ-1.1, REQ-1.3
- **Description:** Update react-router-dom to latest
- **Steps:**
  1. Run update commands for all workspaces
  2. Run tests: `yarn test`
  3. Test navigation functionality
- **Validation:** All tests pass, navigation works
- **Estimated Time:** 2 hours

#### Task 0.2.4: Update Remaining Compatible Packages
- **Requirement:** REQ-1.1, REQ-1.3
- **Description:** Update framer-motion, react-hook-form, @sentry/react, etc.
- **Steps:**
  1. Run update commands from COMPATIBILITY_AUDIT.md
  2. Run tests after each update
  3. Fix any breaking changes
- **Validation:** All tests pass
- **Estimated Time:** 4 hours

### Checkpoint 0.3: Establish Baseline

**Tasks:**

#### Task 0.3.1: Document Test Baseline
- **Requirement:** REQ-7.1, REQ-7.2
- **Description:** Run and document all test results
- **Steps:**
  1. Run `yarn test` and save output
  2. Run `yarn test:integration` and save output
  3. Run `yarn test:e2e` and save output
  4. Document any flaky tests
- **Validation:** All tests documented
- **Estimated Time:** 2 hours

#### Task 0.3.2: Create Visual Regression Baseline
- **Requirement:** REQ-14.4
- **Description:** Create Storybook visual baseline
- **Steps:**
  1. Run Storybook: `yarn storybook`
  2. Take screenshots of all stories
  3. Save as baseline for comparison
- **Validation:** Visual baseline created
- **Estimated Time:** 2 hours

#### Task 0.3.3: Document Performance Metrics
- **Requirement:** REQ-8.1, REQ-8.2
- **Description:** Measure current performance
- **Steps:**
  1. Build production bundle: `yarn build`
  2. Document bundle sizes
  3. Run Lighthouse audit
  4. Document Core Web Vitals
  5. Use React DevTools Profiler on key pages
- **Validation:** Performance metrics documented
- **Estimated Time:** 3 hours

## Phase 1: Preparation (Week 1)

### Checkpoint 1.1: Create Feature Branch

**Tasks:**

#### Task 1.1.1: Create Branch
- **Requirement:** REQ-1.1
- **Description:** Create feature branch for React 19 upgrade
- **Steps:**
  1. Ensure main branch is up to date
  2. Ensure Jotai migration is merged
  3. Create branch: `git checkout -b feat/react-19-upgrade`
  4. Push branch: `git push -u origin feat/react-19-upgrade`
- **Validation:** Branch created and pushed
- **Estimated Time:** 0.5 hours

### Checkpoint 1.2: Update React Core Packages

**Tasks:**

#### Task 1.2.1: Update Root package.json
- **Requirement:** REQ-1.1, REQ-1.6
- **Description:** Update React versions in root package.json
- **Steps:**
  1. Update `react` to `^19.2.0`
  2. Update `react-dom` to `^19.2.0`
  3. Remove `recoil` (should already be removed by Jotai migration)
  4. Verify `jotai` is present
  5. Commit changes
- **Validation:** package.json updated
- **Estimated Time:** 0.5 hours

#### Task 1.2.2: Update twenty-front package.json
- **Requirement:** REQ-1.1, REQ-1.6
- **Description:** Update React versions in twenty-front
- **Steps:**
  1. Update `react` to `^19.2.0`
  2. Update `react-dom` to `^19.2.0`
  3. Remove `recoil` (should already be removed)
  4. Commit changes
- **Validation:** package.json updated
- **Estimated Time:** 0.5 hours

#### Task 1.2.3: Update twenty-ui package.json
- **Requirement:** REQ-1.1, REQ-1.6
- **Description:** Update React versions in twenty-ui
- **Steps:**
  1. Update `react` to `^19.2.0`
  2. Update `react-dom` to `^19.2.0`
  3. Remove `recoil` (should already be removed)
  4. Commit changes
- **Validation:** package.json updated
- **Estimated Time:** 0.5 hours

#### Task 1.2.4: Update React Types
- **Requirement:** REQ-5.1, REQ-5.5
- **Description:** Update @types/react and @types/react-dom
- **Steps:**
  1. Run `yarn add -D @types/react@latest @types/react-dom@latest`
  2. Commit changes
- **Validation:** Types updated
- **Estimated Time:** 0.5 hours

#### Task 1.2.5: Install Dependencies
- **Requirement:** REQ-1.1
- **Description:** Install all dependencies
- **Steps:**
  1. Run `yarn install`
  2. Verify no peer dependency errors
  3. Check for duplicate React installations: `yarn why react`
- **Validation:** Dependencies installed successfully
- **Estimated Time:** 1 hour

### Checkpoint 1.3: Fix Initial TypeScript Errors

**Tasks:**

#### Task 1.3.1: Run TypeScript Compiler
- **Requirement:** REQ-5.1, REQ-5.5
- **Description:** Identify TypeScript errors
- **Steps:**
  1. Run `yarn tsc --noEmit`
  2. Save error output
  3. Categorize errors by type
- **Validation:** Errors documented
- **Estimated Time:** 1 hour

#### Task 1.3.2: Fix Ref Type Errors
- **Requirement:** REQ-3.1, REQ-5.2
- **Description:** Fix ref-related type errors
- **Steps:**
  1. Search for ref type errors
  2. Add ref to component prop interfaces
  3. Update component signatures
  4. Re-run `yarn tsc --noEmit`
- **Validation:** Ref type errors resolved
- **Estimated Time:** 4 hours

#### Task 1.3.3: Fix Context Type Errors
- **Requirement:** REQ-4.1, REQ-5.3
- **Description:** Fix context-related type errors
- **Steps:**
  1. Search for Context.Provider type errors
  2. Update context usage patterns
  3. Re-run `yarn tsc --noEmit`
- **Validation:** Context type errors resolved
- **Estimated Time:** 2 hours

#### Task 1.3.4: Fix Remaining Type Errors
- **Requirement:** REQ-5.5
- **Description:** Fix any other type errors
- **Steps:**
  1. Address remaining type errors
  2. Update type definitions as needed
  3. Run `yarn tsc --noEmit` until clean
- **Validation:** No TypeScript errors
- **Estimated Time:** 4 hours

## Phase 2: Code Migrations (Week 2)

### Checkpoint 2.1: Migrate forwardRef Components

**Tasks:**

#### Task 2.1.1: Identify forwardRef Usage
- **Requirement:** REQ-3.1
- **Description:** Find all forwardRef components
- **Steps:**
  1. Search codebase: `grep -r "forwardRef" packages/`
  2. Create list of files to migrate
  3. Prioritize by usage frequency
- **Validation:** List of components created
- **Estimated Time:** 1 hour

#### Task 2.1.2: Migrate twenty-ui Components
- **Requirement:** REQ-3.1, REQ-3.2, REQ-3.3, REQ-3.4
- **Description:** Migrate forwardRef in twenty-ui
- **Steps:**
  1. For each component:
     - Remove forwardRef wrapper
     - Add ref to props interface
     - Update component signature
     - Test component
  2. Run tests: `yarn test packages/twenty-ui`
- **Validation:** All twenty-ui components migrated, tests pass
- **Estimated Time:** 8 hours

#### Task 2.1.3: Migrate twenty-front Components
- **Requirement:** REQ-3.1, REQ-3.2, REQ-3.3, REQ-3.4
- **Description:** Migrate forwardRef in twenty-front
- **Steps:**
  1. For each component:
     - Remove forwardRef wrapper
     - Add ref to props interface
     - Update component signature
     - Test component
  2. Run tests: `yarn test packages/twenty-front`
- **Validation:** All twenty-front components migrated, tests pass
- **Estimated Time:** 12 hours

### Checkpoint 2.2: Migrate Context.Provider

**Tasks:**

#### Task 2.2.1: Identify Context.Provider Usage
- **Requirement:** REQ-4.1
- **Description:** Find all Context.Provider usage
- **Steps:**
  1. Search codebase: `grep -r "\.Provider" packages/`
  2. Filter for React Context usage
  3. Create list of files to migrate
- **Validation:** List of contexts created
- **Estimated Time:** 1 hour

#### Task 2.2.2: Migrate Context Providers
- **Requirement:** REQ-4.1, REQ-4.2, REQ-4.3, REQ-4.4
- **Description:** Migrate all Context.Provider to Context
- **Steps:**
  1. For each context:
     - Replace `<Context.Provider value={value}>` with `<Context value={value}>`
     - Verify children are preserved
     - Test context functionality
  2. Run tests
- **Validation:** All contexts migrated, tests pass
- **Estimated Time:** 4 hours

### Checkpoint 2.3: Update Ref Callbacks

**Tasks:**

#### Task 2.3.1: Identify Ref Callback Cleanup
- **Requirement:** REQ-3.5
- **Description:** Find ref callbacks that need cleanup
- **Steps:**
  1. Search for ref callback patterns
  2. Identify callbacks with cleanup logic
  3. Create list of files to update
- **Validation:** List created
- **Estimated Time:** 1 hour

#### Task 2.3.2: Update Ref Callbacks
- **Requirement:** REQ-3.5
- **Description:** Ensure cleanup functions are returned
- **Steps:**
  1. For each ref callback:
     - Ensure cleanup is returned from callback
     - Test ref lifecycle
  2. Run tests
- **Validation:** Ref callbacks updated, tests pass
- **Estimated Time:** 3 hours

## Phase 3: Testing (Week 3)

### Checkpoint 3.1: Unit Testing

**Tasks:**

#### Task 3.1.1: Run Unit Tests
- **Requirement:** REQ-7.1
- **Description:** Run all unit tests
- **Steps:**
  1. Run `yarn test`
  2. Document failing tests
  3. Categorize failures
- **Validation:** Test results documented
- **Estimated Time:** 2 hours

#### Task 3.1.2: Fix Unit Test Failures
- **Requirement:** REQ-7.1
- **Description:** Fix failing unit tests
- **Steps:**
  1. Fix each failing test
  2. Update test utilities if needed
  3. Re-run tests until all pass
- **Validation:** All unit tests pass
- **Estimated Time:** 8 hours

### Checkpoint 3.2: Integration Testing

**Tasks:**

#### Task 3.2.1: Run Integration Tests
- **Requirement:** REQ-7.2
- **Description:** Run all integration tests
- **Steps:**
  1. Run `yarn test:integration`
  2. Document failing tests
  3. Categorize failures
- **Validation:** Test results documented
- **Estimated Time:** 2 hours

#### Task 3.2.2: Fix Integration Test Failures
- **Requirement:** REQ-7.2
- **Description:** Fix failing integration tests
- **Steps:**
  1. Fix each failing test
  2. Update test setup if needed
  3. Re-run tests until all pass
- **Validation:** All integration tests pass
- **Estimated Time:** 6 hours

### Checkpoint 3.3: E2E Testing

**Tasks:**

#### Task 3.3.1: Run E2E Tests
- **Requirement:** REQ-7.3
- **Description:** Run all E2E tests
- **Steps:**
  1. Run `yarn test:e2e`
  2. Document failing tests
  3. Categorize failures
- **Validation:** Test results documented
- **Estimated Time:** 2 hours

#### Task 3.3.2: Fix E2E Test Failures
- **Requirement:** REQ-7.3
- **Description:** Fix failing E2E tests
- **Steps:**
  1. Fix each failing test
  2. Update test scenarios if needed
  3. Re-run tests until all pass
- **Validation:** All E2E tests pass
- **Estimated Time:** 6 hours

### Checkpoint 3.4: Manual Testing

**Tasks:**

#### Task 3.4.1: Test Rich Text Editor
- **Requirement:** REQ-14.1, REQ-14.4
- **Description:** Manually test @tiptap/react functionality
- **Steps:**
  1. Test text formatting (bold, italic, underline)
  2. Test lists and headings
  3. Test links and images
  4. Test undo/redo
  5. Document any issues
- **Validation:** Rich text editor works correctly
- **Estimated Time:** 2 hours

#### Task 3.4.2: Test Drag and Drop
- **Requirement:** REQ-14.2, REQ-14.4
- **Description:** Manually test @hello-pangea/dnd functionality
- **Steps:**
  1. Test kanban board drag-drop
  2. Test list reordering
  3. Test drag handles
  4. Document any issues
- **Validation:** Drag-drop works correctly
- **Estimated Time:** 2 hours

#### Task 3.4.3: Test Data Grids
- **Requirement:** REQ-14.3, REQ-14.4
- **Description:** Manually test react-data-grid functionality
- **Steps:**
  1. Test grid rendering
  2. Test sorting and filtering
  3. Test cell editing
  4. Test selection
  5. Document any issues
- **Validation:** Data grids work correctly
- **Estimated Time:** 2 hours

#### Task 3.4.4: Test Forms
- **Requirement:** REQ-14.4
- **Description:** Manually test form functionality
- **Steps:**
  1. Test company/people creation forms
  2. Test date pickers
  3. Test input masks
  4. Test validation
  5. Document any issues
- **Validation:** Forms work correctly
- **Estimated Time:** 2 hours

#### Task 3.4.5: Test Error Boundaries
- **Requirement:** REQ-14.4
- **Description:** Manually test error handling
- **Steps:**
  1. Trigger errors in different components
  2. Verify error boundaries catch errors
  3. Verify errors reported to Sentry
  4. Test error recovery
- **Validation:** Error handling works correctly
- **Estimated Time:** 2 hours

#### Task 3.4.6: Test Navigation
- **Requirement:** REQ-14.4
- **Description:** Manually test routing
- **Steps:**
  1. Test all major routes
  2. Test navigation between pages
  3. Test browser back/forward
  4. Test deep linking
- **Validation:** Navigation works correctly
- **Estimated Time:** 1 hour

#### Task 3.4.7: Test Internationalization
- **Requirement:** REQ-14.4
- **Description:** Manually test i18n
- **Steps:**
  1. Test language switching
  2. Verify translations load
  3. Test RTL languages if supported
- **Validation:** i18n works correctly
- **Estimated Time:** 1 hour

## Phase 4: Build and Performance (Week 4)

### Checkpoint 4.1: Development Build

**Tasks:**

#### Task 4.1.1: Test Development Build
- **Requirement:** REQ-6.1, REQ-13.1
- **Description:** Verify development build works
- **Steps:**
  1. Run `yarn dev`
  2. Verify application loads
  3. Test HMR by editing components
  4. Verify no console errors
- **Validation:** Development build works, HMR functional
- **Estimated Time:** 2 hours

#### Task 4.1.2: Fix Development Issues
- **Requirement:** REQ-6.1, REQ-13.1
- **Description:** Fix any development build issues
- **Steps:**
  1. Address any errors or warnings
  2. Fix HMR issues if any
  3. Re-test until stable
- **Validation:** Development build stable
- **Estimated Time:** 4 hours

### Checkpoint 4.2: Production Build

**Tasks:**

#### Task 4.2.1: Test Production Build
- **Requirement:** REQ-6.4, REQ-8.1
- **Description:** Verify production build works
- **Steps:**
  1. Run `yarn build`
  2. Verify build completes successfully
  3. Check bundle sizes
  4. Test production bundle locally: `yarn start:prod`
- **Validation:** Production build succeeds
- **Estimated Time:** 2 hours

#### Task 4.2.2: Analyze Bundle Size
- **Requirement:** REQ-8.1
- **Description:** Compare bundle sizes
- **Steps:**
  1. Document new bundle sizes
  2. Compare with baseline from Phase 0
  3. Investigate any significant increases
  4. Optimize if needed
- **Validation:** Bundle size acceptable
- **Estimated Time:** 3 hours

#### Task 4.2.3: Performance Testing
- **Requirement:** REQ-8.2, REQ-8.3
- **Description:** Measure performance
- **Steps:**
  1. Run Lighthouse audit
  2. Measure Core Web Vitals
  3. Use React DevTools Profiler
  4. Compare with baseline
  5. Document results
- **Validation:** Performance maintained or improved
- **Estimated Time:** 4 hours

### Checkpoint 4.3: Storybook

**Tasks:**

#### Task 4.3.1: Test Storybook Build
- **Requirement:** REQ-6.2, REQ-6.3
- **Description:** Verify Storybook works
- **Steps:**
  1. Run `yarn storybook`
  2. Verify all stories load
  3. Test component interactions
  4. Build Storybook: `yarn build-storybook`
- **Validation:** Storybook works correctly
- **Estimated Time:** 2 hours

#### Task 4.3.2: Visual Regression Testing
- **Requirement:** REQ-14.4
- **Description:** Compare visual changes
- **Steps:**
  1. Take screenshots of all stories
  2. Compare with baseline from Phase 0
  3. Document any visual changes
  4. Verify changes are intentional
- **Validation:** No unintended visual changes
- **Estimated Time:** 3 hours

## Phase 5: Deployment (Week 5)

### Checkpoint 5.1: Staging Deployment

**Tasks:**

#### Task 5.1.1: Deploy to Staging
- **Requirement:** REQ-9.1, REQ-9.2
- **Description:** Deploy to staging environment
- **Steps:**
  1. Push branch to remote
  2. Create pull request
  3. Deploy to staging
  4. Verify deployment successful
- **Validation:** Staging deployment successful
- **Estimated Time:** 2 hours

#### Task 5.1.2: Staging Smoke Tests
- **Requirement:** REQ-9.3
- **Description:** Run smoke tests on staging
- **Steps:**
  1. Test critical user flows
  2. Test authentication
  3. Test data operations (CRUD)
  4. Test integrations
  5. Document any issues
- **Validation:** Smoke tests pass
- **Estimated Time:** 3 hours

#### Task 5.1.3: Staging Load Testing
- **Requirement:** REQ-8.3
- **Description:** Test performance under load
- **Steps:**
  1. Run load tests
  2. Monitor server metrics
  3. Monitor client metrics
  4. Document results
- **Validation:** Performance acceptable under load
- **Estimated Time:** 3 hours

#### Task 5.1.4: Monitor Staging
- **Requirement:** REQ-10.1, REQ-10.2
- **Description:** Monitor staging for errors
- **Steps:**
  1. Check Sentry for errors
  2. Check application logs
  3. Monitor for 24-48 hours
  4. Address any issues
- **Validation:** No critical errors in staging
- **Estimated Time:** 4 hours (spread over 2 days)

### Checkpoint 5.2: Documentation

**Tasks:**

#### Task 5.2.1: Update Developer Documentation
- **Requirement:** REQ-15.1, REQ-15.2
- **Description:** Update docs for React 19
- **Steps:**
  1. Update React version references
  2. Document new patterns (ref prop, Context)
  3. Update code examples
  4. Document breaking changes
- **Validation:** Documentation updated
- **Estimated Time:** 4 hours

#### Task 5.2.2: Create Migration Guide
- **Requirement:** REQ-15.3
- **Description:** Document migration process
- **Steps:**
  1. Document React 18 to 19 changes
  2. Document forwardRef migration
  3. Document Context.Provider migration
  4. Document common issues and solutions
- **Validation:** Migration guide created
- **Estimated Time:** 3 hours

#### Task 5.2.3: Update Component Guidelines
- **Requirement:** REQ-15.4
- **Description:** Update component best practices
- **Steps:**
  1. Update ref handling examples
  2. Update context usage examples
  3. Document React 19 best practices
- **Validation:** Guidelines updated
- **Estimated Time:** 2 hours

### Checkpoint 5.3: Production Deployment

**Tasks:**

#### Task 5.3.1: Prepare Production Deployment
- **Requirement:** REQ-11.1
- **Description:** Prepare for production
- **Steps:**
  1. Get final approval from team
  2. Schedule deployment window
  3. Prepare rollback plan
  4. Notify stakeholders
- **Validation:** Deployment prepared
- **Estimated Time:** 2 hours

#### Task 5.3.2: Deploy to Production
- **Requirement:** REQ-11.1, REQ-11.2
- **Description:** Deploy to production
- **Steps:**
  1. Merge pull request
  2. Deploy to production
  3. Verify deployment successful
  4. Run smoke tests
- **Validation:** Production deployment successful
- **Estimated Time:** 2 hours

#### Task 5.3.3: Monitor Production
- **Requirement:** REQ-10.1, REQ-10.2, REQ-10.3
- **Description:** Monitor production closely
- **Steps:**
  1. Monitor error rates in Sentry
  2. Monitor performance metrics
  3. Monitor user feedback
  4. Be ready to rollback if needed
  5. Monitor for 48-72 hours
- **Validation:** No critical issues in production
- **Estimated Time:** 6 hours (spread over 3 days)

### Checkpoint 5.4: Post-Deployment

**Tasks:**

#### Task 5.4.1: Performance Analysis
- **Requirement:** REQ-8.1, REQ-8.2, REQ-8.3
- **Description:** Analyze production performance
- **Steps:**
  1. Compare bundle sizes (before/after)
  2. Compare Core Web Vitals
  3. Compare render times
  4. Document improvements
- **Validation:** Performance analysis complete
- **Estimated Time:** 3 hours

#### Task 5.4.2: Team Training
- **Requirement:** REQ-15.5
- **Description:** Train team on React 19
- **Steps:**
  1. Present React 19 changes to team
  2. Review new patterns
  3. Answer questions
  4. Share documentation
- **Validation:** Team trained
- **Estimated Time:** 2 hours

#### Task 5.4.3: Retrospective
- **Requirement:** N/A (Process improvement)
- **Description:** Review migration process
- **Steps:**
  1. Gather team feedback
  2. Document lessons learned
  3. Identify improvements for future migrations
  4. Update migration playbook
- **Validation:** Retrospective complete
- **Estimated Time:** 2 hours

## Optional Tasks

### Optional: React 19 Feature Adoption

**Note:** These tasks are for future consideration AFTER the core migration is stable.

#### Optional Task: Implement useActionState
- **Requirement:** REQ-16.1 (optional)
- **Description:** Adopt useActionState for forms
- **Steps:**
  1. Identify forms that would benefit
  2. Refactor to use useActionState
  3. Test form functionality
- **Estimated Time:** 8 hours

#### Optional Task: Implement useOptimistic
- **Requirement:** REQ-16.2 (optional)
- **Description:** Adopt useOptimistic for mutations
- **Steps:**
  1. Identify mutations that would benefit
  2. Implement optimistic updates
  3. Test optimistic behavior
- **Estimated Time:** 12 hours

#### Optional Task: Add Resource Preloading
- **Requirement:** REQ-16.3 (optional)
- **Description:** Preload critical resources
- **Steps:**
  1. Identify critical resources
  2. Add preload hints
  3. Measure performance impact
- **Estimated Time:** 4 hours

## Summary

**Total Estimated Time:** 120-160 hours
**Timeline:** 5 weeks
**Total Tasks:** 60+ tasks across 5 phases

### Phase Breakdown
- Phase 0 (Pre-Migration): 30 hours
- Phase 1 (Preparation): 15 hours
- Phase 2 (Code Migrations): 35 hours
- Phase 3 (Testing): 40 hours
- Phase 4 (Build & Performance): 20 hours
- Phase 5 (Deployment): 35 hours

### Critical Path
1. Complete Jotai migration (prerequisite)
2. Verify high-priority package compatibility
3. Update React core packages
4. Migrate forwardRef and Context.Provider
5. Fix all tests
6. Deploy to staging
7. Deploy to production

### Success Criteria
- ✅ All dependencies React 19 compatible
- ✅ All forwardRef migrated
- ✅ All Context.Provider migrated
- ✅ All tests passing
- ✅ HMR working
- ✅ Production deployment successful
- ✅ Performance maintained or improved
- ✅ Documentation updated

---

**Document Version:** 1.0
**Last Updated:** January 14, 2026
**Status:** Ready for execution
