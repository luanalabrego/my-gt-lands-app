// src/app/api/propriedades/upload-foto/route.ts

import { NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'
import { google } from 'googleapis'

export const runtime = 'nodejs'
export const config = {
  api: {
    bodyParser: false   // Desligamos o bodyParser para receber multipart/form-data
  }
}

// Inicializa o client do Cloud Storage
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

    // 1) Parsear o multipart/form-data
    const formData = await request.formData()
    const numero = formData.get('numero')
    if (typeof numero !== 'string') {
      throw new Error('Campo "numero" inválido')
    }

    const file = formData.get('foto')
    if (!(file instanceof File)) {
      throw new Error('Campo "foto" inválido')
    }

    // 2) Fazer upload direto para o GCS
    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = `${Date.now()}-${file.name}`
    const remotePath = `uploads/${filename}`
    const gcFile = bucket.file(remotePath)

    await gcFile.save(buffer, {
      metadata: { contentType: file.type },
      public: true,      // torna o objeto público imediatamente
      resumable: false,  // simplifica o fluxo para arquivos menores
    })
    console.log(`upload-foto: arquivo enviado para bucket em ${remotePath}`)

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${remotePath}`

    // 3) Configurar e autenticar Google Sheets API
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

    // 4) Buscar todas as linhas da planilha para encontrar o índice correto
    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Cadastro de Propriedades!A1:ZZ',
    })
    const rows: string[][] = getRes.data.values || []
    const rowIndex = rows.findIndex(r => r[2] === numero)
    console.log('upload-foto: rowIndex encontrado =', rowIndex)

    // 5) Se encontrado, atualizar a célula AH da linha correta
    if (rowIndex > 0) {
      const sheetRowNum = rowIndex + 1
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Cadastro de Propriedades!AH${sheetRowNum}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[publicUrl]] },
      })
      console.log(`upload-foto: URL gravada em AH${sheetRowNum}`)
    } else {
      console.warn(`upload-foto: propriedade "${numero}" não encontrada`)
    }

    // 6) Responder com sucesso
    return NextResponse.json({ ok: true, url: publicUrl })
  } catch (err: any) {
    console.error('Erro em upload-foto:', err)
    const message = err.message || 'Erro desconhecido'
    return NextResponse.json(
      { ok: false, message },
      { status: 500 }
    )
  }
}
