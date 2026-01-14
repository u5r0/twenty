# Twenty CRM: React 19 & State Management Migration Summary

## Overview

This document provides a high-level summary of the two major migrations required to modernize Twenty's frontend stack:

1. **Recoil → Jotai Migration** (State Management)
2. **React 18 → React 19 Upgrade**

## Critical Finding

**Recoil is incompatible with React 19** and has been archived by Meta (January 1, 2025). This creates a dependency chain:

```
Recoil → Jotai Migration (MUST happen first)
    ↓
React 18 → React 19 Upgrade (Can happen after)
```

## Migration 1: Recoil to Jotai

**Location:** `.kiro/specs/recoil-to-jotai-migration/`

**Why:** Recoil does not support React 19 and is no longer maintained

**Timeline:** 6 weeks

**Approach:** Minimal changes - keep same function names and patterns

### Key Benefits
- ✅ React 19 compatibility
- ✅ ~11KB smaller bundle size
- ✅ Better performance
- ✅ Active maintenance
- ✅ Similar atomic state management patterns

### Migration Strategy
1. Create compatibility layer (keep same APIs)
2. Update internal implementations to use Jotai
3. Migrate atoms, selectors, and families
4. Update tests
5. Remove Recoil

### Files
- `requirements.md` - 20 detailed requirements
- `design.md` - Complete technical design
- `tasks.md` - 18 phases, 60+ tasks

## Migration 2: React 18 to React 19

**Location:** `.kiro/specs/react-19-upgrade/`

**Why:** Access latest features, performance improvements, security updates

**Timeline:** 4 weeks (after Jotai migration)

**Approach:** Update dependencies, migrate breaking changes

### Key Changes
- Update React core to 19.2.0
- Migrate `forwardRef` → `ref` prop
- Migrate `Context.Provider` → `Context`
- Update peer dependencies (Apollo, Router, Emotion, etc.)

### Dependency Updates
All packages will be updated to latest stable versions:
- `react`: 18.2.0 → 19.2.0
- `react-dom`: 18.2.0 → 19.2.0
- `@apollo/client`: 3.7.17 → latest
- `react-router-dom`: 6.4.4 → latest
- `@emotion/react`: 11.11.1 → latest
- `@emotion/styled`: 11.11.0 → latest
- All other peer dependencies → latest stable

### Files
- `requirements.md` - 16 detailed requirements
- `design.md` - Complete technical design
- `COMPATIBILITY_AUDIT.md` - Comprehensive analysis of 45+ React packages
- `tasks.md` - 60+ tasks across 5 phases, 120-160 hours estimated

## Recommended Execution Order

### Phase 1: Recoil to Jotai (Weeks 1-6)
1. Week 1: Preparation & compatibility layer
2. Week 2-3: Core migration (atoms, selectors)
3. Week 4: Advanced features (families, async, persistence)
4. Week 5: Testing & validation
5. Week 6: Cleanup & deployment

### Phase 2: React 19 Upgrade (Weeks 7-11)
1. Week 7: Pre-migration verification & package updates
2. Week 8: Dependency updates & TypeScript fixes
3. Week 9: Code migrations (forwardRef, Context)
4. Week 10: Testing (unit, integration, e2e)
5. Week 11: Build, deploy, monitor

### Total Timeline: ~11 weeks

## Success Criteria

### Recoil to Jotai
- ✅ All tests passing
- ✅ No Recoil dependencies
- ✅ Bundle size reduced
- ✅ Performance maintained/improved
- ✅ DevTools working
- ✅ Documentation updated

### React 19 Upgrade
- ✅ All dependencies React 19 compatible
- ✅ All forwardRef migrated
- ✅ All Context.Provider migrated
- ✅ All tests passing
- ✅ HMR working
- ✅ Production deployment successful

## Risk Mitigation

### Rollback Plans
Both migrations have documented rollback procedures:
- Git revert to previous state
- Restore old dependencies
- Redeploy last known good version

### Incremental Approach
- Migrate module by module
- Test at each checkpoint
- Keep application functional throughout
- Can pause at any checkpoint

## Documentation

Each migration has comprehensive documentation:

### Requirements Documents
- Clear user stories
- EARS-pattern acceptance criteria
- Complete glossary of terms

### Design Documents
- Architecture diagrams
- Code migration patterns
- TypeScript type updates
- Performance considerations
- Testing strategies

### Task Documents
- Step-by-step implementation
- Requirements traceability
- Checkpoint validation
- Optional vs required tasks

## Next Steps

1. ✅ Review and approve Recoil → Jotai migration spec
2. ✅ Review and approve React 19 upgrade spec
3. ✅ Review compatibility audit (45+ packages analyzed)
4. ⏳ Begin Recoil → Jotai migration (Phase 1)
5. ⏳ After completion, begin React 19 upgrade (Phase 2)

## Questions?

For detailed information, refer to the individual spec directories:
- `.kiro/specs/recoil-to-jotai-migration/`
- `.kiro/specs/react-19-upgrade/`

---

**Document Version:** 1.0
**Last Updated:** January 14, 2026
**Status:** Ready for execution
