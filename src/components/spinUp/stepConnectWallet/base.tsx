import React, { Dispatch, FC, useState } from 'react'
import Web3 from 'web3'
import { connect } from 'react-redux'
import { IState } from '../../../state/types'
import Web3Integrate from '../../../services/web3-integrate'
import {
  SET_ACCOUNT,
  SET_NETWORK,
  AccountActionTypes,
} from '../../../state/account/types'
import {
  CLEAR_AVAILABLE_NAME,
  SET_CURRENT_STEP,
  SpinUpActionTypes,
} from '../../../state/spinUp/types'

interface Props {
  account: string | null
  network: string | null
  dispatch: Dispatch<AccountActionTypes | SpinUpActionTypes>
}

const StepConnectWallet: FC<Props> = ({
  account,
  network,
  dispatch,
}: Props) => {
  React.useEffect(() => {
    if (account && network) dispatch({ type: SET_CURRENT_STEP, payload: 3 })
  }, [account, dispatch, network])

  const clickBackHandle = () => {
    dispatch({ type: CLEAR_AVAILABLE_NAME })
    dispatch({ type: SET_CURRENT_STEP, payload: 1 })
  }

  const clickConnectHandler = async () => {
    try {
      const web3 = await Web3Integrate.callModal()
      const accounts = await web3.eth.getAccounts()
      dispatch({
        type: SET_NETWORK,
        payload: await web3.eth.net.getNetworkType(),
      })
      dispatch({ type: SET_ACCOUNT, payload: accounts[0] })
      dispatch({ type: SET_CURRENT_STEP, payload: 3 })
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <div>
      <div>
        <div className="">
          <p>Connect a wallet that will own your company.</p>
          <p>{account}</p>
          <p>{network}</p>
        </div>
        <div className="d-flex row-cols-2 pt-4 gap-5 flex-row">
          <button
            type="button"
            className="btn btn-primary-outline flex-fill"
            onClick={clickBackHandle}
          >
            Back
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={clickConnectHandler}
          >
            Connect Wallet
          </button>
        </div>
      </div>
    </div>
  )
}

export default connect((state: IState) => ({
  account: state.account.account,
  network: state.account.network,
}))(StepConnectWallet)
