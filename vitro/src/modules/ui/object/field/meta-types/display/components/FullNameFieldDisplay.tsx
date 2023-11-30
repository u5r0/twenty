import { useFullNameField } from '@/ui/object/field/meta-types/hooks/useFullNameField';

import { TextDisplay } from '../content-display/components/TextDisplay';

export const FullNameFieldDisplay = () => {
  const { fieldValue } = useFullNameField();

  const content = [fieldValue.firstName, fieldValue.lastName]
    .filter(Boolean)
    .join(' ');

  return <TextDisplay text={content} />;
};
