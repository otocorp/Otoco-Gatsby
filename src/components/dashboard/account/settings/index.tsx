import React, { Dispatch, FC, useState } from 'react'
import { connect } from 'react-redux'
import { IState } from '../../../../state/types'
import Textile from '../../../../services/textile'
import { PrivateKey } from '@textile/hub'
import KeyWidget from '../../../keyWidget/keyWidget'

import {
  SeriesType,
  ManagementActionTypes,
} from '../../../../state/management/types'
import {
  AccountActionTypes,
  SET_ALIAS,
  DecryptedMailbox,
  CachedAccount
} from '../../../../state/account/types'

import '../../style.scss'
import Account from '../index'

interface Props {
  account?: string
  network?: string
  managing?: SeriesType
  alias?: string
  privatekey?: PrivateKey
  inboxMessages: DecryptedMailbox[]
  outboxMessages: DecryptedMailbox[]
  dispatch: Dispatch<ManagementActionTypes | AccountActionTypes>
}

const SeriesIdentity: FC<Props> = ({
  account,
  privatekey,
  dispatch,
}: Props) => {
  const [hasEmail, setHasEmail] = useState<boolean>(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [aliasTemp, setAlias] = useState<string | undefined>(undefined)

  const validateEmail = (email) => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return re.test(String(email).toLowerCase())
  }
  const handleChangeEmail = (event) => {
    setEmail(event.target.value)
  }
  const handleUpdateEmail = async () => {
    if (!validateEmail(email) && email.length > 0) {
      setError('* please fill a valid e-mail.')
      return
    }
    try {
      if (email.length == 0) return
      // await oracle.saveWallet(account, email, [])
      await Textile.sendMessage(process.env.GATSBY_ORACLE_KEY, {
        method: 'wallet',
        message: {
          _id: account,
          email,
        },
      })
      if (!account) return
      setHasEmail(true)
    } catch (err) {
      // setError('Some error occurred creating mailbox.')
      console.error(err)
    }
  }
  const handleChangeAliasTemp = (event) => {
    setAlias(event.target.value)
  }
  const handleChangeAlias = async () => {
    if (!aliasTemp || !account) return
    const cached:CachedAccount = Textile.fetchAccountDetails(account)
    cached.alias = aliasTemp
    Textile.storeAccountDetails(account, cached)
    dispatch({ type: SET_ALIAS, payload: aliasTemp })
  }

  return (
    <Account tab="settings">
      <div>
        {privatekey && (
          <div>
            Your Public Key:{' '}
            <KeyWidget publickey={privatekey.public.toString()}></KeyWidget>
          </div>
        )}
        {!hasEmail && (
          <div>
            <h5 className="mt-4">
              Use following form to update/add your contact e-mail:
            </h5>
            <div className="input-group my-2 col-12 col-md-8">
              <input
                type="text"
                className="form-control right"
                placeholder="johndoe@domain.com"
                onChange={handleChangeEmail}
              />
              <div className="input-group-append">
                <div onClick={handleUpdateEmail} className="btn btn-primary">
                  update e-mail
                </div>
              </div>
            </div>
            <div className="small text-warning">{error}</div>
          </div>
        )}
      </div>
      {/* <div>
        <h5 className="mt-4">Create an alias to your wallet:</h5>
        <div className="input-group my-2 col-12 col-md-8">
          <input
            type="text"
            className="form-control right"
            placeholder={alias || 'choose an alias'}
            onChange={handleChangeAliasTemp}
          />
          <div className="input-group-append">
            <div onClick={handleChangeAlias} className="btn btn-primary">
              {alias ? 'update alias' : 'create alias'}
            </div>
          </div>
        </div>
      </div> */}
    </Account>
  )
}

export default connect((state: IState) => ({
  account: state.account.account,
  network: state.account.network,
  alias: state.account.alias,
  inboxMessages: state.account.inboxMessages,
  outboxMessages: state.account.outboxMessages,
  privatekey: state.account.privatekey,
  managing: state.management.managing,
}))(SeriesIdentity)
