import { NextResponse } from 'next/server'
import { google } from 'googleapis'

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

export async function POST(request: Request) {
  const {
    propriedade,
    downPayment,
    valorVenda,
    totalJuros,
    taxaAnual,
    parcelas,
    pmt,
  } = await request.json()

  const sheets = await getSheetsClient()
  const ssId = process.env.SPREADSHEET_ID!
  const tab = 'Simulacoes'

  // 1) garante existência da aba
  const meta = await sheets.spreadsheets.get({ spreadsheetId: ssId })
  const has = meta.data.sheets!.some(s => s.properties!.title === tab)
  if (!has) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: ssId,
      requestBody: {
        requests: [{
          addSheet: { properties: { title: tab } }
        }]
      }
    })
    // cria cabeçalho
    await sheets.spreadsheets.values.update({
      spreadsheetId: ssId,
      range: `${tab}!A1:G1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          'Propriedade',
          'Entrada (USD)',
          'Valor de Venda (USD)',
          'Total de Juros (USD)',
          'Taxa de Juros (%)',
          'Número de Parcelas',
          'Parcela (USD)'
        ]]
      }
    })
  }

  // 2) insere nova linha
  await sheets.spreadsheets.values.append({
    spreadsheetId: ssId,
    range: `${tab}!A:G`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[
        propriedade,
        downPayment,
        valorVenda,
        totalJuros,
        `${taxaAnual}%`,
        parcelas,
        pmt
      ]]
    }
  })

  return NextResponse.json({ ok: true })
}
