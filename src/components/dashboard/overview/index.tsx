import React, { Dispatch, FC, useState } from 'react'
import { connect } from 'react-redux'
import { ChevronLeft, ExclamationCircle } from 'react-bootstrap-icons'
import Address from '../../addressWidget/addressWidget'
import UTCDate from '../../utcDate/utcDate'
import {
  SeriesType,
  ManagementActionTypes,
  SET_MANAGE_SECTION,
  ManageSection,
} from '../../../state/management/types'
import { IState } from '../../../state/types'
import { IJurisdictionOption } from '../../../state/spinUp/types'

interface Props {
  account?: string | null
  network?: string | null
  managing?: SeriesType
  jurisdictionOptions: IJurisdictionOption[]
  dispatch: Dispatch<ManagementActionTypes>
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const SeriesOverview: FC<Props> = ({
  account,
  network,
  managing,
  jurisdictionOptions,
  dispatch,
}: Props) => {

  const handleChangeSection = (section: ManageSection | undefined) => {
    dispatch({
      type: SET_MANAGE_SECTION,
      payload: section,
    })
  }

  return (
    <div>
      {managing !== undefined && (
        <div className="d-grid gap-1 mb-5">
          <h3 className="m-0">
            {managing?.name} ({managing?.jurisdiction})
          </h3>
          { managing.owner != ZERO_ADDRESS &&
          <div className="">
            Manager: <Address address={managing.owner}></Address>
          </div>
          }
          <div className="">
            Entity smart contract:{' '}
            <Address address={managing.contract}></Address>
          </div>
          <div className="">
            Creation: <UTCDate date={managing.created} separator=""></UTCDate>
          </div>
          { managing.renewal &&
            <div className={managing.renewal.getTime() > Date.now() ? '' : 'text-warning'}>
              Next Renewal: <UTCDate date={managing.renewal} separator=""></UTCDate>
            </div>
          }
          { managing.renewal && managing.renewal.getTime() < Date.now() && 
            <div>
              <div className="small mt-2">
                <span style={{ marginRight: '0.5em' }}>
                  <ExclamationCircle className="fix-icon-alignment" />
                </span>
                Please access <a href="" onClick={handleChangeSection.bind(
                    undefined,
                    ManageSection.PLUGINS
                  )}>Billing</a> to renew your entity.
              </div>
            </div>
          }
          { managing.owner != ZERO_ADDRESS &&
            <div className="small text-warning mt-2">
              <span style={{ marginRight: '0.5em' }}>
                <ExclamationCircle className="fix-icon-alignment" />
              </span>
              Your entity smart contract is not a wallet. Go to Multisig to create
              a digital wallet for your company.
            </div>
          }
          { managing.owner == ZERO_ADDRESS &&
            <div className="text-warning">
              <span style={{ marginRight: '0.5em' }}>
                <ExclamationCircle className="fix-icon-alignment" />
              </span>
              Entity closed
            </div>
            }
        </div>
      )}
    </div>
  )
}

export default connect((state: IState) => ({
  account: state.account.account,
  network: state.account.network,
  managing: state.management.managing,
  jurisdictionOptions: state.spinUp.jurisdictionOptions,
}))(SeriesOverview)
