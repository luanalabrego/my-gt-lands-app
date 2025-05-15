// src/app/api/propriedades/update/route.ts

import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export const runtime = 'nodejs'
export const config = { api: { bodyParser: true } }

// converte índice 0-based em letra de coluna (ex: 0→A, 33→AH)
function indexToColumn(idx: number): string {
  let col = ''
  let n = idx + 1
  while (n > 0) {
    const rem = (n - 1) % 26
    col = String.fromCharCode(65 + rem) + col
    n = Math.floor((n - 1) / 26)
  }
  return col
}

export async function POST(request: Request) {
  try {
    const { numero, updates } = await request.json() as {
      numero: string
      updates: Record<string, string>
    }

    console.log('[Update] número =', numero, 'fields =', updates)

    // 1) valida env-vars
    const {
      GOOGLE_CLIENT_EMAIL: clientEmail,
      GOOGLE_PRIVATE_KEY: privateKey,
      SPREADSHEET_ID
    } = process.env

    if (!clientEmail || !privateKey || !SPREADSHEET_ID) {
      console.error('[Update] Variáveis de ambiente faltando')
      return NextResponse.json(
        { ok: false, message: 'Server misconfiguration' },
        { status: 500 }
      )
    }

    // 2) configura auth
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    // 3) instancia Sheets
    const sheets = google.sheets({ version: 'v4', auth })
    const spreadsheetId = SPREADSHEET_ID

    // 4) lê todas as linhas para achar o índice
    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Cadastro de Propriedades!A8:ZZ',
    })
    const rows: string[][] = getRes.data.values || []
    const rowIdx = rows.findIndex(r => r[2] === numero)
    if (rowIdx < 0) {
      return NextResponse.json(
        { ok: false, message: 'Propriedade não encontrada' },
        { status: 404 }
      )
    }

    const sheetRow = rowIdx + 8  // header começa na linha 8

    // 5) grava cada campo editado
    for (const [idxStr, valor] of Object.entries(updates)) {
      const idx = parseInt(idxStr, 10)
      const col = indexToColumn(idx)
      const cell = `${col}${sheetRow}`
      console.log(`[Update] gravando ${valor} em ${cell}`)
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Cadastro de Propriedades!${cell}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[valor]] },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Update] erro:', message)
    return NextResponse.json(
      { ok: false, message },
      { status: 500 }
    )
  }
}
