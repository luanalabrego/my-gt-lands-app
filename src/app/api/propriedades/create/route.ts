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

  // 1) parseia JSON do body
  let data: Record<string,string>
  try {
    data = await request.json()
  } catch (err: unknown) {
    console.error('[Create API] Falha ao parsear JSON:', err)
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  // 2) valida env-vars
  const {
    GOOGLE_CLIENT_EMAIL: clientEmail,
    GOOGLE_PRIVATE_KEY: privateKey,
    SPREADSHEET_ID
  } = process.env

  if (!clientEmail || !privateKey || !SPREADSHEET_ID) {
    console.error('[Create API] Variáveis de ambiente faltando')
    return NextResponse.json(
      { ok: false, error: 'Server misconfiguration' },
      { status: 500 }
    )
  }

  // 3) configura auth
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  // 4) instancia API
  const sheets = google.sheets({ version: 'v4', auth })

  // 5) monta a linha e insere
  const row = COLUMN_ORDER.map(key => data[key] ?? '')
  console.log('[Create API] Row a inserir:', row)

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Cadastro de Propriedades!A9:AG',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Create API] Erro do Sheets:', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
