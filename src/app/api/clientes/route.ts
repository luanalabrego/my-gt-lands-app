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

    // 1) Lê todos os clientes
    const resCli = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Cliente!A:E',
    })
    const clientes = resCli.data.values || []  // inclui cabeçalho

    // 2) Lê todas as propriedades (para buscar o comprador, coluna index 59)
    const resProp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'Cadastro de Propriedades'!A9:BJ`,
    })
    const props = resProp.data.values || []

    // 3) Monta um novo array, adicionando o número da propriedade (coluna 2) a cada cliente
    const header    = [...clientes[0], 'Propriedade']
    const clientsWithProp = clientes.slice(1).map(row => {
      const nomeCliente = row[0].trim()
      // busca propriedade cujo comprador (coluna 59, index 58 zero-based) === nomeCliente
      const match = props.find(p => (p[58] || '').trim() === nomeCliente)
      const propNum = match ? match[2] : ''
      return [...row, propNum]
    })

    // 4) Retorna o cabeçalho + linhas já com a coluna “Propriedade”
    return NextResponse.json({
      ok:   true,
      rows: [header, ...clientsWithProp],
    })
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
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Cliente!A:E',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[ nome, telefone, email, cpf, obs ]] },
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[API POST /clientes]', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
