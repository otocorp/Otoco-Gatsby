import { PrivateKey } from '@textile/hub'
import { DecryptedMailbox } from '../../services/textile/types'

export const DISCONNECT = 'DISCONNECT'
export const SET_ACCOUNT = 'SET_ACCOUNT'
export const SET_NETWORK = 'SET_NETWORK'
export const SET_ALIAS = 'SET_ALIAS'
export const SET_PRIVATEKEY = 'SET_PRIVATEKEY'
export const SET_INBOX_MESSAGES = 'SET_INBOX_MESSAGES'
export const ADD_INBOX_MESSAGES = 'ADD_INBOX_MESSAGES'
export const SET_OUTBOX_MESSAGES = 'SET_OUTBOX_MESSAGES'
export const ADD_OUTBOX_MESSAGES = 'ADD_OUTBOX_MESSAGES'

interface Disconnect {
  type: typeof DISCONNECT
}

interface SetAccount {
  type: typeof SET_ACCOUNT
  payload: string
}

interface SetAlias {
  type: typeof SET_ALIAS
  payload: string
}

interface SetNetwork {
  type: typeof SET_NETWORK
  payload: string
}

interface SetPrivateKey {
  type: typeof SET_PRIVATEKEY
  payload: PrivateKey
}

interface SetInboxMessages {
  type: typeof SET_INBOX_MESSAGES
  payload: DecryptedMailbox[]
}

interface AddInboxMessages {
  type: typeof ADD_INBOX_MESSAGES
  payload: DecryptedMailbox
}

interface SetOutboxMessages {
  type: typeof SET_OUTBOX_MESSAGES
  payload: DecryptedMailbox[]
}

interface AddOutboxMessages {
  type: typeof ADD_OUTBOX_MESSAGES
  payload: DecryptedMailbox
}

export interface IAccountState {
  account?: string
  network?: string
  alias?: string
  privatekey?: PrivateKey
  inboxMessages: DecryptedMailbox[]
  outboxMessages: DecryptedMailbox[]
}

export type AccountActionTypes =
  | Disconnect
  | SetAccount
  | SetNetwork
  | SetAlias
  | SetPrivateKey
  | SetInboxMessages
  | AddInboxMessages
  | SetOutboxMessages
  | AddOutboxMessages
