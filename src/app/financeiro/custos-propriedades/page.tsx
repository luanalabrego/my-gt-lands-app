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
  const [rows, setRows]   = useState<CostRow[]>([])
  const [error, setError] = useState<string | null>(null)

  // filtros…
  const [classFilter, setClassFilter]   = useState('')
  const [numFilter, setNumFilter]       = useState('')
  const [addrFilter, setAddrFilter]     = useState('')

  useEffect(() => {
    fetch('/api/financeiro/custos-propriedades')
      .then(r => r.json())
      .then(b => {
        if (!b.ok) throw new Error(b.error)
        setRows(b.rows)
      })
      .catch(e => setError(e.message))
  }, [])

  const filtered = rows.filter(r => {
    if (classFilter && r.classificacao !== classFilter) return false
    if (numFilter   && !r.numero.includes(numFilter)) return false
    if (addrFilter  && !r.endereco.toLowerCase().includes(addrFilter.toLowerCase())) return false
    return true
  })

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Custos das Propriedades</h1>
      {error && <p className="text-red-500">Erro: {error}</p>}

      {/* filtros… */}      
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

      {/* tabela de resultados */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-[#2C2C2C] text-white rounded-lg overflow-hidden">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left">Data</th>
              <th className="px-4 py-2 text-left">Número</th>
              <th className="px-4 py-2 text-left">Descrição</th>
              <th className="px-4 py-2 text-left">Classificação</th>
              <th className="px-4 py-2 text-right">Valor</th>
              <th className="px-4 py-2 text-left">Parcel</th>
              <th className="px-4 py-2 text-left">Endereço</th>
              <th className="px-4 py-2 text-left">Investidor</th>
              <th className="px-4 py-2 text-left">Observações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filtered.map((r, i) => (
              <tr key={i} className="hover:bg-gray-700">
                <td className="px-4 py-2">{r.data}</td>
                <td className="px-4 py-2">#{r.numero}</td>
                <td className="px-4 py-2">{r.descricao}</td>
                <td className="px-4 py-2">{r.classificacao}</td>
                <td className="px-4 py-2 text-right">R${(r.valor ?? 0).toFixed(2)}</td>
                <td className="px-4 py-2">{r.parcel}</td>
                <td className="px-4 py-2">{r.endereco}</td>
                <td className="px-4 py-2">{r.investidor}</td>
                <td className="px-4 py-2">{r.notes}</td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-gray-400">
                  Nenhum custo encontrado para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
