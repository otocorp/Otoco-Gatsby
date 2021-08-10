import { PrivateKey, PublicKey } from '@textile/hub'
import React, { FC, useState } from 'react'
import { connect } from 'react-redux'
import { IState } from '../../../state/types'
import Textile from '../../../services/textile'

interface Props {
  privatekey?: PrivateKey
}

const Report: FC<Props> = ({ privatekey }: Props) => {
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [result, setResult] = useState<string>('')

  const handleWalletReportRequest = async () => {
    if (!privatekey) return
    if (!process.env.GATSBY_ORACLE_KEY) return

    const res = await Textile.sendMessage(process.env.GATSBY_ORACLE_KEY, {
      method: 'wallet-report',
      message: {},
    })

    if (res) setResult('Report message sent. ID:' + res?.id)
    else setResult('Error sending report message.')
  }

  const handlePaymentReportRequest = async () => {
    if (!privatekey) return
    if (!process.env.GATSBY_ORACLE_KEY) return

    var dateReg = /^\d{4}\/\d{2}\/\d{2}$/

    if (!startDate.match(dateReg)) return setResult('Wrong start date formatting.')
    if (!endDate.match(dateReg)) return setResult('Wrong end date formatting.')

    const startTimestamp = Date.UTC(
      parseInt(startDate.split('/')[0]),
      parseInt(startDate.split('/')[1])-1,
      parseInt(startDate.split('/')[2]))
    
    const endTimestamp = Date.UTC(
      parseInt(endDate.split('/')[0]),
      parseInt(endDate.split('/')[1])-1,
      parseInt(endDate.split('/')[2]))

    const res = await Textile.sendMessage(process.env.GATSBY_ORACLE_KEY, {
      method: 'payment-report',
      message: {
        start: startTimestamp,
        end: endTimestamp
      },
    })

    if (res) setResult('Report message sent. ID:' + res?.id)
    else setResult('Error sending report message.')
  }

  const handleChangeStart = (event) => {
    setStartDate(event.target.value)
  }
  const handleChangeEnd = (event) => {
    setEndDate(event.target.value)
  }

  return (
    <div>
      <div className="row">
        <div className="col-12">
          <div className="col-12 card">
            <h4>Report Wallets</h4>
            <p className="small">Request oracle an accounts registered reports.</p>
            <button
              className="btn btn-primary mb-2"
              onClick={handleWalletReportRequest}
            >
              Request Wallets Report
            </button>
            <p className="mb-2">{result}</p>
            <h4>Report Payments</h4>
            <p className="small">Request payments on a specific timeframe.</p>
            <div className="input-group mb-4">
              <input
                type="text"
                className="form-control right"
                placeholder="YYYY-MM-DD"
                onChange={handleChangeStart}
              />
              <div className="input-group-append">
                <div className="btn btn-primary disabled">Start</div>
              </div>
            </div>
            <div className="input-group mb-4">
              <input
                type="text"
                className="form-control right"
                placeholder="YYYY-MM-DD"
                onChange={handleChangeEnd}
              />
              <div className="input-group-append">
                <div className="btn btn-primary disabled">End</div>
              </div>
            </div>
            <button
              className="btn btn-primary mb-2"
              onClick={handleWalletReportRequest}
            >
              Request Payments Report
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default connect((state: IState) => ({
  privatekey: state.account.privatekey,
}))(Report)
