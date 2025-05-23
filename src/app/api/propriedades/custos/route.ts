// src/app/api/propriedades/custos/route.ts
import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const {
    GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY,
    SPREADSHEET_ID
  } = process.env
  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !SPREADSHEET_ID) {
    return NextResponse.json({ ok: false, error: 'misconfiguration' }, { status: 500 })
  }

  const body = await req.json()
  // body deve ter: data, numeroPropriedade, descricao, valor, investidor, notes, tipoRegistro
  const {
    data, numeroPropriedade, descricao, valor,
    investidor, notes, tipoRegistro
  } = body

  // autentique no Google Sheets
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_CLIENT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  })
  const sheets = google.sheets({ version: 'v4', auth })
  const ssId = SPREADSHEET_ID

  try {
    const sheet = 'Registros'
    // aqui você deve encontrar a próxima linha vazia (pode copiar sua função getNextEmptyRowRegistros)
    // e então escrever no intervalo B:J, por exemplo.
    // Exemplo simplificado:  
    await sheets.spreadsheets.values.append({
      spreadsheetId: ssId,
      range: `${sheet}!B:J`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          data,
          numeroPropriedade,
          descricao,
          tipoRegistro,
          valor,
          '', // parcel (você pode deixar vazio ou preencher)
          '', // endereço
          investidor,
          notes
        ]]
      }
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Erro salvando custo:', e)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
