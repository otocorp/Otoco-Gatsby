import React, { FC } from 'react'
import { DecryptedMailbox } from '../../../../services/textile/types'

interface Props {
  message: DecryptedMailbox
}

export const WalletMessage: FC<Props> = ({ message }: Props) => {
  return (
    <div>
      <span className="badge bg-primary small me-3">wallet update</span>
      {message.body.message.email && (
        <span className="small">e-mail: {message.body.message.email}</span>
      )}
      {!message.body.message.email && (
        <span className="small">
          <td>
            {message.from.substring(0, 5)}...
            {message.from.substring(
              message.from.length - 5,
              message.from.length
            )}
          </td>
        </span>
      )}
    </div>
  )
}
