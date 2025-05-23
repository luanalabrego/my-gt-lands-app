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
  // estados de edição
  const [isEditing,   setIsEditing]   = useState(false)
  const [editedRows, setEditedRows] = useState<CostRow[]>([])
  const [rows, setRows]             = useState<CostRow[]>([])
  const [error, setError]           = useState<string | null>(null)

  // filtros…
  const [classFilter, setClassFilter] = useState('')
  const [numFilter,   setNumFilter]   = useState('')
  const [addrFilter,  setAddrFilter]  = useState('')

  // busca inicial
  useEffect(() => {
    fetch('/api/financeiro/custos-propriedades')
      .then(r => r.json())
      .then(b => {
        if (!b.ok) throw new Error(b.error)
        setRows(b.rows)
        setEditedRows(b.rows)
      })
      .catch(e => setError(e.message))
  }, [])

  // aplica filtros sobre editedRows ou rows, dependendo do modo
  const source = isEditing ? editedRows : rows
  const filtered = source.filter(r => {
    if (classFilter && r.classificacao !== classFilter) return false
    if (numFilter   && r.numero !== numFilter)         return false
    if (addrFilter  && !r.endereco.toLowerCase().includes(addrFilter.toLowerCase())) return false
    return true
  })

  // manipuladores genéricos de mudança
  const updateCell = (idx: number, field: keyof CostRow, value: string) => {
    const copy = [...editedRows]
    copy[idx] = { ...copy[idx], [field]: value }
    setEditedRows(copy)
  }

  return (
    <div className="min-h-screen bg-[#1F1F1F] px-6 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Custos das Propriedades</h1>
      {error && <p className="text-red-500">{error}</p>}

      {/* botão de editar / salvar / cancelar */}
      <div className="flex justify-end space-x-2 print:hidden">
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Editar
          </button>
        ) : (
          <>
            <button
              onClick={async () => {
                // envia todas as linhas editadas
                await fetch('/api/financeiro/atualizar-todos-custos', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ rows: editedRows })
                })
                // recarrega
                const b = await fetch('/api/financeiro/custos-propriedades').then(r => r.json())
                setRows(b.rows)
                setEditedRows(b.rows)
                setIsEditing(false)
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              Salvar
            </button>
            <button
              onClick={() => {
                setEditedRows(rows)
                setIsEditing(false)
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
            >
              Cancelar
            </button>
          </>
        )}
      </div>

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
                  className={`px-4 py-3 text-sm font-medium text-gray-200 ${
                    h === 'Valor' ? 'text-right' : 'text-left'
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 bg-[#2C2C2C]">
            {filtered.map((r, i) => (
              <tr key={i} className="hover:bg-gray-700">
                {/* Data */}
                <td className="px-4 py-2 text-sm text-white">
                  {isEditing ? (
                    <input
                      type="date"
                      value={r.data}
                      onChange={e => updateCell(i, 'data', e.target.value)}
                      className="w-full bg-gray-800 text-white rounded px-2"
                    />
                  ) : (
                    r.data
                  )}
                </td>

                {/* Número */}
                <td className="px-4 py-2 text-sm text-white">
                  {isEditing ? (
                    <input
                      value={r.numero}
                      onChange={e => updateCell(i, 'numero', e.target.value)}
                      className="w-full bg-gray-800 text-white rounded px-2"
                    />
                  ) : (
                    `#${r.numero}`
                  )}
                </td>

                {/* Descrição */}
                <td className="px-4 py-2 text-sm text-white">
                  {isEditing ? (
                    <input
                      value={r.descricao}
                      onChange={e => updateCell(i, 'descricao', e.target.value)}
                      className="w-full bg-gray-800 text-white rounded px-2"
                    />
                  ) : (
                    r.descricao
                  )}
                </td>

                {/* Classificação */}
                <td className="px-4 py-2 text-sm text-white">
                  {isEditing ? (
                    <select
                      value={r.classificacao}
                      onChange={e => updateCell(i, 'classificacao', e.target.value)}
                      className="w-full bg-gray-800 text-white rounded px-2"
                    >
                      <option>Leilão</option>
                      <option>Propriedade</option>
                      <option>Venda</option>
                    </select>
                  ) : (
                    r.classificacao
                  )}
                </td>

                {/* Valor */}
                <td className="px-4 py-2 text-sm text-white text-right">
                  {isEditing ? (
                    <input
                      type="text"
                      value={r.valor}
                      onChange={e => updateCell(i, 'valor', e.target.value)}
                      className="w-full bg-gray-800 text-white rounded px-2 text-right"
                    />
                  ) : (
                    r.valor
                  )}
                </td>

                {/* Parcel */}
                <td className="px-4 py-2 text-sm text-white">
                  {isEditing ? (
                    <input
                      value={r.parcel}
                      onChange={e => updateCell(i, 'parcel', e.target.value)}
                      className="w-full bg-gray-800 text-white rounded px-2"
                    />
                  ) : (
                    r.parcel
                  )}
                </td>

                {/* Endereço */}
                <td className="px-4 py-2 text-sm text-white">
                  {isEditing ? (
                    <input
                      value={r.endereco}
                      onChange={e => updateCell(i, 'endereco', e.target.value)}
                      className="w-full bg-gray-800 text-white rounded px-2"
                    />
                  ) : (
                    r.endereco
                  )}
                </td>

                {/* Investidor */}
                <td className="px-4 py-2 text-sm text-white">
                  {isEditing ? (
                    <input
                      value={r.investidor}
                      onChange={e => updateCell(i, 'investidor', e.target.value)}
                      className="w-full bg-gray-800 text-white rounded px-2"
                    />
                  ) : (
                    r.investidor
                  )}
                </td>

                {/* Observações */}
                <td className="px-4 py-2 text-sm text-white">
                  {isEditing ? (
                    <textarea
                      value={r.notes}
                      onChange={e => updateCell(i, 'notes', e.target.value)}
                      className="w-full bg-gray-800 text-white rounded px-2"
                      rows={1}
                    />
                  ) : (
                    r.notes
                  )}
                </td>
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
