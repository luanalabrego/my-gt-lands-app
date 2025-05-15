// src/app/api/propriedades/route.ts

import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export const runtime = 'nodejs'

export async function GET() {
  try {
    console.log('[API GET] iniciando leitura da planilha (header na linha 8)')

    // Verifica variáveis de ambiente
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error('Credenciais do Google não configuradas')
    }
    if (!process.env.SPREADSHEET_ID) {
      throw new Error('ID da planilha não configurado')
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const client = await auth.getClient()
    const sheets = google.sheets({ version: 'v4', auth: client })

    const spreadsheetId = process.env.SPREADSHEET_ID as string
    const range         = 'Cadastro de Propriedades!A8:BG'  // começa na linha 8

    console.log('[API GET] lendo range:', range)
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
