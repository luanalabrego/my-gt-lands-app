// src/app/api/propriedades/upload-url/route.ts

import { NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'
import path from 'path'

export const runtime = 'nodejs'

const storage = new Storage({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL!,
    private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  },
})
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME!)

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const filename = url.searchParams.get('filename')
    const contentType = url.searchParams.get('contentType') || 'application/octet-stream'

    if (!filename) {
      return NextResponse.json(
        { ok: false, message: 'Parâmetro "filename" é obrigatório' },
        { status: 400 }
      )
    }

    const remotePath = `uploads/${Date.now()}-${path.basename(filename)}`
    const file = bucket.file(remotePath)

    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutos
      contentType,                          // utiliza o tipo de conteúdo real
    })

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${remotePath}`

    return NextResponse.json({ ok: true, uploadUrl, publicUrl })
  } catch (err: any) {
    console.error('Erro em upload-url:', err)
    return NextResponse.json(
      { ok: false, message: err.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
