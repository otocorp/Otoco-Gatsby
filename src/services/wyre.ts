// DOCS => https://docs.sendwyre.com/v3/docs/wyre-checkout-hosted-dialog
import axios from 'axios'
import Wyre from './wyre-core'

type WyreResponseType = {
  url: string
  reservation: string
}

const paymentAddress = process.env.GATSBY_WYRE_WALLET

const options = {
  headers: {
    Authorization: process.env.GATSBY_WYRE_KEY,
    'Content-Type': 'application/json',
  },
}

export enum WyreEnv {
  TEST = 'https://api.testwyre.com',
  PROD = 'https://api.sendwyre.com',
}

// https://api.testwyre.com/v3/orders/WO_74ZARHGVXZ
export const requestPaymentWyre = async (
  env: WyreEnv,
  amount: number,
  target?: string
): Promise<{
  id: string
  timestamp: number
}> => {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await axios.post(
        `${env}/v3/orders/reserve`,
        {
          sourceCurrency: 'USD',
          destCurrency: 'USD',
          paymentMethod: 'debit-card',
          referrerAccountId:
            env == WyreEnv.PROD
              ? process.env.GATSBY_SENDWYRE_ID
              : process.env.GATSBY_TESTWYRE_ID,
          // dest: `ethereum:${
          //   target != undefined
          //     ? target
          //     : '0xa484165bd8E535F11C5820205E98d18DF8d22Bf7'
          // }`,
          dest: `account:${
            env == WyreEnv.PROD
              ? process.env.GATSBY_SENDWYRE_ID
              : process.env.GATSBY_TESTWYRE_ID
          }`,
          amount: amount.toString(),
          lockFields: [
            'dest',
            'destCurrency',
            'sourceCurrency',
            'paymentMethod',
            'amount',
          ],
        },
        {
          headers: {
            Authorization:
              env == WyreEnv.PROD
                ? process.env.GATSBY_SENDWYRE_KEY
                : process.env.GATSBY_TESTWYRE_KEY,
            'Content-Type': 'application/json',
          },
        }
      )
      const wyre = Wyre()
      const widget = new wyre.Widget({
        debug: true,
        apiKey:
          env == WyreEnv.PROD
            ? process.env.GATSBY_SENDWYRE_ID
            : process.env.GATSBY_TESTWYRE_ID,
        reservation: res.data.reservation,
        auth: { type: 'metamask' },
        env: env == WyreEnv.PROD ? 'prod' : 'test',
        operation: {
          type: 'debitcard-hosted-dialog',
        },
        type: 'offramp',
        web3PresentInParentButNotChild: false,
      })
      if (!widget) {
        throw 'Failed to initialize Wyre widget' + res.data.reservation
      }
      widget.open()
      widget.on('paymentSuccess', async (e) => {
        const order = await axios.get(`${env}/v3/orders/${e.data.orderId}`)
        resolve({
          timestamp: order.data.createdAt,
          id: order.data.id,
        })
      })
      const checkWindowOpen = () => {
        try {
          if (!widget.getTargetWindow().closed) {
            setTimeout(checkWindowOpen, 1000)
          } else {
            widget.removeAllListeners()
            widget.getTargetWindow().close()
            reject()
          }
        } catch (err) {
          setTimeout(checkWindowOpen, 1000)
        }
      }
      checkWindowOpen()
    } catch (err) {
      console.error(err)
      reject(err)
    }
  })
}

const WyreAPI = {
  main: "https://api.sendwyre.com/v3/orders/",
  ropsten: "https://api.testwyre.com/v3/orders/"
}

export const verifyPaymentWyre = async (
  id: string,
  network: string,
  amount: number
) => {
  const request = await axios.get(`${WyreAPI[network]}${id}`)
    if (request.status == 204) throw 'Not found any transaction with this Receipt ID.'
    const receipt = request.data
    if (network == 'main' && receipt.dest != `account:${process.env.GATSBY_SENDWYRE_ID}`)
        throw 'Error validating payment. Destination account is not the oracle.'
    if (network == 'ropsten' && receipt.dest != `account:${process.env.GATSBY_TESTWYRE_ID}`)
        throw 'Error validating payment. Destination account is not the oracle.'
    if (receipt.destCurrency != 'USD')
        throw 'Error validating payment. Not USD destination currency.'
    if (receipt.purchaseAmount != amount)
        throw 'Error validating payment. Payment amount not match with receipt.'
    if (network == 'main' && receipt.status != 'SUCCESS')
        throw 'Error validating payment. Payment not yet completed.'
    return
}
