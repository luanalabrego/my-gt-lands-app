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
    return NextResponse.json({ ok: false, error: 'misconfiguration' }, { status: 500 })
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  const sheets = google.sheets({ version: 'v4', auth })
  const ss = SPREADSHEET_ID

  try {
    // ler da linha 9 em diante, colunas B (índice 2) até J (índice 10)
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: ss,
      range: 'Registros!B9:J',
    })
    const values: string[][] = res.data.values || []

    // mapeia cada linha num objeto
    const rows = values.map(r => ({
      data:        r[0] || '',
      numero:      r[1] || '',
      descricao:   r[2] || '',
      classificacao: r[3] || '',
      valor:       parseFloat(r[4] || '0'),
      parcel:      r[5] || '',
      endereco:    r[6] || '',
      investidor:  r[7] || '',
      notes:       r[8] || '',
    }))

    return NextResponse.json({ ok: true, rows })
  } catch (err: any) {
    console.error('Erro ao buscar custos:', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
