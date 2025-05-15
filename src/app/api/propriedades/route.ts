// src/app/api/propriedades/route.ts

import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export const runtime = 'nodejs'

export async function GET() {
  console.log('[API GET] iniciando leitura da planilha (header na linha 8)')

  // 1) valida env-vars
  const {
    GOOGLE_CLIENT_EMAIL: clientEmail,
    GOOGLE_PRIVATE_KEY: privateKey,
    SPREADSHEET_ID
  } = process.env

  if (!clientEmail || !privateKey || !SPREADSHEET_ID) {
    console.error('[API GET] Variáveis de ambiente faltando')
    return NextResponse.json(
      { error: 'Server misconfiguration' },
      { status: 500 }
    )
  }

  // 2) configura auth usando GoogleAuth diretamente
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  // 3) instancia o cliente Sheets com a instância de auth
  const sheets = google.sheets({ version: 'v4', auth })

  const spreadsheetId = SPREADSHEET_ID
  const range         = 'Cadastro de Propriedades!A8:BG'  // cabeçalho na linha 8

  console.log('[API GET] lendo range:', range)
  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range })
    const rows: string[][] = res.data.values || []

    console.log('[API GET] total de linhas retornadas:', rows.length)
    if (rows.length > 0) {
      console.log('[API GET] total de colunas (header):', rows[0].length)
      console.log('[API GET] header AH (idx 33):', rows[0][33])
      console.log('[API GET] primeiro valor AH (idx 33):', rows[1]?.[33])
    }

    return NextResponse.json(rows)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[API GET] erro ao acessar a planilha:', message)
    return NextResponse.json(
      { error: 'Erro interno no servidor', message },
      { status: 500 }
    )
  }
}
