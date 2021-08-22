import React, { FC, Dispatch } from 'react'
import { connect } from 'react-redux'
import { IState } from '../../../state/types'

import Logo from '../../logo/logo'
import './style.scss'

import {
  SET_MANAGE_SECTION,
  ManageSection,
  ManagementActionTypes,
  SeriesType,
} from '../../../state/management/types'
import { ChevronLeft, Inboxes, Gear, Wallet2 } from 'react-bootstrap-icons'
import OtocoIcon from '../../icons'
import EntityCard from './entityCard'
import { Link } from 'gatsby'

interface Props {
  account: string
  network?: string
  managing?: SeriesType
  dispatch: Dispatch<ManagementActionTypes>
}

const SidebarSeries: FC<Props> = ({
  managing,
  dispatch,
}: Props) => {
  const handleChangeSection = (section: ManageSection | undefined) => {
    dispatch({
      type: SET_MANAGE_SECTION,
      payload: section,
    })
  }

  return (
    <nav id="sidebar" className={`p-2 p-md-4 ${managing ? '' : 'collapsed'}`}>
      <div id="sidebar-content">
        <div className="d-none d-md-block">
          <Logo />
        </div>
        <div className="row mt-2">
          {managing && (
            <div className="d-none d-md-block px-0">
              <EntityCard
                name={managing.name}
                jurisdiction={managing?.jurisdiction}
                badges={managing?.badges}
              />
            </div>
          )}
          {managing && managing.access && (
            <div>
              <Link className="d-block d-md-none col-12 btn" to={`/dashpanel/`}>
                <ChevronLeft className="fix-icon-alignment" />
              </Link>
              <a
                className="col-12 btn"
                onClick={handleChangeSection.bind(undefined, undefined)}
              >
                <OtocoIcon icon="house" className="me-3 mb-1" />
                Overview
              </a>
              <a
                className="col-12 btn"
                onClick={handleChangeSection.bind(
                  undefined,
                  ManageSection.LEGAL
                )}
              >
                <OtocoIcon icon="fileearmarktext" className="me-3 mb-1" />
                Files
              </a>
              <a
                className="col-12 btn"
                onClick={handleChangeSection.bind(
                  undefined,
                  ManageSection.TOKEN
                )}
              >
                <OtocoIcon icon="box" className="me-3 mb-1" />
                Tokens
              </a>
              <a
                className="col-12 btn"
                onClick={handleChangeSection.bind(
                  undefined,
                  ManageSection.MULTISIG
                )}
              >
                <Wallet2 className="me-3 mb-1" />
                Asset Wallet
              </a>
              <a
                className="col-12 btn"
                onClick={handleChangeSection.bind(undefined, ManageSection.ENS)}
              >
                <OtocoIcon icon="globe" className="me-3 mb-1" />
                ENS
              </a>
              <a
                className="col-12 btn"
                onClick={handleChangeSection.bind(
                  undefined,
                  ManageSection.PLUGINS
                )}
              >
                <Inboxes className="me-3 mb-1" />
                Billing
              </a>
              <a
                className="col-12 btn"
                onClick={handleChangeSection.bind(
                  undefined,
                  ManageSection.MANAGE
                )}
              >
                <Gear className="me-3 mb-1" />
                Manage
              </a>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default connect((state: IState) => ({
  managing: state.management.managing,
}))(SidebarSeries)
