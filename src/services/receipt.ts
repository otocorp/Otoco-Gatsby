// DOCS => https://thegraph.com/docs/graphql-api#fulltext-search-queries
import { PDFDocument, StandardFonts } from 'pdf-lib'

import receiptPdf from '../../static/pdfs/receipt.pdf'

const saveByteArray = (reportName:string, byte:Uint8Array) => {
    const blob = new Blob([byte], { type: 'application/pdf' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    const fileName = reportName
    link.download = fileName
    link.click()
}

const envLabel = {
    main: 'Ethereum Mainnet',
    ropsten: 'Ropsten Testnet',
}

const envUrls = {
    main_usdt: 'http://etherscan.io/tx/',
    ropsten_usdt: 'http://ropsten.etherscan.io/tx/',
    main_dai: 'http://etherscan.io/tx/',
    ropsten_dai: 'http://ropsten.etherscan.io/tx/',
    main_wyre: 'https://api.sendwyre.com/v3/orders/',
    ropsten_wyre: 'https://api.testwyre.com/v3/orders/',
}

export const downloadReceipt = async (
  date: Date,
  id: string,
  product: string,
  environment: string,
  currency: string,
  method: string,
  entity: string,
  wallet: string,
  amount: number,
): Promise<void> => {
    const fetchedAgreement = await fetch(receiptPdf)
    const pdfBuffer = await fetchedAgreement.arrayBuffer()
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const form = pdfDoc.getForm()
    const TimesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
    const Times = await pdfDoc.embedFont(StandardFonts.TimesRoman)
    form
      .getTextField('date')
      .setText(
        date.getUTCDate() +
          '/' +
          (date.getUTCMonth() + 1) +
          '/' +
          date.getUTCFullYear() +
          ' ' +
          date.getUTCHours() +
          ':' +
          (date.getUTCMinutes() < 10
            ? '0' + date.getUTCMinutes()
            : date.getUTCMinutes()) +
          ' UTC'
      )
    form.updateFieldAppearances(TimesBold)
    form.getTextField('id').setText(id)
    form.updateFieldAppearances(Times)
    form.getTextField('product').setText(product)
    form.getTextField('environment').setText(envLabel[environment])
    form.getTextField('entity').setText(entity)
    form.getTextField('wallet').setText(wallet)
    form.getTextField('amount').setText(`${amount} ${currency}`)
    form.getTextField('url').setText(envUrls[`${environment}_${method.toLowerCase()}`]+id)
    form.flatten()
    const pdfBytes = await pdfDoc.save()
    saveByteArray(`receipt-${product}.pdf`, pdfBytes)
}