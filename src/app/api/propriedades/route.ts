// src/app/api/propriedades/route.ts

import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export const runtime = 'nodejs'

export async function GET() {
  console.log('[API GET] iniciando leitura da planilha')

  // valida env-vars
  const {
    GOOGLE_CLIENT_EMAIL: clientEmail,
    GOOGLE_PRIVATE_KEY: privateKey,
    SPREADSHEET_ID
  } = process.env
  if (!clientEmail || !privateKey || !SPREADSHEET_ID) {
    console.error('[API GET] ENV vars faltando')
    return NextResponse.json({ ok: false, error: 'misconfiguration' }, { status: 500 })
  }

  // monta o auth
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  const sheets = google.sheets({ version: 'v4', auth })
  const spreadsheetId = SPREADSHEET_ID
  const range = `'Cadastro de Propriedades'!A8:BG`

  try {
    console.log('[API GET] lendo', range)
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range })
    const rows: string[][] = res.data.values || []
    console.log('[API GET] linhas:', rows.length)
    return NextResponse.json({ ok: true, rows })
  } catch (err: unknown) {
    // extrai código de erro se existir
    const e = err as any
    const message = e.message || String(err)
    let status = 500
    let errorType = 'server_error'

    // Google API retorna code 403 para falta de permissão
    if (e.code === 403 || message.match(/permission/i)) {
      status = 403
      errorType = 'permission_denied'
    }
    // 401 = credenciais inválidas
    else if (e.code === 401 || message.match(/unauthorized/i)) {
      status = 401
      errorType = 'unauthorized'
    }
    // por fim, pode ser erro de rede
    else if (message.match(/ENOTFOUND|ECONNREFUSED|ETIMEOUT/)) {
      status = 503
      errorType = 'network_error'
    }

    console.error(`[API GET] erro (${errorType}):`, message)
    return NextResponse.json(
      { ok: false, error: errorType, message },
      { status }
    )
  }
}
