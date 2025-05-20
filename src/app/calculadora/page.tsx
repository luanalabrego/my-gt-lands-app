'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast' // ou qualquer lib de notificação

type Simulacao = {
  valorVenda: number
  downPayment: number
  valorFinanciado: number
  parcelas: number
  pmt: number
  totalJuros: number
  taxaAnual: number
}

export default function CalculadoraPage() {
  const [propsList, setPropsList] = useState<string[]>([])
  const [propriedade, setPropriedade] = useState('')
  const [entrada, setEntrada] = useState('30')
  const [parcelas, setParcelas] = useState('36')
  const [taxa, setTaxa] = useState('0')
  const [sim, setSim] = useState<Simulacao | null>(null)
  const [loading, setLoading] = useState(false)

  // 1) busca lista de propriedades
  useEffect(() => {
    fetch('/api/propriedades')
      .then(r => r.json())
      .then(body => {
        if (body.ok && body.rows) {
          const lista = body.rows.slice(1).map(r => r[2])
          setPropsList(lista)
          setPropriedade(lista[0] || '')
        }
      })
  }, [])

  // 2) handler Simular
  const handleSimular = async () => {
    setLoading(true)
    try {
      const resp = await fetch('/api/calculadora/simular', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ propriedade, entrada, parcelas, taxa })
      })
      const data = await resp.json()
      if (resp.ok) {
        setSim(data)
      } else {
        toast.error(data.error || 'Erro na simulação')
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro de rede')
    } finally {
      setLoading(false)
    }
  }

  // 3) handler Registrar
  const handleRegistrar = async () => {
    if (!sim) return
    setLoading(true)
    try {
      const resp = await fetch('/api/calculadora/registrar', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          propriedade,
          downPayment: sim.downPayment,
          valorVenda: sim.valorVenda,
          totalJuros: sim.totalJuros,
          taxaAnual: sim.taxaAnual,
          parcelas: sim.parcelas,
          pmt: sim.pmt
        })
      })
      const body = await resp.json()
      if (body.ok) {
        toast.success('Registrado com sucesso!')
      } else {
        toast.error('Falha ao registrar')
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro de rede')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Calculadora de Parcelamento</h1>

      <div className="space-y-4">
        <label className="block">
          Propriedade:
          <select
            value={propriedade}
            onChange={e => setPropriedade(e.target.value)}
            className="mt-1 block w-full border px-2 py-1"
          >
            {propsList.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>

        <label className="block">
          Entrada (%):
          <input
            type="number"
            value={entrada}
            onChange={e => setEntrada(e.target.value)}
            className="mt-1 block w-full border px-2 py-1"
          />
        </label>

        <label className="block">
          Parcelas:
          <input
            type="number"
            value={parcelas}
            onChange={e => setParcelas(e.target.value)}
            className="mt-1 block w-full border px-2 py-1"
          />
        </label>

        <label className="block">
          Taxa anual (%):
          <input
            type="number"
            value={taxa}
            onChange={e => setTaxa(e.target.value)}
            className="mt-1 block w-full border px-2 py-1"
          />
        </label>

        <button
          onClick={handleSimular}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded"
        >
          {loading ? 'Aguarde...' : 'Simular'}
        </button>
      </div>

      {sim && (
        <div className="bg-gray-100 p-4 rounded space-y-2">
          <p>Valor de Venda: ${sim.valorVenda.toFixed(2)}</p>
          <p>Entrada: ${sim.downPayment.toFixed(2)}</p>
          <p>Valor Financiado: ${sim.valorFinanciado.toFixed(2)}</p>
          <p>Parcela ({sim.parcelas}×): ${sim.pmt.toFixed(2)}</p>
          <p>Total de Juros: ${sim.totalJuros.toFixed(2)}</p>
          <p>Taxa anual: {sim.taxaAnual.toFixed(2)}%</p>

          <button
            onClick={handleRegistrar}
            disabled={loading}
            className="mt-4 w-full bg-green-500 text-white py-2 rounded"
          >
            {loading ? 'Registrando...' : 'Registrar'}
          </button>
        </div>
      )}
    </div>
  )
}
