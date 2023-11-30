import { DropdownMenuSeparator } from '@/ui/layout/dropdown/components/DropdownMenuSeparator';
import { useFilterDropdown } from '@/ui/object/object-filter-dropdown/hooks/useFilterDropdown';

import { MultipleFiltersDropdownFilterOnFilterChangedEffect } from './MultipleFiltersDropdownFilterOnFilterChangedEffect';
import { ObjectFilterDropdownDateSearchInput } from './ObjectFilterDropdownDateSearchInput';
import { ObjectFilterDropdownEntitySearchInput } from './ObjectFilterDropdownEntitySearchInput';
import { ObjectFilterDropdownEntitySelect } from './ObjectFilterDropdownEntitySelect';
import { ObjectFilterDropdownFilterSelect } from './ObjectFilterDropdownFilterSelect';
import { ObjectFilterDropdownNumberSearchInput } from './ObjectFilterDropdownNumberSearchInput';
import { ObjectFilterDropdownOperandButton } from './ObjectFilterDropdownOperandButton';
import { ObjectFilterDropdownOperandSelect } from './ObjectFilterDropdownOperandSelect';
import { ObjectFilterDropdownTextSearchInput } from './ObjectFilterDropdownTextSearchInput';

export const MultipleFiltersDropdownContent = () => {
  const {
    isObjectFilterDropdownOperandSelectUnfolded,
    filterDefinitionUsedInDropdown,
    selectedOperandInDropdown,
  } = useFilterDropdown();

  return (
    <>
      {!filterDefinitionUsedInDropdown ? (
        <ObjectFilterDropdownFilterSelect />
      ) : isObjectFilterDropdownOperandSelectUnfolded ? (
        <ObjectFilterDropdownOperandSelect />
      ) : (
        selectedOperandInDropdown && (
          <>
            <ObjectFilterDropdownOperandButton />
            <DropdownMenuSeparator />
            {['TEXT', 'EMAIL', 'PHONE', 'FULL_NAME', 'LINK'].includes(
              filterDefinitionUsedInDropdown.type,
            ) && <ObjectFilterDropdownTextSearchInput />}
            {['NUMBER', 'CURRENCY'].includes(
              filterDefinitionUsedInDropdown.type,
            ) && <ObjectFilterDropdownNumberSearchInput />}
            {filterDefinitionUsedInDropdown.type === 'DATE_TIME' && (
              <ObjectFilterDropdownDateSearchInput />
            )}
            {filterDefinitionUsedInDropdown.type === 'RELATION' && (
              <ObjectFilterDropdownEntitySearchInput />
            )}
            {filterDefinitionUsedInDropdown.type === 'RELATION' && (
              <ObjectFilterDropdownEntitySelect />
            )}
          </>
        )
      )}
      <MultipleFiltersDropdownFilterOnFilterChangedEffect
        filterDefinitionUsedInDropdownType={
          filterDefinitionUsedInDropdown?.type
        }
      />
    </>
  );
};
