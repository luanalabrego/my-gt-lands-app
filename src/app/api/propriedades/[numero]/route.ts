// src/app/api/propriedades/[numero]/route.ts
import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export const runtime = 'nodejs'

interface PropertyOption {
  numero: string
  parcel: string
  endereco: string
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ numero: string }> }
) {
  // agora await params
  const { numero } = await params

  const {
    GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY,
    SPREADSHEET_ID
  } = process.env

  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !SPREADSHEET_ID) {
    return NextResponse.json(
      { ok: false, error: 'misconfiguration' },
      { status: 500 }
    )
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_CLIENT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
  const sheets = google.sheets({ version: 'v4', auth })

  // ajuste este RANGE conforme sua planilha:
  // coluna C = numero, D = endereco, E = parcel
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'Registros'!C9:E`
  })
  const rows = resp.data.values || []

  const found = rows.find(r => r[0]?.toString() === numero)
  if (!found) {
    return NextResponse.json(
      { ok: false, error: 'not_found' },
      { status: 404 }
    )
  }

  const property: PropertyOption = {
    numero: found[0],
    endereco: found[1],
    parcel: found[2],
  }

  return NextResponse.json({ ok: true, property })
}
