import React, { FC } from 'react'
import { Badges } from '../../../state/management/types'
import OtocoIcon from '../../icons'

interface Props {
  name?: string
  jurisdiction?: string
  badges?: Badges[]
}

interface PropsBadges {
  badges: Badges[]
}

const ListBadges = (props: PropsBadges) => {
  return props.badges.map((badge, idx) => (
    <div key={idx} className="owner-badge greish small me-1">
      <OtocoIcon icon="lockbadge" className="me-1" />
      {badge}
    </div>
  ))
}

const EntityCard: FC<Props> = ({ name, jurisdiction, badges }: Props) => {
  return (
    <div style={{ padding: '0px' }}>
      {name && jurisdiction && (
        <div className="card entity-card">
          <h4>{name}</h4>
          <div className="greish small jurisdiction mb-2">{jurisdiction}</div>
          <div>
            <ListBadges badges={badges} />
          </div>
        </div>
      )}
    </div>
  )
}

export default EntityCard
