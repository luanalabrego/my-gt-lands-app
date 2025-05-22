import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export const runtime = 'nodejs'
export const config = { api: { bodyParser: true } }

const getSheetsClient = () => {
  const { GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, SPREADSHEET_ID } = process.env
  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !SPREADSHEET_ID) {
    throw new Error('Env vars do Google Sheets faltando')
  }
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_CLIENT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return {
    sheets: google.sheets({ version: 'v4', auth }),
    spreadsheetId: SPREADSHEET_ID,
  }
}

export async function GET() {
  try {
    const { sheets, spreadsheetId } = getSheetsClient()
    // lê todos os clientes: aba “Cliente” colunas A–E
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Cliente!A:E',
    })
    const rows = res.data.values || []
    // cabeçalho + dados
    return NextResponse.json({ ok: true, rows })
  } catch (err: any) {
    console.error('[API GET /clientes]', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { nome, telefone, email, cpf = '', obs = '' } = await request.json()
    if (!nome || !telefone || !email) {
      return NextResponse.json(
        { ok: false, error: 'nome, telefone e email são obrigatórios.' },
        { status: 400 }
      )
    }

    const { sheets, spreadsheetId } = getSheetsClient()
    // insere no final da aba “Cliente” nas colunas A–E
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Cliente!A:E',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [ nome, telefone, email, cpf, obs ]
        ],
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[API POST /clientes]', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
