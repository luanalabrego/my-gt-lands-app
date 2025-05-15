// src/app/api/propriedades/route.ts

import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import path from 'path'

export const runtime = 'nodejs'

export async function GET() {
  try {
    console.log('[API GET] iniciando leitura da planilha (header na linha 8)')
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(process.cwd(), 'src', 'lib', 'credentials.json'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    const client = await auth.getClient()
    const sheets = google.sheets({ version: 'v4', auth: client })

    const spreadsheetId = '1RKsyNuRT61ERq_PBdgirNaACXqgXyMuMoNwaXQ30Fqs'
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
  } catch (err) {
    console.error('[API GET] erro ao acessar a planilha:', err)
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    )
  }
}
