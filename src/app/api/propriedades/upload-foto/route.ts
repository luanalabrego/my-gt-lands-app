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

    // 1) parsear multipart
    const formData = await request.formData()
    const numero = formData.get('numero')
    if (typeof numero !== 'string') {
      throw new Error('Campo "numero" inválido')
    }

    const file = formData.get('foto')
    if (!(file instanceof File)) {
      throw new Error('Campo "foto" inválido')
    }

    // 2) salvar arquivo em /public/uploads
    const buffer = Buffer.from(await file.arrayBuffer())
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }
    const filename = `${Date.now()}-${file.name}`
    const outPath = path.join(uploadsDir, filename)
    fs.writeFileSync(outPath, buffer)
    const url = `/uploads/${filename}`
    console.log('upload-foto: arquivo salvo em', outPath)

    // 3) configurar Google Sheets via env vars
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
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })
    const spreadsheetId = SPREADSHEET_ID

    // 4) ler planilha para encontrar a linha
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
    console.error('Erro em upload-foto:', message)
    return NextResponse.json({ ok: false, message }, { status: 500 })
  }
}
