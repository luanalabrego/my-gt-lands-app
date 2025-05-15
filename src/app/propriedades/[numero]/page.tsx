'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from '../../../hooks/useTranslation'

type PropertyRow = string[]

// campos padrão para lotes não vendidos
const camposParaExibir = [
  { key: 'addressLabel',    index: 5  },
  { key: 'countyLabel',     index: 6  },
  { key: 'stateLabel',      index: 7  },
  { key: 'boughtOn',        index: 1  },
  { key: 'squareFeetLabel', index: 8  },
  { key: 'acresLabel',      index: 9  },
  { key: 'zoningTypeLabel', index: 11 },
  { key: 'zoningCodeLabel', index: 10 },
  { key: 'coordinatesLabel',index: 24 },
  { key: 'hoaLabel',        index: 28 },
  { key: 'descriptionLabel',index: 21 },
  { key: 'waterLabel',      index: 14 },
  { key: 'electricityLabel',index: 16 },
  { key: 'sewerLabel',      index: 18 },
]

export default function PropertyDetailPage() {
  const { t } = useTranslation()
  const { numero } = useParams<{ numero: string }>()
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)

  const [row, setRow] = useState<PropertyRow | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<number, string>>({})

  // índices usados
  const purchaseDateIdx = 1
  const addressIdx      = 5
  const countyIdx       = 6
  const stateIdx        = 7
  const acresIdx        = 9
  const saleDateIdx     = 34
  const agingIdx        = 14
  const saleValueIdx    = 50
  const profitIdx       = 51
  const photoIdx        = 33
  const entradaIndex    = 56
  const parcelaQtdIdx   = 57
  const parcelaValIdx   = 58

  // remove classes para impressão
  const stripClasses = (el: HTMLElement) => {
    el.removeAttribute('class')
    Array.from(el.children).forEach((c) =>
      c instanceof HTMLElement && stripClasses(c)
    )
  }

  // carrega dados da API
  useEffect(() => {
    if (!numero) return
    ;(async () => {
      try {
        const res = await fetch('/api/propriedades', { cache: 'no-store' })
        const body = (await res.json()) as { ok: boolean; rows?: PropertyRow[] }
        if (!body.ok) return
        const content = body.rows?.slice(1) || []
        const found = content.find((r) => r[2] === numero) || null
        setRow(found)
        if (found) {
          setPreviewUrl(found[photoIdx])
          const initial: Record<number, string> = {}
          camposParaExibir.forEach((c) => {
            initial[c.index] = found[c.index] || ''
          })
          initial[entradaIndex] = found[entradaIndex] || ''
          initial[parcelaQtdIdx] = found[parcelaQtdIdx] || ''
          initial[parcelaValIdx] = found[parcelaValIdx] || ''
          setEditValues(initial)
        }
      } catch (err) {
        console.error(err)
      }
    })()
  }, [numero])

  if (!row) {
    return <p className="p-6 text-white">{t('loading')}</p>
  }

  const saleDateRaw = (row[saleDateIdx] || '').trim()
  const isSold = Boolean(saleDateRaw)
  const statusLabel = isSold ? t('statusVendido') : t('statusPendente')

  const handleChangeField = (i: number, v: string) =>
    setEditValues((prev) => ({ ...prev, [i]: v }))

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setImageFile(f)
    if (f) setPreviewUrl(URL.createObjectURL(f))
  }

  const handleSave = async () => {
    // upload de foto
    if (imageFile) {
      const form = new FormData()
      form.append('numero', numero as string)
      form.append('foto', imageFile)
      const resFoto = await fetch('/api/propriedades/upload-foto', {
        method: 'POST',
        body: form,
      })
      const bodyFoto = await resFoto.json()
      if (!bodyFoto.ok) {
        alert(`${t('photoUploadError')}: ${bodyFoto.message}`)
        return
      }
      row[photoIdx] = bodyFoto.url
      setPreviewUrl(bodyFoto.url)
    }
    // update campos editáveis
    const res = await fetch('/api/propriedades/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero, updates: editValues }),
    })
    const result = await res.json()
    if (!result.ok) {
      alert(`${t('saveError')}: ${result.message}`)
      return
    }
    setIsEditing(false)
    router.refresh()
  }

  const printCard = () => {
    if (!cardRef.current) return
    const clone = cardRef.current.cloneNode(true) as HTMLElement
    stripClasses(clone)
    const html = `
      <html>
        <head>
          <title>${t('print')}</title>
          <style>
            @media print {
              body * { visibility: hidden !important; }
              #to-print, #to-print * { visibility: visible !important; }
              #to-print { position: absolute; top:0; left:0; }
            }
          </style>
        </head>
        <body style="margin:0;padding:0;">
          <div id="to-print">${clone.outerHTML}</div>
        </body>
      </html>`
    const win = window.open('', '_blank', 'width=800,height=600')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.onload = () => {
      win.print()
      win.close()
    }
  }

  return (
    <div className="min-h-screen bg-[#1F1F1F] px-4 py-6">
      <div
        ref={cardRef}
        className="relative bg-[#2C2C2C] rounded-2xl p-6 shadow-lg max-w-3xl mx-auto flex flex-col h-full"
      >
        {/* Título e status */}
        <h1 className="text-2xl sm:text-3xl font-bold text-[#D4AF37] border-b border-[#D4AF37] pb-2 mb-4">
          {`${t('property')} #${numero}`}
        </h1>
        <span
          className={`absolute top-6 right-6 px-2 py-1 rounded-full text-xs font-bold ${
            isSold ? 'bg-green-400 text-black' : 'bg-red-500 text-white'
          }`}
        >
          {statusLabel}
        </span>

        {/* Bloco principal: informações + imagem/link */}
        <div className="mt-6 flex flex-col lg:flex-row lg:items-start lg:space-x-6">
          {/* Informações */}
          <div className="space-y-4 text-white lg:w-1/2">
            {isSold ? (
              <>
                <div className="flex items-center">
                  <span className="w-36 font-medium">{t('propertyNumber')}:</span>
                  <span className="ml-2">{numero}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-36 font-medium">{t('boughtOn')}:</span>
                  <span className="ml-2">{row[purchaseDateIdx] || '—'}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-36 font-medium">{t('addressLabel')}:</span>
                  <span className="ml-2">{row[addressIdx] || '—'}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-36 font-medium">{t('countyLabel')}:</span>
                  <span className="ml-2">{row[countyIdx] || '—'}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-36 font-medium">{t('stateLabel')}:</span>
                  <span className="ml-2">{row[stateIdx] || '—'}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-36 font-medium">{t('acresLabel')}:</span>
                  <span className="ml-2">{row[acresIdx] || '—'}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-36 font-medium">{t('saleDate')}:</span>
                  <span className="ml-2">{row[saleDateIdx] || '—'}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-36 font-medium">{t('aging')}:</span>
                  <span className="ml-2">{row[agingIdx] || '—'}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-36 font-medium">{t('saleValue')}:</span>
                  <span className="ml-2">{row[saleValueIdx] || '—'}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-36 font-medium">{t('profit')}:</span>
                  <span className="ml-2">{row[profitIdx] || '—'}</span>
                </div>
              </>
            ) : (
              camposParaExibir.map(({ key, index }) => (
                <div key={index} className="flex items-center">
                  <span className="w-36 font-medium">{t(key)}:</span>
                  <span className="ml-2 break-words">{row[index] || '—'}</span>
                </div>
              ))
            )}
          </div>

          {/* Imagem / Link / (botão alinhado à esquerda) */}
          <div className="mt-6 flex flex-col items-start lg:mt-0 lg:w-1/2">
            {previewUrl && (
              <img
                src={previewUrl}
                alt={t('photoAlt')}
                className="w-full h-auto max-h-60 object-cover rounded-lg mb-4"
              />
            )}

            {isEditing ? (
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mb-4 w-full sm:w-auto text-white text-sm"
              />
            ) : (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  row[24]
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-4 bg-[#D4AF37] text-black px-4 py-2 text-sm rounded-lg font-medium hover:bg-[#D4AF37]/90 transition"
              >
                {t('viewOnMap')}
              </a>
            )}

            {/* Condições de pagamento apenas para pendentes */}
            {!isSold && (
              <div className="w-full bg-[#1F1F1F] border border-gray-700 rounded-2xl p-4 text-white">
                <h2 className="text-center text-lg font-semibold mb-2">
                  {t('paymentConditions')}
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">{t('downPayment')}</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editValues[entradaIndex]}
                        onChange={(e) =>
                          handleChangeField(entradaIndex, e.target.value)
                        }
                        className="w-20 bg-black border border-gray-600 px-1 py-1 rounded text-white text-sm text-right"
                      />
                    ) : (
                      <span>{row[entradaIndex] || '—'}</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">{t('installments')}</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editValues[parcelaQtdIdx]}
                        onChange={(e) =>
                          handleChangeField(parcelaQtdIdx, e.target.value)
                        }
                        className="w-20 bg-black border border-gray-600 px-1 py-1 rounded text-white text-sm text-right"
                      />
                    ) : (
                      <span>
                        {row[parcelaQtdIdx] || '—'} {t('times')}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">{t('installmentValue')}</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editValues[parcelaValIdx]}
                        onChange={(e) =>
                          handleChangeField(parcelaValIdx, e.target.value)
                        }
                        className="w-20 bg-black border border-gray-600 px-1 py-1 rounded text-white text-sm text-right"
                      />
                    ) : (
                      <span>{row[parcelaValIdx] || '—'}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botões de ação */}
        <div className="mt-6 flex justify-end space-x-2">
          <button
            onClick={() => router.back()}
            className="bg-[#D4AF37] text-black px-3 py-2 rounded-lg font-medium hover:bg-[#D4AF37]/90 text-sm"
          >
            ← {t('back')}
          </button>
          <button
            onClick={printCard}
            className="bg-blue-500 text-white px-3 py-2 rounded-lg font-medium hover:bg-blue-600 text-sm"
          >
            {t('print')}
          </button>
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="bg-green-500 text-white px-3 py-2 rounded-lg font-medium hover:bg-green-600 text-sm"
              >
                {t('save')}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-gray-700 text-sm"
              >
                {t('cancel')}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-[#D4AF37] text-black px-3 py-2 rounded-lg font-medium hover:bg-[#D4AF37]/90 text-sm"
            >
              {t('edit')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
