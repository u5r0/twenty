# Implementation Plan: Recoil to Jotai Migration (V2 Dual-Write Approach)

## Overview

This implementation plan tracks the V2 dual-write migration from Recoil to Jotai. Much of the V2 infrastructure and first migration (ChipFieldDisplay) are already complete. Remaining work focuses on verifying write sites and documenting the migration pattern.

## Tasks

- [x] 1. Phase 1: V2 Infrastructure Setup (COMPLETE)
  - V2 infrastructure already exists in codebase
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.1 Install Jotai dependencies (COMPLETE)
  - jotai and jotai-devtools already installed
  - _Requirements: 1.1_

- [x] 1.2 Create shared jotaiStore (COMPLETE)
  - Already exists at packages/twenty-front/src/modules/ui/utilities/state/jotai/jotaiStore.ts
  - _Requirements: 1.2, 1.4_

- [x] 1.3 Wrap RecoilRoot with JotaiProvider (COMPLETE)
  - Already done in packages/twenty-front/src/modules/app/components/App.tsx
  - _Requirements: 1.3, 1.5_

- [x] 1.4 Create createStateV2 utility (COMPLETE)
  - Already exists at packages/twenty-front/src/modules/ui/utilities/state/jotai/utils/createStateV2.ts
  - _Requirements: 2.1, 2.7_

- [x] 1.5 Create createFamilyStateV2 utility (COMPLETE)
  - Already exists at packages/twenty-front/src/modules/ui/utilities/state/jotai/utils/createFamilyStateV2.ts
  - _Requirements: 2.2, 2.7_

- [x] 1.6 Create V2 hooks (COMPLETE)
  - useRecoilValueV2, useRecoilStateV2, useSetRecoilStateV2, useFamilyRecoilValueV2 all exist
  - Located in packages/twenty-front/src/modules/ui/utilities/state/jotai/hooks/
  - _Requirements: 2.3, 2.4, 2.5, 2.6_

- [x] 2. Phase 2: First Migration - ChipFieldDis
: 4.2_

- [x] 2.3 Update ChipFieldDisplay to use V2 (COMPLETE)
  - useChipFieldDisplay already uses useFamilyRecoilValueV2(recordStoreFamilyStateV2, recordId)
  - Located in packages/twenty-front/src/modules/object-record/record-field/ui/meta-types/hooks/useChipFieldDisplay.ts
  - _Requirements: 4.3_

- [x] 2.4 Update RecordChip to use V2 (COMPLETE)
  - RecordChip already uses useRecoilValueV2(recordIndexOpenRecordInStateV2)
  - Located in packages/twenty-front/src/modules/object-record/components/RecordChip.tsx
  - _Requirements: 4.4_

- [x] 2.5 Add dual-write to useUpsertRecordsInStore (COMPLETE)
  - Dual-writes already implemented
  - Located in packages/twenty-front/src/modules/object-record/record-store/hooks/useUpsertRecordsInStore.ts
  - _Requirements: 3.1, 3.2, 4.5_

- [x] 2.6 Add dual-write to useSetRecordTableData (COMPLETE)
  - Dual-writes already implemented
  - Located in packages/twenty-front/src/modules/object-record/record-table/hooks/internal/useSetRecordTableData.ts
  - _Requirements: 3.1, 3.2, 4.5_

- [ ] 3. Phase 3: Verify Remaining Write Sites
  - Check and add dual-writes to remaining write sites
  - _Requirements: 3.1, 3.2, 4.5, 4.6_

- [ ] 3.1 Find and verify ListenRecordUpdatesEffect
  - Search for ListenRecordUpdatesEffect component
  - Check if it writes to recordStoreFamilyState
  - If yes, add dual-write to recordStoreFamilyStateV2
  - _Requirements: 3.1, 3.2, 4.5_

- [ ] 3.2 Find and verify RecordShowEffect
  - Search for RecordShowEffect component
  - Check if it writes to recordStoreFamilyState
  - If yes, add dual-write to recordStoreFamilyStateV2
  - _Requirements: 3.1, 3.2, 4.5_

- [ ] 3.3 Find and verify useLoadRecordIndexStates
  - Search for useLoadRecordIndexStates hook
  - Check if it writes to recordStoreFamilyState
  - If yes, add dual-write to recordStoreFamilyStateV2
  - _Requirements: 3.1, 3.2, 4.5_

- [ ] 3.4 Find and verify useUpdateObjectViewOptions
  - Search for useUpdateObjectViewOptions hook
  - Check if it writes to recordIndexOpenRecordInState
  - If yes, add dual-write to recordIndexOpenRecordInStateV2
  - _Requirements: 3.1, 3.2, 4.6_

- [ ] 3.5 Search for any other write sites
  - Search codebase for useSetRecoilState(recordStoreFamilyState
  - Search codebase for set(recordStoreFamilyState
  - Search codebase for useSetRecoilState(recordIndexOpenRecordInState
  - Search codebase for set(recordIndexOpenRecordInState
  - Add dual-writes to any found write sites
  - _Requirements: 3.1, 3.2_

- [ ] 4. Checkpoint - Verify All Write Sites
  - Ensure all write sites have dual-writes
  - Test app builds and runs
  - Manually test ChipFieldDisplay and RecordChip
  - Verify no regressions

- [ ] 5. Phase 4: Document Progressive Migration Pattern
  - Create migration pattern documentation
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 5.1 Create MIGRATION_PATTERN.md
  - Create .kiro/specs/recoil-to-jotai-migration/MIGRATION_PATTERN.md
  - Document Step 1: Create V2 atom (createStateV2 or createFamilyStateV2)
  - Document Step 2: Add jotaiStore.set(v2Atom, value) at each write site
  - Document Step 3: Switch readers to useRecoilValueV2(v2Atom)
  - Document Step 4: Once all readers migrated, remove Recoil atom and dual-writes
  - Include code examples from ChipFieldDisplay migration
  - Document how to identify write sites (grep patterns)
  - Document how to verify completeness (grep patterns)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 5.2 Write integration tests for migration pattern
  - Test dual-write synchronization
  - Test ChipFieldDisplay renders correctly with V2
  - Test RecordChip renders correctly with V2
  - _Requirements: 4.7_

- [ ] 6. Final Checkpoint - V2 Infrastructure Complete
  - V2 infrastructure set up ✅
  - V2 API created ✅
  - ChipFieldDisplay migrated ✅
  - All write sites have dual-writes ✅
  - Progressive migration pattern documented ✅
  - App builds and runs ✅

## Notes

- Tasks marked with `*` are optional and can be skipped
- Most V2 infrastructure is already complete
- Focus on verifying remaining write sites and documentation
- Avatar and event handlers are intentionally left on Recoil (not on render path)
- Future migrations should follow the documented 4-step pattern
- Estimated remaining time: 1-2 days for verification and documentation

## Write Site Search Patterns

Use these grep patterns to find write sites:

```bash
# Find recordStoreFamilyState writes
grep -r "set(recordStoreFamilyState" packages/twenty-front/src
grep -r "useSetRecoilState(recordStoreFamilyState" packages/twenty-front/src

# Find recordIndexOpenRecordInState writes
grep -r "set(recordIndexOpenRecordInState" packages/twenty-front/src
grep -r "useSetRecoilState(recordIndexOpenRecordInState" packages/twenty-front/src
```

## Verification Checklist

After adding dual-writes:

- [ ] App builds without errors
- [ ] ChipFieldDisplay renders correctly
- [ ] RecordChip renders correctly
- [ ] Record updates propagate to both Recoil and Jotai
- [ ] No console errors or warnings
- [ ] Manual testing shows no regressions
