import { useContext } from 'react';
import { I18nContext } from './context';
import { getMessages } from './getMessages';
import type { Messages } from './messages/types';

export function useMessages(): Messages {
  return useContext(I18nContext)?.messages ?? getMessages();
}
