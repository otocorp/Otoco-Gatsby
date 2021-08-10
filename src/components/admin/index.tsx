import React, { Dispatch, FC, useState } from 'react'
import { connect } from 'react-redux'
import Master from './master'
import Broadcast from './broadcast'
import Report from './report'
import Billing from './billing'

import WelcomeForm from '../dashboard/welcomeForm'
import Web3Integrate from '../../services/web3-integrate'
import Web3 from 'web3'
import {
  AccountActionTypes,
  SET_ACCOUNT,
  SET_NETWORK,
} from '../../state/account/types'
import { IState } from '../../state/types'
import { PrivateKey } from '@textile/hub'

interface Props {
  account?: string
  privatekey?: PrivateKey
  dispatch: Dispatch<AccountActionTypes>
}

const Admin: FC<Props> = ({ account, privatekey, dispatch }: Props) => {

  React.useEffect(() => {
    setTimeout(async () => {
      if (!account) {
        await Web3Integrate.callModal()
        const web3: Web3 = window.web3
        const accounts = await web3.eth.getAccounts()
        dispatch({
          type: SET_NETWORK,
          payload: await web3.eth.net.getNetworkType(),
        })
        dispatch({ type: SET_ACCOUNT, payload: accounts[0] })
        return
      }
    }, 10)
  }, [account])

  return (
    <div>
      <Master></Master>
      {privatekey && (
        <div>
          <Broadcast></Broadcast>
          <Billing></Billing>
          <Report></Report>
        </div>
      )}
      {!privatekey && (
        <WelcomeForm></WelcomeForm>
      )}
    </div>
  )
}

export default connect((state: IState) => ({
  account: state.account.account,
  privatekey: state.account.privatekey,
}))(Admin)
