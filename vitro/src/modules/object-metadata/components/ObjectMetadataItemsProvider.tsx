import { ObjectMetadataItemsRelationPickerEffect } from '@/object-metadata/components/ObjectMetadataItemsRelationPickerEffect';
import { useFindManyObjectMetadataItems } from '@/object-metadata/hooks/useFindManyObjectMetadataItems';
import { RelationPickerScope } from '@/ui/input/components/internal/relation-picker/scopes/RelationPickerScope';

export const ObjectMetadataItemsProvider = ({
  children,
}: React.PropsWithChildren) => {
  const { loading } = useFindManyObjectMetadataItems();

  return loading ? (
    <></>
  ) : (
    <>
      <ObjectMetadataItemsRelationPickerEffect />
      <RelationPickerScope relationPickerScopeId="relation-picker">
        {children}
      </RelationPickerScope>
    </>
  );
};
