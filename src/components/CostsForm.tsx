'use client'

import { useState } from 'react'

interface CostsFormProps {
  numero: string
  onClose: () => void
}

export default function CostsForm({ numero, onClose }: CostsFormProps) {
  // estados dos campos
  const [data, setData] = useState<string>(new Date().toISOString().slice(0,10))
  const [descricao, setDescricao] = useState<string>('')
  const [valor, setValor] = useState<number>(0)
  const [investidor, setInvestidor] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/propriedades/custos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data,
          numeroPropriedade: numero,
          descricao,
          valor,
          investidor,
          notes,
          tipoRegistro: 'Propriedade'
        })
      })
      const body = await res.json()
      if (!body.ok) throw new Error(body.message || 'Erro desconhecido')
      onClose()
      // opcional: toast de sucesso ou reload de dados
    } catch (err: any) {
      alert(`Falha ao salvar: ${err.message}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-white">
      <h2 className="text-xl font-semibold mb-4">Registrar Custos</h2>
      <div>
        <label className="block mb-1">Data</label>
        <input
          type="date"
          value={data}
          onChange={e => setData(e.target.value)}
          className="w-full px-3 py-2 bg-black border border-gray-600 rounded"
          required
        />
      </div>
      <div>
        <label className="block mb-1">Descrição</label>
        <input
          type="text"
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          className="w-full px-3 py-2 bg-black border border-gray-600 rounded"
          required
        />
      </div>
      <div>
        <label className="block mb-1">Valor (R$)</label>
        <input
          type="number"
          step="0.01"
          value={valor}
          onChange={e => setValor(parseFloat(e.target.value))}
          className="w-full px-3 py-2 bg-black border border-gray-600 rounded"
          required
          min={0.01}
        />
      </div>
      <div>
        <label className="block mb-1">Investidor</label>
        <input
          type="text"
          value={investidor}
          onChange={e => setInvestidor(e.target.value)}
          className="w-full px-3 py-2 bg-black border border-gray-600 rounded"
          required
        />
      </div>
      <div>
        <label className="block mb-1">Observações</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full px-3 py-2 bg-black border border-gray-600 rounded"
          rows={3}
        />
      </div>
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
        >
          Salvar
        </button>
      </div>
    </form>
  )
}
