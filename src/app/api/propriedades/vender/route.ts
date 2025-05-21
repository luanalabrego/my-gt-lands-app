import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export const runtime = 'nodejs'

interface VendaPayload {
  saleDate: string
  propriedade: string
  buyerName: string
  paymentMethod: string
  downPayment: number
  installmentCount: number
  installmentValue: number
  custos: Record<string, number>
  creditos: Record<string, number>
  saleValue: number
  stateCommission: number
  docStamps: number
}

export async function POST(req: Request) {
  const payload = await req.json() as VendaPayload
  const {
    saleDate,
    propriedade,
    buyerName,
    paymentMethod,
    downPayment,
    installmentCount,
    installmentValue,
    custos,
    creditos,
    saleValue,
    stateCommission,
    docStamps
  } = payload

  const {
    GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY,
    SPREADSHEET_ID
  } = process.env
  if (!GOOGLE_CLIENT_EMAIL||!GOOGLE_PRIVATE_KEY||!SPREADSHEET_ID)
    return NextResponse.json({ ok:false,error:'misconfiguration' },{ status:500 })

  const auth = new google.auth.GoogleAuth({
    credentials:{
      client_email:GOOGLE_CLIENT_EMAIL,
      private_key:GOOGLE_PRIVATE_KEY.replace(/\\n/g,'\n')
    },
    scopes:['https://www.googleapis.com/auth/spreadsheets']
  })
  const sheets = google.sheets({ version:'v4', auth })
  const ssId = SPREADSHEET_ID

  const formattedDate = saleDate
    ? new Date(saleDate).toLocaleDateString('en-US')
    : ''

  async function getNextEmptyRow() {
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId:ssId,
      range:`'Registros'!B9:F`
    })
    const data = resp.data.values||[]
    for(let i=0;i<data.length;i++) if(data[i].every(c=>!c)) return 9+i
    return 9+data.length
  }

  async function updateOrInsertRegistro(description:string, value:number) {
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId:ssId,
      range:`'Registros'!C9:D`
    })
    const rows = resp.data.values||[]
    const idx = rows.findIndex(r=>
      r[0]?.toString().trim().toLowerCase()===propriedade.trim().toLowerCase() &&
      r[1]?.toString().trim().toLowerCase()===description.trim().toLowerCase()
    )

    const ops:any[] = []
    const rowNum = idx>=0 ? 9+idx : await getNextEmptyRow()
    ops.push(
      { range:`'Registros'!B${rowNum}`, values:[[formattedDate]] },
      { range:`'Registros'!C${rowNum}`, values:[[propriedade]] },
      { range:`'Registros'!D${rowNum}`, values:[[description]] },
      { range:`'Registros'!E${rowNum}`, values:[['Venda']]    },
      { range:`'Registros'!F${rowNum}`, values:[[value]]      }
    )
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId:ssId,
      requestBody:{ valueInputOption:'RAW', data:ops }
    })
    return rowNum
  }

  // grando custos
  for(const [type,val] of Object.entries(custos))
    if(val && val!==0) await updateOrInsertRegistro(type,val)

  // valor da venda
  const saleRow = await updateOrInsertRegistro('Valor da Venda', saleValue)

  // buyerName…installmentValue nas colunas Q–U da mesma linha
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId:ssId,
    requestBody:{
      valueInputOption:'RAW',
      data:[
        { range:`'Registros'!Q${saleRow}`, values:[[buyerName]] },
        { range:`'Registros'!R${saleRow}`, values:[[paymentMethod]] },
        { range:`'Registros'!S${saleRow}`, values:[[downPayment]] },
        { range:`'Registros'!T${saleRow}`, values:[[installmentCount]] },
        { range:`'Registros'!U${saleRow}`, values:[[installmentValue]] }
      ]
    }
  })

  // comissão e stamps
  if(stateCommission && stateCommission!==0)
    await updateOrInsertRegistro('State Commission', stateCommission)
  if(docStamps && docStamps!==0)
    await updateOrInsertRegistro('Documents Stamps', docStamps)

  // créditos
  for(const [type,val] of Object.entries(creditos))
    if(val && val!==0) await updateOrInsertRegistro(type,val)

  return NextResponse.json({ ok:true })
}
