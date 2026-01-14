# React 19 Compatibility Audit

## Overview

This document provides a comprehensive audit of all React-dependent packages in the Twenty CRM codebase to identify potential compatibility issues with React 19.

**Audit Date:** January 14, 2026
**React Target Version:** 19.2.0
**Current React Version:** 18.2.0

## Critical Blockers

### 🔴 BLOCKER: Recoil
- **Package:** `recoil@^0.7.7`
- **Status:** ❌ **NOT COMPATIBLE**
- **Issue:** Archived by Meta on January 1, 2025. Does not support React 19.
- **Solution:** **MUST migrate to Jotai before React 19 upgrade**
- **Migration Spec:** `.kiro/specs/recoil-to-jotai-migration/`
- **Timeline:** 6 weeks

## High Priority - Requires Updates

### 🟡 @tiptap/react (Rich Text Editor)
- **Current Version:** `3.4.2`
- **Status:** ⚠️ **NEEDS VERIFICATION**
- **Issue:** GitHub issue #6110 reports ReactRenderer broken on React 19
- **Recommendation:** Update to latest @tiptap/react version and test thoroughly
- **Risk:** Medium - Core editing functionality
- **Action:** Test with React 19, may need to wait for official support

### 🟡 @hello-pangea/dnd (Drag & Drop)
- **Current Version:** `^16.2.0`
- **Status:** ⚠️ **NEEDS VERIFICATION**
- **Issue:** Fork of react-beautiful-dnd, React 18 support confirmed, React 19 unclear
- **Recommendation:** Update to latest version and test
- **Risk:** Medium - Used for kanban views and drag-drop features
- **Action:** Test drag-drop functionality with React 19

## Medium Priority - Likely Compatible

### 🟢 @apollo/client
- **Current Version:**
 Version:** `latest` (11.14.0+)
- **Status:** ✅ **COMPATIBLE**
- **Notes:** Emotion 11.14+ supports React 19
- **Action:** Update to latest stable version

### 🟢 react-hook-form
- **Current Version:** `^7.45.1`
- **Target Version:** `latest`
- **Status:** ✅ **COMPATIBLE**
- **Notes:** React Hook Form v7 supports React 19
- **Action:** Update to latest stable version

### 🟢 @sentry/react
- **Current Version:** `^10.27.0`
- **Target Version:** `latest`
- **Status:** ✅ **COMPATIBLE**
- **Notes:** Sentry React SDK supports React 19
- **Action:** Update to latest stable version

## Low Priority - Already Compatible

### ✅ @testing-library/react
- **Current Version:** `^16.3.0`
- **Status:** ✅ **ALREADY COMPATIBLE**
- **Notes:** Version 16.3.0 already supports React 19
- **Action:** Update to latest stable for improvements

### ✅ @vitejs/plugin-react-swc
- **Current Version:** `3.11.0`
- **Status:** ✅ **ALREADY COMPATIBLE**
- **Notes:** Already supports React 19
- **Action:** Update to latest stable

### ✅ @storybook/react-vite
- **Current Version:** `^10.1.11`
- **Status:** ✅ **ALREADY COMPATIBLE**
- **Notes:** Storybook 10.1+ supports React 19
- **Action:** Update to latest stable

### ✅ framer-motion
- **Current Version:** `^11.18.0`
- **Status:** ✅ **COMPATIBLE**
- **Notes:** Framer Motion 11+ supports React 19
- **Action:** Update to latest stable

## React Component Libraries - Needs Testing

### 🟡 @blocknote/react
- **Current Version:** `^0.31.1`
- **Status:** ⚠️ **NEEDS TESTING**
- **Risk:** Medium - Used for rich text editing
- **Action:** Test with React 19, update to latest

### 🟡 @graphiql/react
- **Current Version:** `^0.23.0`
- **Status:** ⚠️ **NEEDS TESTING**
- **Risk:** Low - GraphQL explorer UI
- **Action:** Test with React 19, update to latest

### 🟡 @lingui/react
- **Current Version:** `^5.1.2`
- **Status:** ⚠️ **NEEDS TESTING**
- **Risk:** Medium - Internationalization
- **Action:** Test with React 19, update to latest

### 🟡 @monaco-editor/react
- **Current Version:** `^4.7.0`
- **Status:** ⚠️ **NEEDS TESTING**
- **Risk:** Medium - Code editor
- **Action:** Test with React 19, update to latest

### 🟡 @nivo/* (Charts)
- **Current Version:** `^0.99.0`
- **Status:** ⚠️ **NEEDS TESTING**
- **Risk:** Low - Data visualization
- **Action:** Test charts with React 19, update to latest

### 🟡 @react-pdf/renderer
- **Current Version:** `^4.1.6`
- **Status:** ⚠️ **NEEDS TESTING**
- **Risk:** Low - PDF generation
- **Action:** Test PDF generation with React 19

### 🟡 @xyflow/react
- **Current Version:** `^12.4.2`
- **Status:** ⚠️ **NEEDS TESTING**
- **Risk:** Medium - Workflow diagrams
- **Action:** Test workflow diagrams with React 19

### 🟡 react-datepicker
- **Current Version:** `^6.7.1`
- **Status:** ⚠️ **NEEDS TESTING**
- **Risk:** Medium - Date selection UI
- **Action:** Test date pickers with React 19

### 🟡 react-dropzone
- **Current Version:** `^14.2.3`
- **Status:** ⚠️ **NEEDS TESTING**
- **Risk:** Medium - File uploads
- **Action:** Test file upload with React 19

### 🟡 react-error-boundary
- **Current Version:** `^4.0.11`
- **Status:** ⚠️ **NEEDS TESTING**
- **Risk:** High - Error handling
- **Action:** Test error boundaries with React 19

### 🟡 react-helmet-async
- **Current Version:** `^1.3.0`
- **Status:** ⚠️ **NEEDS TESTING**
- **Risk:** Low - Document head management
- **Action:** May be replaced by React 19 native metadata support

### 🟡 react-markdown
- **Current Version:** `^10.1.0`
- **Status:** ⚠️ **NEEDS TESTING**
- **Risk:** Low - Markdown rendering
- **Action:** Test markdown rendering with React 19

## Complete Package List

### 🟡 react-phone-number-input
- **Current Version:** `3.4.5` (patched)
- **Status:** ⚠️ **NEEDS TESTING**
- **Risk:** Medium - Phone number input
- **Action:** Test phone input with React 19, verify patch compatibility

### 🟡 react-textarea-autosize
- **Current Version:** `^8.4.1`
- **Status:** ⚠️ **NEEDS TESTING**
- **Risk:** Low - Auto-resizing textareas
- **Action:** Test textarea auto-resize with React 19

### 🟡 react-qr-code
- **Current Version:** `^2.0.18`
- **Status:** ⚠️ **NEEDS TESTING**
- **Risk:** Low - QR code generation
- **Action:** Test QR code rendering with React 19

### 🟡 react-grid-layout
- **Current Version:** `^1.5.2`
- **Status:** ⚠️ **NEEDS TESTING**
- **Risk:** Medium - Dashboard layouts
- **Action:** Test grid layouts with React 19

### 🟡 react-data-grid
- **Current Version:** `7.0.0-beta.13`
- **Status:** ⚠️ **NEEDS TESTING**
- **Risk:** High - Data tables (beta version)
- **Action:** Update to stable version, test with React 19

### 🟡 @ai-sdk/react
- **Current Version:** `2.0.52`
- **Status:** ⚠️ **NEEDS TESTING**
- **Risk:** Medium - AI features
- **Action:** Test AI SDK with React 19

### 🟡 @calcom/embed-react
- **Curre
alar/api-reference-react
- **Current Version:** `^0.4.36`
- **Status:** ⚠️ **NEEDS TESTING**
- **Risk:** Low - API documentation
- **Action:** Test API reference with React 19

### 🟡 linkify-react
- **Current Version:** `^4.1.3`
- **Status:** ⚠️ **NEEDS TESTING**
- **Risk:** Low - Link detection
- **Action:** Test link detection with React 19

### 🟡 react-hotkeys-hook
- **Current Version:** `^4.4.4`
- **Status:** ⚠️ **NEEDS TESTING**
- **Risk:** Medium - Keyboard shortcuts
- **Action:** Test keyboard shortcuts with React 19

### 🟡 react-imask
- **Current Version:** `^7.6.0`
- **Status:** ⚠️ **NEEDS TESTING**
- **Risk:** Medium - Input masking
- **Action:** Test input masks with React 19

### 🟡 react-intersection-observer
- **Current Version:** `^9.15.1`
- **Status:** ⚠️ **NEEDS TESTING**
- **Risk:** Low - Intersection observer
- **Action:** Test intersection observer with React 19

### 🟡 react-loading-skeleton
- **Current Version:** `^3.3.1`
- **Status:** ⚠️ **NEEDS TESTING**
- **Risk:** Low - Loading skeletons
- **Action:** Test loading skeletons with React 19

## Package Summary Tables

### Root Dependencies (package.json)
| Package | Current Version | React 19 Status | Priority |
|---------|----------------|-----------------|----------|
| react | ^18.2.0 | 🔄 **UPGRADE TARGET** | Critical |
| react-dom | ^18.2.0 | 🔄 **UPGRADE TARGET** | Critical |
| recoil | ^0.7.7 | ❌ **BLOCKER** | Critical |
| @apollo/client | ^3.7.17 | ✅ Compatible | High |
| @emotion/react | ^11.11.1 | ✅ Compatible | High |
| @emotion/styled | ^11.11.0 | ✅ Compatible | High |
| framer-motion | ^11.18.0 | ✅ Compatible | Medium |
| react-router-dom | ^6.4.4 | ✅ Compatible | High |
| react-responsive | ^9.0.2 | ⚠️ Needs Testing | Low |
| react-tooltip | ^5.13.1 | ⚠️ Needs Testing | Low |

### twenty-front Dependencies
| Package | Current Version | React 19 Status | Priority |
|---------|----------------|-----------------|----------|
| @tiptap/react | 3.4.2 | ⚠️ **VERIFY** | High |
| @hello-pangea/dnd | ^16.2.0 | ⚠️ **VERIFY** | High |
| @blocknote/react | ^0.31.1 | ⚠️ Needs Testing | Medium |
| @graphiql/react | ^0.23.0 | ⚠️ Needs Testing | Low |
| @lingui/react | ^5.1.2 | ⚠️ Needs Testing | Medium |
| @monaco-editor/react | ^4.7.0 | ⚠️ Needs Testing | Medium |
| @nivo/* | ^0.99.0 | ⚠️ Needs Testing | Low |
| @react-pdf/renderer | ^4.1.6 | ⚠️ Needs Testing | Low |
| @xyflow/react | ^12.4.2 | ⚠️ Needs Testing | Medium |
| @sentry/react | ^10.27.0 | ✅ Compatible | High |
| react-hook-form | ^7.45.1 | ✅ Compatible | High |
| react-datepicker | ^6.7.1 | ⚠️ Needs Testing | Medium |
| react-dropzone | ^14.2.3 | ⚠️ Needs Testing | Medium |
| react-error-boundary | ^4.0.11 | ⚠️ Needs Testing | High |
| react-helmet-async | ^1.3.0 | ⚠️ Needs Testing | Low |
| react-markdown | ^10.1.0 | ⚠️ Needs Testing | Low |
| react-phone-number-input | 3.4.5 (patched) | ⚠️ Needs Testing | Medium |
| react-textarea-autosize | ^8.4.1 | ⚠️ Needs Testing | Low |
| react-qr-code | ^2.0.18 | ⚠️ Needs Testing | Low |
| react-grid-layout | ^1.5.2 | ⚠️ Needs Testing | Medium |
| react-data-grid | 7.0.0-beta.13 | ⚠️ Needs Testing | High |
| @ai-sdk/react | 2.0.52 | ⚠️ Needs Testing | Medium |
| @calcom/embed-react | ^1.5.3 | ⚠️ Needs Testing | Low |
| @cyntler/react-doc-viewer | ^1.17.0 | ⚠️ Needs Testing | Low |
| @react-email/components | ^0.5.3 | ⚠️ Needs Testing | Low |
| @scalar/api-reference-react | ^0.4.36 | ⚠️ Needs Testing | Low |
| linkify-react | ^4.1.3 | ⚠️ Needs Testing | Low |
| react-hotkeys-hook | ^4.4.4 | ⚠️ Needs Testing | Medium |
| react-imask | ^7.6.0 | ⚠️ Needs Testing | Medium |
| react-intersection-observer | ^9.15.1 | ⚠️ Needs Testing | Low |
| react-loading-skeleton | ^3.3.1 | ⚠️ Needs Testing | Low |

### twenty-ui Dependencies
| Package | Current Version | React 19 Status | Priority |
|---------|----------------|-----------------|----------|
| react | ^18.2.0 | 🔄 **UPGRADE TARGET** | Critical |
| react-dom | ^18.2.0 | 🔄 **UPGRADE TARGET** | Critical |
| recoil | ^0.7.7 | ❌ **BLOCKER** | Critical |
| @emotion/react | ^11.11.1 | ✅ Compatible | High |
| @emotion/styled | ^11.11.0 | ✅ Compatible | High |
| @monaco-editor/react | ^4.7.0 | ⚠️ Needs Testing | Medium |
| framer-motion | ^11.18.0 | ✅ Compatible | Medium |
| react-responsive | ^9.0.2 | ⚠️ Needs Testing | Low |
| react-router-dom | ^6.4.4 | ✅ Compatible | High |
| react-tooltip | ^5.13.1 | ⚠️ Needs Testing | Low |

### Dev Dependencies
| Package | Current Version | React 19 Status | Priority |
|---------|----------------|-----------------|----------|
| @testing-library/react | ^16.3.0 | ✅ Compatible | High |
| @vitejs/plugin-react-swc | 3.11.0 | ✅ Compatible | High |
| @storybook/react-vite | ^10.1.11 | ✅ Compatible | Medium |
| @types/react | ^18.2.39 | 🔄 Update to ^19.x | High |
| @types/react-dom | ^18.2.15 | 🔄 Update to ^19.x | High |

## Summary Statistics

- **Total React Packages:** 45+
- **Critical Blockers:** 1 (Recoil)
- **High Priority Verification:** 2 (@tiptap/react, @hello-pangea/dnd)
- **Needs Testing:** 35+
- **Already Compatible:** 10+

## Testing Strategy

### Phase 1: Pre-Migration Testing (Current React 18)
1. **Establish Baseline**
   - Run full test suite
   - Document all passing tests
   - Create visual regression baseline with Storybook
   - Test all critical user flows manually

2. **Update Compatible Packages**
   - Update all "Already Compatible" packages to latest
   - Run tests after each update
   - Fix any breaking changes

### Phase 2: Compatibility Research
1. **High Priority Packages**
   - @tiptap/react: Check GitHub issues, test with React 19 RC
   - @hello-pangea/dnd: Check maintainer status, test drag-drop
   - react-data-grid: Update from beta to stable first

2. **Medium Priority Packages**
   - Test each package individually in isolated environment
   - Create compatibility matrix
   - Document workarounds if needed

3. **Low Priority Packages**
   - Batch test in staging environment
   - Monitor for runtime errors

### Phase 3: React 19 Migration Testing
1. **Create Feature Branch**
   - Branch: `feat/react-19-upgrade`
   - Update React and ReactDOM to 19.x
   - Update @types/react and @types/react-dom

2. **Incremental Testing**
   - Run TypeScript compiler
   - Fix type errors
   - Run unit tests
   - Fix test failures
   - Run integration tests
   - Test in development environment

3. **Component-Level Testing**
   - Test each major component area:
     - Rich text editor (@tiptap/react, @blocknote/react)
     - Drag and drop (@hello-pangea/dnd)
     - Data grids (react-data-grid)
     - Forms (react-hook-form, react-datepicker)
     - Charts (@nivo/*)
     - File uploads (react-dropzone)
     - Error boundaries (react-error-boundary)

4. **Integration Testing**
   - Test complete user workflows
   - Test with real data
   - Performance testing
   - Accessibility testing

### Phase 4: Staging Deployment
1. **Deploy to Staging**
   - Full smoke test
   - Load testing
   - Monitor error tracking (Sentry)
   - User acceptance testing

2. **Performance Benchmarking**
   - Compare React 18 vs React 19 metrics
   - Bundle size comparison
   - Runtime performance
   - Memory usage

### Phase 5: Production Rollout
1. **Gradual Rollout**
   - Feature flag for React 19
   - 10% traffic initially
   - Monitor metrics and errors
   - Increase to 50%, then 100%

2. **Monitoring**
   - Error rates
   - Performance metrics
   - User feedback
   - Rollback plan ready

## Risk Mitigation

### High Risk Items

1. **@tiptap/react (Rich Text Editor)**
   - **Risk:** Core editing functionality broken
   - **Mitigation:**
     - Test extensively before migration
     - Have rollback plan
     - Consider alternative editors if incompatible
     - Contact maintainers about React 19 support

2. **@hello-pangea/dnd (Drag & Drop)**
   - **Risk:** Kanban and drag-drop features broken
   - **Mitigation:**
     - Test all drag-drop scenarios
     - Check for React 19 compatible forks
     - Consider @dnd-kit as alternative

3. **react-data-grid (Beta Version)**
   - **Risk:** Beta version may have stability issues
   - **Mitigation:**
     - Update to stable version first
     - Test all grid features
     - Have fallback to simpler table component

4. **react-error-boundary**
   - **Risk:** Error handling broken could hide issues
   - **Mitigation:**
     - Test error boundaries thoroughly
     - Verify error reporting to Sentry
     - Manual error injection testing

### Medium Risk Items

1. **Form Libraries**
   - react-hook-form, react-datepicker, react-imask
   - Test all form interactions
   - Verify validation logic

2. **Internationalization**
   - @lingui/react
   - Test all language switching
   - Verify translations load correctly

3. **Monaco Editor**
   - @monaco-editor/react
   - Test code editing features
   - Verify syntax highlighting

### Low Risk Items

1. **Visualization Libraries**
   - @nivo/*, @xyflow/react
   - Visual testing sufficient
   - Non-critical features

2. **Utility Components**
   - react-tooltip, react-loading-skeleton, react-qr-code
   - Simple components, likely compatible
   - Easy to replace if needed

## Recommended Actions

### Immediate (Before Jotai Migration)
1. ✅ Update all "Already Compatible" packages to latest
2. ✅ Research @tiptap/react React 19 compatibility
3. ✅ Research @hello-pangea/dnd React 19 compatibility
4. ✅ Update react-data-grid from beta to stable
5. ✅ Create test environment for React 19 testing

### During Jotai Migration (6 weeks)
1. ✅ Continue monitoring React 19 compatibility updates
2. ✅ Test high-priority packages in isolated environment
3. ✅ Document any workarounds needed
4. ✅ Update design.md with findings

### Before React 19 Migration
1. ✅ Complete Jotai migration
2. ✅ Verify all tests passing
3. ✅ Update all packages to latest compatible versions
4. ✅ Create React 19 test branch
5. ✅ Run compatibility tests

### During React 19 Migration (4 weeks)
1. ✅ Follow testing strategy phases
2. ✅ Fix compatibility issues as discovered
3. ✅ Update documentation
4. ✅ Train team on React 19 changes

## Package Update Commands

### Update Compatible Packages (Safe Now)
```bash
# Update Apollo Client
yarn workspace twenty-front add @apollo/client@latest
yarn workspace root add @apollo/client@latest

# Update Emotion
yarn workspace twenty-front add @emotion/react@latest @emotion/styled@latest
yarn workspace twenty-ui add @emotion/react@latest @emotion/styled@latest
yarn workspace root add @emotion/react@latest @emotion/styled@latest

# Update React Router
yarn workspace twenty-front add react-router-dom@latest
yarn workspace twenty-ui add react-router-dom@latest
yarn workspace root add react-router-dom@latest

# Update Framer Motion
yarn workspace twenty-front add framer-motion@latest
yarn workspace twenty-ui add framer-motion@latest
yarn workspace root add framer-motion@latest

# Update React Hook Form
yarn workspace twenty-front add react-hook-form@latest

# Update Sentry
yarn workspace twenty-front add @sentry/react@latest

# Update Testing Library
yarn add -D @testing-library/react@latest

# Update Vite Plugin
yarn add -D @vitejs/plugin-react-swc@latest

# Update Storybook
yarn add -D @storybook/react-vite@latest
```

### Update React 19 (After Jotai Migration)
```bash
# Update React and ReactDOM
yarn workspace twenty-front add react@latest react-dom@latest
yarn workspace twenty-ui add react@latest react-dom@latest
yarn workspace root add react@latest react-dom@latest

# Update React Types
yarn add -D @types/react@latest @types/react-dom@latest
```

## Conclusion

The React 19 upgrade is **feasible but requires careful planning**:

1. **Critical Blocker:** Recoil must be migrated to Jotai first (6 weeks)
2. **High Priority:** @tiptap/react and @hello-pangea/dnd need verification
3. **Testing Required:** 35+ packages need compatibility testing
4. **Timeline:** 4 weeks after Jotai migration completes
5. **Risk Level:** Medium - manageable with proper testing

**Recommendation:** Proceed with Jotai migration first, then conduct thorough compatibility testing before React 19 upgrade.
