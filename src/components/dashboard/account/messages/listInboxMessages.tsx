import React, { FC } from 'react'
import { DecryptedMailbox } from '../../../../state/account/types'
import { BroadcastMessage } from './broadcastMessage'
import { WalletMessage } from './walletMessage'
import { Trash } from 'react-bootstrap-icons'
import { Link } from 'gatsby'
import { BillingMessage } from './billingMessage'

interface ListMessagesProps {
  publicKey: string
  messages: DecryptedMailbox[]
  handleDelete: (id: string) => Promise<void>
  handleDownload: (content: any) => Promise<void>
}

const oraclePublicKey = process.env.GATSBY_ORACLE_KEY

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const ListInboxMessages = ({
  publicKey,
  messages,
  handleDelete,
  handleDownload,
}: ListMessagesProps) => {
  return messages.map((m) => (
    <tr key={m.id}>
      {publicKey == m.from && (
        <td>
          <span>me</span>
        </td>
      )}
      {oraclePublicKey == m.from && (
        <td>
          <span>otoco</span>
        </td>
      )}
      {oraclePublicKey != m.from && publicKey != m.from && (
        <td>
          {m.from.substring(0, 5)} ...
          {m.from.substring(m.from.length - 5, m.from.length)}
        </td>
      )}
      <td>
        {m.body.method == 'wallet' && (
          <WalletMessage message={m}></WalletMessage>
        )}
        {m.body.method == 'broadcast' && (
          <BroadcastMessage message={m}></BroadcastMessage>
        )}
        {m.body.method == 'report' && (
          <span className="badge bg-primary small me-3">{m.body.method}</span>
        )}
        {m.body.method == 'billing' && (
          <BillingMessage message={m}></BillingMessage>
        )}
      </td>
      <td className="d-none d-md-block" style={{ textAlign: 'right' }}>
        {m.body.method == 'broadcast' && (
          <div>
            <a
              className="btn  btn-primary-outline btn-sm me-2"
              href={m.body.message.link}
            >
              visit
            </a>
            <button
              className="btn btn-primary-outline btn-sm me-2"
              onClick={handleDelete.bind(undefined, m.id)}
            >
              <Trash />
            </button>
          </div>
        )}
        {m.body.method == 'billing' && (
          <Link
            className="btn  btn-primary-outline btn-sm me-2"
            to={`/dashpanel/entity/${m.body.message.entity}`}
          >
            go pay
          </Link>
        )}
        {m.body.method == 'report' && (
          <div>
            <button
              className="btn btn-primary-outline btn-sm me-2"
              onClick={handleDownload.bind(undefined, m.body)}
            >
              Download
            </button>
            <button
              className="btn btn-primary-outline btn-sm me-2"
              onClick={handleDelete.bind(undefined, m.id)}
            >
              <Trash />
            </button>
          </div>
        )}
      </td>
    </tr>
  ))
}
