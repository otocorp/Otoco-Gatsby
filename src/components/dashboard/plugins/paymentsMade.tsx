import React, { FC } from 'react'
import { DecryptedMailbox } from '../../../state/account/types'
import { Trash, Clipboard, Download } from 'react-bootstrap-icons'
import UTCDate from '../../utcDate/utcDate'
import { downloadReceipt } from '../../../services/receipt'

interface ListMessagesProps {
  contract: string // Company/Entity contract address
  messages: DecryptedMailbox[],
  wallet: string,
}

const clickCopyHandler = (info: string) => {
  navigator.clipboard.writeText(info)
}



// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const PaymentsMade = ({ messages, wallet }: ListMessagesProps) => {
  const tempMessages = messages
    .map((m) => {
      return {
        id: m.id,
        entity: m.body.message.entity,
        product: m.body.message.product,
        method: m.body.message.method,
        receipt: m.body.message._id,
        timestamp: m.body.message.timestamp,
        env: m.body.message.environment,
        amount: m.body.message.amount,
        currency: m.body.message.currency
      }
    })

  return tempMessages.map((m) => (
    <>
      <tr className="small d-none d-md-table-row" key={m.id}>
        <td>
          {m.product} - {m.method}
          <a href="#" onClick={downloadReceipt.bind(
            undefined,
            new Date(m.timestamp),
            m.receipt,
            m.product,
            m.env,
            m.currency,
            m.method,
            m.entity,
            wallet,
            m.amount
            )}>
            <Download
              style={{ marginLeft: '0.6em' }}
              className="fix-icon-alignment"
            /></a>
        </td>
        {m.receipt.length > 20 && (
          <td>
            {m.receipt.substring(0, 7)} ...
            {m.receipt.substring(m.receipt.length - 8, m.receipt.length)}
            &nbsp;
            <a href="#" onClick={clickCopyHandler.bind(undefined, m.receipt)}>
            <Clipboard
              style={{ marginLeft: '0.25em' }}
              className="fix-icon-alignment"
            /></a>
          </td>
          
        )}
        {m.receipt.length <= 20 && <td>{m.receipt}</td>}
        <td className="text-end">
          <UTCDate date={new Date(m.timestamp)} separator="-" />
        </td>
        <td className="text-end">
          {m.amount} {m.currency}
        </td>
      </tr>
      <tr className="small d-md-none" key={m.id}>
      <td>
        {m.product} {m.amount} {m.currency}<br/>
        <span className="text-white-50 small"><UTCDate date={new Date(m.timestamp)} separator="-" /></span>
      </td>
      <td className="text-end">
        <button className="btn btn-sm btn-primary" onClick={downloadReceipt.bind(
          undefined,
          new Date(m.timestamp),
          m.receipt,
          m.product,
          m.env,
          m.currency,
          m.method,
          m.entity,
          wallet,
          m.amount
          )}>
          <Download
            className="fix-icon-alignment"
          />
        </button>
        <button className="btn btn-sm btn-primary flex-fill ms-2" onClick={clickCopyHandler.bind(undefined, m.receipt)}>
          <Clipboard
            className="fix-icon-alignment"
          /></button>
      </td>
    </tr>
  </>
  ))
}
