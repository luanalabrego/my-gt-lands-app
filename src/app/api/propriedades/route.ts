// src/app/api/propriedades/route.ts

import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  console.log('[API GET] iniciando leitura da planilha')

  // validação das ENV vars
  const {
    GOOGLE_CLIENT_EMAIL: clientEmail,
    GOOGLE_PRIVATE_KEY: privateKey,
    SPREADSHEET_ID
  } = process.env

  if (!clientEmail || !privateKey || !SPREADSHEET_ID) {
    console.error('[API GET] ENV vars faltando')
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

  // intervalo completo
  const range = `'Cadastro de Propriedades'!A8:BJ`

  try {
    console.log('[API GET] lendo', range)
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range })
    const rows: string[][] = res.data.values || []
    console.log('[API GET] linhas totais:', rows.length)

    // captura query-param ?onlyAvailable=true
    const url = new URL(request.url)
    const onlyAvailable = url.searchParams.get('onlyAvailable') === 'true'

    if (onlyAvailable) {
      // filtra quem está "Disponível" (coluna BJ = índice 61)
      const available = rows.filter(r => (r[61] || '').trim() === 'Disponível')
      // mapeia para objetos { numero, endereco } (coluna C índice 2, coluna F índice 5)
      const properties = available.map(r => ({
        numero: r[2],
        endereco: r[5],
      }))
      console.log('[API GET] disponíveis:', properties.length)
      return NextResponse.json({ ok: true, properties })
    }

    // retorno padrão com todas as rows (inalterado)
    return NextResponse.json({ ok: true, rows })
  } catch (err: any) {
    const message = err.message || String(err)
    let status = 500
    let errorType = 'server_error'

    if (err.code === 403 || /permission/i.test(message)) {
      status = 403; errorType = 'permission_denied'
    } else if (err.code === 401 || /unauthorized/i.test(message)) {
      status = 401; errorType = 'unauthorized'
    } else if (/ENOTFOUND|ECONNREFUSED|ETIMEOUT/.test(message)) {
      status = 503; errorType = 'network_error'
    }

    console.error(`[API GET] erro (${errorType}):`, message)
    return NextResponse.json(
      { ok: false, error: errorType, message },
      { status }
    )
  }
}

export async function POST(request: Request) {
  // Recebe { rowIndex, blocked } no body
  const { rowIndex, blocked } = await request.json() as {
    rowIndex: number
    blocked: boolean
  }

  const {
    GOOGLE_CLIENT_EMAIL: clientEmail,
    GOOGLE_PRIVATE_KEY: privateKey,
    SPREADSHEET_ID
  } = process.env

  if (!clientEmail || !privateKey || !SPREADSHEET_ID) {
    console.error('[API POST] ENV vars faltando')
    return NextResponse.json(
      { ok: false, error: 'misconfiguration' },
      { status: 500 }
    )
  }

  // autenticação Google Sheets (mesma do GET)
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  const sheets = google.sheets({ version: 'v4', auth })
  const spreadsheetId = SPREADSHEET_ID

  // Calcula número da linha na planilha:
  // GET lê da A8, então data[0] é a linha 9.
  const sheetRow = rowIndex + 9

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'Cadastro de Propriedades'!BI${sheetRow}`, // coluna BI
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          [ blocked ? 'Sim' : '' ]
        ]
      }
    })
    console.log(`[API POST] linha ${sheetRow} atualizada com bloqueado=${blocked}`)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[API POST] erro ao atualizar bloqueio:', err)
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    )
  }
}
