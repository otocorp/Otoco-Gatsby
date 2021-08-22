import { PrivateKey, PublicKey } from '@textile/hub'
import React, { FC, useState } from 'react'
import { connect } from 'react-redux'
import { IState } from '../../../state/types'
import Textile from '../../../services/textile/textile'
import { BillingProps } from '../../../services/textile/types'

interface Props {
  network?: string
  privatekey?: PrivateKey
}

const Billing: FC<Props> = ({ network, privatekey }: Props) => {
  const [error, setError] = useState<string>('')
  const [confirmation, setConfirmation] = useState<string>('')
  const [product, setProduct] = useState<string>('')
  const [entity, setEntity] = useState<string>('')
  const [environment, setEnvironment] = useState<'main' | 'ropsten'>('main')
  const [amount, setAmount] = useState<number>(0)
  const [result, setResult] = useState<string>('')

  React.useEffect(() => {
    setTimeout(async () => {
      if (!privatekey) setError('No Account Key-pair found.')
      setEnvironment(network)
    }, 10)
  }, [privatekey, network])

  const handleChangeProduct = (event) => {
    setProduct(event.target.value)
  }
  const handleChangeEntity = (event) => {
    setEntity(event.target.value)
  }
  const handleChangeAmount = (event) => {
    setAmount(parseInt(event.target.value))
  }

  const handleBroadcastMessage = async () => {
    if (!privatekey) return
    if (!process.env.GATSBY_ORACLE_KEY) return

    const message: BillingProps = {
      product,
      entity,
      environment,
      amount,
    }

    const res = await Textile.sendMessage(process.env.GATSBY_ORACLE_KEY, {
      method: 'billing',
      message,
    })

    if (res) setResult('Billing message sent. ID:' + res?.id)
    else setResult('Error sending billing message.')
  }

  return (
    <div>
      <div className="row">
        <div className="col-12">
          <div className="col-12 card">
            <h4>Billing Message</h4>
            <p className="small">Create billing to an addressed entity. The message will be sent to company manager.</p>
            <div className="input-group mb-4">
              <input
                type="text"
                className="form-control right"
                placeholder="Item to pay for"
                onChange={handleChangeProduct}
              />
              <div className="input-group-append">
                <div className="btn btn-primary disabled">Product</div>
              </div>
            </div>
            <div className="input-group mb-4">
              <input
                type="text"
                className="form-control right"
                placeholder="Entity address"
                onChange={handleChangeEntity}
              />
              <div className="input-group-append">
                <div className="btn btn-primary disabled">Entity</div>
              </div>
            </div>
            <div className="input-group mb-4">
              <input
                type="text"
                className="form-control right"
                placeholder="Payment amount"
                onChange={handleChangeAmount}
              />
              <div className="input-group-append">
                <div className="btn btn-primary disabled">Amount</div>
              </div>
            </div>
            <button
              className="btn btn-primary mb-2"
              onClick={handleBroadcastMessage}
            >
              Send Billing
            </button>
            <p className="mb-2">{result}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default connect((state: IState) => ({
  network: state.account.network,
  privatekey: state.account.privatekey,
}))(Billing)
