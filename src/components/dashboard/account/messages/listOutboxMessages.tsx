import React, { FC } from 'react'
import { DecryptedMailbox } from '../../../../state/account/types'
import { BroadcastMessage } from './broadcastMessage'
import { PaymentMessage } from './paymentMessage'
import { WalletMessage } from './walletMessage'
import { Trash } from 'react-bootstrap-icons'

interface ListMessagesProps {
  publicKey: string
  messages: DecryptedMailbox[]
  handleDelete: (id: string) => Promise<void>
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const ListOutboxMessages = ({
  publicKey,
  messages,
  handleDelete,
}: ListMessagesProps) => {
  return messages.map((m) => (
    <tr key={m.id}>
      <td>
        {m.body.method == 'wallet' && (
          <WalletMessage message={m}></WalletMessage>
        )}
        {m.body.method == 'broadcast' && (
          <BroadcastMessage message={m}></BroadcastMessage>
        )}
        {m.body.method == 'report' && (
          <BroadcastMessage message={m}></BroadcastMessage>
        )}
        {m.body.method == 'payment' && (
          <PaymentMessage message={m}></PaymentMessage>
        )}
      </td>
      <td className="d-none d-md-block" style={{ textAlign: 'right' }}>
        <button
          className="btn  btn-primary-outline btn-sm"
          onClick={handleDelete.bind(undefined, m.id)}
        >
          <Trash></Trash>
        </button>
      </td>
    </tr>
  ))
}
