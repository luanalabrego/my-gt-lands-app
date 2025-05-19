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
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename')
  if (!filename) {
    return NextResponse.json({ ok: false, message: 'filename é obrigatório' }, { status: 400 })
  }

  const remotePath = `uploads/${Date.now()}-${path.basename(filename)}`
  const file = bucket.file(remotePath)

  const [uploadUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutos
    contentType: 'application/octet-stream',
  })

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${remotePath}`

  return NextResponse.json({ ok: true, uploadUrl, publicUrl })
}
