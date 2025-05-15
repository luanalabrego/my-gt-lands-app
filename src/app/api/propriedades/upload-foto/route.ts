// src/app/api/propriedades/upload-foto/route.ts

import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { google } from 'googleapis'

export const runtime = 'nodejs'
export const config = { api: { bodyParser: false } }

export async function POST(request: Request) {
  try {
    console.log('upload-foto: recebendo request')

    // 1) parsear multipart com Web API
    const formData = await request.formData()
    console.log('upload-foto: formData keys =', [...formData.keys()])

    const numero = formData.get('numero')
    if (typeof numero !== 'string') {
      throw new Error('Campo "numero" inválido')
    }
    console.log('upload-foto: numero =', numero)

    const file = formData.get('foto')
    if (!(file instanceof File)) {
      throw new Error('Campo "foto" inválido')
    }
    console.log('upload-foto: arquivo recebido =', file.name, file.size)

    // 2) salvar o arquivo em /public/uploads
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      console.log('upload-foto: criando pasta uploads')
      fs.mkdirSync(uploadsDir, { recursive: true })
    }
    const filename = `${Date.now()}-${file.name}`
    const outPath = path.join(uploadsDir, filename)
    fs.writeFileSync(outPath, buffer)
    console.log('upload-foto: arquivo salvo em', outPath)

    const url = `/uploads/${filename}`
    console.log('upload-foto: url pública =', url)

    // 3) atualizar a planilha (coluna AH)
    console.log('upload-foto: autenticando Google Sheets')

    // Verifica variáveis de ambiente
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error('Credenciais do Google não configuradas')
    }
    if (!process.env.SPREADSHEET_ID) {
      throw new Error('ID da planilha não configurado')
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    const client = await auth.getClient()
    const sheets = google.sheets({ version: 'v4', auth: client })
    const spreadsheetId = process.env.SPREADSHEET_ID as string

    console.log('upload-foto: lendo planilha para encontrar rowIndex')
    const { data: all } = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Cadastro de Propriedades!A1:ZZ',
    })
    const rows: string[][] = all.values || []
    const rowIndex = rows.findIndex(r => r[2] === numero)
    console.log('upload-foto: rowIndex encontrado =', rowIndex)

    if (rowIndex > 0) {
      const columnLetter = 'AH'
      const sheetRowNum = rowIndex + 1
      console.log(`upload-foto: escrevendo URL em ${columnLetter}${sheetRowNum}`)
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Cadastro de Propriedades!${columnLetter}${sheetRowNum}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[url]] },
      })
      console.log('upload-foto: planilha atualizada com sucesso')
    } else {
      console.warn('upload-foto: propriedade não encontrada, não foi atualizado')
    }

    return NextResponse.json({ ok: true, url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Erro em upload-foto:', message, err)
    return NextResponse.json({ ok: false, message }, { status: 500 })
  }
}
