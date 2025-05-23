// src/app/api/propriedades/dropdown/route.ts
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

  // autenticação Google Sheets
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  const sheets = google.sheets({ version: 'v4', auth })
  const spreadsheetId = SPREADSHEET_ID

  try {
    // 1) Números de propriedade (caso ainda use)
    const propRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'Cadastro de Propriedades'!C9:C`,
    })
    const propertyNumbers = (propRes.data.values || [])
      .flat()
      .map(v => v.toString().trim())
      .filter(v => v)

    // 2) Descrições: coluna B a partir da linha 5 na sheet "Configurações"
    const descRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'Configurações'!B5:B`,
    })
    const descricaoOptions = Array.from(new Set(
      (descRes.data.values || [])
        .flat()
        .map(v => v.toString().trim())
        .filter(v => v)
    ))

    // 3) Investidores: coluna I a partir da linha 9 na sheet "Registros"
    const invRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'Registros'!I9:I`,
    })
    const investidores = Array.from(new Set(
      (invRes.data.values || [])
        .flat()
        .map(v => v.toString().trim())
        .filter(v => v)
    ))

    return NextResponse.json({
      ok: true,
      propertyNumbers,
      descricaoOptions,
      investidores
    })
  } catch (err: any) {
    console.error('Erro ao buscar dropdown:', err)
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    )
  }
}
