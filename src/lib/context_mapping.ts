export const enum CommandType {
  ChatInput,
  ContextMenu,
  Message,
}

export interface ContextMapping<T> {
  chatInput?: T;
  contextMenu?: T;
  message?: T;
}

export function defaultContextMapping<T>(value?: T): ContextMapping<T> {
  if (value) {
    return {
      chatInput: value,
      contextMenu: value,
      message: value,
    };
  }

  return {
    chatInput: null,
    contextMenu: null,
    message: null,
  };
}

export function getFromMapping<T>(
  mapping: ContextMapping<T>,
  commandType: CommandType
): T {
  switch (commandType) {
    case CommandType.ChatInput:
      return mapping?.chatInput;
    case CommandType.ContextMenu:
      return mapping?.contextMenu;
    case CommandType.Message:
      return mapping?.message;
    default:
      throw new Error('invalid command type passed for mapping retrieval');
  }
}
