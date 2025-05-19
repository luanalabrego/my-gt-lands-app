'use client';

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from '../../../hooks/useTranslation'

type PropertyRow = string[]

export default function PropertyDetailPage() {
  const { t } = useTranslation()
  const { numero } = useParams<{ numero: string }>()
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)

  const [headers, setHeaders] = useState<string[]>([])
  const [row, setRow] = useState<PropertyRow | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<number, string>>({})

  // índices fixos
  const saleDateIdx   = 34
  const photoIdx      = 33
  const entradaIdx    = 56
  const parcelaQtdIdx = 57
  const parcelaValIdx = 58

  useEffect(() => {
    if (!numero) return
    ;(async () => {
      try {
        const res = await fetch('/api/propriedades', { cache: 'no-store' })
        const body = (await res.json()) as { ok: boolean; rows?: PropertyRow[] }
        if (!body.ok) return

        const allRows = body.rows || []
        if (allRows.length === 0) return

        // primeiramente guardamos o cabeçalho
        setHeaders(allRows[0])

        // depois procuramos a linha pelo número
        const content = allRows.slice(1)
        const found = content.find(r => r[2] === numero) || null
        setRow(found)

        if (found) {
          setPreviewUrl(found[photoIdx])
          // inicializamos editValues com todos os valores atuais
          const initial: Record<number, string> = {}
          found.forEach((cell, idx) => {
            initial[idx] = cell
          })
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
  const isSold      = Boolean(saleDateRaw)

  const statusLabel = isSold
    ? t('statusVendido')
    : t('statusDisponivel')

  const handleChangeField = (i: number, v: string) =>
    setEditValues(prev => ({ ...prev, [i]: v }))

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setImageFile(f)
    if (f) setPreviewUrl(URL.createObjectURL(f))
  }

  const handleSave = async () => {
    // upload de foto, se tiver
    if (imageFile) {
      const form = new FormData()
      form.append('numero', numero!)
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

    // enviamos todos os campos editados
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

  const stripClasses = (el: HTMLElement) => {
    el.removeAttribute('class')
    Array.from(el.children).forEach(c =>
      c instanceof HTMLElement && stripClasses(c)
    )
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
        className="relative bg-[#2C2C2C] rounded-2xl p-6 shadow-lg max-w-3xl mx-auto flex flex-col"
      >
        {/* Título e status */}
        <h1 className="text-2xl sm:text-3xl font-bold text-[#D4AF37] border-b border-[#D4AF37] pb-2 mb-4">
          {t('property')} #{numero}
        </h1>
        <span
          className={`absolute top-6 right-6 px-2 py-1 rounded-full text-xs font-bold ${
            isSold ? 'bg-red-500 text-white' : 'bg-green-400 text-black'
          }`}
        >
          {statusLabel}
        </span>

        {/* Informações dinâmicas */}
        <div className="mt-6 flex flex-col lg:flex-row lg:space-x-6">
          <div className="space-y-3 text-white lg:w-1/2">
            {row.map((cell, idx) => (
              <div key={idx} className="flex items-center">
                <span className="w-36 font-medium text-gray-300">
                  {headers[idx] || `Col ${idx}`}:
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editValues[idx] || ''}
                    onChange={e => handleChangeField(idx, e.target.value)}
                    className="ml-2 flex-1 bg-black border border-gray-600 px-2 py-1 rounded text-white text-sm"
                  />
                ) : (
                  <span className="ml-2 break-words">{cell || '—'}</span>
                )}
              </div>
            ))}
          </div>

          {/* Imagem / Ações */}
          <div className="mt-6 lg:mt-0 lg:w-1/2 flex flex-col items-end">
            {previewUrl && (
              <img
                src={previewUrl}
                alt={t('photoAlt')}
                className="w-full max-h-60 object-cover rounded-lg mb-4"
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
              <button
                onClick={() => printCard()}
                className="self-end bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#D4AF37]/90 transition text-sm"
              >
                {t('print')}
              </button>
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
