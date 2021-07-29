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
import { DistributeVertical, ExclamationCircle, FileEarmarkText } from 'react-bootstrap-icons'
import { IState } from '../../../state/types'

interface Props {
  account?: string | null
  network?: string | null
  managing?: SeriesType
  dispatch: Dispatch<ManagementActionTypes>
}

const SeriesDocuments: FC<Props> = ({ account, network, managing, dispatch }: Props) => {
  const [closeFormOpened, setCloseFormOpened] = useState<boolean>(false)
  const [transactionTransfer, setTransactionTransfer] = useState<string>('')
  const [transactionClose, setTransactionClose] = useState<string>('')
  const [newOwner, setNewOwner] = useState<string>()

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
        setTransactionClose(hash)
      })
  }

  const handleOwnerChanges = (event: React.FormEvent<HTMLInputElement>) => {
    setNewOwner(event.target.value)
  }

  const handleClickTransferOwnership = async () => {
    if (!managing) return
    if (!network) return
    if (!account) return
    const requestInfo = await TransactionUtils.getTransactionRequestInfo(
      account,
      '30000'
    )
    SeriesContract.getContract(managing.contract)
      .methods.transferOwnership(newOwner)
      .send(requestInfo, (error, hash: string) => {
        if (error) return console.error(error)
        setTransactionTransfer(hash)
      })
  }

  const closingFinished = async () => {
    dispatch({ type: CLEAR_MANAGE_SERIES })
  }

  return (
    <div className="row">
      <div className="d-grid gap-1 mb-5">
        <h3 className="mt-2">Manage Entity</h3>
        <div className="small">Take critical decisions related to the company:</div>
        <div className="row">
          <div className="col-12 col-md-8 col-lg-6 mt-4">
            <h4>Transfer Ownership</h4>
            <p className="small">Move the ownership of your entity to a new owner.</p>
            { !transactionTransfer && (
            <div className="input-group mb-2">
              <input
                type="text"
                className="form-control right"
                placeholder="e.g.: 0x000123123..."
                aria-label="Text input with dropdown button"
                onChange={handleOwnerChanges}
              />
              <div className="input-group-append">
                <div className="btn btn-primary" onClick={handleClickTransferOwnership}>Transfer Ownership</div>
              </div>
            </div>
            )}
            { transactionTransfer && (
                <TransactionMonitor
                  hash={transactionTransfer}
                  title="Transfer Ownership"
                  callbackSuccess={closingFinished}
                ></TransactionMonitor>
              )}
        </div>
        <div className="col-12 col-md-8 col-lg-6 mt-4">
          <h4>Close Entity</h4>
          <div className="mt-2">
            <p className="small">Revoke ownership of your entity and close it.</p>
            {!closeFormOpened && (
              <button className="btn btn-warning px-4" onClick={handleClickClose} style={{padding: "12px 24px", borderRadius: "8px"}}>
                Close Entity
              </button>
            )}
            { closeFormOpened && !transactionClose && (
            <div className="card text-white">
              <p>
              <span style={{ marginRight: '0.5em' }}>
            <ExclamationCircle className="fix-icon-alignment" />
            </span>After confirm your ownership will be revoked. This operation couldn't be undone. Are you sure want to close your entity?</p>
              <button className="btn btn-warning mt-4 px-4 py-3" onClick={handleClickConfirmClose}>
                Confirm Close Entity
              </button>
            </div>
            )}
            { transactionClose && (
              <TransactionMonitor
                hash={transactionClose}
                title="Closing Entity"
                callbackSuccess={closingFinished}
              ></TransactionMonitor>
            )}
          </div>
        </div>
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
