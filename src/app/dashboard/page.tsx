'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/hooks/useTranslation'

type PropertyRow = string[]

// parse datas no formato BR “DD/MM/YYYY” ou ISO “YYYY-MM-DD”
function parseBRDate(s: string): Date {
  if (!s) return new Date('')
  const parts = s.split('/')
  if (parts.length === 3) {
    const [d, m, y] = parts
    return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
  }
  return new Date(s)
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
        if (!body.ok) return setLoading(false)

        const all = body.rows || []
        const content = all.length > 1 ? all.slice(1) : []
        const filtered = content.filter(r => r[2]?.toString().trim() !== '')
        setRows(filtered)
      } catch {
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

  const total = rows.length
  const soldRows = rows.filter(r => Boolean(r[34]?.toString().trim()))   // coluna AI: data de venda
  const pendingRows = rows.filter(r => !r[34]?.toString().trim())

  // aging pendentes (hoje - data compra em B=idx1)
  const today = new Date()
  const msInDay = 1000 * 60 * 60 * 24
  const daysInStock = pendingRows
    .map(r => {
      const buyDate = parseBRDate(r[1] || '')
      return isNaN(buyDate.getTime())
        ? null
        : (today.getTime() - buyDate.getTime()) / msInDay
    })
    .filter((d): d is number => d !== null)
  const avgDays = daysInStock.length
    ? Math.round(daysInStock.reduce((a, b) => a + b, 0) / daysInStock.length)
    : 0

  // valores totais
  const totalValue = pendingRows.reduce((sum, r) => {
    const v = parseFloat(r[48]?.toString().replace(/[^0-9.-]+/g, '')) || 0
    return sum + v
  }, 0)
  const totalReceive = soldRows.reduce((sum, r) => {
    const v = parseFloat(r[48]?.toString().replace(/[^0-9.-]+/g, '')) || 0
    return sum + v
  }, 0)

  // aging propriedades vendidas (coluna AG = idx32)
  const soldAgingValues = soldRows
    .map(r => parseFloat(r[32]?.toString().replace(/[^0-9.-]+/g, '')))
    .filter(v => !isNaN(v))
  const avgSoldAging = soldAgingValues.length
    ? Math.round(soldAgingValues.reduce((a, b) => a + b, 0) / soldAgingValues.length)
    : 0

  // média do aging de mercado (coluna AP = idx41)
  const marketAgingValues = rows
    .map(r => parseFloat(r[41]?.toString().replace(/[^0-9.-]+/g, '')))
    .filter(v => !isNaN(v))
  const avgMarketAging = marketAgingValues.length
    ? Math.round(marketAgingValues.reduce((a, b) => a + b, 0) / marketAgingValues.length)
    : 0

  const cards = [
    { key: 'totalProps',     value: total },
    { key: 'soldProps',      value: soldRows.length },
    { key: 'pendingProps',   value: pendingRows.length },
    { key: 'avgStockTime',   value: `${avgDays} ${t('days')}` },
    { key: 'avgSoldTime',    value: `${avgSoldAging} ${t('days')}` },
    { key: 'avgMarketAging', value: `${avgMarketAging} ${t('days')}` },
    { key: 'totalInStock',   value: `U$ ${totalValue.toLocaleString()}` },
    { key: 'totalToReceive', value: `U$ ${totalReceive.toLocaleString()}` },
  ]

  return (
    <div className="min-h-screen bg-[#1F1F1F] text-white px-4 py-6">
      <h1 className="text-2xl sm:text-3xl font-semibold mb-8">
        {t('greeting')}, Gustavo
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {cards.map(({ key, value }) => (
          <div
            key={key}
            className="bg-[#2C2C2C] rounded-2xl p-4 sm:p-6 shadow-lg flex flex-col justify-between"
          >
            <span className="text-sm sm:text-base text-gray-300 mb-2">
              {t(key)}
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-gold">
              {value}
            </span>
          </div>
        ))}
      </div>

      <h2 className="text-xl sm:text-2xl font-semibold mb-4">
        {t('pendingHeading')}
      </h2>
      <div className="bg-[#2C2C2C] rounded-2xl p-4 sm:p-6 shadow-lg">
        {pendingRows.length > 0 ? (
          pendingRows.map((r, i) => (
            <p key={i} className="text-sm sm:text-base mb-2">
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
