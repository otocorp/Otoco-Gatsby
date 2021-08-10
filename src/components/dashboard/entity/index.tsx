import React, { Dispatch, FC, useState } from 'react'
import Web3 from 'web3'
import { connect } from 'react-redux'
import { ChevronLeft } from 'react-bootstrap-icons'
import Web3Integrate from '../../../services/web3-integrate'

import { SET_ACCOUNT, SET_NETWORK } from '../../../state/account/types'
import {
  SeriesType,
  ManageSection,
  SET_MANAGE_SERIES,
  ManagementActionTypes,
  Badges,
} from '../../../state/management/types'
import { IState } from '../../../state/types'
import { IJurisdictionOption } from '../../../state/spinUp/types'

import safeContract from '../../../smart-contracts/GnosisSafe'

import SeriesDocuments from '../legal'
import SeriesENS from '../ens'
import SeriesToken from '../token'
import SeriesMultisig from '../multisig'
import SeriesOverview from '../overview'
import Manage from '../manage'
import Plugins from '../plugins'
import { Link } from 'gatsby'
import { CSSTransition } from 'react-transition-group'
import { GraphNetwork, requestSubgraph } from '../../../services/thegraph'
import { AxiosResponse } from 'axios'
import Textile from '../../../services/textile'

interface Props {
  id: string
  account?: string
  network?: string
  managing?: SeriesType
  section?: ManageSection
  jurisdictionOptions: IJurisdictionOption[]
  dispatch: Dispatch<ManagementActionTypes>
}

const SeriesManagement: FC<Props> = ({
  id,
  account,
  network,
  managing,
  section,
  jurisdictionOptions,
  dispatch,
}: Props) => {
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  React.useEffect(() => {
    setTimeout(async () => {
      // IF NOT CONNECTED YET
      setLoading(true)
      if (!account || !network) {
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
      if (!managing) {
        const newSeries: SeriesType = {
          jurisdiction: '',
          contract: id,
          created: new Date(),
          name: '',
          owner: '',
          first: '',
          badges: [],
          closed: false,
          access: false,
        }
        let otocoNetwork = GraphNetwork.mainnet
        try {
          if (network == 'ropsten') otocoNetwork = GraphNetwork.ropsten
          const response: AxiosResponse = await requestSubgraph(
            otocoNetwork,
            `
          {
            companies(first:1,where:{id:"${id.toLowerCase()}"}) {
              id
              name
              jurisdiction
              creation
              owner
              creator
            }
          }
          `
          )
          if (response.data.data.companies.length < 1) throw 'Error'

          const company = response.data.data.companies[0]
          newSeries.jurisdiction = company.jurisdiction
          newSeries.name = company.name
          newSeries.created = new Date(
            parseInt(company.creation.toString()) * 1000
          )
          newSeries.owner = company.owner
          newSeries.first = company.creator

          if (company.owner == account.toLowerCase())
            newSeries.badges.push(Badges.MANAGEMENT)
          if (company.creator == account.toLowerCase())
            newSeries.badges.push(Badges.FIRST)
          
          newSeries.access = company.owner == account.toLowerCase()
          try {
              const multisigOwners = await safeContract.getContract(newSeries.owner).methods
              .getOwners()
              .call({ from: account })
              if (multisigOwners.find((o:string) => o == account)) {
                newSeries.access = true
                newSeries.badges.push(Badges.MANAGEMENT)
              }
          } catch (err) {
            console.log('Entity owner is not a Multisig wallet.')
          }
          try {
            const res = await Textile.sendRequest({
              method:'expiration',
              wallet: account,
              environment: network,
              entity: id.toLowerCase()
            })
            newSeries.renewal = new Date(res.expiration)
            newSeries.access = newSeries.access && newSeries.renewal.getTime() > Date.now()
          } catch (err) {}
          dispatch({ type: SET_MANAGE_SERIES, payload: newSeries })
          setLoading(false)
        } catch (err) {
          setError('Error requesting company address from selected network.')
          setLoading(false)
        }
      }
      setLoading(false)
    }, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, managing])

  return (
    <div>
      <Link
        className="d-none d-md-block btn btn-back btn-primary-outline btn-sm"
        to={`/dashpanel/`}
      >
        <ChevronLeft className="fix-icon-alignment" />
        <span style={{ paddingLeft: '0.5em' }}>Back to Dashpanel</span>
      </Link>
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
            <div className="col-12 text-center">Loading Data</div>
            <div className="col-12 text-center">
              <div className="spinner-border" role="status"></div>
            </div>
          </div>
        </div>
      </CSSTransition>
      <CSSTransition
        in={error !== ''}
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
            <div className="col-12 text-center text-warning">{error}</div>
          </div>
        </div>
      </CSSTransition>
      <CSSTransition
        in={!section && !loading}
        timeout={{
          appear: 200,
          enter: 200,
          exit: 200,
        }}
        classNames="slide-up"
        unmountOnExit
      >
        <SeriesOverview></SeriesOverview>
      </CSSTransition>
      <CSSTransition
        in={section == ManageSection.LEGAL}
        timeout={{
          appear: 200,
          enter: 200,
          exit: 200,
        }}
        classNames="slide-up"
        unmountOnExit
      >
        <SeriesDocuments></SeriesDocuments>
      </CSSTransition>
      <CSSTransition
        in={section == ManageSection.TOKEN}
        timeout={{
          appear: 200,
          enter: 200,
          exit: 200,
        }}
        classNames="slide-up"
        unmountOnExit
      >
        <SeriesToken></SeriesToken>
      </CSSTransition>
      <CSSTransition
        in={section == ManageSection.MULTISIG}
        timeout={{
          appear: 200,
          enter: 200,
          exit: 200,
        }}
        classNames="slide-up"
        unmountOnExit
      >
        <SeriesMultisig></SeriesMultisig>
      </CSSTransition>
      <CSSTransition
        in={section == ManageSection.ENS}
        timeout={{
          appear: 200,
          enter: 200,
          exit: 200,
        }}
        classNames="slide-up"
        unmountOnExit
      >
        <SeriesENS></SeriesENS>
      </CSSTransition>
      <CSSTransition
        in={section == ManageSection.PLUGINS}
        timeout={{
          appear: 200,
          enter: 200,
          exit: 200,
        }}
        classNames="slide-up"
        unmountOnExit
      >
        <Plugins></Plugins>
      </CSSTransition>
      <CSSTransition
        in={section == ManageSection.MANAGE}
        timeout={{
          appear: 200,
          enter: 200,
          exit: 200,
        }}
        classNames="slide-up"
        unmountOnExit
      >
        <Manage></Manage>
      </CSSTransition>
    </div>
  )
}

export default connect((state: IState) => ({
  account: state.account.account,
  network: state.account.network,
  managing: state.management.managing,
  section: state.management.section,
  jurisdictionOptions: state.spinUp.jurisdictionOptions,
}))(SeriesManagement)
