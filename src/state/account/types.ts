import { PrivateKey } from '@textile/hub'

export const DISCONNECT = 'DISCONNECT'
export const SET_ACCOUNT = 'SET_ACCOUNT'
export const SET_NETWORK = 'SET_NETWORK'
export const SET_ALIAS = 'SET_ALIAS'
export const SET_PRIVATEKEY = 'SET_PRIVATEKEY'
export const SET_INBOX_MESSAGES = 'SET_INBOX_MESSAGES'
export const ADD_INBOX_MESSAGES = 'ADD_INBOX_MESSAGES'
export const SET_OUTBOX_MESSAGES = 'SET_OUTBOX_MESSAGES'
export const ADD_OUTBOX_MESSAGES = 'ADD_OUTBOX_MESSAGES'

export interface PaymentReceipt {
  receipt: string
  method: 'WYRE' | 'DAI' | 'USDT' | 'USDC'
  currency: 'USD' | 'DAI' | 'USDT' | 'USDC'
  timestamp: number
}

export interface ReportProps {
  start?: number
  end?: number
}

export interface BillingProps {
  _id?: string
  product: string // Service paid for
  entity: string // Company ETH Address
  environment: 'main' | 'ropsten'
  amount: number
  body?: unknown
}

export interface BroadcastProps {
  title?: string
  message?: string
  link?: string
  icon?: string
  filter?: BroadcastFilter
}

export interface WalletProps {
  _id: string
  email: string
  keys: string[]
  signature: number
}

export interface PaymentProps {
  _id: string // Receipt
  product: string // Service paid for
  entity: string // Company ETH Address
  environment: string
  method: 'WYRE' | 'DAI' | 'USDT' | 'USDC'
  currency: 'USD' | 'DAI' | 'USDT' | 'USDC'
  amount: number
  timestamp: number
  status: 'processing' | 'failed' | 'success'
  body?: unknown
}

export interface CompanyInterface {
  id: string
  name: string
  jurisdiction: string
  owner: string
  ownerEmail?: string
  creator: string
  creatorEmail?: string
  creation: Date
}

export interface BroadcastFilter {
  jurisdiction?: string
  address?: string
}

export interface MessageResponseReport {
  companies?: CompanyInterface[]
  payments?: PaymentProps[]
}

export interface MessageRequest {
  method: string
  message:
    | PaymentProps
    | WalletProps
    | BroadcastProps
    | ReportProps
    | BillingProps
}

export interface DecryptedMailbox {
  id: string
  body: any
  from: string
  sent: number
  readAt?: number
}

export interface CachedAccount {
  alias: string
}

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
