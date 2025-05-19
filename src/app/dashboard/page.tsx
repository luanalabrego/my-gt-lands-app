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
    console.log('[DashboardPage] iniciando fetch de /api/propriedades')
    ;(async () => {
      try {
        const res = await fetch('/api/propriedades', { cache: 'no-store' })
        console.log('[DashboardPage] status da resposta:', res.status)
        const body = (await res.json()) as {
          ok: boolean
          rows?: PropertyRow[]
          error?: string
          message?: string
        }
        console.log('[DashboardPage] body recebido:', body)

        if (!body.ok) {
          console.error('[DashboardPage] API retornou erro:', body.error, body.message)
          setLoading(false)
          return
        }

        const all = body.rows || []
        const content = all.length > 1 ? all.slice(1) : []
        const filtered = content.filter(r => r[2]?.toString().trim() !== '')
        setRows(filtered)
      } catch (err) {
        console.error('[DashboardPage] falha no fetch:', err)
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
  const soldRows = rows.filter(r => Boolean(r[34]?.toString().trim()))   // coluna AI: data de venda
  const pendingRows = rows.filter(r => !r[34]?.toString().trim())

  // 1) Tempo médio em estoque para pendentes (hoje - data compra em B=idx1)
  const today = new Date()
  const daysInStock = pendingRows
    .map(r => {
      const rawBuy = r[1]  // coluna B
      const buyDate = parseBRDate(rawBuy)
      if (isNaN(buyDate.getTime())) {
        console.warn('[DashboardPage] data de compra inválida:', rawBuy)
        return null
      }
      return (today.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24)
    })
    .filter((d): d is number => d !== null)
  const avgDays = daysInStock.length
    ? Math.round(daysInStock.reduce((a, b) => a + b, 0) / daysInStock.length)
    : 0

  // 2) Valores totais
  const totalValue = pendingRows.reduce((sum, r) => {
    const v = parseFloat(r[48]?.toString().replace(/[^0-9.-]+/g, '')) || 0
    return sum + v
  }, 0)
  const totalReceive = soldRows.reduce((sum, r) => {
    const v = parseFloat(r[48]?.toString().replace(/[^0-9.-]+/g, '')) || 0
    return sum + v
  }, 0)

  // 3) Tempo médio de venda: (data de venda AI=idx34) – (data compra B=idx1)
  const soldDays = soldRows
    .map(r => {
      const rawBuy  = r[1]
      const rawSell = r[34]
      console.log('[DashboardPage] compra:', rawBuy, '| venda:', rawSell)
      const buyDate  = parseBRDate(rawBuy)
      const sellDate = parseBRDate(rawSell)
      if (isNaN(buyDate.getTime()) || isNaN(sellDate.getTime())) {
        console.warn('[DashboardPage] data inválida:', rawBuy, rawSell)
        return null
      }
      return (sellDate.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24)
    })
    .filter((d): d is number => d !== null)
  const avgSoldAging = soldDays.length
    ? Math.round(soldDays.reduce((a, b) => a + b, 0) / soldDays.length)
    : 0

  // 4) Média do aging de mercado (coluna AP = idx41)
  const marketAgingValues = rows
    .map(r => parseFloat(r[41]?.toString().replace(/[^0-9.-]+/g, '')) || NaN)
    .filter(v => !isNaN(v))
  const avgMarketAging = marketAgingValues.length
    ? Math.round(marketAgingValues.reduce((a, b) => a + b, 0) / marketAgingValues.length)
    : 0

  // --- montagem dos cards ---
  const cards = [
    { key: 'totalProps',       value: total },
    { key: 'soldProps',        value: soldRows.length },
    { key: 'pendingProps',     value: pendingRows.length },
    { key: 'avgStockTime',     value: `${avgDays} ${t('days')}` },
    { key: 'avgSoldTime',      value: `${avgSoldAging} ${t('days')}` },
    { key: 'avgMarketAging',   value: `${avgMarketAging} ${t('days')}` },
    { key: 'totalInStock',     value: `U$ ${totalValue.toLocaleString()}` },
    { key: 'totalToReceive',   value: `U$ ${totalReceive.toLocaleString()}` },
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
