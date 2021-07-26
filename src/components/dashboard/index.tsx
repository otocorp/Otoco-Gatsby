import React, { FC, Dispatch, useState } from 'react'
import Axios, { AxiosResponse } from 'axios'
import Web3 from 'web3'
import { connect } from 'react-redux'
import { CSSTransition } from 'react-transition-group'
import { IState } from '../../state/types'
import Web3Integrate from '../../services/web3-integrate'
import SeriesListing from './seriesListing'
import WelcomeForm from './welcomeForm'

import './style.scss'

import {
  SET_ACCOUNT,
  SET_NETWORK,
  AccountActionTypes,
} from '../../state/account/types'

import {
  SeriesType,
  CLEAR_MANAGE_SERIES,
  SET_OWN_SERIES,
  SET_CONTACT_FORM,
  ManagementActionTypes,
  Badges,
} from '../../state/management/types'

import { IJurisdictionOption } from '../../state/spinUp/types'
import { PrivateKey } from '@textile/hub'
import { GraphNetwork, requestSubgraph } from '../../services/thegraph'
import Logo from '../logo/logo'
import {
  CLEAR_MULTISIG_DEPLOYED,
  MultisigActionTypes,
} from '../../state/management/multisig/types'
import {
  CLEAR_TOKEN_DEPLOYED,
  TokenActionTypes,
} from '../../state/management/token/types'
import {
  CLEAR_ENS_DOMAINS,
  ENSActionTypes,
} from '../../state/management/ens/types'
import { ExclamationTriangle } from 'react-bootstrap-icons'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

interface Props {
  account?: string
  network?: string
  privatekey?: PrivateKey
  series: SeriesType[]
  managing?: SeriesType
  jurisdictionOptions: IJurisdictionOption[]
  contactForm: boolean
  dispatch: Dispatch<
    | AccountActionTypes
    | ManagementActionTypes
    | AccountActionTypes
    | TokenActionTypes
    | MultisigActionTypes
    | ENSActionTypes
  >
}

const Overview: FC<Props> = ({ account, network, series, dispatch }: Props) => {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  React.useEffect(() => {
    dispatch({ type: CLEAR_MANAGE_SERIES })
    dispatch({ type: CLEAR_MULTISIG_DEPLOYED })
    dispatch({ type: CLEAR_TOKEN_DEPLOYED })
    dispatch({ type: CLEAR_ENS_DOMAINS })
    setTimeout(async () => {
      // IF NOT CONNECTED YET
      setLoading(true)
      setError(null)
      if (!account) {
        try {
          await Web3Integrate.callModal()
          const web3: Web3 = window.web3
          const accounts = await web3.eth.getAccounts()
          dispatch({
            type: SET_NETWORK,
            payload: await web3.eth.net.getNetworkType(),
          })
          dispatch({ type: SET_ACCOUNT, payload: accounts[0] })
          return
        } catch (err) {
          setError('Error connecting wallet. ' + err)
        }
      }
      // ALREADY CONNECTED
      const web3: Web3 = window.web3
      const ownSeries: any = {}

      if (!web3) {
        setError('Failed to connect wallet.')
        return
      }
      if (!network) {
        setError('Unknown network.')
        return
      }
      setError(null)
      let otocoNetwork = GraphNetwork.mainnet
      if (network == 'ropsten') otocoNetwork = GraphNetwork.ropsten
      const response: AxiosResponse = await requestSubgraph(
        otocoNetwork,
        `
        {
          owned:companies(where:{owner:"${account}"}) {
            id
            name
            owner
            jurisdiction
            creation
          }
          created:companies(where:{creator:"${account}"}) {
            id
            name
            owner
            jurisdiction
            creation
          }
        }
        `
      )

      const addBadge = (company: any, badge: Badges) => {
        if (!ownSeries[company.id]) {
          const c: SeriesType = {
            contract: company.id,
            name: company.name,
            jurisdiction: company.jurisdiction,
            created: new Date(parseInt(company.creation.toString()) * 1000),
            badges: [],
            closed: false
          }
          if (company.owner == ZERO_ADDRESS) c.closed = true
          ownSeries[company.id] = c
        }
        ownSeries[company.id].badges.push(badge)
      }

      for (const company of response.data.data.created) {
        addBadge(company, Badges.FIRST)
      }
      for (const company of response.data.data.owned) {
        addBadge(company, Badges.MANAGEMENT)
      }

      dispatch({ type: SET_OWN_SERIES, payload: Object.values(ownSeries) })
      if (ownSeries.length < 1) setError('You own no companies at the moment.')
      else setError(null)
      // }
      setLoading(false)
    }, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account])

  return (
    <div>
      <div className="absolute-logo">
        <Logo />
      </div>
      <div className="container-sm limiter-lg content">
        <h5>Account</h5>
        <CSSTransition
          in={account != null}
          timeout={{
            appear: 200,
            enter: 200,
            exit: 200,
          }}
          classNames="slide-up"
          unmountOnExit
        >
          <WelcomeForm></WelcomeForm>
        </CSSTransition>
        {!account && <div className="card">Connect your wallet to get access.</div>}
        <h5>Entities</h5>
        <CSSTransition
          in={loading}
          timeout={{
            appear: 200,
            enter: 200,
            exit: 200,
          }}
          classNames="slide-up"
          unmountOnExit
        >
          <div className="d-flex justify-content-center">
            <div className="row">
              <div className="col-12 text-center">Loading Companies</div>
              <div className="col-12 text-center">
                <div className="spinner-border" role="status"></div>
              </div>
            </div>
          </div>
        </CSSTransition>
        <CSSTransition
          in={series.length > 0}
          timeout={{
            appear: 200,
            enter: 200,
            exit: 0,
          }}
          classNames="my-node"
          unmountOnExit
        >
          <SeriesListing></SeriesListing>
        </CSSTransition>
        {error && (
          <div className="d-flex justify-content-center">
            <div className="row">
              <div className="col-12 text-center text-warning">
                Warning: {error}
              </div>
              {account === null && (
                <div className="col-12 text-center text-warning">
                  Wallet Not Connected.
                </div>
              )}
              {network === null && (
                <div className="col-12 text-center text-warning">
                  Invalid Network.
                </div>
              )}
              {network && (
                <div className="col-12 text-center text-warning">
                  Network selected: {network}
                </div>
              )}
            </div>
          </div>
        )}
        {!error && !loading && series.length == 0 && (
          <div className="d-flex justify-content-center">
            <div className="row text-secondary">
              <div className="col-12 text-center">
                <ExclamationTriangle></ExclamationTriangle>
              </div>
              <div className="col-12 text-center">
                No entities for selected network
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default connect((state: IState) => ({
  account: state.account.account,
  network: state.account.network,
  privatekey: state.account.privatekey,
  jurisdictionOptions: state.spinUp.jurisdictionOptions,
  series: state.management.series,
  contactForm: state.management.contactForm,
}))(Overview)
