'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/hooks/useTranslation'


type PropertyRow = string[]

type ApiResponse = {
  ok: boolean
  rows?: PropertyRow[]
  error?: string
  message?: string
}

// Parsers de data US e BR
function parseUS(dateStr: string): Date {
  const [m, d, y] = dateStr.split(/[\/\-]/)
  return new Date(+y, +m - 1, +d)
}
function parseBR(dateStr: string): Date {
  const [d, m, y] = dateStr.split('/')
  return new Date(+y, +m - 1, +d)
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const [rows, setRows] = useState<PropertyRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/propriedades', { cache: 'no-store' })
        const body = (await res.json()) as ApiResponse
        if (!body.ok) {
          console.error('[DashboardPage] API error:', body.error ?? body.message)
          setLoading(false)
          return
        }
        const all     = body.rows || []
        const content = all.length > 1 ? all.slice(1) : []
        setRows(content.filter(r => r[2]?.toString().trim() !== ''))
      } catch (err) {
        console.error('[DashboardPage] fetch failed:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-dark text-white flex items-center justify-center">
        {t('loading')}
      </div>
    )
  }

  // --- cálculos ---
  const total       = rows.length
  const soldRows    = rows.filter(r => Boolean(r[34]?.toString().trim()))
  const pendingRows = rows.filter(r => !r[34]?.toString().trim())

  // Média de dias em estoque (pendentes)
  const daysInStock = pendingRows
    .map(r => {
      const s = r[1]?.toString().trim()
      if (!s) return NaN
      const d = parseUS(s)
      return isNaN(d.getTime())
        ? NaN
        : (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)
    })
    .filter(v => !isNaN(v))
  const avgStockTime = daysInStock.length
    ? daysInStock.reduce((a, b) => a + b, 0) / daysInStock.length
    : 0

  // Média de tempo de venda
  const soldDurations = soldRows
    .map(r => {
      const b = r[1]?.toString().trim()
      const s = r[34]?.toString().trim()
      if (!b || !s) return NaN
      const d1 = parseUS(b)
      const d2 = parseBR(s)
      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return NaN
      return (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)
    })
    .filter(v => !isNaN(v))
  const avgSoldTime = soldDurations.length
    ? soldDurations.reduce((a, b) => a + b, 0) / soldDurations.length
    : 0

  // Média do aging de mercado
  const marketAgingVals = rows
    .map(r => parseFloat(r[41]?.toString().replace(',', '.')) || 0)
    .filter(v => v > 0)
  const avgMarketAging = marketAgingVals.length
    ? marketAgingVals.reduce((a, b) => a + b, 0) / marketAgingVals.length
    : 0

  // Financeiro
  const totalInStock = pendingRows.reduce((sum, r) => {
    const v = parseFloat(r[48]?.toString().replace(/[^0-9.-]+/g, '')) || 0
    return sum + v
  }, 0)
  const totalProfit = soldRows.reduce((sum, r) => {
    const v = parseFloat(r[51]?.toString().replace(/[^0-9.-]+/g, '')) || 0
    return sum + v
  }, 0)
  const roiVals = soldRows
    .map(r => parseFloat(r[52]?.toString().replace(',', '.')) || 0)
    .filter(v => !isNaN(v))
  const avgROI = roiVals.length
    ? roiVals.reduce((a, b) => a + b, 0) / roiVals.length
    : 0
  const avgROIFmt = avgROI.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  // Monta os cards
  const cards = [
    { key: 'totalProps',     value: total },
    { key: 'soldProps',      value: soldRows.length },
    { key: 'pendingProps',   value: pendingRows.length },
    { key: 'avgMarketAging', value: `${avgMarketAging.toFixed(0)} ${t('days')}` },
    { key: 'avgSoldTime',    value: `${avgSoldTime.toFixed(0)} ${t('days')}` },
    { key: 'avgStockTime',   value: `${avgStockTime.toFixed(0)} ${t('days')}` },
    { key: 'totalInStock',   value: `U$ ${totalInStock.toLocaleString('pt-BR')}` },
    { key: 'totalProfit',    value: `U$ ${totalProfit.toLocaleString('pt-BR')}` },
    { key: 'avgROI',         value: `${avgROIFmt}%` },
  ]

  const overviewKeys = ['totalProps','soldProps','pendingProps']
  const timeKeys     = ['avgSoldTime','avgStockTime']  // removemos avgMarketAging daqui
  const financeKeys  = ['totalInStock','totalProfit','avgROI']

  // Renderiza um card, aplicando cor só para soldTime e stockTime
  const renderCard = ({ key, value }: { key: string; value: string|number }) => {
    const isConditional = timeKeys.includes(key)
    const num           = parseFloat(value.toString())
    const color         = isConditional
      ? (num < avgMarketAging ? 'text-green-400' : 'text-red-400')
      : 'text-gold'

    return (
      <div
        key={key}
        className="bg-[#2C2C2C] rounded-2xl shadow-lg p-4 flex flex-col justify-between"
      >
        <span className="text-sm text-gray-300 mb-2">{t(key)}</span>
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-dark text-white px-4 py-6">
      {/* Saudação */}
      <h1 className="text-2xl sm:text-3xl font-semibold mb-8 text-gold">
        {t('greeting')}, Gustavo
      </h1>

      {/* Seções lado a lado em desktop */}
      <div className="flex flex-col space-y-12 md:flex-row md:space-y-0 md:space-x-8 mb-12">
        {/* Visão Geral */}
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-gold">
            {t('overviewHeading')}
          </h2>
          <div className="flex flex-col space-y-4">
            {cards.filter(c => overviewKeys.includes(c.key)).map(renderCard)}
          </div>
        </div>

        {/* Desempenho de Tempo */}
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-gold">
            {t('timeHeading')}
          </h2>
          <div className="flex flex-col space-y-4">
            {cards.filter(c => ['avgMarketAging', ...timeKeys].includes(c.key)).map(renderCard)}
          </div>
        </div>

        {/* Financeiro */}
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-gold">
            {t('financeHeading')}
          </h2>
          <div className="flex flex-col space-y-4">
            {cards.filter(c => financeKeys.includes(c.key)).map(renderCard)}
          </div>
        </div>
      </div>

      {/* Pendências (vazio) */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-gold">
          {t('pendingHeading')}
        </h2>
        <div className="bg-[#2C2C2C] rounded-2xl p-4 shadow-lg">
          {/* conteúdo a definir */}
        </div>
      </div>
    </div>
  )
}
