'use client'

import React, { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

interface CostsFormProps {
  numero: string
  onClose: () => void
}

interface DropdownData {
  propertyNumbers: string[]
  descricaoOptions: string[]
  investidores: string[]
}

export default function CostsForm({ numero, onClose }: CostsFormProps) {
  // tipo de registro
  const [tipoRegistro, setTipoRegistro] = useState<'Propriedade' | 'Leilão'>('Propriedade')

  // dropdowns
  const [dropdowns, setDropdowns] = useState<DropdownData>({
    propertyNumbers: [],
    descricaoOptions: [],
    investidores: []
  })

  // campos comuns
  const [data, setData] = useState<Date | null>(new Date())
  const [numeroPropriedade, setNumeroPropriedade] = useState<string>(numero)
  const [investidor, setInvestidor] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  // campos Propriedade
  const [descricao, setDescricao] = useState<string>('')
  const [valor, setValor] = useState<number>(0)

  // campos Leilão
  const [valorArrematado, setValorArrematado] = useState<number>(0)
  const [docStamps, setDocStamps] = useState<number>(0)
  const [recordingFees, setRecordingFees] = useState<number>(0)
  const [publicacionFee, setPublicacionFee] = useState<number>(0)
  const [taxaBancaria, setTaxaBancaria] = useState<number>(0)
  const [outrosCustos, setOutrosCustos] = useState<number>(0)

  // busca opções de dropdown
  useEffect(() => {
    fetch('/api/propriedades/dropdown')
      .then(res => res.json())
      .then((data: DropdownData) => setDropdowns(data))
      .catch(console.error)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const dateStr = data ? data.toISOString().slice(0,10) : ''

    try {
      if (tipoRegistro === 'Propriedade') {
        await fetch('/api/propriedades/custos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: dateStr,
            numeroPropriedade,
            descricao,
            valor,
            investidor,
            notes,
            tipoRegistro
          })
        })
      } else {
        const custos = [
          { descricao: 'Valor Arrematado', valor: valorArrematado },
          { descricao: 'Doc Stamps', valor: docStamps },
          { descricao: 'Recording Fees', valor: recordingFees },
          { descricao: 'Publicacion Fee', valor: publicacionFee },
          { descricao: 'Taxa Bancária', valor: taxaBancaria },
          { descricao: 'Custos Adicionais', valor: outrosCustos }
        ]
        for (const c of custos) {
          if (c.valor > 0) {
            await fetch('/api/propriedades/custos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                data: dateStr,
                numeroPropriedade,
                descricao: c.descricao,
                valor: c.valor,
                investidor,
                notes,
                tipoRegistro
              })
            })
          }
        }
      }
      onClose()
    } catch (err: any) {
      alert(`Falha ao salvar: ${err.message}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-white">
      <h2 className="text-2xl font-semibold">Registrar Custos</h2>

      {/* Tipo de Registro */}
      <div className="flex space-x-6">
        <label className="flex items-center">
          <input
            type="radio"
            value="Propriedade"
            checked={tipoRegistro === 'Propriedade'}
            onChange={() => setTipoRegistro('Propriedade')}
            className="mr-2"
          />
          Propriedade
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            value="Leilão"
            checked={tipoRegistro === 'Leilão'}
            onChange={() => setTipoRegistro('Leilão')}
            className="mr-2"
          />
          Leilão
        </label>
      </div>

      {/* Campos comuns */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1">Data</label>
          <DatePicker
            selected={data}
            onChange={d => setData(d)}
            dateFormat="yyyy-MM-dd"
            className="w-full px-3 py-2 bg-black border border-gray-600 rounded text-white"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Número da Propriedade</label>
          <select
            value={numeroPropriedade}
            onChange={e => setNumeroPropriedade(e.target.value)}
            className="w-full px-3 py-2 bg-black border border-gray-600 rounded text-white"
            required
          >
            <option value="">Selecione uma opção</option>
            {dropdowns.propertyNumbers.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Investidor</label>
          <select
            value={investidor}
            onChange={e => setInvestidor(e.target.value)}
            className="w-full px-3 py-2 bg-black border border-gray-600 rounded text-white"
            required
          >
            <option value="">Selecione uma opção</option>
            {dropdowns.investidores.map(i => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Observações</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-black border border-gray-600 rounded text-white"
            rows={2}
          />
        </div>
      </div>

      {/* Campos específicos */}
      {tipoRegistro === 'Propriedade' ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Descrição</label>
            <select
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-gray-600 rounded text-white"
              required
            >
              <option value="">Selecione uma opção</option>
              {dropdowns.descricaoOptions.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              value={valor}
              onChange={e => setValor(parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-black border border-gray-600 rounded text-white"
              required
              min={0.01}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Valor Arrematado</label>
            <input
              type="number"
              step="0.01"
              value={valorArrematado}
              onChange={e => setValorArrematado(parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-black border border-gray-600 rounded text-white"
              min={0}
            />
          </div>
          <div>
            <label className="block mb-1">% Doc Stamps</label>
            <input
              type="number"
              step="0.01"
              value={docStamps}
              onChange={e => setDocStamps(parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-black border border-gray-600 rounded text-white"
              min={0}
            />
          </div>
          <div>
            <label className="block mb-1">Recording Fees</label>
            <input
              type="number"
              step="0.01"
              value={recordingFees}
              onChange={e => setRecordingFees(parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-black border border-gray-600 rounded text-white"
              min={0}
            />
          </div>
          <div>
            <label className="block mb-1">Publicacion Fee</label>
            <input
              type="number"
              step="0.01"
              value={publicacionFee}
              onChange={e => setPublicacionFee(parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-black border border-gray-600 rounded text-white"
              min={0}
            />
          </div>
          <div>
            <label className="block mb-1">Taxa Bancária</label>
            <input
              type="number"
              step="0.01"
              value={taxaBancaria}
              onChange={e => setTaxaBancaria(parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-black border border-gray-600 rounded text-white"
              min={0}
            />
          </div>
          <div>
            <label className="block mb-1">Custos Adicionais</label>
            <input
              type="number"
              step="0.01"
              value={outrosCustos}
              onChange={e => setOutrosCustos(parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-black border border-gray-600 rounded text-white"
              min={0}
            />
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="flex justify-end space-x-2 pt-4">
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
