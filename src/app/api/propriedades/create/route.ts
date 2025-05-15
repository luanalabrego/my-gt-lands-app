// src/app/api/propriedades/create/route.ts
import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import credentials from '@/lib/credentials.json'  // seu JSON de service account

// 1) instanciar Sheets client
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})
const sheets = google.sheets({ version: 'v4', auth })

// 2) ID da sua planilha (do URL)
const SPREADSHEET_ID = '1RKsyNuRT61ERq_PBdgirNaACXqgXyMuMoNwaXQ30Fqs'

// mapeamento chave→coluna (B=col 2 … AG=col 33)
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
    console.log('[Create API] Body recebido:', data)
  } catch (err) {
    console.error('[Create API] Falha ao parsear JSON:', err)
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  // monta array na ordem B–AG
  const row = COLUMN_ORDER.map(key => data[key] ?? '')
  console.log('[Create API] Row a inserir:', row)

  try {
    const resp = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      // especifica o nome da aba + intervalo
      range: 'Cadastro de Propriedades!A9:AG',
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
