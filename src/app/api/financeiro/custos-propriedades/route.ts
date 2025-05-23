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
    // 1) Lê da planilha “Registros”, colunas B a J a partir da linha 9
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: ss,
      range: 'Registros!B9:J'
    })
    const values = res.data.values || []

    // 2) Debug: raw values
    console.log('⏳ [API] raw values:', JSON.stringify(values, null, 2))

    // 3) Mapeia e sanitiza
    const rows = values.map((r, i) => {
      const rawValor = r[4] || ''  // coluna F
      // remove tudo que não for dígito, ponto ou vírgula
      let clean = rawValor.replace(/[^0-9.,\-]/g, '')
      // retira pontos de milhar (ex.: “1.234,56” → “1234,56”)
      clean = clean.replace(/\.(?=\d{3}(,|$))/g, '')
      // substitui vírgula decimal por ponto
      clean = clean.replace(/,/g, '.')
      const valorNum = parseFloat(clean) || 0

      console.log(
        `Linha ${i + 9}: rawValor="${rawValor}" → clean="${clean}" → valorNum=${valorNum}`
      )

      return {
        data:          r[0] || '',    // B
        numero:        r[1] || '',    // C
        descricao:     r[2] || '',    // D
        classificacao: r[3] || '',    // E
        valor:         valorNum,      // F
        parcel:        r[5] || '',    // G
        endereco:      r[6] || '',    // H
        investidor:    r[7] || '',    // I
        notes:         r[8] || ''     // J
      }
    })

    // 4) Debug: mapped rows
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
