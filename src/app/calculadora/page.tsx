'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

type Simulacao = {
  valorVenda: number
  downPayment: number
  valorFinanciado: number
  parcelas: number
  pmt: number
  totalJuros: number
  taxaAnual: number
  endereco: string
}

export default function CalculadoraPage() {
  const [propsList, setPropsList] = useState<string[]>([])
  const [addresses, setAddresses] = useState<Record<string, string>>({})
  const [propriedade, setPropriedade] = useState('')
  
  // agora guardamos o tipo de entrada:
  const [entrada, setEntrada] = useState('30')
  const [entradaType, setEntradaType] = useState<'percent'|'value'>('percent')
  
  const [parcelas, setParcelas] = useState('36')
  const [taxa, setTaxa] = useState('0')
  const [sim, setSim] = useState<Simulacao | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/propriedades')
      .then(r => r.json())
      .then((body: { ok: boolean; rows?: string[][] }) => {
        if (body.ok && body.rows) {
          const data = body.rows.slice(1).map(row => ({
            prop: row[2],
            endereco: row[5],
          }))
          const lista = data.map(d => d.prop)
          setPropsList(lista)
          setAddresses(data.reduce((acc, d) => ({ ...acc, [d.prop]: d.endereco }), {}))
          setPropriedade(lista[0] || '')
        }
      })
  }, [])

  const handleSimular = async () => {
    setLoading(true)
    try {
      const resp = await fetch('/api/calculadora/simular', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          propriedade,
          entrada,
          entradaType,
          parcelas,
          taxa
        })
      })
      const data = await resp.json()
      if (resp.ok) {
        setSim({ ...data, endereco: addresses[propriedade] || '' })
      } else {
        toast.error(data.error || 'Erro na simulação')
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro de rede')
    } finally {
      setLoading(false)
    }
  }

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
      if (resp.ok && body.ok) {
        toast.success('Registrado com sucesso!')
        // reset completo
        setSim(null)
        setPropriedade(propsList[0] || '')
        setEntrada('30')
        setEntradaType('percent')
        setParcelas('36')
        setTaxa('0')
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
    <div className="min-h-screen bg-[#1F1F1F] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#2C2C2C] rounded-2xl p-6 shadow-lg space-y-6">
        <h1 className="text-2xl font-bold text-[#D4AF37] text-center">
          Calculadora de Parcelamento
        </h1>

        <div className="space-y-4">
          <label className="block text-gray-200">
            Propriedade:
            <select
              value={propriedade}
              onChange={e => setPropriedade(e.target.value)}
              className="mt-1 w-full bg-black border border-gray-600 rounded px-3 py-2 text-white"
            >
              {propsList.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>

          {propriedade && addresses[propriedade] && (
            <p className="text-gray-300">
              Endereço: <strong>{addresses[propriedade]}</strong>
            </p>
          )}

          {/* toggle % vs USD */}
          <div className="flex items-center space-x-4 text-gray-200">
            <label className="flex items-center space-x-1">
              <input
                type="radio"
                checked={entradaType === 'percent'}
                onChange={() => setEntradaType('percent')}
              />
              <span>%</span>
            </label>
            <label className="flex items-center space-x-1">
              <input
                type="radio"
                checked={entradaType === 'value'}
                onChange={() => setEntradaType('value')}
              />
              <span>USD</span>
            </label>
          </div>

          <label className="block text-gray-200">
            {entradaType === 'percent' ? 'Entrada (%):' : 'Entrada (USD):'}
            <input
              type="number"
              value={entrada}
              onChange={e => setEntrada(e.target.value)}
              className="mt-1 w-full bg-black border border-gray-600 rounded px-3 py-2 text-white"
            />
          </label>

          <label className="block text-gray-200">
            Parcelas:
            <input
              type="number"
              value={parcelas}
              onChange={e => setParcelas(e.target.value)}
              className="mt-1 w-full bg-black border border-gray-600 rounded px-3 py-2 text-white"
            />
          </label>

          <label className="block text-gray-200">
            Taxa anual (%):
            <input
              type="number"
              value={taxa}
              onChange={e => setTaxa(e.target.value)}
              className="mt-1 w-full bg-black border border-gray-600 rounded px-3 py-2 text-white"
            />
          </label>

          <button
            onClick={handleSimular}
            disabled={loading}
            className="w-full bg-[#D4AF37] text-black font-medium py-2 rounded hover:bg-[#D4AF37]/90 transition"
          >
            {loading ? 'Aguarde...' : 'Simular'}
          </button>
        </div>

        {sim && (
          <div className="bg-[#1F1F1F] rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-white">
              <span>Valor de Venda (USD):</span>
              <span>${sim.valorVenda.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white">
              <span>Entrada (USD):</span>
              <span>${sim.downPayment.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white">
              <span>Valor Financiado (USD):</span>
              <span>${sim.valorFinanciado.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white">
              <span>Parcela ({sim.parcelas}×):</span>
              <span>${sim.pmt.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white">
              <span>Total de Juros (USD):</span>
              <span>${sim.totalJuros.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white">
              <span>Taxa anual (%):</span>
              <span>{sim.taxaAnual.toFixed(2)}%</span>
            </div>

            <button
              onClick={handleRegistrar}
              disabled={loading}
              className="mt-4 w-full bg-green-500 text-white font-medium py-2 rounded hover:bg-green-600 transition"
            >
              {loading ? 'Registrando...' : 'Registrar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
