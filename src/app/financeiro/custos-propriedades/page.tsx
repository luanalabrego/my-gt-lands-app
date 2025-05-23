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
  const [error, setError] = useState<string| null>(null)

  useEffect(() => {
    fetch('/api/financeiro/custos-propriedades')
      .then(res => res.json())
      .then(body => {
        if (!body.ok) throw new Error(body.error || 'fetch failed')
        setRows(body.rows)
      })
      .catch(err => setError(err.message))
  }, [])

  // agrupar por classificação
  const leilao = rows.filter(r => r.classificacao === 'Leilão')
  const propriedade = rows.filter(r => r.classificacao === 'Propriedade')

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Custos das Propriedades</h1>
      {error && <p className="text-red-500">Erro: {error}</p>}

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Custos de Leilão</h2>
        {leilao.length
          ? <ul className="list-disc ml-6">
              {leilao.map((r,i) => (
                <li key={i}>
                  {r.data} — #{r.numero} — {r.descricao}: R${r.valor.toFixed(2)}
                </li>
              ))}
            </ul>
          : <p>Nenhum custo de leilão registrado.</p>}
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Custos de Propriedade</h2>
        {propriedade.length
          ? <ul className="list-disc ml-6">
              {propriedade.map((r,i) => (
                <li key={i}>
                  {r.data} — #{r.numero} — {r.descricao}: R${r.valor.toFixed(2)}
                </li>
              ))}
            </ul>
          : <p>Nenhum custo de propriedade registrado.</p>}
      </section>
    </div>
  )
}
