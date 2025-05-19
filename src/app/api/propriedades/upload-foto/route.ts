// src/app/api/propriedades/upload-foto/route.ts

import { NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'
import { google } from 'googleapis'

export const runtime = 'nodejs'
export const config = { api: { bodyParser: false } }

const storage = new Storage({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL!,
    private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  },
})
const bucketName = process.env.GCS_BUCKET_NAME!
const bucket = storage.bucket(bucketName)

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

    // 2) upload para o bucket
    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = `${Date.now()}-${file.name}`
    const remotePath = `uploads/${filename}`
    const gcFile = bucket.file(remotePath)

    await gcFile.save(buffer, {
      metadata: { contentType: file.type },
      public: true,
      resumable: false,
    })
    console.log(`upload-foto: arquivo enviado para bucket em ${remotePath}`)

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${remotePath}`

    // 3) configurar Google Sheets via env vars
    const {
      GOOGLE_CLIENT_EMAIL: clientEmail,
      GOOGLE_PRIVATE_KEY: privateKey,
      SPREADSHEET_ID,
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
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Cadastro de Propriedades!A1:ZZ',
    })
    const rows: string[][] = data.values || []
    const rowIndex = rows.findIndex(r => r[2] === numero)
    console.log('upload-foto: rowIndex encontrado =', rowIndex)

    if (rowIndex > 0) {
      const sheetRowNum = rowIndex + 1
      console.log(`upload-foto: escrevendo publicUrl em AH${sheetRowNum}`)
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Cadastro de Propriedades!AH${sheetRowNum}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[publicUrl]] },
      })
      console.log('upload-foto: planilha atualizada com sucesso')
    } else {
      console.warn('upload-foto: propriedade não encontrada, não foi atualizado')
    }

    return NextResponse.json({ ok: true, url: publicUrl })
  } catch (err: any) {
    console.error('Erro em upload-foto:', err)
    return NextResponse.json(
      { ok: false, message: err.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
