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
    return NextResponse.json(
      { ok: false, error: 'misconfiguration' },
      { status: 500 }
    )
  }

  // Recebe os dados do formulário, incluindo parcel e endereco
  const body = await req.json()
  const {
    data,
    numeroPropriedade,
    descricao,
    valor,
    investidor,
    notes,
    tipoRegistro,
    parcel,
    endereco
  } = body

  // Define classificação a ser gravada na coluna E
  const classification = tipoRegistro === 'Leilão' ? 'Leilão' : 'Propriedade'

  // Autenticação Google Sheets
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_CLIENT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  const sheets = google.sheets({ version: 'v4', auth })
  const spreadsheetId = SPREADSHEET_ID

  try {
    // Append na aba "Registros" colunas B:J
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Registros!B:J',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          data,               // B: Data
          numeroPropriedade,  // C: Número da Propriedade
          descricao,          // D: Descrição
          classification,     // E: Classificação (Leilão/Propriedade)
          valor,              // F: Valor
          parcel,             // G: Parcel
          endereco,           // H: Endereço
          investidor,         // I: Investidor
          notes               // J: Notas
        ]]
      }
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Erro ao salvar custo:', e)
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    )
  }
}
