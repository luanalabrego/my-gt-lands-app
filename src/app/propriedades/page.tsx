'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLanguage } from '../../context/LanguageContext'
import { useTranslation } from '../../hooks/useTranslation'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { ChevronDown, ChevronUp, ClipboardCopy, Printer } from 'lucide-react'

type PropertyRow = string[]

export default function PropriedadesPage() {
  const [showFilters, setShowFilters] = useState(false)
  const [data, setData] = useState<PropertyRow[]>([])
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const [dateFromObj, setDateFromObj] = useState<Date | null>(null)
  const [dateToObj, setDateToObj]   = useState<Date | null>(null)

  // idioma e função de tradução
  const { lang, setLang } = useLanguage()
  const { t } = useTranslation()

  // filtros
  const [searchTerm, setSearchTerm]         = useState('')
  const [selectedState, setSelectedState]   = useState('')
  const [selectedCounty, setSelectedCounty] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'sold' | 'pending' | 'available' | 'blocked'>('all')
  const [dateFrom, setDateFrom]             = useState('')
  const [dateTo, setDateTo]                 = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [printMode, setPrintMode] = useState(false)


  // índice da coluna de data de venda (AI) = 34 (0-based)
  const saleDateIndex = 34

  useEffect(() => {
    console.log('[PropriedadesPage] iniciando fetch de /api/propriedades')
    ;(async () => {
      try {
        const res = await fetch('/api/propriedades', { cache: 'no-store' })
        console.log('[PropriedadesPage] status da resposta:', res.status)
        const body = await res.json() as {
          ok: boolean
          rows?: PropertyRow[]
          error?: string
          message?: string
        }
        console.log('[PropriedadesPage] body recebido:', body)
  
        if (!body.ok) {
          console.error('[PropriedadesPage] API retornou erro:', body.error, body.message)
          return
        }
  
        const allRows = body.rows || []
        console.log('[PropriedadesPage] rows totais:', allRows.length)
  
        if (allRows.length > 0) {
          setHeaders(allRows[0])
          const contentRows = allRows.slice(1)
          console.log('[PropriedadesPage] rows de conteúdo:', contentRows.length)
          setData(contentRows)
        }
      } catch (err) {
        console.error('[PropriedadesPage] falha no fetch:', err)
      }
    })()
  }, [])
  

  const validRows = data.filter(r => r[2]?.trim() !== '')
  const states    = Array.from(new Set(validRows.map(r => r[7]).filter(Boolean)))
  const counties  = Array.from(new Set(validRows.map(r => r[6]).filter(Boolean)))

  const filtered = validRows.filter(r => {
    const address      = r[5] || ''
    const numero       = r[2] || ''
    const state        = r[7] || ''
    const county       = r[6] || ''
    const purchaseDate = new Date(r[1] || '')
    const saleDateRaw  = (r[saleDateIndex] || '').toString().trim()
    const sold         = saleDateRaw !== ''
    

    if (searchTerm) {
      if (/^\d+$/.test(searchTerm)) {
        if (numero !== searchTerm) return false
      } else {
        if (!address.toLowerCase().includes(searchTerm.toLowerCase())) return false
      }
    }
    if (selectedState && state !== selectedState) return false
    if (selectedCounty && county !== selectedCounty) return false
    if (statusFilter === 'sold' && !sold) return false
    if (statusFilter === 'pending' && sold) return false
    if (statusFilter === 'available' && sold) return false
    if (statusFilter === 'blocked' && r[60] !== 'Sim') return false


    if (dateFrom) {
      const from = new Date(dateFrom)
      from.setHours(0,0,0,0)
      if (purchaseDate < from) return false
    }
    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23,59,59,999)
      if (purchaseDate > to) return false
    }

    return true
  })

  return (
    <div className="min-h-screen bg-[#1F1F1F] px-4 py-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between mb-6 print-hidden">
        <h1 className="text-3xl font-semibold text-white mb-4 md:mb-0">
          {t('properties')}
        </h1>
        <div className="flex space-x-2">
    {/* Botão Imprimir Tudo */}
<button
  onClick={async () => {
    // 1) ativa o modo de detalhes para impressão
    setPrintMode(true)
    // 2) espera o React montar o container de detalhes
    await new Promise(res => setTimeout(res, 100))

    // 3) aguarda todas as imagens dentro de .print-container carregarem
    const imgs = Array.from(document.querySelectorAll('.print-container img'))
    await Promise.all(
      imgs.map(img =>
        new Promise<void>(res => {
          if ((img as HTMLImageElement).complete) return res()
          img.addEventListener('load', () => res(), { once: true })
        })
      )
    )

    // 4) dispara a impressão
    window.print()
    // 5) volta ao modo normal
    setPrintMode(false)
  }}
  className="flex items-center gap-2 bg-[#2C2C2C] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#2C2C2C]/90 transition"
  title={t('printAll')}
>
  <Printer size={16} />
  {t('printAll')}
</button>


          {/* Botão Nova Propriedade */}
          <Link
            href="/propriedades/new"
            className="bg-[#D4AF37] text-black border border-[#D4AF37] px-4 py-2 rounded-lg font-medium hover:bg-[#D4AF37]/90 transition"
          >
            {t('newProperty')}
          </Link>
        </div>
      </div>

      {/* Botão “Filtro” mobile */}
      <div className="flex items-center justify-between mb-4 md:hidden print-hidden">
        <button
          onClick={() => setShowFilters(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-[#2C2C2C] rounded-lg text-white"
        >
          {t('filter')}
          {showFilters ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </button>
      </div>

      {/* Contêiner de filtros completo */}
      <div
  className={`
    ${showFilters ? 'flex flex-wrap gap-4 mb-6' : 'hidden'}
    md:flex flex-wrap gap-4 mb-6
    print-hidden
  `}
>
        {/* Busca */}
        <input
          type="text"
          placeholder={t('placeholder')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 rounded-lg bg-black border border-gray-600 text-white focus:outline-none focus:border-gold"
        />

        {/* Estado */}
        <select
          value={selectedState}
          onChange={e => setSelectedState(e.target.value)}
          className="px-4 py-2 rounded-lg bg-black border border-gray-600 text-white focus:outline-none focus:border-gold"
        >
          <option value="">{t('allStates')}</option>
          {states.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Condado */}
        <select
          value={selectedCounty}
          onChange={e => setSelectedCounty(e.target.value)}
          className="px-4 py-2 rounded-lg bg-black border border-gray-600 text-white focus:outline-none focus:border-gold"
        >
          <option value="">{t('allCounties')}</option>
          {counties.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="px-4 py-2 rounded-lg bg-black border border-gray-600 text-white focus:outline-none focus:border-gold"
        >
          <option value="all">{t('allStatus')}</option>
          <option value="sold">{t('sold')}</option>
          <option value="pending">{t('pending')}</option>
          <option value="available">{t('available')}</option>
          <option value="blocked">{t('blocked')}</option>
        </select>

        {/* DatePickers */}
        <div className="flex flex-col sm:flex-row sm:space-x-2 mb-4">
          {/* De */}
          <div className="w-28 sm:w-auto">
            <DatePicker
              selected={dateFromObj}
              onChange={d => {
                setDateFromObj(d)
                setDateFrom(d ? d.toISOString().slice(0, 10) : '')
              }}
              placeholderText={t('fromDate')}
              dateFormat="yyyy-MM-dd"
              wrapperClassName="w-full"
              className="w-full px-2 py-1 rounded-lg bg-black border border-gray-600 text-white text-xs sm:text-sm focus:outline-none focus:border-gold"
            />
          </div>

          {/* Até */}
          <div className="w-28 sm:w-auto mt-2 sm:mt-0">
            <DatePicker
              selected={dateToObj}
              onChange={d => {
                setDateToObj(d)
                setDateTo(d ? d.toISOString().slice(0, 10) : '')
              }}
              placeholderText={t('toDate')}
              dateFormat="yyyy-MM-dd"
              wrapperClassName="w-full"
              className="w-full px-2 py-1 rounded-lg bg-black border border-gray-600 text-white text-xs sm:text-sm focus:outline-none focus:border-gold"
            />
          </div>
        </div>
      </div>

      {/* Botões de visualização */}
      <div className="flex mb-6 space-x-2 print-hidden">
        <button
          onClick={() => setViewMode('card')}
          className={`px-3 py-1 rounded-lg font-medium ${
            viewMode === 'card'
              ? 'bg-[#D4AF37] text-black'
              : 'bg-gray-dark text-white'
          }`}
        >
          {t('cards')}
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`px-3 py-1 rounded-lg font-medium ${
            viewMode === 'list'
              ? 'bg-[#D4AF37] text-black'
              : 'bg-gray-dark text-white'
          }`}
        >
          {t('list')}
        </button>
      </div>

      {/* Renderização em Cards */}
{viewMode === 'card' && !printMode && (
  // modo normal: mostra só os cards resumidos
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {filtered.map((r, i) => {
      const dataCompra   = r[1]
      const numero       = r[2]
      const parcelNumber = r[4]
      const endereco     = r[5]
      const condado      = r[6]
      const estado       = r[7]
      const acres        = r[9]
      const saleDateRaw  = (r[saleDateIndex] || '').trim()
// ⬇ bloco de status dinâmico / bloqueio ⬇
const blockedFlag = r[60] === 'Sim'           // coluna BI
const rawStatus   = (r[61] || '').trim()      // coluna BJ

const statusLabel = blockedFlag
  ? t('blocked')
  : rawStatus
    ? rawStatus
    : saleDateRaw
      ? t('statusVendido')
      : t('statusDisponível')

const statusColor = blockedFlag
  ? 'bg-gray-500 text-white'
  : saleDateRaw
    ? 'bg-red-500 text-white'
    : 'bg-green-400 text-black'
// ⬆ fim do bloco ⬆


      const copyParcel  = () => navigator.clipboard.writeText(parcelNumber)
      const copyAddress = () => navigator.clipboard.writeText(endereco)

      return (
        <div
          key={i}
          className="bg-[#2C2C2C] rounded-2xl p-6 shadow-lg flex flex-col justify-between"
        >
          <div className="space-y-2">
            {/* Número do pedido */}
            <h2 className="text-xl font-bold text-white">
              <span className="text-[#D4AF37]">#{numero}</span>
            </h2>

            {/* Endereço + copiar */}
            <h3 className="text-white flex items-center">
              {endereco}
              <button onClick={copyAddress} className="ml-2" title="Copiar endereço">
                <ClipboardCopy size={18} className="text-gray-400 hover:text-white transition-colors" />
              </button>
            </h3>

            {/* Condado, estado */}
            <p className="text-gray-300 text-sm">{condado}, {estado}</p>

            {/* Parcel + copiar */}
            <div className="flex items-center space-x-2 text-gray-300 text-sm">
              <span>Parcel: {parcelNumber}</span>
              <button onClick={copyParcel} title="Copiar parcel">
                <ClipboardCopy size={18} className="text-gray-400 hover:text-white transition-colors" />
              </button>
            </div>

            {/* Acres */}
            <p className="text-gray-300 text-sm">Acres: {acres}</p>
          </div>

         {/* Rodapé atualizado */}
<div className="mt-4 flex items-center justify-between">
  <span className="text-gray-500 text-xs">
    {t('boughtOn')} {dataCompra}
  </span>
  <div className="flex items-center space-x-2">
    {/* badge dinâmica */}
    <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColor}`}>
      {statusLabel}
    </span>
    {/* link de ações */}
    <Link
      href={`/propriedades/${numero}`}
      className="bg-[#D4AF37] text-black border border-[#D4AF37] px-3 py-1 rounded-lg text-sm font-medium hover:bg-[#D4AF37]/90 transition"
    >
      {t('actions')}
    </Link>
    {/* botão bloquear/desbloquear */}
    <button
      onClick={async () => {
        const res = await fetch('/api/propriedades', {
          method: 'POST',
          body: JSON.stringify({ rowIndex: i, blocked: !blockedFlag }),
        })
        if (res.ok) {
          setData(prev => {
            const next = [...prev]
            next[i][60] = blockedFlag ? '' : 'Sim'
            return next
          })
        }
      }}
      className="ml-2 text-sm underline"
    >
      { blockedFlag ? t('unblock') : t('block') }
    </button>
  </div>
</div>
        </div>
    )})}
  </div>
)}

{viewMode === 'card' && printMode && (
  // modo printMode: imprime detalhes completos de cada propriedade
  <div className="print-container space-y-8">
    {filtered.map(r => {
      const numero      = r[2]
      const saleDateRaw = (r[saleDateIndex] || '').trim()
      const isSold      = Boolean(saleDateRaw)
      const statusLabel = isSold ? t('statusVendido') : t('statusDisponível')

      const sections = [
        { title: t('sectionPropertyInfo'), indices: [4,5,6,7,24,21] },
        { title: t('sectionSize'),         indices: [8,9,12,23] },
        { title: t('sectionZoning'),       indices: [10,11,22] },
        { title: t('sectionTax'),          indices: [13] },
        { title: t('sectionUtilities'),    indices: [14,15,16,17,18,19] },
        { title: t('sectionFlood'),        indices: [20] },
        { title: t('sectionHOA'),          indices: [26,27,28,29] },
      ]

      return (
        <div key={numero} className="bg-[#2C2C2C] rounded-2xl p-6 shadow-lg">
          <h1 className="text-2xl font-bold text-[#D4AF37] mb-4">
            {t('property')} #{numero}
          </h1>
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
            isSold ? 'bg-red-500 text-white' : 'bg-green-400 text-black'
          }`}>
            {statusLabel}
          </span>

          {sections.map(({ title, indices }) => (
            <section key={title} className="mt-6">
              <h2 className="text-lg font-bold text-[#D4AF37] mb-2">{title}</h2>
              <div className="flex flex-wrap gap-4 text-white">
                {indices.map(idx => (
                  <div key={idx} className="flex space-x-1">
                    <span className="font-medium text-gray-300 whitespace-nowrap">
                      {headers[idx] || `Col ${idx}`}:
                    </span>
                    <span className="break-words">{r[idx] || '—'}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* Imagem */}
          {r[33] && (
            <img
              src={r[33]}
              alt={t('photoAlt')}
              className="w-full object-cover rounded-lg mt-6"
            />
          )}

          {/* Venda da Propriedade */}
          <section className="mt-6">
            <h2 className="text-lg font-semibold text-white border-b border-gray-600 pb-1 mb-4">
              {t('sectionSaleValue')}
            </h2>
            <div className="flex items-start space-x-2 text-white">
              <span className="font-medium text-gray-300 whitespace-nowrap">
                {headers[50]}:
              </span>
              <span>{r[50] || '—'}</span>
            </div>
          </section>

          {/* Condições de Pagamento */}
          <section className="mt-6">
            <h2 className="text-lg font-semibold text-white border-b border-gray-600 pb-1 mb-4">
              {t('sectionPaymentTerms')}
            </h2>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-white">
              {[56,57,58].map(idx => (
                <div key={idx} className="flex items-start space-x-1">
                  <span className="font-medium text-gray-300 whitespace-nowrap">
                    {headers[idx]}:
                  </span>
                  <span className="break-words">{r[idx] || '—'}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
    )})}
  </div>
)}


      {/* Renderização em Lista */}
      {viewMode === 'list' && (
        <div className="overflow-x-auto bg-[#2C2C2C] rounded-2xl shadow-lg">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-dark">
              <tr>
                {[t('boughtOn'), t('nrLabel'), t('parcelLabel'), t('addressLabel'),
                  t('countyLabel'), t('stateLabel'), t('descriptionLabel'),
                  t('acresLabel'), t('measuresLabel'), t('sold')]
                  .map((h, j) => (
                    <th key={j} className="px-4 py-2 text-left text-sm font-medium text-gray-300">
                      {h}
                    </th>
                  ))
                }
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filtered.map((r, i) => {
                const saleDateRaw = (r[saleDateIndex] || '').trim()
                const blockedFlag = r[60] === 'Sim'
const rawStatus   = (r[61] || '').trim()

const statusLabel = blockedFlag
  ? t('blocked')
  : rawStatus
    ? rawStatus
    : saleDateRaw
      ? t('statusVendido')
      : t('statusDisponível')

const statusColor = blockedFlag
  ? 'text-gray-500'
  : saleDateRaw
    ? 'text-red-500'
    : 'text-green-400'

                return (
                  <tr key={i}>
                    <td className="px-4 py-2 text-sm text-white">{r[1]}</td>
                    <td className="px-4 py-2 text-sm text-white">{r[2]}</td>
                    <td className="px-4 py-2 text-sm text-white">{r[4]}</td>
                    <td className="px-4 py-2 text-sm text-white">{r[5]}</td>
                    <td className="px-4 py-2 text-sm text-white">{r[6]}</td>
                    <td className="px-4 py-2 text-sm text-white">{r[7]}</td>
                    <td className="px-4 py-2 text-sm text-white">{r[21]}</td>
                    <td className="px-4 py-2 text-sm text-white">{r[9]}</td>
                    <td className="px-4 py-2 text-sm text-white">{r[12]}</td>
                    <td className="px-4 py-2 text-sm">
  <span className={statusColor}>
    {statusLabel}
  </span>
</td>

                    <td className="px-4 py-2">
                      <Link
                        href={`/propriedades/${r[2]}`}
                        className="bg-[#D4AF37] text-black border border-[#D4AF37] px-3 py-1 rounded-lg text-sm font-medium hover:bg-[#D4AF37]/90 transition"
                      >
                        {t('actions')}
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}