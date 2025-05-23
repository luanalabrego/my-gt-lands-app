'use client'

import React, { useEffect, useState } from 'react'

interface CostRow {
  data: string
  numero: string
  descricao: string
  classificacao: string
  valor: string
  parcel: string
  endereco: string
  investidor: string
  notes: string
}

export default function PropertyCostsPage() {
  const [rows, setRows]   = useState<CostRow[]>([])
  const [error, setError] = useState<string | null>(null)

  // filtros…
  const [classFilter, setClassFilter] = useState('')
  const [numFilter, setNumFilter]     = useState('')
  const [addrFilter, setAddrFilter]   = useState('')

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
    <div className="min-h-screen bg-[#1F1F1F] px-6 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Custos das Propriedades</h1>
      {error && <p className="text-red-500">{error}</p>}

      {/* filtros */}
      <div className="flex flex-wrap gap-4 mb-6 print:hidden">
        <select
          value={classFilter}
          onChange={e => setClassFilter(e.target.value)}
          className="px-4 py-2 bg-black border border-gray-600 text-white rounded-lg focus:outline-none focus:border-gold"
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
          className="px-4 py-2 bg-black border border-gray-600 text-white rounded-lg focus:outline-none focus:border-gold"
        />

        <input
          type="text"
          placeholder="Endereço"
          value={addrFilter}
          onChange={e => setAddrFilter(e.target.value)}
          className="flex-1 px-4 py-2 bg-black border border-gray-600 text-white rounded-lg focus:outline-none focus:border-gold"
        />
      </div>

      {/* tabela de resultados */}
      <div className="overflow-x-auto bg-[#2C2C2C] rounded-2xl shadow-lg">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-dark">
            <tr>
              {[
                'Data',
                'Número',
                'Descrição',
                'Classificação',
                'Valor',
                'Parcel',
                'Endereço',
                'Investidor',
                'Observações',
              ].map((h, i) => (
                <th
                  key={i}
                  className={`px-4 py-3 text-sm font-medium text-gray-200 text-left
                    ${h === 'Valor' ? 'text-right' : ''}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 bg-[#2C2C2C]">
            {filtered.map((r, i) => (
              <tr key={i} className="hover:bg-gray-700">
                <td className="px-4 py-2 text-sm text-white">{r.data}</td>
                <td className="px-4 py-2 text-sm text-white">#{r.numero}</td>
                <td className="px-4 py-2 text-sm text-white">{r.descricao}</td>
                <td className="px-4 py-2 text-sm text-white">{r.classificacao}</td>
                <td className="px-4 py-2 text-sm text-white text-right">
                <td className="px-4 py-2 text-right">{r.valor}</td>
                </td>
                <td className="px-4 py-2 text-sm text-white">{r.parcel}</td>
                <td className="px-4 py-2 text-sm text-white">{r.endereco}</td>
                <td className="px-4 py-2 text-sm text-white">{r.investidor}</td>
                <td className="px-4 py-2 text-sm text-white">{r.notes}</td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-6 text-center text-gray-400 text-sm"
                >
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
