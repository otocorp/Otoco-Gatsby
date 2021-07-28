import React, { Dispatch, FC, useState } from 'react'
import { connect } from 'react-redux'
import MasterRegistry from '../../../smart-contracts/MasterRegistry'
import GnosisSafe from '../../../smart-contracts/GnosisSafe'

import Config from './config'
import Wallet from './wallet'

import { SeriesType } from '../../../state/management/types'
import {
  SET_MULTISIG_CONFIG,
  SET_MULTISIG_DEPLOYED,
  MultisigConfig,
  MultisigDeployed,
  MultisigActionTypes,
} from '../../../state/management/multisig/types'
import { IState } from '../../../state/types'

interface Props {
  account?: string | null
  network?: string | null
  managing?: SeriesType
  multisigConfig?: MultisigConfig
  multisigDeployed?: MultisigDeployed
  dispatch: Dispatch<MultisigActionTypes>
}

const SeriesMultisig: FC<Props> = ({
  account,
  network,
  managing,
  multisigConfig,
  multisigDeployed,
  dispatch,
}: Props) => {
  const [loading, setLoading] = useState(true)

  React.useEffect(() => {
    setTimeout(async () => {
      if (!network || !managing) return
      const multisigAddress = await MasterRegistry.getContract(network)
        .methods.getRecord(managing.contract, 2)
        .call({ from: account })
      if (multisigAddress === '0x0000000000000000000000000000000000000000') {
        dispatch({
          type: SET_MULTISIG_CONFIG,
          payload: {
            owners: [],
            threshold: '1',
          },
        })
        setLoading(false)
        return
      }
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
      setLoading(false)
    }, 0)
  }, [])

  return (
    <div>
      <div className="d-grid gap-1 mb-5">
        <h3 className="m-0">Digital Asset Wallet</h3>
        {loading && (
          <div className="d-flex justify-content-center">
            <div className="row">
              <div className="col-12 text-center">Loading</div>
              <div className="col-12 text-center">
                <div className="spinner-border" role="status"></div>
              </div>
            </div>
          </div>
        )}
        {!loading && !multisigDeployed && multisigConfig && <Config></Config>}
        {!loading && multisigDeployed && <Wallet></Wallet>}
      </div>
    </div>
  )
}

export default connect((state: IState) => ({
  account: state.account.account,
  network: state.account.network,
  managing: state.management.managing,
  multisigConfig: state.multisig.multisigConfig,
  multisigDeployed: state.multisig.multisigDeployed,
}))(SeriesMultisig)
