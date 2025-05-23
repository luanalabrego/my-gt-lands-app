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
    // 1) Faz a leitura da aba Registros, colunas B–J a partir da linha 9
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: ss,
      range: 'Registros!B9:J'
    })
    const values = res.data.values || []

    // 2) Debug: log raw values
    console.log('⏳ [API] raw values:', JSON.stringify(values, null, 2))

    // 3) Mapeia cada linha, mantendo "valor" como string com símbolo
    const rows = values.map((r, i) => ({
      data:          r[0] || '',  // coluna B
      numero:        r[1] || '',  // coluna C
      descricao:     r[2] || '',  // coluna D
      classificacao: r[3] || '',  // coluna E
      valor:         r[4] || '',  // coluna F — preserva o "$xx.xx"
      parcel:        r[5] || '',  // coluna G
      endereco:      r[6] || '',  // coluna H
      investidor:    r[7] || '',  // coluna I
      notes:         r[8] || ''   // coluna J
    }))

    // 4) Debug: log mapped rows
    console.log('✅ [API] mapped rows:', JSON.stringify(rows, null, 2))

    // 5) Retorna ao cliente
    return NextResponse.json({ ok: true, rows })
  } catch (err: any) {
    console.error('❌ Erro ao buscar custos:', err)
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    )
  }
}
