'use client'

import React, { useEffect, useState } from 'react'

interface CostRow {
  data: string
  numero: string
  descricao: string
  classificacao: string
  valor: number
  parcel: string
  endereco: string
  investidor: string
  notes: string
}

export default function PropertyCostsPage() {
  const [rows, setRows] = useState<CostRow[]>([])
  const [error, setError] = useState<string | null>(null)

  // filtros
  const [classFilter, setClassFilter] = useState<string>('')       // '' = todos
  const [numFilter, setNumFilter]       = useState<string>('')
  const [addrFilter, setAddrFilter]     = useState<string>('')

  useEffect(() => {
    fetch('/api/financeiro/custos-propriedades')
      .then(res => res.json())
      .then(body => {
        if (!body.ok) throw new Error(body.error || 'fetch failed')
        setRows(body.rows)
      })
      .catch(err => setError(err.message))
  }, [])

  // aplica filtros
  const filtered = rows.filter(r => {
    if (classFilter && r.classificacao !== classFilter) return false
    if (numFilter && !r.numero.includes(numFilter))       return false
    if (addrFilter && !r.endereco.toLowerCase().includes(addrFilter.toLowerCase())) return false
    return true
  })

  // agrupa
  const byClass = {
    Leilão:        filtered.filter(r => r.classificacao === 'Leilão'),
    Propriedade:   filtered.filter(r => r.classificacao === 'Propriedade'),
    Venda:         filtered.filter(r => r.classificacao === 'Venda'),
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Custos das Propriedades</h1>
      {error && <p className="text-red-500">Erro: {error}</p>}

      {/* ---- FILTROS ---- */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={classFilter}
          onChange={e => setClassFilter(e.target.value)}
          className="px-3 py-2 bg-gray-800 text-white rounded"
        >
          <option value="">Todas Classificações</option>
          <option value="Leilão">Leilão</option>
          <option value="Propriedade">Propriedade</option>
          <option value="Venda">Venda</option>
        </select>

        <input
          type="text"
          placeholder="Número da propriedade"
          value={numFilter}
          onChange={e => setNumFilter(e.target.value)}
          className="px-3 py-2 bg-gray-800 text-white rounded"
        />

        <input
          type="text"
          placeholder="Endereço"
          value={addrFilter}
          onChange={e => setAddrFilter(e.target.value)}
          className="px-3 py-2 bg-gray-800 text-white rounded flex-1"
        />
      </div>

      {/* ---- SEÇÕES AGRUPADAS ---- */}
      {(['Leilão','Propriedade','Venda'] as const).map(key => (
        <section key={key} className="mb-8">
          <h2 className="text-xl font-semibold mb-2">
            {key === 'Venda'
              ? 'Custos de Venda'
              : key === 'Leilão'
                ? 'Custos de Leilão'
                : 'Custos de Propriedade'}
          </h2>
          {byClass[key].length ? (
            <ul className="list-disc ml-6">
              {byClass[key].map((r,i) => (
                <li key={i}>
                  {r.data} — #{r.numero} — {r.descricao}: R${r.valor.toFixed(2)} — {r.endereco}
                </li>
              ))}
            </ul>
          ) : (
            <p>Nenhum custo de {key.toLowerCase()} registrado.</p>
          )}
        </section>
      ))}
    </div>
  )
}
