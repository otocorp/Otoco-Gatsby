import React, { Dispatch, FC, useState } from 'react'
import { connect } from 'react-redux'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import TransactionUtils from '../../../services/transactionUtils'
import TransactionMonitor from '../../transactionMonitor/transactionMonitor'
import {
  CLEAR_MANAGE_SERIES,
  SeriesType,
  ManagementActionTypes,
} from '../../../state/management/types'
import SeriesContract from '../../../smart-contracts/SeriesContract'
import { DistributeVertical, FileEarmarkText } from 'react-bootstrap-icons'
import { IState } from '../../../state/types'

interface Props {
  account?: string | null
  network?: string | null
  managing?: SeriesType
  dispatch: Dispatch<ManagementActionTypes>
}

import doaDE from '../../../../static/pdfs/DOA_de.pdf'
import doaWY from '../../../../static/pdfs/DOA_wy.pdf'
import oaMasterDE from '../../../../static/pdfs/OA_Master_de.pdf'
import oaMasterWY from '../../../../static/pdfs/OA_Master_wy.pdf'
import cofMasterDE from '../../../../static/pdfs/COF_Master_de.pdf'
import cofMasterWY from '../../../../static/pdfs/COF_Master_wy.pdf'

const pdfs = {
  de: {
    agreement: doaDE,
    oaMaster: oaMasterDE,
    cofMaster: cofMasterDE
  },
  wy: {
    agreement: doaWY,
    oaMaster: oaMasterWY,
    cofMaster: cofMasterWY
  },
}

const toUnicode = (str: string) => {
  return str
    .split('')
    .map(function (value) {
      const temp = value.charCodeAt(0).toString(16).toUpperCase()
      if (temp.length > 2) {
        return '\\u' + temp
      }
      return value
    })
    .join('')
}

const removeSpecial = (str: string) => {
  return toUnicode(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

const SeriesDocuments: FC<Props> = ({ account, network, managing, dispatch }: Props) => {
  const [closeFormOpened, setCloseFormOpened] = useState<boolean>(false)
  const [transaction, setTransaction] = useState<string>('')
  const [prefix, setPrefix] = useState<string>('')

  React.useEffect(() => {
    if (!managing) return
    setPrefix(managing.jurisdiction.substring(0, 2).toLowerCase())
  }, [])

  const saveByteArray = (reportName:string, byte:Uint8Array) => {
    const blob = new Blob([byte], { type: 'application/pdf' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    const fileName = reportName
    link.download = fileName
    link.click()
  }

  const exportPDF = async () => {
    if (!managing) return
    const fetchedAgreement = await fetch(pdfs[prefix].agreement)
    const pdfBuffer = await fetchedAgreement.arrayBuffer()
    let seriesName = removeSpecial(managing.name)
    if (prefix === 'wy')
      seriesName = 'OTOCO WY LLC - ' + removeSpecial(managing.name)

    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const form = pdfDoc.getForm()
    const TimesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
    const Times = await pdfDoc.embedFont(StandardFonts.TimesRoman)
    form.getTextField('Series').setText(seriesName)
    try {
      form.getTextField('Address').setText(managing.contract)
    } catch (err) {
      console.error('Wyoming has no address field')
    }
    form
      .getTextField('Date')
      .setText(
        managing.created.getUTCDate() +
          '/' +
          (managing.created.getUTCMonth() + 1) +
          '/' +
          managing.created.getUTCFullYear() +
          ' ' +
          managing.created.getUTCHours() +
          ':' +
          (managing.created.getUTCMinutes() < 10
            ? '0' + managing.created.getUTCMinutes()
            : managing.created.getUTCMinutes()) +
          ' UTC'
      )
    form.updateFieldAppearances(TimesBold)
    form.getTextField('ByManager').setText('By ' + managing.owner + ', Manager')
    form.getTextField('Owner').setText('(' + managing.owner + ' - MEMBER)')
    form.updateFieldAppearances(Times)
    form.flatten()
    const pdfBytes = await pdfDoc.save()
    saveByteArray('Series_Operating_Agreement.pdf', pdfBytes)
  }

  const exportOAMaster = async () => {
    const prefix = managing.jurisdiction.substring(0, 2).toLowerCase()
    const fetchedAgreement = await fetch(pdfs[prefix].oaMaster)
    const pdfBuffer = await fetchedAgreement.arrayBuffer()
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const pdfBytes = await pdfDoc.save()
    saveByteArray('Master_Operation_Agreement.pdf', pdfBytes)
  }

  const exportCOFMaster = async () => {
    const prefix = managing.jurisdiction.substring(0, 2).toLowerCase()
    const fetchedAgreement = await fetch(pdfs[prefix].cofMaster)
    const pdfBuffer = await fetchedAgreement.arrayBuffer()
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const pdfBytes = await pdfDoc.save()
    saveByteArray('Master_Certificate_of_Formation.pdf', pdfBytes)
  }

  return (
    <div>
      <div className="d-grid gap-1 mb-5">
        <h3 className="m-0">Files</h3>
        <div className="small">Download files related to your company:</div>
        <div className="mt-4">
          <a href="#" className="card-link" onClick={exportPDF}>
            <FileEarmarkText className="fix-icon-alignment" />
            <span style={{ marginLeft: '0.5em' }}>
              Series Operating Agreement - {managing?.name}
            </span>
          </a>
        </div>
        <div className="mt-4">
          <a href="#" className="card-link" onClick={exportCOFMaster}>
            <FileEarmarkText className="fix-icon-alignment" />
            <span style={{ marginLeft: '0.5em' }}>
              Master LLC Certificate of Formation - OtoCo {prefix.toUpperCase()} LLC
            </span>
          </a>
        </div>
        <div className="mt-4">
          <a href="" className="card-link" onClick={exportOAMaster}>
            <FileEarmarkText className="fix-icon-alignment" />
            <span style={{ marginLeft: '0.5em' }}>
            Master LLC Operation Agreement - OtoCo {prefix.toUpperCase()} LLC
            </span>
          </a>
        </div>
      </div>
    </div>
  )
}

export default connect((state: IState) => ({
  account: state.account.account,
  network: state.account.network,
  managing: state.management.managing,
}))(SeriesDocuments)
