import React, { FC } from 'react'
import { DecryptedMailbox } from '../../../../services/textile/types'

interface Props {
  message: DecryptedMailbox
}

export const ReportMessage: FC<Props> = ({ message }: Props) => {
  return (
    <div>
      <span className="badge bg-primary small me-3">{message.body.method}</span>
    </div>
  )
}
