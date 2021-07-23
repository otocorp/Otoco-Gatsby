import React, { Dispatch, FC } from 'react'
import { connect } from 'react-redux'
import { ExclamationCircle, Gear } from 'react-bootstrap-icons'
import { ShieldLock } from 'react-bootstrap-icons'
import { IState } from '../../state/types'
import {
  ManagementActionTypes,
  SeriesType,
  Badges,
} from '../../state/management/types'
import UTCDate from '../utcDate/utcDate'

import './style.scss'
import { Link } from 'gatsby'
import OtocoIcon from '../icons'

interface PropsSeries {
  series: SeriesType[]
  dispatch: Dispatch<ManagementActionTypes>
}

interface PropsBadges {
  badges: Badges[]
}

const ListBadges = (props: PropsBadges) => {
  return props.badges.map((badge, idx) => (
    <span key={idx} className="owner-badge">
      <OtocoIcon icon="lockbadge" className="me-1" />
      {badge}
    </span>
  ))
}

const SeriesListing: FC<PropsSeries> = ({ series, dispatch }: PropsSeries) => {
  const listSeries = series.map((s: SeriesType, idx) => (
    <div key={idx} className="col-12 col-md-6">
      <div className="card squared">
        <h3>{s.name}</h3>
        <div className="">
          <span className="jurisdiction text-uppercase small">
            {s.jurisdiction}
          </span>
        </div>
        <div className="card-body d-grid gap-2">
          {/* <div className="card-text">
            Manager: <AddressWidget address={s.owner}></AddressWidget>
          </div> */}
          {/* <div className="card-text small">
            Address: <AddressWidget address={s.contract}></AddressWidget>
          </div> */}
          <div>
            <ListBadges badges={s.badges} />
          </div>
          <div className="card-text small">
            Creation: <UTCDate date={s.created} separator="-"></UTCDate>
          </div>
          <div className="mt-4">
            <div className="d-grid gap-2">
              { s.closed && (
              <div className="btn btn-warning-outline disabled text-warning mt-2 text-center">
                <span style={{ marginRight: '0.5em' }}>
                  <ExclamationCircle className="fix-icon-alignment" />
                </span>
                Closed
              </div>
              )}
              { !s.closed && (
              <Link
                className="btn btn-primary-outline"
                to={`/dashpanel/entity/${s.contract}`}
              >
                <Gear className="fix-icon-alignment" />
                <span style={{ paddingLeft: '0.5em' }}>Manage</span>
              </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  ))

  return <div className="row">{listSeries}</div>
}

export default connect((state: IState) => ({
  series: state.management.series,
}))(SeriesListing)
