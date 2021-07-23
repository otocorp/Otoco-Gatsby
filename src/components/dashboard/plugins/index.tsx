import React, { Dispatch, FC, useState } from 'react'
import { connect } from 'react-redux'
import {
  SeriesType,
  ManagementActionTypes,
} from '../../../state/management/types'
import {
  AccountActionTypes,
  DecryptedMailbox,
  SET_INBOX_MESSAGES,
  SET_OUTBOX_MESSAGES,
} from '../../../state/account/types'
import Textile from '../../../services/textile'
import PaymentWidget from '../../paymentWidget'
import { IState } from '../../../state/types'
import { PaymentsMade } from './paymentsMade'
import { PaymentsDue } from './paymentsDue'
import { PrivateKey } from '@textile/crypto'
import WelcomeForm from '../welcomeForm'
import manage from '../manage'
import account from '../account'

interface Props {
  account?: string
  network?: string
  managing?: SeriesType
  privatekey?: PrivateKey
  inboxMessages: DecryptedMailbox[]
  outboxMessages: DecryptedMailbox[]
  dispatch: Dispatch<AccountActionTypes | ManagementActionTypes>
}

interface ModalProps {
  messageId: string
  billId: string
  product: string
  amount: number
}

const SeriesOverview: FC<Props> = ({
  account,
  network,
  managing,
  privatekey,
  inboxMessages,
  outboxMessages,
  dispatch,
}: Props) => {
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [modalInfo, setModalInfo] = useState<ModalProps | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  const insertRenewalDue = (inbox:DecryptedMailbox[], outbox:DecryptedMailbox[]) => {
    const billRef = "Renewal/" + managing.renewal.getFullYear()
    const payment = outbox.find((m) => m.body.message.body.billRef == billRef)
    console.log(payment)
    if ( !payment && managing?.renewal && managing?.renewal.getTime() < Date.now() ) {
      inbox.push({
        from: process.env.GATSBY_ORACLE_KEY,
        body: {
          method: "billing",
          message: {
            amount: 39,
            entity: managing?.contract,
            environment: network,
            product: "Renewal",
            _id: billRef
          }
        }
      })
    }
  }

  React.useEffect(() => {
    setTimeout(async () => {
      if (!privatekey) return // Ignore in case of non privateKey present
      if (modalOpen) return   // Ignore in case of opening modal, refresh when closes
      setLoading(true)
      setError('')
      try {
        const outbox = (await Textile.listOutboxMessages())
          .filter((m) => m.body.method === 'payment' )
          .filter((m) => m.body.message.entity === managing?.contract)
        dispatch({
          type: SET_OUTBOX_MESSAGES,
          payload: outbox,
        })
        const inbox = (await Textile.listInboxMessages())
          .filter((m) => m.body.method === 'billing')
          .filter((m) => m.body.message.entity === managing?.contract)
        insertRenewalDue(inbox, outbox)
        dispatch({
          type: SET_INBOX_MESSAGES,
          payload: inbox,
        })
        setLoading(false)
      } catch (err) {
        console.error(err)
        setError('An error ocurred acessing payment service.')
        setLoading(false)
      }
    }, 0)
  }, [managing, privatekey, modalOpen])

  const closeModal = () => {
    setModalInfo(null)
    setModalOpen(false)
  }

  const handleSelectPlugin = async (
    p: string,
    messageId: string,
    billId: string,
    a: number
  ) => {
    setModalInfo({
      messageId,
      billId,
      product: p,
      amount: a,
    })
    setModalOpen(true)
  }

  return (
    <div>
      <div className="d-grid gap-1 mb-5">
        <h3 className="m-0">Billing</h3>
        <div className="small">
          Here you can pay for the maintenance of your entities and see what
          else you paid for.
        </div>
        {!privatekey && (
          <div className="d-flex justify-content-center">
            <div className="row">
              <WelcomeForm></WelcomeForm>
            </div>
          </div>
        )}
        {error && (
          <div className="d-flex justify-content-center">
            <div className="row">
              <div className="col-12 text-center text-warning">{error}</div>
              <div className="col-12 text-center">
                Try again in some minutes.
              </div>
            </div>
          </div>
        )}
        {!error && privatekey && (
          <div>
            <div>
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Item</th>
                    <th scope="col" className="text-end">
                      Amount
                    </th>
                    <th scope="col" className="text-end">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  { !loading &&
                  <PaymentsDue
                    contract={managing?.contract}
                    messages={inboxMessages}
                    handlePay={handleSelectPlugin}
                  ></PaymentsDue>
                  }
                  { loading &&
                    <tr>
                      <td colSpan={4}>
                        <div className="col-12 text-center">Loading</div>
                        <div className="col-12 text-center">
                          <div className="spinner-border" role="status"></div>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
              <PaymentWidget
                show={modalOpen}
                messageId={modalInfo?.messageId}
                billId={modalInfo?.billId}
                product={modalInfo?.product}
                amount={modalInfo?.amount}
                closeModal={closeModal}
              ></PaymentWidget>
            </div>
            <h3 className="m-0">Payments made</h3>
            <div className="small">
              Easy place to check the payments you have made using plugins
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">ID/Hash</th>
                  <th scope="col" className="text-end">
                    Timestamp
                  </th>
                  <th scope="col" className="text-end">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                { !loading &&
                  <PaymentsMade
                    contract={managing?.contract}
                    messages={outboxMessages}
                    wallet={account}
                  ></PaymentsMade>
                }
                { loading &&
                  <tr>
                    <td colSpan={4}>
                      <div className="col-12 text-center">Loading</div>
                      <div className="col-12 text-center">
                        <div className="spinner-border" role="status"></div>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default connect((state: IState) => ({
  account: state.account.account,
  network: state.account.network,
  managing: state.management.managing,
  privatekey: state.account.privatekey,
  inboxMessages: state.account.inboxMessages,
  outboxMessages: state.account.outboxMessages,
}))(SeriesOverview)
