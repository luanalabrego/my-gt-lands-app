'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/hooks/useTranslation'

type PropertyRow = string[]

// --- helpers de parse de datas ---
function parseUS(dateStr: string): Date {
  const [m, d, y] = dateStr.split(/[\/\-]/)
  return new Date(Number(y), Number(m) - 1, Number(d))
}
function parseBR(dateStr: string): Date {
  const [d, m, y] = dateStr.split('/')
  return new Date(Number(y), Number(m) - 1, Number(d))
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const [rows, setRows] = useState<PropertyRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/propriedades', { cache: 'no-store' })
        const body = (await res.json()) as { ok: boolean; rows?: PropertyRow[] }
        if (!body.ok) throw new Error(body.error || 'Erro na API')
        const all = body.rows || []
        const content = all.length > 1 ? all.slice(1) : []
        setRows(content.filter(r => r[2]?.toString().trim() !== ''))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1F1F1F] text-white flex items-center justify-center">
        {t('loading')}
      </div>
    )
  }

  // --- cálculos básicos ---
  const total = rows.length
  const soldRows    = rows.filter(r => Boolean(r[34]?.toString().trim()))
  const pendingRows = rows.filter(r => !r[34]?.toString().trim())

  // 1) Média do aging de estoque (pendentes)
  const daysInStock = pendingRows
    .map(r => {
      const str = r[1]?.toString().trim()
      if (!str) return NaN
      const dt = parseUS(str)
      return isNaN(dt.getTime())
        ? NaN
        : (Date.now() - dt.getTime()) / (1000 * 60 * 60 * 24)
    })
    .filter(v => !isNaN(v))
  const avgStockTime = daysInStock.length
    ? Math.round(daysInStock.reduce((a, b) => a + b, 0) / daysInStock.length)
    : 0

  // 2) Tempo médio de venda
  const soldDurations = soldRows
    .map(r => {
      const buyStr  = r[1]?.toString().trim()
      const sellStr = r[34]?.toString().trim()
      if (!buyStr || !sellStr) return NaN
      const buy  = parseUS(buyStr)
      const sell = parseBR(sellStr)
      if (isNaN(buy.getTime()) || isNaN(sell.getTime())) return NaN
      return (sell.getTime() - buy.getTime()) / (1000 * 60 * 60 * 24)
    })
    .filter(v => !isNaN(v))
  const avgSoldTime = soldDurations.length
    ? Math.round(soldDurations.reduce((a, b) => a + b, 0) / soldDurations.length)
    : 0

  // 3) Média de aging de mercado (coluna AP = índice 41)
  const marketAgingVals = rows
    .map(r => parseFloat(r[41]?.toString().replace(',', '.')) || 0)
    .filter(v => v > 0)
  const avgMarketAging = marketAgingVals.length
    ? Math.round(marketAgingVals.reduce((a, b) => a + b, 0) / marketAgingVals.length)
    : 0

  // 4) Valores monetários
  const totalInStock   = pendingRows.reduce((sum, r) => {
    const v = parseFloat(r[48]?.toString().replace(/[^0-9.-]+/g, '')) || 0
    return sum + v
  }, 0)
  const totalToReceive = soldRows.reduce((sum, r) => {
    const v = parseFloat(r[48]?.toString().replace(/[^0-9.-]+/g, '')) || 0
    return sum + v
  }, 0)

  // 5) Lucro total (coluna AZ = índice 51)
  const totalProfit = soldRows.reduce((sum, r) => {
    const v = parseFloat(r[51]?.toString().replace(/[^0-9.-]+/g, '')) || 0
    return sum + v
  }, 0)

  // --- ordem dos cards ---
  const cards = [
    { key: 'totalProps',     value: total },
    { key: 'soldProps',      value: soldRows.length },
    { key: 'pendingProps',   value: pendingRows.length },
    { key: 'avgMarketAging', value: `${avgMarketAging} ${t('days')}` },
    { key: 'avgSoldTime',    value: `${avgSoldTime} ${t('days')}` },
    { key: 'avgStockTime',   value: `${avgStockTime} ${t('days')}` },
    { key: 'totalInStock',   value: `U$ ${totalInStock.toLocaleString()}` },
    { key: 'totalToReceive', value: `U$ ${totalToReceive.toLocaleString()}` },
    { key: 'totalProfit',    value: `U$ ${totalProfit.toLocaleString()}` },
  ]

  return (
    <div className="min-h-screen bg-[#1F1F1F] text-white px-4 py-6">
      <h1 className="text-2xl sm:text-3xl font-semibold mb-8">
        {t('greeting')}, Gustavo
      </h1>

      {/* Grid de 3 colunas a partir de md */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-12">
        {cards.map(({ key, value }) => {
          const compact = ['totalProps','soldProps','pendingProps'].includes(key)
          return (
            <div
              key={key}
              className={`
                bg-[#2C2C2C] rounded-2xl shadow-lg flex flex-col justify-between
                ${compact ? 'p-3 sm:p-4' : 'p-4 sm:p-6'}
              `}
            >
              <span className="text-sm sm:text-base text-gray-300 mb-2">
                {t(key)}
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-gold">
                {value}
              </span>
            </div>
          )
        })}
      </div>

      <h2 className="text-xl sm:text-2xl font-semibold mb-4">
        {t('pendingHeading')}
      </h2>
      <div className="bg-[#2C2C2C] rounded-2xl p-4 sm:p-6 shadow-lg">
        {pendingRows.length > 0 ? (
          pendingRows.map((r, idx) => (
            <p key={idx} className="text-sm sm:text-base mb-2">
              {r[5]}
            </p>
          ))
        ) : (
          <p className="text-gray-400">{t('noPending')}</p>
        )}
      </div>
    </div>
  )
}
