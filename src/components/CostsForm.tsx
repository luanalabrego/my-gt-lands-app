'use client'

import { useState } from 'react'

interface CostsFormProps {
  numero: string
  onClose: () => void
}

export default function CostsForm({ numero, onClose }: CostsFormProps) {
  // tipo de registro: propriedade ou leilão
  const [tipoRegistro, setTipoRegistro] = useState<'Propriedade' | 'Leilão'>('Propriedade')

  // campos comuns
  const [data, setData] = useState<string>(new Date().toISOString().slice(0,10))
  const [descricao, setDescricao] = useState<string>('')
  const [valor, setValor] = useState<number>(0)
  const [investidor, setInvestidor] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  // campos específicos de leilão
  const [valorArrematado, setValorArrematado] = useState<number>(0)
  const [docStamps, setDocStamps] = useState<number>(0)
  const [recordingFees, setRecordingFees] = useState<number>(0)
  const [publicacionFee, setPublicacionFee] = useState<number>(0)
  const [taxaBancaria, setTaxaBancaria] = useState<number>(0)
  const [outrosCustos, setOutrosCustos] = useState<number>(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (tipoRegistro === 'Propriedade') {
        // único registro
        await fetch('/api/propriedades/custos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data,
            numeroPropriedade: numero,
            descricao,
            valor,
            investidor,
            notes,
            tipoRegistro
          })
        })
      } else {
        // múltiplos registros de leilão
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
                data,
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
      <h2 className="text-xl font-semibold mb-4">Registrar Custos</h2>

      {/* 1) Escolha do tipo */}
      <div>
        <label className="mr-4">
          <input
            type="radio"
            value="Propriedade"
            checked={tipoRegistro === 'Propriedade'}
            onChange={() => setTipoRegistro('Propriedade')}
            className="mr-1"
          />
          Propriedade
        </label>
        <label>
          <input
            type="radio"
            value="Leilão"
            checked={tipoRegistro === 'Leilão'}
            onChange={() => setTipoRegistro('Leilão')}
            className="mr-1"
          />
          Leilão
        </label>
      </div>

      {/* 2) Campos comuns */}
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
          rows={2}
        />
      </div>

      {/* 3) Campos específicos por tipo */}
      {tipoRegistro === 'Propriedade' ? (
        <>
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
        </>
      ) : (
        <>
          <div>
            <label className="block mb-1">Valor Arrematado (R$)</label>
            <input
              type="number"
              step="0.01"
              value={valorArrematado}
              onChange={e => setValorArrematado(parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-black border border-gray-600 rounded"
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
              className="w-full px-3 py-2 bg-black border border-gray-600 rounded"
              min={0}
            />
          </div>
          {/* adicione os demais campos: recordingFees, publicacionFee, taxaBancaria, outrosCustos */}
        </>
      )}

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
