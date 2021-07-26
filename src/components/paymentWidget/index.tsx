import React, { Dispatch, FC, useState } from 'react'
import Web3, { TransactionReceipt } from 'web3'
import { connect } from 'react-redux'
import { CSSTransition } from 'react-transition-group'
import { SeriesType, ManagementActionTypes } from '../../state/management/types'
import { IState } from '../../state/types'
import './style.scss'
import ERC20Contract from '../../smart-contracts/ERC20'
import TransactionUtils from '../../services/transactionUtils'
import { requestPaymentWyre, WyreEnv } from '../../services/wyre'
import { PrivateKey } from '@textile/crypto'
import { DecryptedMailbox, PaymentMessage, PaymentProps } from '../../state/account/types'
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
  dispatch: Dispatch<ManagementActionTypes>
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
  dispatch,
}: Props) => {
  const [status, setStatus] = useState<StatusType>(StatusType.CLOSED)
  const [countdown, setCountdown] = useState<boolean>(false)
  // Recept informations
  const [receipt, setReceipt] = useState<PaymentProps | null>(null)
  const [error, setError] = useState<string>('')

  React.useEffect(() => {
    if (show) {
      setStatus(StatusType.OPENED)
      setTimeout(() => {
        setCountdown(true)
      }, 200)
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
      const receipt: PaymentProps = {
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
      const receipt: PaymentProps = {
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
      const receipt: PaymentProps = {
        receipt: hash,
        method: 'USDT',
        currency: 'USDT',
        timestamp: Date.now(),
      }
      setReceipt(receipt)
      setStatus(StatusType.SUCCESS)
      // TODO In case of error sending message, suggest to RESEND receipt.
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
  const sendPaymentMessage = async (receipt: PaymentProps) => {
    if (!privatekey) throw 'Error sending payment. No Private Key present.'
    if (!process.env.GATSBY_ORACLE_KEY)
      throw 'Error sending payment. No Oracle public key set.'
    if (!managing) throw 'Error sending payment. No receipt/company found.'
    const message: PaymentMessage = {
      _id: receipt.receipt,
      method: receipt.method,
      currency: receipt.currency,
      entity: managing.contract,
      environment: network,
      timestamp: receipt.timestamp,
      product,
      amount,
      status: 'PROCESSING',
      body: { billRef: billId },
    }
    await Textile.sendMessage(process.env.GATSBY_ORACLE_KEY, {
      method: 'payment',
      message,
    })
    try {
      await Textile.readMessage(messageId)
    } catch (err) {
      // This will fail in cases of DAPP generated Renewals
    }
  }
  const handleClickDownload = async () => {
    const object = {
      _id: receipt?.receipt,
      method: receipt?.method,
      currency: receipt?.currency,
      entity: managing?.contract,
      environment: network,
      timestamp: receipt?.timestamp,
      product,
      amount,
      status: 'PROCESSING',
      body: { billRef: billId },
    }
    await downloadReceipt(
      new Date(receipt?.timestamp),
      receipt?.receipt,
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
              {status == StatusType.OPENED && (
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
                      className="btn btn-primary modal-option"
                      onClick={handleDAIPayment}
                    >
                      <OtocoIcon icon="dai" size={48} />
                      <div className="label">{amount} DAI</div>
                    </button>
                    <button
                      className="btn btn-primary modal-option"
                      onClick={handleUSDTPayment}
                    >
                      <OtocoIcon icon="usdt" size={48} />
                      <div className="label">{amount} USDT</div>
                    </button>
                  </div>
                  <p className="small mt-2">
                    <span style={{ marginRight: '0.5em' }}>
                      <ExclamationCircle className="fix-icon-alignment" />
                    </span>
                    Don't speed up this transaction, make sure your gas price is configured properly.
                  </p>
                  {error && <p className="small text-warning">{error}</p>}
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
