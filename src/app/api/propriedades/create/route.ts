// src/app/api/propriedades/create/route.ts

import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export const runtime = 'nodejs'

// Colunas B–AG em ordem
const COLUMN_ORDER = [
  'purchaseDate','propertyNumber','description','parcel','address','county','state',
  'squareFeet','acres','zoningCode','zoningType','lotMeasurements','propertyTax',
  'water','waterDesc','electricity','electricityDesc','sewer','sewerDesc','floodZone',
  'propertyDesc','notesZone','minimumLotArea','coordinates','legalDesc','hoa',
  'hoaName','hoaValue','hoaPeriod','optionalNotes','images','documents'
]

export async function POST(request: Request) {
  console.log('[Create API] Método POST recebido')

  let data: Record<string,string>
  try {
    data = await request.json()
    console.log('[Create API] Body:', data)
  } catch (err) {
    console.error('[Create API] Falha ao parsear JSON:', err)
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  // obtém credenciais da env var
  let creds: any
  try {
    creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!)
  } catch (err) {
    console.error('[Create API] GOOGLE_SERVICE_ACCOUNT_KEY inválida ou ausente')
    return NextResponse.json({ ok: false, error: 'Server misconfiguration' }, { status: 500 })
  }

  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  const client = await auth.getClient()
  const sheets = google.sheets({ version: 'v4', auth: client })

  const SPREADSHEET_ID = process.env.SPREADSHEET_ID!
  if (!SPREADSHEET_ID) {
    console.error('[Create API] SPREADSHEET_ID não configurado')
    return NextResponse.json({ ok: false, error: 'Server misconfiguration' }, { status: 500 })
  }

  // monta a linha nos campos B–AG
  const row = COLUMN_ORDER.map(key => data[key] ?? '')
  console.log('[Create API] Row a inserir:', row)

  try {
    const resp = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Cadastro de Propriedades!A9:AG', // aba + range
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    })
    console.log('[Create API] Sheets resposta:', resp.status, resp.data.updates)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[Create API] Erro do Sheets:', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
