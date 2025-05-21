// src/app/api/calculadora/simular/route.ts
import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export const runtime = 'nodejs'

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
  return google.sheets({ version: 'v4', auth })
}

export async function POST(request: Request) {
  try {
    // agora recebemos também entradaType: 'percent' | 'value'
    const {
      propriedade,
      entrada = '30',
      entradaType = 'percent',
      parcelas = '36',
      taxa = '0',
    } = await request.json()

    const sheets = await getSheetsClient()
    const ssId = process.env.SPREADSHEET_ID!
    if (!ssId) throw new Error('SPREADSHEET_ID não configurado')

    // lê propriedades da linha 9 em diante
    const range = `'Cadastro de Propriedades'!A9:BG`
    const allRes = await sheets.spreadsheets.values.get({ spreadsheetId: ssId, range })
    const rows: string[][] = allRes.data.values || []

    const idx = rows.findIndex(r => r[2] === propriedade)
    if (idx < 0) {
      return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })
    }

    const endereco = rows[idx][5] || ''
    const vendaCell = rows[idx][50] || ''
    const valorVenda = parseFloat(vendaCell.replace(/[^0-9.\-]/g, ''))
    if (isNaN(valorVenda)) {
      return NextResponse.json({ error: 'Valor de venda inválido' }, { status: 400 })
    }

    // Cálculo de downPayment conforme tipo de entrada
    let downPayment: number
    if (entradaType === 'percent') {
      const pct = (parseFloat(entrada) || 30) / 100
      downPayment = valorVenda * pct
    } else {
      downPayment = parseFloat(entrada) || 0
    }

    const valorFin = valorVenda - downPayment
    const n = parseInt(parcelas) || 36
    const j = (parseFloat(taxa) || 0) / 100 / 12
    const pmt = valorFin * (j * Math.pow(1 + j, n)) / (Math.pow(1 + j, n) - 1)
    const totalJuros = pmt * n - valorFin

    return NextResponse.json({
      valorVenda,
      downPayment,
      valorFinanciado: valorFin,
      parcelas: n,
      pmt,
      totalJuros,
      taxaAnual: j * 12 * 100,
      endereco,
    })
  } catch (err: any) {
    console.error('Erro em /api/calculadora/simular:', err)
    return NextResponse.json(
      { error: err.message || 'Erro interno' },
      { status: 500 }
    )
  }
}
