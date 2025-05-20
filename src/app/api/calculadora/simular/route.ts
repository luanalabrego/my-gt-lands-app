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
    const { propriedade, entrada = '30', parcelas = '36', taxa = '0' } =
      await request.json()

    const sheets = await getSheetsClient()
    const ssId = process.env.SPREADSHEET_ID!
    if (!ssId) throw new Error('SPREADSHEET_ID não configurado')

    // busca propriedades via API interna
    const propsRes = await fetch(new URL('/api/propriedades', request.url))
    const propsBody = (await propsRes.json()) as { ok: boolean; rows?: string[][] }
    if (!propsBody.ok || !propsBody.rows) {
      return NextResponse.json({ error: 'Não foi possível listar propriedades' }, { status: 500 })
    }

    const dataRows = propsBody.rows.slice(1)
    const idx = dataRows.findIndex(r => r[2] === propriedade)
    if (idx < 0) {
      return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })
    }
    const rowNum = idx + 2

    // lê valor de venda (coluna AO = 41)
    const vendaCell = await sheets.spreadsheets.values.get({
      spreadsheetId: ssId,
      range: `Cadastro de Propriedades!AO${rowNum}`,
    })
    const rawVenda = (vendaCell.data.values?.[0]?.[0] || '').toString()
    const valorVenda = parseFloat(rawVenda.replace(/[^0-9.\-]/g, ''))
    if (isNaN(valorVenda)) {
      return NextResponse.json({ error: 'Valor de venda inválido' }, { status: 400 })
    }

    // cálculos
    const entFrac = (parseFloat(entrada) || 30) / 100
    const downPayment = valorVenda * entFrac
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
    })
  } catch (err: any) {
    console.error('Erro em /api/calculadora/simular:', err)
    return NextResponse.json(
      { error: err.message || 'Erro interno' },
      { status: 500 }
    )
  }
}
