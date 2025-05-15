// src/app/api/propriedades/create/route.ts
import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export const runtime = 'nodejs'

// Desativa o parser JSON padrão para podermos usar formData()
export const config = {
  api: {
    bodyParser: false,
  },
}

// Colunas B–AG em ordem
const COLUMN_ORDER = [
  'purchaseDate','propertyNumber','description','parcel','address','county','state',
  'squareFeet','acres','zoningCode','zoningType','lotMeasurements','propertyTax',
  'water','waterDesc','electricity','electricityDesc','sewer','sewerDesc','floodZone',
  'propertyDesc','notesZone','minimumLotArea','coordinates','legalDesc','hoa',
  'hoaName','hoaValue','hoaPeriod','optionalNotes','images','documents'
]

export async function POST(request: Request) {
  console.log('[Create API] Multipart recebido')

  // 1) obtém o FormData
  let form: FormData
  try {
    form = await request.formData()
  } catch (err) {
    console.error('[Create API] Falha ao ler FormData:', err)
    return NextResponse.json({ ok: false, error: 'Invalid form data' }, { status: 400 })
  }

  // 2) extrai campos de texto
  const data: Record<string,string> = {}
  for (const key of COLUMN_ORDER) {
    const v = form.get(key)
    data[key] = typeof v === 'string' ? v : ''
  }

  // 3) extrai arquivos
  const imageFiles = form.getAll('images') as Blob[]
  const docFiles   = form.getAll('documents') as Blob[]

  // 4) valida env-vars
  const {
    GOOGLE_CLIENT_EMAIL: clientEmail,
    GOOGLE_PRIVATE_KEY: privateKey,
    SPREADSHEET_ID
  } = process.env
  if (!clientEmail || !privateKey || !SPREADSHEET_ID) {
    console.error('[Create API] Variáveis de ambiente faltando')
    return NextResponse.json({ ok: false, error: 'Server misconfiguration' }, { status: 500 })
  }

  // 5) configura auth Google
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, '\n'),
    },
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file'  // para upload de arquivos
    ],
  })
  const drive = google.drive({ version: 'v3', auth })
  const sheets = google.sheets({ version: 'v4', auth })

  // 6) faz upload de cada arquivo e coleta as URLs públicas
  async function uploadToDrive(file: Blob, namePrefix: string) {
    const buffer = Buffer.from(await file.arrayBuffer())
    const res = await drive.files.create({
      media: { mimeType: file.type, body: buffer },
      requestBody: {
        name: `${namePrefix}-${Date.now()}`,
        parents: ['<PASTA_DO_DRIVE>'],  // id da pasta no Drive
      }
    })
    // disponibilizar publicamente (ajuste permissões conforme precisar)
    await drive.permissions.create({
      fileId: res.data.id!,
      requestBody: { role: 'reader', type: 'anyone' }
    })
    const url = `https://drive.google.com/uc?id=${res.data.id}`
    return url
  }

  // 7) processa uploads
  const imageUrls = await Promise.all(
    imageFiles.map((f,i) => uploadToDrive(f, `img-${numero}-${i}`))
  )
  const docUrls = await Promise.all(
    docFiles.map((f,i) => uploadToDrive(f, `doc-${numero}-${i}`))
  )

  // 8) insere URLs concatenadas no data
  data.images    = imageUrls.join(', ')
  data.documents = docUrls.join(', ')

  // 9) monta a linha e envia ao Sheets
  const row = COLUMN_ORDER.map(key => data[key] ?? '')
  console.log('[Create API] Row a inserir:', row)

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID!,
      range: 'Cadastro de Propriedades!A9:AG',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Create API] Erro do Sheets:', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
