// src/app/api/financeiro/custos-propriedades/route.ts
import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export const runtime = 'nodejs'

export async function GET() {
  const {
    GOOGLE_CLIENT_EMAIL: clientEmail,
    GOOGLE_PRIVATE_KEY: privateKey,
    SPREADSHEET_ID
  } = process.env

  if (!clientEmail || !privateKey || !SPREADSHEET_ID) {
    return NextResponse.json(
      { ok: false, error: 'misconfiguration' },
      { status: 500 }
    )
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, '\n')
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  })
  const sheets = google.sheets({ version: 'v4', auth })
  const ss = SPREADSHEET_ID

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: ss,
      range: 'Registros!B9:J'
    })
    const values = res.data.values || []

    const rows = values.map(r => ({
      data:           r[1] || '',
      numero:         r[2] || '',
      descricao:      r[3] || '',
      classificacao:  r[4] || '',
      valor:          parseFloat(r[6] || '0'),
      parcel:         r[7] || '',
      endereco:       r[8] || '',
      investidor:     r[9] || '',
      notes:          r[10] || ''
    }))

    return NextResponse.json({ ok: true, rows })
  } catch (err: any) {
    console.error('Erro ao buscar custos:', err)
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    )
  }
}
