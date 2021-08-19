import React, { Dispatch, FC, useState } from 'react'
import Web3 from 'web3'
import BN from 'bn.js'
import Web3Integrate from '../../services/web3-integrate'
import { connect } from 'react-redux'
import { CSSTransition } from 'react-transition-group'
import { SeriesType, ManagementActionTypes } from '../../state/management/types'
import { IState } from '../../state/types'
import './style.scss'
import ERC20Contract from '../../smart-contracts/ERC20'
import TransactionUtils from '../../services/transactionUtils'
import { requestPaymentWyre, WyreEnv, verifyPaymentWyre } from '../../services/wyre'
import { PrivateKey } from '@textile/crypto'
import { PaymentProps, PaymentReceipt } from '../../state/account/types'
import Textile from '../../services/textile'
import OtocoIcon from '../icons'
import { downloadReceipt } from '../../services/receipt'
import { ExclamationCircle } from 'react-bootstrap-icons'

enum StatusType {
  CLOSED = 'closed',
  OPENED = 'opened',
  PROCESSING = 'processing',
  SUCCESS = 'success',
}

interface Balances {
  DAI: boolean
  USDT: boolean
  USDC: boolean
}

interface Props {
  account?: string
  network?: string
  privatekey?: PrivateKey
  managing?: SeriesType
  show: boolean
  billId: string
  messageId: string
  product: string
  amount: number
  closeModal: () => void
}

const PaymentWidget: FC<Props> = ({
  account,
  network,
  privatekey,
  managing,
  show,
  billId,
  messageId,
  product,
  amount,
  closeModal,
}: Props) => {
  const [status, setStatus] = useState<StatusType>(StatusType.CLOSED)
  const [countdown, setCountdown] = useState<boolean>(false)
  // Recept informations
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null)
  const [error, setError] = useState<string>('')
  const [receiptId, setReceiptId] = useState<string>('')
  const [receiptFormVisible, setReceiptFormVisible] = useState<boolean>(false)
  const [enoughBalances, setBalances] = useState<Balances>({
    DAI:false,
    USDT:false,
    USDC:false
  })
 


  React.useEffect(() => {
    if (show) {
      setStatus(StatusType.OPENED)
      setTimeout(() => {
        setCountdown(true)
      }, 200)
      setReceiptFormVisible(false)
      setTimeout(async () => {
        const amountToWei: BN = new BN(Web3.utils.toWei(amount.toString()))
        const amountToMwei: BN = new BN(Web3.utils.toWei(amount.toString(),'mwei'))
        const DAIBalance = new BN(await ERC20Contract.getContractDAI().methods.balanceOf(account).call({ from: account }))
        const USDTBalance = new BN(await ERC20Contract.getContractUSDT().methods.balanceOf(account).call({ from: account }))
        const USDCBalance = new BN(await ERC20Contract.getContractUSDC().methods.balanceOf(account).call({ from: account }))
        setBalances({
          DAI: DAIBalance.gte(amountToWei),
          USDT: USDTBalance.gte(amountToMwei),
          USDC: USDCBalance.gte(amountToMwei)
        })
      },0)
    } else {
      setStatus(StatusType.CLOSED)
      setCountdown(false)
    }
  }, [show])

  const handleWyrePayment = async () => {
    const env = network == 'main' ? WyreEnv.PROD : WyreEnv.TEST
    if (!account || !network) return
    setStatus(StatusType.PROCESSING)
    try {
      const response = await requestPaymentWyre(env, amount)
      const receipt: PaymentReceipt = {
        receipt: response.id,
        method: 'WYRE',
        currency: 'USD',
        timestamp: response.timestamp,
      }
      setReceipt(receipt)
      setStatus(StatusType.SUCCESS)
      await sendPaymentMessage(receipt)
    } catch (err) {
      setStatus(StatusType.OPENED)
      setError('Payment failed or cancelled.')
      console.error('PAYMENT CANCELLED', err)
    }
  }
  const handleDAIPayment = async () => {
    if (!account || !network) return
    setError('')
    setStatus(StatusType.PROCESSING)
    try {
      const requestInfo = await TransactionUtils.getTransactionRequestInfo(
        account,
        '60000'
      )
      const hash: string = await new Promise((resolve, reject) => {
        ERC20Contract.getContractDAI(network)
          .methods.transfer(
            process.env.GATSBY_WYRE_WALLET,
            Web3.utils.toWei(amount.toString(), 'ether')
          )
          .send(requestInfo, (error: Error, hash: string) => {
            if (error) reject(error.message)
            else resolve(hash)
          })
      })

      // if (!r.status) throw 'Transaction Errored'
      const receipt: PaymentReceipt = {
        receipt: hash,
        method: 'DAI',
        currency: 'DAI',
        timestamp: Date.now(),
      }
      setReceipt(receipt)
      setStatus(StatusType.SUCCESS)
      await sendPaymentMessage(receipt)
    } catch (err) {
      setStatus(StatusType.OPENED)
      setError('Payment failed or cancelled.')
      console.error('PAYMENT CANCELLED', err)
    }
  }
  const handleUSDTPayment = async () => {
    if (!account || !network) return
    setError('')
    setStatus(StatusType.PROCESSING)
    try {
      const requestInfo = await TransactionUtils.getTransactionRequestInfo(
        account,
        '60000'
      )
      const hash: string = await new Promise((resolve, reject) => {
        ERC20Contract.getContractUSDT(network)
          .methods.transfer(
            process.env.GATSBY_WYRE_WALLET,
            Web3.utils.toWei(amount.toString(), 'mwei')
          )
          .send(requestInfo, (error: Error, hash: string) => {
            if (error) reject(error.message)
            else resolve(hash)
          })
      })
      // if (!r.status) throw 'Transaction Errored'
      const receipt: PaymentReceipt = {
        receipt: hash,
        method: 'USDT',
        currency: 'USDT',
        timestamp: Date.now(),
      }
      setReceipt(receipt)
      setStatus(StatusType.SUCCESS)
      await sendPaymentMessage(receipt)
    } catch (err) {
      // In case of error sending confirmation message
      if (status != StatusType.SUCCESS) {
        setStatus(StatusType.OPENED)
        setError('Payment failed or cancelled.')
      } else {
        setError(
          'Error sending receipt to oracle, wait some minutes and click Re-send message.'
        )
      }
    }
  }
  const handleUSDCPayment = async () => {
    if (!account || !network) return
    setError('')
    setStatus(StatusType.PROCESSING)
    try {
      const requestInfo = await TransactionUtils.getTransactionRequestInfo(
        account,
        '60000'
      )
      const hash: string = await new Promise((resolve, reject) => {
        ERC20Contract.getContractUSDC(network)
          .methods.transfer(
            process.env.GATSBY_WYRE_WALLET,
            Web3.utils.toWei(amount.toString(), 'mwei')
          )
          .send(requestInfo, (error: Error, hash: string) => {
            if (error) reject(error.message)
            else resolve(hash)
          })
      })
      // if (!r.status) throw 'Transaction Errored'
      const receipt: PaymentReceipt = {
        receipt: hash,
        method: 'USDC',
        currency: 'USDC',
        timestamp: Date.now(),
      }
      setReceipt(receipt)
      setStatus(StatusType.SUCCESS)
      await sendPaymentMessage(receipt)
    } catch (err) {
      // In case of error sending confirmation message
      if (status != StatusType.SUCCESS) {
        setStatus(StatusType.OPENED)
        setError('Payment failed or cancelled.')
      } else {
        setError(
          'Error sending receipt to oracle, wait some minutes and click Re-send message.'
        )
      }
    }
  }
  const handleCloseModal = async () => {
    setError('')
    setReceipt(null)
    setStatus(StatusType.CLOSED)
    closeModal()
  }
  const sendPaymentMessage = async (receipt: PaymentReceipt) => {
    if (!network) throw 'Error sending payment. No network connected.'
    if (!privatekey) throw 'Error sending payment. No Private Key present.'
    if (!process.env.GATSBY_ORACLE_KEY)
      throw 'Error sending payment. No Oracle public key set.'
    if (!managing) throw 'Error sending payment. No receipt/company found.'
    const message: PaymentProps = {
      _id: receipt.receipt,
      method: receipt.method,
      currency: receipt.currency,
      entity: managing.contract,
      environment: network,
      timestamp: receipt.timestamp,
      product,
      amount,
      status: 'processing',
      body: { billRef: billId },
    }
    await Textile.sendMessage(process.env.GATSBY_ORACLE_KEY, {
      method: 'payment',
      message,
    })
    try { await Textile.readMessage(messageId) } catch (err) {
      // This will fail in cases of DAPP generated Renewals
    }
  }
  const handleClickDownload = async () => {
    if (!receipt) return setError('No Receipt to download found.')
    if (!network) return setError('No network connected.')
    if (!managing) return setError('No entity selected.')
    if (!account) return setError('No account connected.')
    const object = {
      _id: receipt.receipt,
      method: receipt.method,
      currency: receipt.currency,
      entity: managing?.contract,
      environment: network,
      timestamp: receipt?.timestamp,
      product,
      amount,
      status: 'processing',
      body: { billRef: billId },
    }
    await downloadReceipt(
      new Date(receipt.timestamp),
      receipt.receipt,
      product,
      network,
      receipt?.currency,
      receipt?.method,
      managing?.contract,
      account,
      amount,
      object
    )
    setError('')
    setReceipt(null)
    setStatus(StatusType.CLOSED)
    closeModal()
  }

  const handleClickReceiptForm = async () => {
    setReceiptFormVisible(true)
  }
  const updateReceipt = async (event) => {
    setReceiptId(event.target.value)
  }
  const handleClickUploadReceipt = async () => {
    const receipt: PaymentReceipt = {
      receipt: receiptId,
      method: 'WYRE',
      currency: 'USD',
      timestamp: Date.now(),
    }
    setStatus(StatusType.PROCESSING)
    try {
      // Is a Hash
      if (/^0x([A-Fa-f0-9]{64})$/.test(receiptId)) {
        const web3 = Web3Integrate.getWeb3()
        let currency = ''
        let r = await web3.eth.getTransactionReceipt(receiptId);
        if (!r.status)
          throw "Transaction not exists or not confirmed.";
        if (r.to != ERC20Contract.addressesDAI[network]) {
          receipt.method = 'DAI'
          receipt.currency = 'DAI'
        } else if (r.to != ERC20Contract.addressesUSDT[network]) {
          receipt.method = 'USDT'
          receipt.currency = 'USDT'
        }
        else throw "Transaction made on wrong contract.";
        receipt.timestamp = parseInt((await web3.eth.getBlock(r.blockNumber)).timestamp.toString()) * 1000
      } else {
        // Is NOT a hash
        await verifyPaymentWyre(receiptId, network, amount)
      }
      // If passed
      setReceipt(receipt)
      setStatus(StatusType.SUCCESS)
      await sendPaymentMessage(receipt)
    }
    catch(e) {
      setError(e);
      setStatus(StatusType.OPENED)
    }
  }

  return (
    <div>
      {status !== StatusType.CLOSED && (
        <div className="modal-widget">
          <CSSTransition
            in={countdown}
            timeout={{
              appear: 200,
              enter: 200,
              exit: 200,
            }}
            classNames="slide-up"
            unmountOnExit
          >
            <div className="modal-content">
              <div
                className={`close ${
                  status == StatusType.OPENED || status == StatusType.SUCCESS
                }`}
                onClick={handleCloseModal}
              >
                &times;
              </div>
              {status == StatusType.OPENED && !receiptFormVisible &&(
                <div>
                  <h3>Payment method</h3>
                  <div className="small">
                    Item: {product} -{' '}
                    <span className="text-secondary">({billId})</span>
                  </div>
                  <div className="row justify-content-center mt-2">
                    <button
                      className="btn btn-primary modal-option"
                      onClick={handleWyrePayment}
                    >
                      <OtocoIcon icon="creditcard" size={48} />
                      <div className="label">Card ${amount}</div>
                    </button>
                    <button
                      className={`btn btn-primary modal-option ${enoughBalances.DAI ? '' : 'disabled'}`}
                      onClick={handleDAIPayment}
                    >
                      <OtocoIcon icon="dai" size={48} />
                      <div className="label">{amount} DAI</div>
                      {!enoughBalances.DAI && <div className="small">no balance</div>}
                    </button>
                    <button
                      className={`btn btn-primary modal-option ${enoughBalances.USDT ? '' : 'disabled'}`}
                      onClick={handleUSDTPayment}
                    >
                      <OtocoIcon icon="usdt" size={48} />
                      <div className="label">{amount} USDT</div>
                      {!enoughBalances.USDT && <div className="small">no balance</div>}
                    </button>
                    <button
                     className={`btn btn-primary modal-option ${enoughBalances.USDC ? '' : 'disabled'}`}
                      onClick={handleUSDCPayment}
                    >
                      <OtocoIcon icon="usdc" size={48} />
                      <div className="label">{amount} USDC</div>
                      {!enoughBalances.USDC && <div className="small">no balance</div>}
                    </button>
                  </div>
                  <p className="small mt-2">
                    <span style={{ marginRight: '0.5em' }}>
                      <ExclamationCircle className="fix-icon-alignment" />
                    </span>
                    In case you have already made this payment before, just <a href='' onClick={handleClickReceiptForm}>click here</a> and upload a receipt.
                  </p>
                  {error && <p className="small text-warning">{error}</p>}
                </div>
              )}
              {status == StatusType.OPENED && receiptFormVisible &&(
                <div>
                  <h3>Upload Receipt</h3>
                  <div className="small">
                    Item: {product} -{' '}
                    <span className="text-secondary">({billId})</span>
                  </div>
                  <div className="row justify-content-center mt-4" style={{minHeight:'172px'}}>
                    <div className="col-12">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Paste a hash or a Payment id"
                        aria-label="Text input"
                        onChange={updateReceipt}
                      />
                    </div>
                    <div className="col-6">
                      <button
                        className="btn btn-primary flex-fill"
                        onClick={handleClickUploadReceipt}
                      >Check and Upload</button>
                    </div>
                    <div className="col-6">
                      {error && <p className="small text-warning">{error}</p>}
                    </div>
                  </div>
                </div>
              )}
              {status == StatusType.PROCESSING && (
                <div>
                  <h3>Processing Payment</h3>
                  <div className="small">Item: {product}</div>
                  <div
                    className="row justify-content-center align-items-center"
                    style={{ minHeight: '230px' }}
                  >
                    <div className="col">
                      <div className="col-12 text-center">
                        <div className="spinner-border" role="status"></div>
                      </div>
                      <div className="col-12 text-center">
                        <b>Payment confirming...</b>
                      </div>
                      <div className="col-12 text-center text-warning">
                        Do not close or refresh page
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {status == StatusType.SUCCESS && (
                <div>
                  <h3>Payment Successfull</h3>
                  <div className="px-4 py-4">
                  <div
                    className="row d-none d-md-flex align-items-center justify-content-center small"
                    style={{ minHeight: '230px' }}
                  >
                    <div className="col-3 text-end"><b>Item:</b></div>
                    <div className="col-9">{product}</div>
                    <div className="col-3 text-end"><b>Entity:</b></div>
                    <div className="col-9">{managing?.name} ({managing?.jurisdiction})</div>
                    <div className="col-3 text-end"><b>Receipt:</b></div>
                    <div className="col-9">{receipt?.receipt}</div>
                    <div className="col-3 text-end"><b>Method:</b></div>
                    <div className="col-9">{receipt?.method}</div>
                    <div className="col-3 text-end"><b>Amount:</b></div>
                    <div className="col-9">{amount} {receipt?.currency}</div>
                  </div>
                  <div
                    className="row d-md-none align-items-center justify-content-center small"
                    style={{ minHeight: '230px' }}
                  >
                    <h3 className="col-12 text-center">{product}</h3>
                    <div className="col-12 text-center"><b>Receipt</b></div>
                    <div className="col-12 text-center">{receipt?.receipt}</div>
                    <div className="col-12 text-center"><b>Method</b></div>
                    <div className="col-12 text-center">{receipt?.method}</div>
                    <div className="col-12 text-center"><b>Amount:</b> {amount} {receipt?.currency}</div>
                  </div>
                  <div className="row">
                    <p className="small mt-2">
                      <span style={{ marginRight: '0.5em' }}>
                        <ExclamationCircle className="fix-icon-alignment" />
                      </span>
                      Payments are not processed immediatelly, it could take some minutes to reflect changes.
                    </p>
                    <button
                      className="btn btn-primary flex-fill"
                      onClick={handleClickDownload}
                    >Download and Close</button>
                  </div>
                  {error && <p className="small text-warning">{error}</p>}
                </div>
                </div>
              )}
            </div>
          </CSSTransition>
        </div>
      )}
    </div>
  )
}

export default connect((state: IState) => ({
  account: state.account.account,
  network: state.account.network,
  privatekey: state.account.privatekey,
  managing: state.management.managing,
}))(PaymentWidget)
