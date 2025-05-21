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
  try {
    const {
      propriedade,
      downPayment,
      valorVenda,
      totalJuros,
      taxaAnual,
      parcelas,
      pmt,
    } = await request.json()

    const ssId = process.env.SPREADSHEET_ID!
    if (!ssId) throw new Error('SPREADSHEET_ID não configurado')

    const tab = 'Simulacoes'
    const sheets = await getSheetsClient()

    // 1) garante existência da aba “Simulacoes” e cabeçalho
    const meta = await sheets.spreadsheets.get({ spreadsheetId: ssId })
    const has = meta.data.sheets?.some(s => s.properties?.title === tab)
    if (!has) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: ssId,
        requestBody: {
          requests: [{
            addSheet: { properties: { title: tab } }
          }]
        }
      })
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

    // 2) lê propriedades já registradas (coluna A, a partir da linha 2)
    const readRes = await sheets.spreadsheets.values.get({
      spreadsheetId: ssId,
      range: `${tab}!A2:A`,
    })
    const existingRows: string[][] = readRes.data.values || []
    const existingIdx = existingRows.findIndex(r => r[0] === propriedade)

    if (existingIdx >= 0) {
      // 3a) se existir, atualiza a linha correspondente
      const rowNumber = existingIdx + 2
      await sheets.spreadsheets.values.update({
        spreadsheetId: ssId,
        range: `${tab}!A${rowNumber}:G${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
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
    } else {
      // 3b) senão, insere nova linha
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
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Erro ao registrar simulação:', err)
    return NextResponse.json(
      { ok: false, message: err.message || 'Erro interno ao registrar' },
      { status: 500 }
    )
  }
}
