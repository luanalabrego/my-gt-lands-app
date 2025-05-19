'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/hooks/useTranslation'

type PropertyRow = string[]

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
        // filtra apenas as linhas que têm número de propriedade (coluna C)
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

  // --- cálculos principais ---
  const total = rows.length

  // soldRows: têm data de venda (coluna AI, índice 34)
  const soldRows = rows.filter(r => Boolean(r[34]?.toString().trim()))
  const pendingRows = rows.filter(r => !r[34]?.toString().trim())

  // 1. Média de dias em estoque (pendentes)
  const today = new Date()
  const daysInStock = pendingRows.map(r => {
    const purchase = new Date(r[1] || '')
    return (today.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24)
  })
  const avgDays = daysInStock.length
    ? Math.round(daysInStock.reduce((a, b) => a + b, 0) / daysInStock.length)
    : 0

  // 2. Média de dias entre compra (B=1) e venda (AI=34)
  const soldDurations = soldRows.map(r => {
    const purchase = new Date(r[1] || '')
    const sale = new Date(r[34] || '')
    return (sale.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24)
  })
  const avgSoldTime = soldDurations.length
    ? Math.round(soldDurations.reduce((a, b) => a + b, 0) / soldDurations.length)
    : 0

  // 3. Média do aging de mercado (coluna AP=41)
  const marketAgingVals = rows
    .map(r => parseFloat(r[41]?.toString().replace(',', '.')) || 0)
    .filter(v => v > 0)
  const avgMarketAging = marketAgingVals.length
    ? Math.round(marketAgingVals.reduce((a, b) => a + b, 0) / marketAgingVals.length)
    : 0

  // valores monetários
  const totalValue = pendingRows.reduce((sum, r) => {
    const v = parseFloat(r[48]?.toString().replace(/[^0-9.-]+/g, '')) || 0
    return sum + v
  }, 0)
  const totalReceive = soldRows.reduce((sum, r) => {
    const v = parseFloat(r[48]?.toString().replace(/[^0-9.-]+/g, '')) || 0
    return sum + v
  }, 0)

  // monta os cards
  const cards = [
    { key: 'totalProps',       value: total },
    { key: 'soldProps',        value: soldRows.length },
    { key: 'pendingProps',     value: pendingRows.length },
    { key: 'avgStockTime',     value: `${avgDays} ${t('days')}` },
    { key: 'avgSoldTime',      value: `${avgSoldTime} ${t('days')}` },
    { key: 'avgMarketAging',   value: `${avgMarketAging} ${t('days')}` },
    { key: 'totalInStock',     value: `U$ ${totalValue.toLocaleString()}` },
    { key: 'totalToReceive',   value: `U$ ${totalReceive.toLocaleString()}` },
  ]

  return (
    <div className="min-h-screen bg-[#1F1F1F] text-white px-4 py-6">
      {/* Saudação */}
      <h1 className="text-2xl sm:text-3xl font-semibold mb-8">
        {t('greeting')}, Gustavo
      </h1>

      {/* Grid de cards */}
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

      {/* Pendências */}
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
