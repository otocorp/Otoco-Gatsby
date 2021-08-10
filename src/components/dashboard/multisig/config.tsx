import React, { Dispatch, FC, useState } from 'react'
import Web3 from 'web3'
import { connect } from 'react-redux'
import { XLg } from 'react-bootstrap-icons'
import TransactionUtils from '../../../services/transactionUtils'
import TransactionMonitor from '../../transactionMonitor/transactionMonitor'
import GnosisSafe from '../../../smart-contracts/GnosisSafe'
import MultisigFactory from '../../../smart-contracts/MultisigFactory'
import MasterRegistry from '../../../smart-contracts/MasterRegistry'
import { SeriesType } from '../../../state/management/types'
import {
  SET_MULTISIG_CONFIG,
  SET_MULTISIG_DEPLOYED,
  MultisigConfig,
  MultisigActionTypes,
} from '../../../state/management/multisig/types'
import { IState } from '../../../state/types'
import { CSSTransition } from 'react-transition-group'

interface Props {
  account?: string | null
  network?: string | null
  managing: SeriesType
  multisigConfig: MultisigConfig
  dispatch: Dispatch<MultisigActionTypes>
}

const Config: FC<Props> = ({
  account,
  network,
  managing,
  multisigConfig,
  dispatch,
}: Props) => {
  const [error, setError] = useState<string | null>(null)
  const [currentOwner, setCurrentOwner] = useState<string>('')
  const [owners, setOwners] = useState<string[]>([])
  const [threshold, setThreshold] = useState<number>(1)
  const [multisig, setMultisig] = useState<boolean>(false)
  const [existing, setExisting] = useState('')
  const [transaction, setTransaction] = useState<string | null>(null)

  const web3: Web3 = window.web3

  React.useEffect(() => {
    setOwners([account])
  }, [])

  const ListOwners = () => {
    return owners.map((owner, idx) => (
      <div className="multisig-owner-card mt-2 px-3">
        <div className="mt-2" style={{float:'left'}}>
        {owner.substring(0, 6) +
          '...' +
          owner.substring(owner.length - 6, owner.length)}
        {owner.toLocaleLowerCase() == account?.toLocaleLowerCase() && <span className="text-white-50"> (you)</span>}
        </div>
        <button
          className={`btn btn-sm ${!multisig || owners.length < 2 ? 'disabled':''}`}
          onClick={handleRemoveOwner.bind(undefined, idx)}
          style={{float:'right'}}
        >
          <XLg>&#10005;</XLg>
        </button>
      </div>
    ))
  }

  const handleOwnerInputChange = (event) => {
    setCurrentOwner(event.target.value.toLowerCase())
    setError(null)
  }

  const handleRemoveOwner = (idx: number) => {
    const owns = [...owners]
    owns.splice(idx, 1)
    setOwners(owns)
  }

  const handleThresholdChange = (event) => {
    setThreshold(event.target.value)
    setError(null)
  }

  const handleAddOwner = (event) => {
    if (!web3.utils.isAddress(currentOwner)) {
      setError('Owner selected isn`t a valid address.')
      return
    }
    if (owners.indexOf(currentOwner) >= 0) {
      setError('Owner already added.')
      return
    }
    const owns = owners
    owns.push(currentOwner)
    setOwners(owns)
    setCurrentOwner('')
  }

  const handleClickAddOwners = () => {
    setMultisig(true)
  }

  const handleExistingChanges = (event: React.FormEvent<HTMLInputElement>) => {
    setExisting(event.target.value)
  }

  const handleClickAttachExisting = async () => {
    if (!account || !network || !managing) return
    if (!Web3.utils.isAddress(existing)) {
      setError('The existing wallet is not a valid Address.')
      return
    }
    try {
      // Get deployed Gnosis Contract
      const owners = await GnosisSafe.getContract(existing)
        .methods.getOwners()
        .call({ from: account })
      if (owners.length < 1) throw 'Error'
    } catch (err) {
      setError('Error checking if address is a Gnosis-safe Wallet')
      return
    }
    const requestInfo = await TransactionUtils.getTransactionRequestInfo(
      account,
      '100000'
    )
    MasterRegistry.getContract(network)
      .methods.setRecord(managing.contract, 2, existing)
      .send(requestInfo, (error, hash: string) => {
        if (error) return console.error(error)
        setTransaction(hash)
      })
  }

  const handleClickDeploy = async () => {
    if (owners.length < 1) {
      setError('Your wallet should have at least one owner.')
      return
    }
    if (threshold > owners.length) {
      setError('Threshold should not be bigger than owners quantity.')
      return
    }
    if (!network) return
    if (!account) return
    dispatch({
      type: SET_MULTISIG_CONFIG,
      payload: {
        owners,
        threshold: threshold.toString(),
      },
    })
    const requestInfo = await TransactionUtils.getTransactionRequestInfo(
      account,
      '500000'
    )
    try {
      const setupParametersEncoded = web3.eth.abi.encodeFunctionCall(
        GnosisSafe.abi[36], // Abi for Initialize wallet with Owners config
        [
          owners, // Array of owners
          threshold, // Threshold
          '0x0000000000000000000000000000000000000000',
          '0x0',
          '0x0000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000',
          0,
          '0x0000000000000000000000000000000000000000',
        ]
      )
      MultisigFactory.getContract(network)
        .methods.createMultisig(managing.contract, setupParametersEncoded)
        .send(requestInfo, (error, hash: string) => {
          setTransaction(hash)
        })
    } catch (err) {
      console.error(err)
    }
  }

  const deployFinished = async () => {
    const multisigAddress = await MasterRegistry.getContract(network)
      .methods.getRecord(managing.contract, 2)
      .call({ from: account })
    if (multisigAddress === '0x0000000000000000000000000000000000000000') {
      return
    }
    setTransaction(null)
    const safeContract = GnosisSafe.getContract(multisigAddress)
    dispatch({
      type: SET_MULTISIG_CONFIG,
      payload: {
        owners: await safeContract.methods
          .getOwners()
          .call({ from: account }),
        threshold: await safeContract.methods
          .getThreshold()
          .call({ from: account }),
      },
    })
    dispatch({
      type: SET_MULTISIG_DEPLOYED,
      payload: {
        contract: multisigAddress,
        balances: {},
      },
    })
  }

  return (
    <div>
      <div className="small mb-2">
        Create a digital wallet to store your company's crypto assets using Gnosis-Safe.
      </div>
      <div className="small">Your Safe wallet can have one or more owners. Your connected wallet is its first owner, but you can add more below.</div>
      <div className="row">
        <div className="mt-2 small">Owners:</div>
        <div className="col-12 col-md-8 mb-2 d-flex flex-wrap">
          <ListOwners></ListOwners>
        </div>
      </div>
      {!transaction && (
        <CSSTransition
          in={multisig}
          timeout={{
            appear: 200,
            enter: 200,
            exit: 200,
          }}
          classNames="slide-up"
          unmountOnExit
        >
          <div>
          <div className="row">
            <div className="mb-2 col-12 col-md-8">
              {error && <p className="text-warning small">{error}</p>}
            </div>
          </div>
          <div className="row">
            <div className="col-12 col-md-8"> 
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control right"
                  placeholder="Add an owner address..."
                  aria-label="Text input with button"
                  value={currentOwner}
                  onChange={handleOwnerInputChange}
                />
                <div className="input-group-append">
                  <button className="btn btn-primary" onClick={handleAddOwner}>
                    Add Owner
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-12 col-md-8 small">Any transaction requires the confirmation of:</div>
            <div className="mb-2 col-12 col-md-8">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control right"
                  placeholder="Number of signatures to aprove a transaction"
                  aria-label="Text input with button"
                  onChange={handleThresholdChange}
                />
                <div className="input-group-append">
                  <span className="btn btn-primary disabled">
                    out of {owners.length} owner(s)
                  </span>
                </div>
              </div>
            </div>
          </div>
          </div>
        </CSSTransition>
      )}
      {!transaction && (
        <div className="row">
          <div className="col-12 col-md-8">
            { !multisig && 
              <button className="col-12 col-md-5 col-lg-4 btn btn-primary mt-4" onClick={handleClickAddOwners}>
                + More Owners
              </button>
            }
            <button className="col-12 col-md-5 col-lg-4 btn btn-primary mt-4" onClick={handleClickDeploy} style={{float:'right'}}>
              Create Wallet
            </button>
          </div>
          <div className="col-12 col-md-8">
            <p className="mt-4 small">or attach an existing Gnosis-Safe multisig wallet to your company</p>
            <div className="input-group mb-2">
              <input
                type="text"
                className="form-control right"
                placeholder="Paste your Gnosis-safe wallet address here"
                aria-label="Text input with dropdown button"
                onChange={handleExistingChanges}
              />
              <div className="input-group-append">
                <div className="btn btn-primary" onClick={handleClickAttachExisting}>Attach Wallet</div>
              </div>
            </div>
          </div>
        </div>
      )}
      {transaction && (
        <TransactionMonitor
          hash={transaction}
          title="Creating Wallet"
          callbackSuccess={deployFinished}
        ></TransactionMonitor>
      )}
    </div>
  )
}

export default connect((state: IState) => ({
  account: state.account.account,
  network: state.account.network,
  managing: state.management.managing,
  multisigConfig: state.multisig.multisigConfig,
}))(Config)
