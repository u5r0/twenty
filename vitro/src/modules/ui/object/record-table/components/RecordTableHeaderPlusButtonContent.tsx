import { useCallback } from 'react';
import { useRecoilValue } from 'recoil';

import { IconPlus } from '@/ui/display/icon';
import { useLazyLoadIcons } from '@/ui/input/hooks/useLazyLoadIcons';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { useDropdown } from '@/ui/layout/dropdown/hooks/useDropdown';
import { MenuItem } from '@/ui/navigation/menu-item/components/MenuItem';

import { FieldMetadata } from '../../field/types/FieldMetadata';
import { useRecordTableScopedStates } from '../hooks/internal/useRecordTableScopedStates';
import { useTableColumns } from '../hooks/useTableColumns';
import { ColumnDefinition } from '../types/ColumnDefinition';

export const RecordTableHeaderPlusButtonContent = () => {
  const { closeDropdown } = useDropdown();

  const { hiddenTableColumnsSelector } = useRecordTableScopedStates();

  const hiddenTableColumns = useRecoilValue(hiddenTableColumnsSelector);

  const { icons } = useLazyLoadIcons();

  const { handleColumnVisibilityChange } = useTableColumns();

  const handleAddColumn = useCallback(
    (column: ColumnDefinition<FieldMetadata>) => {
      closeDropdown();
      handleColumnVisibilityChange(column);
    },
    [handleColumnVisibilityChange, closeDropdown],
  );

  return (
    <DropdownMenuItemsContainer>
      {hiddenTableColumns.map((column) => (
        <MenuItem
          key={column.fieldMetadataId}
          iconButtons={[
            {
              Icon: IconPlus,
              onClick: () => handleAddColumn(column),
            },
          ]}
          LeftIcon={icons[column.iconName]}
          text={column.label}
        />
      ))}
    </DropdownMenuItemsContainer>
  );
};
