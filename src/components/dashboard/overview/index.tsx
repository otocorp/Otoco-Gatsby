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
          <div className="mt-4">
            <h4>Manager</h4> <Address address={managing.owner}></Address>
          </div>
          }
          <div className="row">
            <div className="col-12 col-sm-6 col-md-4 col-lg-3 mt-2">
              <h4>Entity address</h4>
              <Address address={managing.contract}></Address>
            </div>
            { managing.owner != ZERO_ADDRESS &&
              <div className="col-12 col-md-4 small text-white-50">
                <span style={{ marginRight: '0.5em' }}>
                  <ExclamationCircle className="fix-icon-alignment" />
                </span>
                Your entity smart contract is not a wallet. Go to Multisig to create
                a digital wallet for your company.
              </div>
            }
            <div className="col-12 mt-2">
              <h4>Creation</h4> <UTCDate date={managing.created} separator=""></UTCDate>
            </div>
            { managing.renewal && managing.badges.length > 0 &&
              <div className="col-12 col-sm-6 mt-2">
                { managing.renewal.getTime() > Date.now() && 
                  <div className="text-small">
                    <h4>Next Renewal</h4> <UTCDate date={managing.renewal} separator=""></UTCDate>
                  </div>
                }
                { managing.renewal.getTime() < Date.now() && 
                  <div className="card">
                    <div className="text-small">Please, access <a href="" onClick={handleChangeSection.bind(
                          undefined,
                          ManageSection.PLUGINS
                        )}>Billing</a> to renew your entity. Expiration date <b><UTCDate date={managing.renewal} separator=""></UTCDate></b>.
                    </div>
                  </div>
                }
              </div>
            }
          </div>
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
