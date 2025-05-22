// src/app/api/propriedades/vender/route.ts

import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export const runtime = 'nodejs'

interface VendaPayload {
  saleDate: string
  propriedade: string
  endereco: string
  buyerName: string
  paymentMethod: string
  downPayment: number
  installmentCount: number
  installmentValue: number
  custos: Record<string, number>
  creditos: Record<string, number>
  saleValue: number
  stateCommission: number
  docStamps: number
}

export async function POST(req: Request) {
  const {
    saleDate,
    propriedade,
    endereco,
    buyerName,
    paymentMethod,
    downPayment,
    installmentCount,
    installmentValue,
    custos,
    creditos,
    saleValue,
    stateCommission,
    docStamps
  } = await req.json() as VendaPayload

  const {
    GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY,
    SPREADSHEET_ID
  } = process.env
  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !SPREADSHEET_ID) {
    return NextResponse.json({ ok: false, error: 'misconfiguration' }, { status: 500 })
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_CLIENT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  const sheets = google.sheets({ version: 'v4', auth })
  const ssId = SPREADSHEET_ID

  const formattedDate = saleDate
    ? new Date(saleDate).toLocaleDateString('en-US')
    : ''

  // encontra a próxima linha em branco entre B9:F
  async function getNextEmptyRow() {
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: ssId,
      range: `'Registros'!B9:F`
    })
    const data = resp.data.values || []
    for (let i = 0; i < data.length; i++) {
      if (data[i].every(cell => !cell)) return 9 + i
    }
    return 9 + data.length
  }

  // insere ou atualiza registro em colunas B–F:
  // B=date (2), C=parcel (3), D=descrição (4), E="Venda" (5), F=valor (6)
  async function updateOrInsertRegistro(description: string, value: number) {
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: ssId,
      range: `'Registros'!C9:D`
    })
    const rows = resp.data.values || []
    const idx = rows.findIndex(r =>
      r[0]?.toString().trim().toLowerCase() === propriedade.trim().toLowerCase() &&
      r[1]?.toString().trim().toLowerCase() === description.trim().toLowerCase()
    )
    const rowNum = idx >= 0 ? 9 + idx : await getNextEmptyRow()
    const ops = [
      { range: `'Registros'!B${rowNum}`, values: [[formattedDate]] },
      { range: `'Registros'!C${rowNum}`, values: [[propriedade]] },
      { range: `'Registros'!D${rowNum}`, values: [[description]] },
      { range: `'Registros'!E${rowNum}`, values: [['Venda']] },
      { range: `'Registros'!F${rowNum}`, values: [[value]] }
    ]
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: ssId,
      requestBody: { valueInputOption: 'RAW', data: ops }
    })
    return rowNum
  }

  // grava todos os custos primeiro
  for (const [type, val] of Object.entries(custos)) {
    if (val && val !== 0) {
      await updateOrInsertRegistro(type, val)
    }
  }

  // insere o "Valor da Venda" e obtém a linha
  const saleRow = await updateOrInsertRegistro('Valor da Venda', saleValue)

  // agora grava:
  //   G (7) = parcel novamente,
  //   H (8) = endereco,
  //   I (9) = buyerName
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: ssId,
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        { range: `'Registros'!G${saleRow}`, values: [[propriedade]] },
        { range: `'Registros'!H${saleRow}`, values: [[endereco]] },
        { range: `'Registros'!I${saleRow}`, values: [[buyerName]] }
      ]
    }
  })

  // grava Q (17)=buyerName Caso queira redundância, mas conforme pedido:
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: ssId,
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        { range: `'Registros'!Q${saleRow}`, values: [[buyerName]] },
        { range: `'Registros'!R${saleRow}`, values: [[paymentMethod]] },
        { range: `'Registros'!S${saleRow}`, values: [[downPayment]] },
        { range: `'Registros'!T${saleRow}`, values: [[installmentCount]] },
        { range: `'Registros'!U${saleRow}`, values: [[installmentValue]] }
      ]
    }
  })

  // grava comissão e stamps (se houver)
  if (stateCommission && stateCommission !== 0) {
    await updateOrInsertRegistro('State Commission', stateCommission)
  }
  if (docStamps && docStamps !== 0) {
    await updateOrInsertRegistro('Documents Stamps', docStamps)
  }

  // grava créditos após a venda
  for (const [type, val] of Object.entries(creditos)) {
    if (val && val !== 0) {
      await updateOrInsertRegistro(type, val)
    }
  }

  return NextResponse.json({ ok: true })
}
