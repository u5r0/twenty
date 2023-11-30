import { FieldMetadata } from '@/ui/object/field/types/FieldMetadata';
import { BoardFieldDefinition } from '@/ui/object/record-board/types/BoardFieldDefinition';
import { ColumnDefinition } from '@/ui/object/record-table/types/ColumnDefinition';

export type ViewField = {
  id: string;
  fieldMetadataId: string;
  position: number;
  isVisible: boolean;
  size: number;
  definition:
    | ColumnDefinition<FieldMetadata>
    | BoardFieldDefinition<FieldMetadata>;
};
