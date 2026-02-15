# Requirements Document: Recoil to Jotai Migration (V2 Dual-Write Approach)

## Introduction

This document outlines the requirements for migrating Twenty CRM from Recoil to Jotai using a **V2 dual-write approach**. This enables component-by-component migration without a big-bang rewrite.

**Why**: Recoil is archived (no React 19 support). Jotai is modern, lightweight, and React 19-compatible.

**How**: Introduce a V2 API (Jotai-backed, Recoil-ergonomic) alongside existing Recoil. Use dual-writes to keep both in sync during migration.

## Glossary

- **V2_API**: Jotai-backed state API that mirrors Recoil ergonomics (createStateV2, useRecoilValueV2, etc.)
- **Dual_Write**: Write to both Recoil and Jotai atoms during migration via jotaiStore.set()
- **jotaiStore**: Shared Jotai store for imperative updates
- **Write_Site**: Code location where state is updated (needs dual-write)

## Requirements

### Requirement 1: V2 Infrastructure

**User Story:** As a developer, I want V2 infrastructure set up so I can progressively migrate from Recoil to Jotai.

#### Acceptance Criteria

1. Install jotai and jotai-devtools
2. Create shared jotaiStore (createStore())
3. Wrap RecoilRoot with JotaiProvider
4. Expose jotaiStore for imperative dual-writes
5. Support Recoil and Jotai running side-by-side

### Requirement 2: V2 API (State Creation + Hooks)

**User Story:** As a developer, I want V2 utilities that mirror Recoil's API but use Jotai, so migration is straightforward.

#### Acceptance Criteria

1. Provide createStateV2 (returns Jotai atom)
2. Provide createFamilyStateV2 (returns Jotai atomFamily)
3. Provide useRecoilValueV2 (wraps useAtomValue)
4. Provide useRecoilStateV2 (wraps useAtom)
5. Provide useSetRecoilStateV2 (wraps useSetAtom)
6. Provide useFamilyRecoilValueV2 for atom families
7. Add debugLabel to all atoms for DevTools

### Requirement 3: Dual-Write Bridge

**User Story:** As a developer, I want dual-writes to keep Recoil and Jotai in sync during migration.

#### Acceptance Criteria

1. Update both Recoil and Jotai atoms at write sites using jotaiStore.set()
2. Identify write sites: useUpsertRecordsInStore, useSetRecordTableData, ListenRecordUpdatesEffect, RecordShowEffect, useLoadRecordIndexStates, useUpdateObjectViewOptions
3. Ensure app builds and runs at each migration step

### Requirement 4: First Migration - ChipFieldDisplay Render Path

**User Story:** As a developer, I want to migrate ChipFieldDisplay as the first target to validate the approach.

#### Acceptance Criteria

1. Create recordStoreFamilyStateV2 (createFamilyStateV2)
2. Create recordIndexOpenRecordInStateV2 (createStateV2)
3. Update useChipFieldDisplay → useFamilyRecoilValueV2(recordStoreFamilyStateV2)
4. Update RecordChip → useRecoilValueV2(recordIndexOpenRecordInStateV2)
5. Add dual-writes at all write sites
6. Leave Avatar and event handlers on Recoil (not on render path)
7. Verify no regressions

### Requirement 5: Progressive Migration Pattern

**User Story:** As a developer, I want a clear 4-step pattern for migrating additional atoms.

#### Acceptance Criteria

1. Step 1: Create V2 atom (createStateV2 or createFamilyStateV2)
2. Step 2: Add jotaiStore.set(v2Atom, value) at each write site
3. Step 3: Switch readers to useRecoilValueV2(v2Atom)
4. Step 4: Once all readers migrated, remove Recoil atom and dual-writes
5. Document how to identify write sites and verify completeness
