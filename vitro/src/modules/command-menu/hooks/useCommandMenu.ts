import { useRecoilCallback, useSetRecoilState } from 'recoil';

import { usePreviousHotkeyScope } from '@/ui/utilities/hotkey/hooks/usePreviousHotkeyScope';
import { AppHotkeyScope } from '@/ui/utilities/hotkey/types/AppHotkeyScope';

import { commandMenuCommands } from '../constants/commandMenuCommands';
import { commandMenuCommandsState } from '../states/commandMenuCommandsState';
import { isCommandMenuOpenedState } from '../states/isCommandMenuOpenedState';
import { Command } from '../types/Command';

export const useCommandMenu = () => {
  const setIsCommandMenuOpened = useSetRecoilState(isCommandMenuOpenedState);
  const setCommands = useSetRecoilState(commandMenuCommandsState);
  const {
    setHotkeyScopeAndMemorizePreviousScope,
    goBackToPreviousHotkeyScope,
  } = usePreviousHotkeyScope();

  const openCommandMenu = () => {
    setIsCommandMenuOpened(true);
    setHotkeyScopeAndMemorizePreviousScope(AppHotkeyScope.CommandMenu);
  };

  const closeCommandMenu = () => {
    setIsCommandMenuOpened(false);
    goBackToPreviousHotkeyScope();
  };

  const toggleCommandMenu = useRecoilCallback(({ snapshot }) => async () => {
    const isCommandMenuOpened = snapshot
      .getLoadable(isCommandMenuOpenedState)
      .getValue();

    if (isCommandMenuOpened) {
      closeCommandMenu();
    } else {
      openCommandMenu();
    }
  });

  const addToCommandMenu = (addCommand: Command[]) => {
    setCommands((prev) => [...prev, ...addCommand]);
  };

  const setToIntitialCommandMenu = () => {
    setCommands(commandMenuCommands);
  };

  return {
    openCommandMenu,
    closeCommandMenu,
    toggleCommandMenu,
    addToCommandMenu,
    setToIntitialCommandMenu,
  };
};
