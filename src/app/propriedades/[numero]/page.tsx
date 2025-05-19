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

  // carrega dados
  useEffect(() => {
    if (!numero) return
    ;(async () => {
      try {
        const res = await fetch('/api/propriedades', { cache: 'no-store' })
        const body = (await res.json()) as { ok: boolean; rows?: PropertyRow[] }
        if (!body.ok) return
        const allRows = body.rows || []
        if (!allRows.length) return
        setHeaders(allRows[0])
        const content = allRows.slice(1)
        const found = content.find(r => r[2] === numero) || null
        setRow(found)
        if (found) {
          setPreviewUrl(found[photoIdx])
          const initial: Record<number, string> = {}
          found.forEach((cell, idx) => { initial[idx] = cell })
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
  const statusLabel = isSold ? t('statusVendido') : t('statusDisponível')

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
    if (!cardRef.current) return;
    // clona só o conteúdo que queremos imprimir
    const clone = cardRef.current.cloneNode(true) as HTMLElement;
  
    // abre a janela de print
    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) return;
  
    // monta o HTML incluindo TODO head atual
    const head = document.head.innerHTML;
    const html = `
      <!doctype html>
      <html>
        <head>
          ${head}
          <style>
            /* ajustes específicos para print */
            @page { margin: 10mm; }
            body { margin:0; padding:0; }
            #to-print { position: absolute; top:0; left:0; width:100%; }
            /* remova cantos arredondados e sombras */
            #to-print { border-radius: 0 !important; box-shadow: none !important; background: white !important; }
          </style>
        </head>
        <body>
          <div id="to-print">${clone.outerHTML}</div>
        </body>
      </html>`;
  
    win.document.open();
    win.document.write(html);
    win.document.close();
  
    // aguarda carregar CSS
    win.onload = () => {
      win.focus();
      win.print();
      win.close();
    };
  };
  

  // Definição de seções
  // dentro do seu componente
// defina as sessões com os índices corretos:
const sections = [
  {
    title: t('sectionPropertyInfo'),       // Parcel, Endereço, Condado, Estado
    indices: [ 4, 5,6,7,24,21],
  },
  {
    title: t('sectionSize'),               // Square Feet, Acres, Medidas do Lote, Minimum Lot Area
    indices: [8, 9, 12, 23],
  },
  {
    title: t('sectionZoning'),             // Zoning Code, Zoning type, Notes Zone
    indices: [10, 11, 22],
  },
  {
    title: t('sectionTax'),                // Property Tax
    indices: [13],
  },
  {
    title: t('sectionUtilities'),          // Água, Descrição Água, Luz, Descrição Luz, Esgoto, Descrição Esgoto
    indices: [14, 15, 16, 17, 18, 19],
  },
  {
    title: t('sectionFlood'),              // Flood Zone
    indices: [20],
  },
  
  {
    title: t('sectionHOA'),                // HOA, Nome do HOA, Valor (Hoa), Período (Hoa), Notas (Opcional)
    indices: [26, 27, 28, 29],
  },
];

  return (
    <div className="min-h-screen bg-[#1F1F1F] px-4 py-6">
      <div
        ref={cardRef}
        className="relative bg-[#2C2C2C] rounded-2xl p-6 shadow-lg max-w-3xl mx-auto flex flex-col"
      >
        {/* Título e status */}
        <h1 className="text-2xl sm:text-3xl font-bold text-[#D4AF37] border-b border-[#D4AF37] pb-2 mb-6">
          {t('property')} #{numero}
        </h1>
        <span
          className={`absolute top-6 right-6 px-2 py-1 rounded-full text-xs font-bold ${
            isSold ? 'bg-red-500 text-white' : 'bg-green-400 text-black'
          }`}
        >
          {statusLabel}
        </span>

        {/* Seções agrupadas */}
<div className="space-y-8">
  {sections.map(({ title, indices }) => (
    <section key={title}>
      <h2 className="text-lg font-bold text-[#D4AF37] border-b border-gray-600 pl-2 mb-4">
        {title}
      </h2>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-white">
                {indices.map(idx => (
          <div key={idx} className="flex items-start space-x-1">
            <span className="font-medium text-gray-300 flex-shrink-0 whitespace-nowrap">
              {headers[idx] || `Col ${idx}`}:
            </span>

            {isEditing ? (
              <input
                type="text"
                value={editValues[idx] || ''}
                onChange={e => handleChangeField(idx, e.target.value)}
                className="bg-black border border-gray-600 px-2 py-1 rounded text-white text-sm break-words"
              />
            ) : (
              <span className="text-white break-words">
                {row[idx] || '—'}
                </span>
            )}
          </div>
        ))}
      </div>
    </section>
  ))}
</div>


        {/* Imagem e ações */}
        <div className="mt-8 flex flex-col items-end">
          {previewUrl && (
            <img
              src={previewUrl}
              alt={t('photoAlt')}
              className="w-full max-h-60 object-cover rounded-lg mb-4"
            />
          )}
          
          {isEditing && (
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mb-4 w-full sm:w-auto text-white text-sm"
            />
          )}
        </div>

        {/* Venda da Propriedade & Condições de Pagamento */}
<div className="bg-black rounded-2xl p-6 shadow-lg mt-8">
  {/* Venda da Propriedade */}
  <section>
    <h2 className="text-lg font-semibold text-white border-b border-gray-600 pb-1 mb-4">
      {t('sectionSaleValue')}
    </h2>
    <div className="flex items-start space-x-2 text-white">
      <span className="font-medium text-gray-300 whitespace-nowrap">
        {headers[50]}:
      </span>
      <span className="break-words">
        {row[50] || '—'}
      </span>
    </div>
  </section>

  {/* Condições de Pagamento */}
  <section className="mt-6">
    <h2 className="text-lg font-semibold text-white border-b border-gray-600 pb-1 mb-4">
      {t('sectionPaymentTerms')}
    </h2>
    <div className="flex flex-wrap gap-x-6 gap-y-2 text-white">
      {[56, 57, 58].map(idx => (
        <div key={idx} className="flex items-start space-x-1">
          <span className="font-medium text-gray-300 whitespace-nowrap">
            {headers[idx]}:
          </span>
          <span className="break-words">
            {row[idx] || '—'}
          </span>
        </div>
      ))}
    </div>
  </section>
</div>


        {/* Botões de ação */}
        <div className="mt-6 flex justify-end space-x-2">
        {!isEditing && (
            <button
              onClick={printCard}
              className="self-end bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#D4AF37]/90 transition text-sm"
            >
              {t('print')}
            </button>
          )}
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
