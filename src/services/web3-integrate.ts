import Web3 from 'web3'
import { provider } from 'web3-core'
import Web3Modal from 'web3modal'
import WalletConnectProvider from '@walletconnect/web3-provider'

interface ModalType {
  getWeb3: () => Web3
  callModal: () => Promise<Web3>
  disconnect: () => void
  web3?: Web3
  web3Modal?: Web3Modal
  provider?: provider
}

const Modal: ModalType = {
  web3: undefined,
  web3Modal: undefined,
  provider: undefined,

  getWeb3: function (): Web3 {
    if (!this.web3) throw 'WEB3 not yet connected'
    return this.web3
  },
  callModal: async function (): Promise<Web3> {
    if (!this.web3Modal) {
      const providerOptions = {
        walletconnect: {
          package: WalletConnectProvider, // required
          options: {
            // infuraId: process.env.GATSBY_INFURA_ID, // required
            rpc: {
              1: "https://cloudflare-eth.com/",
              3: "https://ropsten.infura.io/v3/" + process.env.GATSBY_INFURA_ID,
            }
          },
        },
      }

      this.web3Modal = new Web3Modal({
        cacheProvider: false, // optional
        providerOptions, // required
        theme: {
          background: '#0B1326',
          main: 'rgba(255, 255, 255, 0.8)',
          secondary: 'rgba(255, 255, 255, 0.8)',
          border: 'transparent',
          hover: 'rgba(116, 121, 255, 0.2)',
        },
      })
    }

    this.provider = await this.web3Modal.connect()
    this.web3 = new Web3(this.provider)
    return this.web3
  },
  disconnect: function (): void {
    if (this.web3Modal) this.web3Modal.clearCachedProvider()
    this.provider = null
  },
}

export default Modal
