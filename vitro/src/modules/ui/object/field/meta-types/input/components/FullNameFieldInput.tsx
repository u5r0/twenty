import { useFullNameField } from '@/ui/object/field/meta-types/hooks/useFullNameField';
import { DoubleTextInput } from '@/ui/object/field/meta-types/input/components/internal/DoubleTextInput';
import { FieldDoubleText } from '@/ui/object/field/types/FieldDoubleText';

import { usePersistField } from '../../../hooks/usePersistField';

import { FieldInputOverlay } from './internal/FieldInputOverlay';
import { FieldInputEvent } from './DateFieldInput';

export type FullNameFieldInputProps = {
  onClickOutside?: FieldInputEvent;
  onEnter?: FieldInputEvent;
  onEscape?: FieldInputEvent;
  onTab?: FieldInputEvent;
  onShiftTab?: FieldInputEvent;
};

export const FullNameFieldInput = ({
  onEnter,
  onEscape,
  onClickOutside,
  onTab,
  onShiftTab,
}: FullNameFieldInputProps) => {
  const { hotkeyScope, initialValue } = useFullNameField();

  const persistField = usePersistField();
  const convertToFullName = (newDoubleText: FieldDoubleText) => {
    return {
      firstName: newDoubleText.firstValue,
      lastName: newDoubleText.secondValue,
    };
  };

  const handleEnter = (newDoubleText: FieldDoubleText) => {
    onEnter?.(() => persistField(convertToFullName(newDoubleText)));
  };

  const handleEscape = (newDoubleText: FieldDoubleText) => {
    onEscape?.(() => persistField(convertToFullName(newDoubleText)));
  };

  const handleClickOutside = (
    event: MouseEvent | TouchEvent,
    newDoubleText: FieldDoubleText,
  ) => {
    onClickOutside?.(() => persistField(convertToFullName(newDoubleText)));
  };

  const handleTab = (newDoubleText: FieldDoubleText) => {
    onTab?.(() => persistField(convertToFullName(newDoubleText)));
  };

  const handleShiftTab = (newDoubleText: FieldDoubleText) => {
    onShiftTab?.(() => persistField(convertToFullName(newDoubleText)));
  };

  return (
    <FieldInputOverlay>
      <DoubleTextInput
        firstValue={initialValue.firstName}
        secondValue={initialValue.lastName}
        firstValuePlaceholder={'F‌‌irst name'}
        secondValuePlaceholder={'L‌‌ast name'}
        onClickOutside={handleClickOutside}
        onEnter={handleEnter}
        onEscape={handleEscape}
        onShiftTab={handleShiftTab}
        onTab={handleTab}
        hotkeyScope={hotkeyScope}
      />
    </FieldInputOverlay>
  );
};
