// src/app/api/propriedades/upload-foto/route.ts

import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export const runtime = 'nodejs'
export const config = {
  api: {
    // Limitamos o body a um JSON pequeno: { numero, url }
    bodyParser: { sizeLimit: '1kb' }
  }
}

export async function POST(request: Request) {
  try {
    // 1) Parsear o JSON
    const { numero, url } = await request.json()
    if (typeof numero !== 'string' || typeof url !== 'string') {
      return NextResponse.json(
        { ok: false, message: 'Envie { numero, url } como JSON' },
        { status: 400 }
      )
    }

    // 2) Carregar credenciais e inicializar o client da Sheets API
    const {
      GOOGLE_CLIENT_EMAIL: clientEmail,
      GOOGLE_PRIVATE_KEY: privateKey,
      SPREADSHEET_ID
    } = process.env
    if (!clientEmail || !privateKey || !SPREADSHEET_ID) {
      throw new Error('Variáveis de ambiente do Google não configuradas')
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n')
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    })
    const sheets = google.sheets({ version: 'v4', auth })

    // 3) Ler todas as linhas para encontrar a propriedade
    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Cadastro de Propriedades!A1:ZZ'
    })
    const rows: string[][] = getRes.data.values || []
    const rowIndex = rows.findIndex(r => r[2] === numero)

    // 4) Atualizar a célula AH na linha correta
    if (rowIndex > 0) {
      const sheetRow = rowIndex + 1
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Cadastro de Propriedades!AH${sheetRow}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[url]] }
      })
      console.log(`upload-foto: URL gravada em AH${sheetRow}`)
    } else {
      console.warn(`upload-foto: "${numero}" não encontrado`)
    }

    // 5) Responder sucesso
    return NextResponse.json({ ok: true, url })
  } catch (err: any) {
    console.error('Erro em upload-foto:', err)
    return NextResponse.json(
      { ok: false, message: err.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
