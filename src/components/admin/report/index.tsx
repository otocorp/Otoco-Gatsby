import { PrivateKey, PublicKey } from '@textile/hub'
import React, { FC, useState } from 'react'
import { connect } from 'react-redux'
import { IState } from '../../../state/types'
import Textile from '../../../services/textile'
import {
  BroadcastFilter,
  BroadcastMessage,
  MessageSchema,
  PaymentMessage,
} from '../../../state/account/types'

interface Props {
  privatekey?: PrivateKey
}

const Report: FC<Props> = ({ privatekey }: Props) => {
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState<string>('')
  const [link, setLink] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [filter, setFilter] = useState<BroadcastFilter | null>(null)
  const [result, setResult] = useState<string>('')

  const handleReportRequest = async () => {
    if (!privatekey) return
    if (!process.env.GATSBY_ORACLE_KEY) return

    const res = await Textile.sendMessage(process.env.GATSBY_ORACLE_KEY, {
      method: 'report',
      message: {},
    })

    if (res) setResult('Report message sent. ID:' + res?.id)
    else setResult('Error sending report message.')
  }

  return (
    <div>
      <div className="row">
        <div className="col-12">
          <div className="col-12 card">
          <h4>Report Message</h4>
            <p className="small">Request oracle an accounts registered reports.</p>
            {!result && (
              <button
                className="btn btn-primary mb-2"
                onClick={handleReportRequest}
              >
                Request Report
              </button>
            )}
            <p className="mb-2">{result}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default connect((state: IState) => ({
  privatekey: state.account.privatekey,
}))(Report)
