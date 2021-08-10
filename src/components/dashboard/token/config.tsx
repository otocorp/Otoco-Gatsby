import React, { Dispatch, FC, useState } from 'react'
import Web3 from 'web3'
import BN from 'bn.js'
import { connect } from 'react-redux'
import CurrencyInput from 'react-currency-input-field';
import FactoryContract from '../../../smart-contracts/TokenFactory'
import MasterRegistry from '../../../smart-contracts/MasterRegistry'
import TokenContract from '../../../smart-contracts/OtocoToken'
import TransactionUtils from '../../../services/transactionUtils'
import TransactionMonitor from '../../transactionMonitor/transactionMonitor'
import { SeriesType } from '../../../state/management/types'
import {
  SET_TOKEN_CONFIG,
  SET_TOKEN_DEPLOYED,
  TokenActionTypes,
} from '../../../state/management/token/types'
import { IState } from '../../../state/types'

interface Props {
  account?: string | null
  network?: string | null
  managing?: SeriesType
  dispatch: Dispatch<TokenActionTypes>
}

const Config: FC<Props> = ({ account, network, managing, dispatch }: Props) => {
  const decimals = 18
  const [error, setError] = useState<string | null>(null)
  const [shares, setShares] = useState(0)
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [existing, setExisting] = useState('')
  const [transaction, setTransaction] = useState('')

  const web3: Web3 = window.web3
  const getBNDecimals = (decimals: number) => {
    return new BN(10).pow(new BN(decimals))
  }

  const handleChangeName = (event: React.FormEvent<HTMLInputElement>) => {
    setName(event.target.value)
  }
  const handleChangeSymbol = (event: React.FormEvent<HTMLInputElement>) => {
    setSymbol(event.target.value)
  }
  const handleChangeShares = (value:string | void) => {
    setShares(parseInt(value))
  }
  const handleExistingChanges = (event: React.FormEvent<HTMLInputElement>) => {
    setExisting(event.target.value)
  }

  const handleClickDeploy = async () => {
    if (name.length < 3 || name.length > 50) {
      setError('Keep token name length biggen than 2 and less than 50')
      return
    }
    if (!/^[A-Z]+$/.test(symbol)) {
      setError('For Token Symbol only use upper case letters')
      return
    }
    if (symbol.length < 3) {
      setError('For Token Symbol only use upper case letters')
      return
    }
    if (shares < 100 || shares > 100000000000) {
      setError('For Total Shares use integers between 100 and 100000000000')
      return
    }
    dispatch({
      type: SET_TOKEN_CONFIG,
      payload: {
        shares: shares.toString(),
        decimals,
        name,
        symbol,
      },
    })
    if (!account || !network || !managing) {
      setError('Not connected or not account related.')
      return
    }
    const requestInfo = await TransactionUtils.getTransactionRequestInfo(
      account,
      '300000'
    )
    try {
      FactoryContract.getContract(network)
        .methods.createERC20(
          new BN(shares).mul(getBNDecimals(decimals)).toString(),
          name,
          symbol,
          managing.contract
        )
        .send(requestInfo, (error, hash: string) => {
          if (error) return console.error(error)
          setTransaction(hash)
        })
    } catch (err) {
      console.error(err)
    }
  }

  const handleClickAttachExisting = async () => {
    if (!account || !network || !managing) return
    if (!Web3.utils.isAddress(existing)) {
      setError('The existing token is not an Address.')
      return
    }
    try {
      // Get deployed Token Contract
      const decimals = await TokenContract.getContract(existing)
        .methods.decimals()
        .call({ from: account })
      if (isNaN(decimals)) throw 'Error'
    } catch (err) {
      setError('Error checking if address is a ERC20 token')
      return
    }
    const requestInfo = await TransactionUtils.getTransactionRequestInfo(
      account,
      '100000'
    )
    MasterRegistry.getContract(network)
      .methods.setRecord(managing.contract, 1, existing)
      .send(requestInfo, (error, hash: string) => {
        if (error) return console.error(error)
        setTransaction(hash)
      })
  }

  const handleNextStep = async () => {
    if (!account || !network || !managing) {
      setError('Not connected or not account related.')
      return
    }
    // Get deployed Token Contract
    const contract = await MasterRegistry.getContract(network)
      .methods.getRecord(managing.contract, 1)
      .call({ from: account })
    const shares = await TokenContract.getContract(contract)
      .methods.totalSupply()
      .call({ from: account })
    const decimals = await TokenContract.getContract(contract)
      .methods.decimals()
      .call({ from: account })
    const sharesBN = new BN(shares)

    dispatch({
      type: SET_TOKEN_CONFIG,
      payload: {
        name: await TokenContract.getContract(contract)
          .methods.name()
          .call({ from: account }),
        symbol: await TokenContract.getContract(contract)
          .methods.symbol()
          .call({ from: account }),
        shares: sharesBN.div(getBNDecimals(decimals)).toString(),
        decimals: decimals,
      },
    })
    // Get Token creation
    const events = await TokenContract.getContract(
      contract
    ).getPastEvents('allEvents', { fromBlock: 0, toBlock: 'latest' })
    const timestamp = await web3.eth.getBlock(events[0].blockNumber)
    const creation = new Date(parseInt(timestamp.timestamp.toString()) * 1000)
    dispatch({
      type: SET_TOKEN_DEPLOYED,
      payload: {
        creation,
        contract,
      },
    })
  }

  return (
    <div>
      <div className="small">
        We made it easy for your new company to issue ERC20 tokens.
      </div>
      <div className="small pb-2">
        You decide what the tokens represent: equity in your company, a usage
        right, a convertible, etc. <br/>
        Simply set you token parameters and click <b>Deploy Token</b> to create the new contract.
      </div>
      {!transaction && (
        <div>
        <div className="row">
          <div className="col-12 col-md-8">
            <div className="input-group mb-2">
              <input
                type="text"
                className="form-control right"
                placeholder="Choose token name"
                aria-label="Text input with dropdown button"
                onChange={handleChangeName}
              />
              <div className="input-group-append">
                <div className="btn btn-primary disabled">Token Name</div>
              </div>
            </div>
          </div>
          <div className="w-100"></div>
          <div className="col-12 col-md-8">
            <div className="input-group mb-2">
              <input
                type="text"
                className="form-control right"
                placeholder="e.g.: TOK"
                aria-label="Text input with dropdown button"
                onChange={handleChangeSymbol}
              />
              <div className="input-group-append">
                <div className="btn btn-primary disabled">Token Symbol</div>
              </div>
            </div>
          </div>
          <div className="w-100"></div>
          <div className="col-12 col-md-8">
            <div className="input-group mb-2">
              <CurrencyInput
                className="form-control right"
                placeholder="e.g.: 1000000"
                defaultValue={0}
                decimalsLimit={0}
                onValueChange={handleChangeShares}
              />
              <div className="input-group-append">
                <div className="btn btn-primary disabled">Token Quantity</div>
              </div>
            </div>
          </div>
          <div className="w-100"></div>
        </div>
        <div className="row">
          <div className="col-12 col-md-8 mt-4"> 
            <button className="col-12 col-md-4 btn btn-primary" onClick={handleClickDeploy} style={{float:'right'}}>
              Deploy Token
            </button>
          </div>
        </div>
        <div className="row">
          <p className="mt-4">or link an existing ERC20 token to your company</p>
          <div className="col-12 col-md-8">
            <div className="input-group mb-2">
                <input
                  type="text"
                  className="form-control right"
                  placeholder="Paste your ERC20 token contract address here"
                  aria-label="Text input with dropdown button"
                  onChange={handleExistingChanges}
                />
                <div className="input-group-append">
                  <div className="btn btn-primary" onClick={handleClickAttachExisting}>Attach Token</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {transaction && (
        <TransactionMonitor
          hash={transaction}
          title="Deploying Tokens"
          callbackSuccess={handleNextStep}
        ></TransactionMonitor>
      )}
      {error && <p className="small text-danger">{error}</p>}
    </div>
  )
}

export default connect((state: IState) => ({
  account: state.account.account,
  network: state.account.network,
  managing: state.management.managing,
}))(Config)
