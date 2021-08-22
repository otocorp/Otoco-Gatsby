import React, { FC } from 'react'
import { DecryptedMailbox } from '../../../../services/textile/types'

interface Props {
  message: DecryptedMailbox
}

export const BroadcastMessage: FC<Props> = ({ message }: Props) => {
  return (
    <div>
      <span className="badge bg-primary small me-3">{message.body.method}</span>
      {message.body.message.title && (
        <span className="small">{message.body.message.title}</span>
      )}
    </div>
  )
}
