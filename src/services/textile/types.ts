export interface BillingProps {
    _id?: string
    product: string // Service paid for
    entity: string // Company ETH Address
    environment: 'main' | 'ropsten'
    amount: number
    body?: unknown
}

export interface PaymentReceipt {
    receipt: string
    method: 'WYRE' | 'DAI' | 'USDT' | 'USDC'
    currency: 'USD' | 'DAI' | 'USDT' | 'USDC'
    timestamp: number
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

export interface BroadcastProps {
    title?: string
    message?: string
    link?: string
    icon?: string
    filter?: BroadcastFilter
}

export interface BroadcastFilter {
    jurisdiction?: string
    address?: string
}

export interface WalletProps {
    _id: string
    email: string
    keys: string[]
    signature: number
}

export interface ReportProps {
    start?: number
    end?: number
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