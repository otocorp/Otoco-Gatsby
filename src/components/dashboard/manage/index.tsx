import React, { Dispatch, FC, useState } from 'react'
import { navigate } from '@reach/router'
import { connect } from 'react-redux'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import TransactionUtils from '../../../services/transactionUtils'
import TransactionMonitor from '../../transactionMonitor/transactionMonitor'
import {
  CLEAR_MANAGE_SERIES,
  SeriesType,
  ManagementActionTypes,
} from '../../../state/management/types'
import SeriesContract from '../../../smart-contracts/SeriesContract'
import { DistributeVertical, FileEarmarkText } from 'react-bootstrap-icons'
import { IState } from '../../../state/types'

interface Props {
  account?: string | null
  network?: string | null
  managing?: SeriesType
  dispatch: Dispatch<ManagementActionTypes>
}

const SeriesDocuments: FC<Props> = ({ account, network, managing, dispatch }: Props) => {
  const [closeFormOpened, setCloseFormOpened] = useState<boolean>(false)
  const [transaction, setTransaction] = useState<string>('')

  const handleClickClose = () => {
    setCloseFormOpened(true)
  }

  const handleClickConfirmClose = async () => {
    if (!managing) return
    if (!network) return
    if (!account) return
    const requestInfo = await TransactionUtils.getTransactionRequestInfo(
      account,
      '30000'
    )
    // closingFinished()
    SeriesContract.getContract(managing.contract)
      .methods.renounceOwnership()
      .send(requestInfo, (error, hash: string) => {
        if (error) return console.error(error)
        setTransaction(hash)
      })
  }

  const closingFinished = async () => {
    dispatch({ type: CLEAR_MANAGE_SERIES })
  }

  return (
    <div className="row">
      <div className="d-grid gap-1 mb-5 col-12 col-md-6">
        <h3 className="m-0">Manage Entity</h3>
        <div className="small">Take critical decisions related to the company:</div>
        <div className="mt-2">
          {!closeFormOpened && (
          <button className="btn btn-warning mt-4 px-4 py-3" onClick={handleClickClose}>
            Close Entity
          </button>
          )}
          {closeFormOpened && !transaction && (
          <div className="card text-white">
            <p>After confirm your ownership will be revoked. This operation couldn't be undone. Are you sure want to close your entity?</p>
            <button className="btn btn-warning mt-4 px-4 py-3" onClick={handleClickConfirmClose}>
              Confirm Close Entity
            </button>
          </div>
          )}
          {transaction && (
            <TransactionMonitor
              hash={transaction}
              title="Closing Entity"
              callbackSuccess={closingFinished}
            ></TransactionMonitor>
          )}
        </div>
      </div>
    </div>
  )
}

export default connect((state: IState) => ({
  account: state.account.account,
  network: state.account.network,
  managing: state.management.managing,
}))(SeriesDocuments)
