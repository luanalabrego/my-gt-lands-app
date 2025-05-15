// src/lib/sheets.ts

import { google } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
const RANGE  = 'Cadastro de Propriedades!A8:BG'

const {
  GOOGLE_CLIENT_EMAIL,
  GOOGLE_PRIVATE_KEY,
  SPREADSHEET_ID,
} = process.env

if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !SPREADSHEET_ID) {
  throw new Error(
    'Environment variables GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY or SPREADSHEET_ID not set'
  )
}

// Configura o GoogleAuth com variáveis de ambiente
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: GOOGLE_CLIENT_EMAIL,
    private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: SCOPES,
})

/**
 * Busca todas as linhas da planilha (header na linha 8)
 */
export async function getPropriedadesFromSheet(): Promise<string[][]> {
  // Passa a instância de auth diretamente
  const sheets = google.sheets({ version: 'v4', auth })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
  })
  return res.data.values || []
}
