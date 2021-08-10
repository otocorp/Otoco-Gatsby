import Web3 from 'web3'
import {
  Users,
  Client,
  PrivateKey,
  PublicKey,
  UserMessage,
  UserAuth,
  Identity,
  MailboxEvent,
} from '@textile/hub'
import {
  CachedAccount,
  DecryptedMailbox,
  MessageRequest,
} from '../state/account/types'

const messageDecoder = async (
  message: UserMessage,
  privateKey: PrivateKey
): Promise<DecryptedMailbox> => {
  const bytes = await privateKey.decrypt(message.body)
  const bodyString = new TextDecoder().decode(bytes)
  let body: any
  try {
    body = JSON.parse(bodyString)
  } catch (err) {
    body = bodyString
  }
  const { from } = message
  const { readAt } = message
  const { createdAt } = message
  const { id } = message
  return { body, from, readAt, sent: createdAt, id }
}

interface TextileInterface {
  user: Users | null
  client: Client | null
  account: string | null
  privateKey?: PrivateKey
  authorized: string | null
  lastAuthorization: number | null
  callbackInbox: (message: DecryptedMailbox) => void | null
  generateMessageForEntropy: (
    address: string,
  ) => string
  generateMessageForPublicKeyValidation: (publickey: string) => string
  generateIdentity: (address: string) => Promise<PrivateKey | null>
  generatePublicKeyValidation: (
    address: string,
    publickey: string
  ) => Promise<string | null>
  storeAccountDetails: (address: string, cached:CachedAccount) => void
  fetchAccountDetails: (
    address: string
  ) => CachedAccount
  loginWithChallenge: (identity: Identity, account:string) => Promise<UserAuth>
  registerNewKey: (wallet: string, key: string, sig: string) => Promise<void>
  authorize: () => Promise<Client | null>
  watchInbox: (
    reply?: MailboxEvent | undefined,
    err?: Error | undefined
  ) => void
  setCallbackInbox: (callback: (message: DecryptedMailbox) => void) => void
  refreshAuthorization: () => Promise<Client | null>
  listInboxMessages: () => Promise<DecryptedMailbox[]>
  listOutboxMessages: () => Promise<DecryptedMailbox[]>
  sendMessage: (
    to: string,
    message: MessageRequest
  ) => Promise<UserMessage | null>
  sendRequest: (body:any) => Promise<any>
  deleteMessage: (id: string) => Promise<void>
  readMessage: (id: string) => Promise<void>
}

const Textile: TextileInterface = {
  user: null,
  client: null,
  account: null,
  privateKey: undefined,
  authorized: null, // Authorized Address
  lastAuthorization: null,
  callbackInbox: null,

  generateMessageForEntropy(
    account: string
  ): string {
    return (
      'PLEASE MAKE SURE THAT YOU ARE SIGNING THIS MESSAGE ON OTOCO.IO DOMAIN. \n' +
      'This signature will be used to generate an entropy for a key-pair. \n' +
      'Do not share this signed message with anyone or they will have read/write acess to this application. \n' +
      'Your connected account: ' + account
    )
  },

  generateMessageForPublicKeyValidation(publickey: string): string {
    return (
      'THIS SIGNATURE SERVE TO THE PURPOSE OF \n' +
      'VALIDATE THE OWNERSHIP OF YOUR PUBLIC KEY \n' +
      'BY YOUR WALLET ADDRESS: \n' +
      publickey
    )
  },

  generateIdentity: async function (
    account: string
  ): Promise<PrivateKey | null> {
    const web3: Web3 = window.web3
    const message = this.generateMessageForEntropy(account)
    const signedText = await web3.eth.personal.sign(message, account)
    const signatureHash = web3.utils.keccak256(signedText).replace('0x', '')
    // The following line converts the hash in hex to an array of 32 integers.
    const sigArray = signatureHash
      .match(/.{2}/g)
      .map((t) => web3.utils.hexToNumber('0x' + t))
    if (sigArray.length !== 32) {
      throw new Error(
        'Hash of signature is not the correct size! Something went wrong!'
      )
    }
    // If have some old LocalStorage, remove it.
    const cached = this.fetchAccountDetails(account)
    this.storeAccountDetails(account, cached)
    this.account = account
    this.privateKey = PrivateKey.fromRawEd25519Seed(Uint8Array.from(sigArray))
    // Your app can now use this identity for generating a user Mailbox, Threads, Buckets, etc
    return this.privateKey
  },

  generatePublicKeyValidation: async function (
    address: string,
    publickey: string
  ): Promise<string | null> {
    try {
      const web3: Web3 = window.web3
      const message = this.generateMessageForPublicKeyValidation(publickey)
      const signature = await web3.eth.personal.sign(message, address)
      return signature
    } catch (err) {
      console.error('Signature Rejected.')
    }
    return null
  },

  storeAccountDetails: function (account: string, cached:CachedAccount): void {
    localStorage.setItem( `did:eth:${account.substr(2)}`, JSON.stringify(cached))
  },

  fetchAccountDetails: function (
    account: string
  ): CachedAccount {
    /** Restore any cached user identity first */
    const cachedString = localStorage.getItem(`did:eth:${account.substr(2)}`)
    if (cachedString) {
      const obj = JSON.parse(cachedString)
      if (obj.key) delete obj.key
      return obj
    }
    return {alias:''}
  },

  loginWithChallenge: async (identity: Identity, account:string): Promise<UserAuth> => {
    return new Promise((resolve, reject) => {
      /**
       * Configured for our development server
       *
       * Note: this should be upgraded to wss for production environments.
       */

      /** Initialize our websocket connection */
      const socket = new WebSocket(process.env.GATSBY_ORACLE_URL)
      socket.onerror = () => {
        reject('Error connecting socket')
      }
      /** Wait for our socket to open successfully */
      socket.onopen = () => {
        /** Get public key string */
        const publicKey = identity.public.toString()

        /** Send a new token request */
        socket.send(
          JSON.stringify({
            pubkey: publicKey,
            wallet: account,
            type: 'token',
          })
        )

        /** Listen for messages from the server */
        socket.onmessage = async (event) => {
          const data = JSON.parse(event.data)
          switch (data.type) {
            /** Error never happen :) */
            case 'error': {
              reject(data.value)
              break
            }
            /** The server issued a new challenge */
            case 'challenge': {
              /** Convert the challenge json to a Buffer */
              const buf = Buffer.from(data.value)
              /** User our identity to sign the challenge */
              const signed = await identity.sign(buf)
              /** Send the signed challenge back to the server */
              socket.send(
                JSON.stringify({
                  type: 'challenge',
                  sig: Buffer.from(signed).toJSON(),
                })
              )
              break
            }
            /** New token generated */
            case 'token': {
              resolve(data.value)
              break
            }
          }
        }
      }
    })
  },

  registerNewKey: async (
    wallet: string,
    key: string,
    sig: string
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(process.env.GATSBY_ORACLE_URL)

      /* Wait for our socket to open successfully */
      socket.onopen = () => {
        /* Send a new token request */
        socket.send(
          JSON.stringify({
            type: 'register',
            key,
            sig,
            wallet,
          })
        )

        /* Listen for messages from the server */
        socket.onmessage = async (event) => {
          const data = JSON.parse(event.data)
          if (data.type == 'error') reject('Error registering key.')
          if (data.type == 'wallet') resolve()
        }
      }
    })
  },

  sendRequest: async function(
    body:any
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(process.env.GATSBY_ORACLE_URL)
      var enc = new TextEncoder();
      const bodyArray = enc.encode(JSON.stringify(body))

      /* Wait for our socket to open successfully */
      socket.onopen = () => {
        if (this.privateKey) {
          // Send an authenticated request
          socket.send(
            JSON.stringify({
              type: 'request',
              signer: this.privateKey.public,
              signature: this.privateKey?.sign(bodyArray).toString(),
              body
            })
          )
        } else {
          // Send an unautenticated request
          socket.send(
            JSON.stringify({
              type: 'request',
              body
            })
          )
        }
        /* Listen for messages from the server */
        socket.onmessage = async (event) => {
          const data = JSON.parse(event.data)
          if (data.value.error) {
            reject(data.value.message)
            return
          }
          resolve(data.value)
        }
      }
      socket.onerror = reject
    })
  },

  authorize: async function () {
    if (!this.privateKey) throw 'No private key found'
    const auth: UserAuth = await this.loginWithChallenge(this.privateKey, this.account)
    this.user = await Users.withUserAuth(auth)
    this.client = await Client.withUserAuth(auth)
    await this.user.setupMailbox()
    const now = new Date()
    this.lastAuthorization = now.getTime()
    // await this.user.watchInbox(await this.user.getMailboxID(), this.watchInbox)
    return this.client
  },

  watchInbox: async function (
    reply?: MailboxEvent | undefined,
    err?: Error | undefined
  ) {
    if (!reply || !reply.message) return
    // if (reply.type !== MailboxEventType.CREATE) {
    //   return
    // }
    if (!Textile.privateKey) return
    const messageDecoded = await messageDecoder(
      reply.message,
      Textile.privateKey
    )
    Textile.callbackInbox(messageDecoded)
  },

  setCallbackInbox: async function (
    callback: (message: DecryptedMailbox) => void
  ) {
    this.callbackInbox = callback
  },

  refreshAuthorization: async function (): Promise<Client | null> {
    const now = new Date()
    try {
    if (!this.lastAuthorization) return await this.authorize()
    if (this.lastAuthorization + 60000 < now.getTime())
      return await this.authorize()
    } catch (err) {
      if (err == "No private key found") console.log('The accound has no Textile key registered.')
    }
    return null
  },

  // MAILBOX
  listInboxMessages: async function (): Promise<DecryptedMailbox[]> {
    await this.refreshAuthorization()
    if (!this.user) return []
    if (!this.privateKey) return []
    const messages = await this.user.listInboxMessages({ status: 2 })
    const privateKey = PrivateKey.fromString(this.privateKey.toString())
    const messageList = Promise.all(
      messages.map(async function (m) {
        return await messageDecoder(m, privateKey)
      })
    )
    return messageList
  },

  listOutboxMessages: async function (): Promise<DecryptedMailbox[]> {
    await this.refreshAuthorization()
    if (!this.user) throw 'No user defined'
    if (!this.privateKey) throw 'No private key present'
    const messages = await this.user.listSentboxMessages()
    const privateKey = PrivateKey.fromString(this.privateKey.toString())
    const messageList = Promise.all(
      messages.map(async function (m) {
        return await messageDecoder(m, privateKey)
      })
    )
    return messageList
  },

  sendMessage: async function (to: string, message: MessageRequest) {
    await this.refreshAuthorization()
    if (!this.user) return null
    if (!this.privateKey) return null
    const toPublicKey: PublicKey = PublicKey.fromString(to)
    const encoded = new TextEncoder().encode(JSON.stringify(message))
    // const encryptedEncoded = await toPublicKey.encrypt(encoded)
    // const decoded = new TextDecoder().decode(encryptedEncoded).toString()
    return await this.user.sendMessage(this.privateKey, toPublicKey, encoded)
  },

  readMessage: async function (id: string) {
    await this.refreshAuthorization()
    if (!this.user) return
    await this.user.readInboxMessage(id)
  },

  deleteMessage: async function (id: string) {
    await this.refreshAuthorization()
    if (!this.user) return
    // Delete from both cause it only exist in one
    await this.user.deleteSentboxMessage(id)
    await this.user.deleteInboxMessage(id)
  },

  // SHARABLE BUCKETS
  createBucket: async function () {},

  listBuckets: async function () {},

  listFilesInBucket: async function () {},

  uploadFile: async function () {},

  updateFolderPermission: async function () {},

  eraseFile: async function () {},
}

export default Textile
