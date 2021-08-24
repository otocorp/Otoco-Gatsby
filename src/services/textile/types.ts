import { ThreadID } from '@textile/hub'

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

// Verified Credentials according to W3C
// https://www.w3.org/TR/vc-data-model/

export enum CredentialTypes {
    ProofOfOwnership = 'ProofOfOwnership',
}

export interface CredentialSubject {
    id: string
}

export interface ProofOfOwnership extends CredentialSubject {
    nonce: string
}

export class CredentialProof {
    type: string;
    created: Date;
    proofPurpose: string;
    verificationMethod: 'https://otoco.io/credential/verifier/';
    proofValue: string;

    constructor (_purpose:string, _value:string) {
        this.type = 'secp256k1',
        this.created = new Date(),
        this.proofPurpose = _purpose,
        this.verificationMethod = 'https://otoco.io/credential/verifier/',
        this.proofValue = _value
    }
}

export class Credential {
    _id: string;
    context: 'https://www.w3.org/2018/credentials/v1';
    type: CredentialTypes[];
    issuer: string;
    issuanceDate: Date;
    expirationDate?: Date;
    nonTransferable: true;
    credentialSubject: CredentialSubject;
    proof?: CredentialProof;

    constructor (_type:CredentialTypes[], _issuer:string, _subject: CredentialSubject) {
        this._id = ThreadID.fromRandom().toString()
        this.context = 'https://www.w3.org/2018/credentials/v1'
        this.type = _type
        this.issuer = _issuer
        this.issuanceDate = new Date()
        this.nonTransferable = true
        this.credentialSubject = _subject
    }

    addProof (_proof:CredentialProof) {
        this.proof = _proof
    }
}