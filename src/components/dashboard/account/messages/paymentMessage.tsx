import React, { FC } from 'react'
import {
  DecryptedMailbox,
  PaymentProps,
} from '../../../../state/account/types'
import UTCDate from '../../../utcDate/utcDate'

interface Props {
  message: DecryptedMailbox
}

export const PaymentMessage: FC<Props> = ({ message }: Props) => {
  const payment: PaymentProps = message.body.message
  return (
    <div>
      <span className="badge bg-primary small me-3">{message.body.method}</span>
      <span className="small">
        {payment.product} - {payment.amount} {payment.currency} -{' '}
        <UTCDate date={new Date(payment.timestamp)} separator="-" />
      </span>
    </div>
  )
}
