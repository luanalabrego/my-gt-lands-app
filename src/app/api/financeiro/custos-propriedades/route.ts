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

  const {
    data,
    numeroPropriedade,
    parcel,
    endereco,
    descricao,
    valor,
    investidor,
    notes,
    tipoRegistro
  } = await req.json() as {
    data: string
    numeroPropriedade: string
    parcel: string
    endereco: string
    descricao: string
    valor: number
    investidor: string
    notes: string
    tipoRegistro: 'Propriedade' | 'Leilão'
  }

  // Autentica no Google Sheets
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_CLIENT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  })
  const sheets = google.sheets({ version: 'v4', auth })
  const ssId = SPREADSHEET_ID
  const sheetName = 'Registros'

  try {
    // 1) Lê todas as linhas atuais (B9:J)
    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId: ssId,
      range: `${sheetName}!B9:J`
    })
    const values: string[][] = getRes.data.values || []

    // 2) Procura por linha existente (mesmo número e descrição)
    let foundRowIndex = -1
    for (let i = 0; i < values.length; i++) {
      const row = values[i]
      const num = row[1]?.toString().trim()   // coluna C
      const desc = row[2]?.toString().trim()  // coluna D
      if (num === numeroPropriedade.trim() && desc === descricao.trim()) {
        foundRowIndex = i
        break
      }
    }

    // Prepara os dados a escrever: colunas B–J
    const newRow = [
      data,                     // B: data
      numeroPropriedade,        // C: propriedade
      descricao,                // D: descrição
      tipoRegistro,             // E: classificação
      valor,                    // F: valor
      parcel,                   // G: parcel
      endereco,                 // H: endereço
      investidor,               // I: investidor
      notes                     // J: observações
    ]

    if (foundRowIndex >= 0) {
      // 3a) Atualiza linha existente
      const sheetRow = foundRowIndex + 9  // pois começamos em B9
      await sheets.spreadsheets.values.update({
        spreadsheetId: ssId,
        range: `${sheetName}!B${sheetRow}:J${sheetRow}`,
        valueInputOption: 'RAW',
        requestBody: { values: [newRow] }
      })
      console.log(`Registro existente na linha ${sheetRow} atualizado.`)
    } else {
      // 3b) Caso não exista, insere nova linha
      await sheets.spreadsheets.values.append({
        spreadsheetId: ssId,
        range: `${sheetName}!B:J`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [newRow] }
      })
      console.log('Novo registro inserido.')
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Erro salvando custo:', e)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
