'use client'

import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

interface CostsFormProps {
  numero: string
  onClose: () => void
}

export default function CostsForm({ numero, onClose }: CostsFormProps) {
  const [tipoRegistro, setTipoRegistro] = useState<'Leilão' | 'Propriedade'>('Leilão')

  // campo de data inicial em branco
  const [data, setData] = useState<Date | null>(null)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const dateStr = data ? data.toISOString().slice(0, 10) : ''

    try {
      if (tipoRegistro === 'Propriedade') {
        await fetch('/api/propriedades/custos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: dateStr,
            numeroPropriedade: numero,
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
                numeroPropriedade: numero,
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
    <form onSubmit={handleSubmit} className="space-y-4 text-white">
      <h2 className="text-xl font-semibold">Registrar Custos</h2>

      {/* 1) Tipo de Registro */}
      <div className="flex space-x-6">
        <label className="flex items-center">
          <input
            type="radio"
            value="Leilão"
            checked={tipoRegistro === 'Leilão'}
            onChange={() => setTipoRegistro('Leilão')}
            className="mr-1"
          />
          Leilão
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            value="Propriedade"
            checked={tipoRegistro === 'Propriedade'}
            onChange={() => setTipoRegistro('Propriedade')}
            className="mr-1"
          />
          Propriedade
        </label>
      </div>

      {/* 2) Número da Propriedade (fixo) */}
      <div>
        <label className="block mb-1">Número da Propriedade</label>
        <input
          type="text"
          value={numero}
          readOnly
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
        />
      </div>

      {/* 3) Data (calendário sem valor inicial) */}
      <div>
        <label className="block mb-1">Data</label>
        <DatePicker
          selected={data}
          onChange={d => setData(d)}
          dateFormat="yyyy-MM-dd"
          placeholderText="Selecione a data"
          className="w-full px-3 py-2 bg-black border border-gray-600 rounded text-white"
          required
        />
      </div>

      {/* 4) Investidor */}
      <div>
        <label className="block mb-1">Investidor</label>
        <input
          type="text"
          value={investidor}
          onChange={e => setInvestidor(e.target.value)}
          className="w-full px-3 py-2 bg-black border border-gray-600 rounded text-white"
          required
        />
      </div>

      {/* 5) Observações */}
      <div>
        <label className="block mb-1">Observações</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full px-3 py-2 bg-black border border-gray-600 rounded text-white"
          rows={2}
        />
      </div>

      {/* 6) Campos específicos */}
      {tipoRegistro === 'Propriedade' ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Descrição</label>
            <input
              type="text"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-gray-600 rounded text-white"
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
              className="w-full px-3 py-2 bg-black border border-gray-600 rounded text-white"
              required
              min={0.01}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Valor Arrematado (R$)</label>
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
            <label className="block mb-1">Doc Stamps (%)</label>
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
