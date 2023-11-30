import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';

import { parseFieldType } from '@/object-metadata/utils/parseFieldType';
import { Tag } from '@/ui/display/tag/components/Tag';
import { FieldDisplay } from '@/ui/object/field/components/FieldDisplay';
import { FieldContext } from '@/ui/object/field/contexts/FieldContext';
import { BooleanFieldInput } from '@/ui/object/field/meta-types/input/components/BooleanFieldInput';
import { Field } from '~/generated/graphql';
import { FieldMetadataType } from '~/generated-metadata/graphql';

import { SettingsObjectFieldPreviewValueEffect } from '../components/SettingsObjectFieldPreviewValueEffect';
import { useFieldPreview } from '../hooks/useFieldPreview';

import { SettingsObjectFieldSelectFormValues } from './SettingsObjectFieldSelectForm';

export type SettingsObjectFieldPreviewProps = {
  className?: string;
  fieldMetadata: Pick<Field, 'icon' | 'label' | 'type'> & { id?: string };
  objectMetadataId: string;
  relationObjectMetadataId?: string;
  selectOptions?: SettingsObjectFieldSelectFormValues;
  shrink?: boolean;
};

const StyledContainer = styled.div`
  background-color: ${({ theme }) => theme.background.secondary};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
  box-sizing: border-box;
  color: ${({ theme }) => theme.font.color.primary};
  max-width: 480px;
  padding: ${({ theme }) => theme.spacing(2)};
`;

const StyledObjectSummary = styled.div`
  align-items: center;
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const StyledObjectName = styled.div`
  align-items: center;
  display: flex;
  font-weight: ${({ theme }) => theme.font.weight.medium};
  gap: ${({ theme }) => theme.spacing(1)};
`;

const StyledFieldPreview = styled.div<{ shrink?: boolean }>`
  align-items: center;
  background-color: ${({ theme }) => theme.background.primary};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  height: ${({ theme }) => theme.spacing(8)};
  overflow: hidden;
  padding: 0
    ${({ shrink, theme }) => (shrink ? theme.spacing(1) : theme.spacing(2))};
  white-space: nowrap;
`;

const StyledFieldLabel = styled.div`
  align-items: center;
  color: ${({ theme }) => theme.font.color.tertiary};
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export const SettingsObjectFieldPreview = ({
  className,
  fieldMetadata,
  objectMetadataId,
  relationObjectMetadataId,
  selectOptions,
  shrink,
}: SettingsObjectFieldPreviewProps) => {
  const theme = useTheme();

  const {
    entityId,
    FieldIcon,
    fieldName,
    ObjectIcon,
    objectMetadataItem,
    relationObjectMetadataItem,
    value,
  } = useFieldPreview({
    fieldMetadata,
    objectMetadataId,
    relationObjectMetadataId,
    selectOptions,
  });

  return (
    <StyledContainer className={className}>
      <StyledObjectSummary>
        <StyledObjectName>
          {!!ObjectIcon && (
            <ObjectIcon
              size={theme.icon.size.sm}
              stroke={theme.icon.stroke.sm}
            />
          )}
          {objectMetadataItem?.labelPlural}
        </StyledObjectName>
        {objectMetadataItem?.isCustom ? (
          <Tag color="orange" text="Custom" />
        ) : (
          <Tag color="blue" text="Standard" />
        )}
      </StyledObjectSummary>
      <SettingsObjectFieldPreviewValueEffect
        entityId={entityId}
        fieldName={fieldName}
        value={value}
      />
      <StyledFieldPreview shrink={shrink}>
        <StyledFieldLabel>
          {!!FieldIcon && (
            <FieldIcon
              size={theme.icon.size.md}
              stroke={theme.icon.stroke.sm}
            />
          )}
          {fieldMetadata.label}:
        </StyledFieldLabel>
        <FieldContext.Provider
          value={{
            entityId,
            isLabelIdentifier: false,
            fieldDefinition: {
              type: parseFieldType(fieldMetadata.type),
              iconName: 'FieldIcon',
              fieldMetadataId: fieldMetadata.id || '',
              label: fieldMetadata.label,
              metadata: {
                fieldName,
                relationObjectMetadataNameSingular:
                  relationObjectMetadataItem?.nameSingular,
              },
            },
            hotkeyScope: 'field-preview',
          }}
        >
          {fieldMetadata.type === FieldMetadataType.Boolean ? (
            <BooleanFieldInput readonly />
          ) : (
            <FieldDisplay />
          )}
        </FieldContext.Provider>
      </StyledFieldPreview>
    </StyledContainer>
  );
};
