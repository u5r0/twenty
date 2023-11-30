import { useRecoilCallback } from 'recoil';

import { entityFieldsFamilyState } from '@/ui/object/field/states/entityFieldsFamilyState';
import { useRecordTable } from '@/ui/object/record-table/hooks/useRecordTable';
import { isFetchingRecordTableDataState } from '@/ui/object/record-table/states/isFetchingRecordTableDataState';
import { numberOfTableRowsState } from '@/ui/object/record-table/states/numberOfTableRowsState';
import { tableRowIdsState } from '@/ui/object/record-table/states/tableRowIdsState';
import { useViewBar } from '@/views/hooks/useViewBar';

export const useSetRecordTableData = () => {
  const { resetTableRowSelection } = useRecordTable();
  const { setEntityCountInCurrentView } = useViewBar();

  return useRecoilCallback(
    ({ set, snapshot }) =>
      <T extends { id: string } & Record<string, any>>(newEntityArray: T[]) => {
        for (const entity of newEntityArray) {
          const currentEntity = snapshot
            .getLoadable(entityFieldsFamilyState(entity.id))
            .valueOrThrow();

          if (JSON.stringify(currentEntity) !== JSON.stringify(entity)) {
            set(entityFieldsFamilyState(entity.id), entity);
          }
        }

        const entityIds = newEntityArray.map((entity) => entity.id);

        set(tableRowIdsState, (currentRowIds) => {
          if (JSON.stringify(currentRowIds) !== JSON.stringify(entityIds)) {
            return entityIds;
          }

          return currentRowIds;
        });

        resetTableRowSelection();

        set(numberOfTableRowsState, entityIds.length);
        setEntityCountInCurrentView(entityIds.length);

        set(isFetchingRecordTableDataState, false);
      },
    [resetTableRowSelection, setEntityCountInCurrentView],
  );
};
