'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from '../../../hooks/useTranslation'  // path corrigido

type PropertyRow = string[]

// campos editáveis, agora usando chaves de tradução
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
  const [editValues, setEditValues] = useState<Record<number,string>>({})

  // índices extras
  const saleDateIndex = 34
  const fotoIndex     = 33
  const entradaIndex  = 56
  const parcelaQtdIdx = 57
  const parcelaValIdx = 58

  // limpa classes para impressão
  const stripClasses = (el: HTMLElement) => {
    el.removeAttribute('class')
    Array.from(el.children).forEach(c =>
      c instanceof HTMLElement && stripClasses(c)
    )
  }

  useEffect(() => {
    if (!numero) return

    ;(async () => {
      try {
        const res = await fetch('/api/propriedades', { cache: 'no-store' })
        const body = await res.json() as {
          ok: boolean
          rows?: PropertyRow[]
          error?: string
          message?: string
        }
        if (!body.ok) return
        const allRows = body.rows || []
        const contentRows = allRows.length > 1 ? allRows.slice(1) : []
        const found = contentRows.find(r => r[2] === numero) || null
        setRow(found)
        if (found) {
          setPreviewUrl(found[fotoIndex])
          const initial: Record<number,string> = {}
          camposParaExibir.forEach(c => {
            initial[c.index] = found[c.index] || ''
          })
          initial[entradaIndex]  = found[entradaIndex]  || ''
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

  const saleDateRaw = (row[saleDateIndex] || '').trim()
  const statusLabel = saleDateRaw
    ? t('statusVendido')
    : t('statusPendente')

  const handleChangeField = (i: number, v: string) =>
    setEditValues(prev => ({ ...prev, [i]: v }))

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setImageFile(f)
    if (f) setPreviewUrl(URL.createObjectURL(f))
  }

  const handleSave = async () => {
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
      row[fotoIndex] = bodyFoto.url
      setPreviewUrl(bodyFoto.url)
    }

    const res = await fetch('/api/propriedades/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero, updates: editValues }),
    })
    const body = await res.json()
    if (!body.ok) {
      alert(`${t('saveError')}: ${body.message}`)
      return
    }

    setIsEditing(false)
    router.refresh()
  }

  const printCard = () => {
    if (!cardRef.current) return
    const clone = cardRef.current.cloneNode(true) as HTMLElement
    stripClasses(clone)
    const html = `<html><head><title>${t('print')}</title><style>
      @media print {
        body * { visibility: hidden !important; }         
        #to-print, #to-print * { visibility: visible !important; }         
        #to-print { position: absolute; top:0; left:0; }
      }       
    </style></head><body style="margin:0;padding:0;">
      <div id="to-print">${clone.outerHTML}</div>
    </body></html>`
    const win = window.open('', '_blank', 'width=800,height=600')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.onload = () => { win.print(); win.close() }
  }

  return (
    <div className="min-h-screen bg-[#1F1F1F] px-4 py-6">
      <div
        ref={cardRef}
        className="relative bg-[#2C2C2C] rounded-2xl p-6 shadow-lg max-w-3xl mx-auto flex flex-col h-full"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-[#D4AF37] border-b border-[#D4AF37] pb-2 mb-4">
          {`${t('property')} #${numero}`}
        </h1>
        <span className={`absolute top-6 right-6 px-2 py-1 rounded-full text-xs font-bold ${
          saleDateRaw ? 'bg-green-400 text-black' : 'bg-red-500 text-white'
        }`}>
          {statusLabel}
        </span>

        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Campos de texto */}
          <div className="space-y-3 text-white">
            {camposParaExibir.map(({ key, index }) => (
              <div
                key={index}
                className="flex items-center min-w-0"
              >
                <span className="w-28 flex-shrink-0 font-medium">{t(key)}:</span>
                {isEditing && index === 1 ? (
                  <input
                    type="date"
                    value={editValues[index]}
                    onChange={e => handleChangeField(index, e.target.value)}
                    className="ml-2 flex-1 bg-black border border-gray-600 px-2 py-1 rounded text-white text-sm"
                  />
                ) : isEditing ? (
                  <input
                    type="text"
                    value={editValues[index]}
                    onChange={e => handleChangeField(index, e.target.value)}
                    className="ml-2 flex-1 bg-black border border-gray-600 px-2 py-1 rounded text-white text-sm"
                  />
                ) : (
                  <span className="ml-2 break-words">{row[index] || '—'}</span>
                )}
              </div>
            ))}
          </div>

          {/* Imagem e condições de pagamento */}
          <div className="flex flex-col items-center">
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
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(row[24])}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-4 w-full sm:w-auto bg-[#D4AF37] text-black px-4 py-2 text-sm rounded-lg font-medium text-center hover:bg-[#D4AF37]/90 transition"
              >
                {t('viewOnMap')}
              </a>
            )}
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
                      onChange={e => handleChangeField(entradaIndex, e.target.value)}
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
                      onChange={e => handleChangeField(parcelaQtdIdx, e.target.value)}
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
                      onChange={e => handleChangeField(parcelaValIdx, e.target.value)}
                      className="w-20 bg-black border border-gray-600 px-1 py-1 rounded text-white text-sm text-right"
                    />
                  ) : (
                    <span>{row[parcelaValIdx] || '—'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="mt-6 flex flex-col sm:flex-row justify-end items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <button
            onClick={() => router.back()}
            className="flex-1 sm:flex-none bg-[#D4AF37] text-black px-2 py-1 text-sm rounded-lg font-medium hover:bg-[#D4AF37]/90 text-center"
          >
            ← {t('back')}
          </button>
          <button
            onClick={printCard}
            className="flex-1 sm:flex-none bg-blue-500 text-white px-2 py-1 text-sm rounded-lg font-medium hover:bg-blue-600 text-center"
          >
            {t('print')}
          </button>
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="flex-1 sm:flex-none bg-green-500 text-white px-2 py-1 text-sm rounded-lg font-medium hover:bg-green-600 text-center"
              >
                {t('save')}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 sm:flex-none bg-gray-600 text-white px-2 py-1 text-sm rounded-lg font-medium hover:bg-gray-700 text-center"
              >
                {t('cancel')}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 sm:flex-none bg-[#D4AF37] text-black px-2 py-1 text-sm rounded-lg font-medium hover:bg-[#D4AF37]/90 text-center"
            >
              {t('edit')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
