'use client'

import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useTranslation } from '@/hooks/useTranslation'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Rótulos das colunas
const FIELDS = {
  purchaseDate:     'Data da Compra',
  propertyNumber:   'Número Propriedade',
  parcel:           'Parcel',
  address:          'Endereço',
  county:           'Condado',
  state:            'Estado',
  coordinates:      'Coordenadas',
  squareFeet:       'Square Feet',
  acres:            'Acres',
  lotMeasurements:  'Medidas do Lote',
  zoningCode:       'Zoning Code',
  zoningType:       'Zoning Type',
  notesZone:        'Notes Zone',
  water:            'Água',
  waterDesc:        'Descrição Água',
  electricity:      'Luz',
  electricityDesc:  'Descrição Luz',
  sewer:            'Esgoto',
  sewerDesc:        'Descrição Esgoto',
  floodZone:        'Flood Zone',
  propertyDesc:     'Descrição do Imóvel',
  legalDesc:        'Legal Description',
  hoa:              'HOA',
  optionalNotes:    'Notas (Opcional)',
  images:           'Imagens',
  documents:        'Documentos',
} as const

type FieldKey = keyof typeof FIELDS

export default function CadastrarPropriedade() {
  const { t } = useTranslation()
  const router = useRouter()

  // Estado para todos os campos textuais
  const [values, setValues] = useState<Record<FieldKey,string>>(() => {
    const obj = {} as Record<FieldKey,string>
    (Object.keys(FIELDS) as FieldKey[]).forEach(k => { obj[k] = '' })
    return obj
  })

  // Estado apenas para o DatePicker
  const [purchaseDateObj, setPurchaseDateObj] = useState<Date | null>(null)

  // Atualiza valor de um campo
  const handleChange = (key: FieldKey, v: string) =>
    setValues(prev => ({ ...prev, [key]: v }))

  // Envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...values,
      purchaseDate: purchaseDateObj
        ? purchaseDateObj.toISOString().slice(0, 10)
        : ''
    }
    const resp = await fetch('/api/propriedades/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const body = await resp.json()
    if (!body.ok) {
      alert('Erro ao salvar: ' + (body.error || resp.statusText))
    } else {
      alert('Propriedade salva com sucesso!')
      // Reset completo
      const empty = {} as Record<FieldKey,string>
      ;(Object.keys(FIELDS) as FieldKey[]).forEach(k => { empty[k] = '' })
      setValues(empty)
      setPurchaseDateObj(null)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto bg-[#2C2C2C] p-6 rounded-2xl shadow-lg space-y-6 text-white"
    >
      {/* Dados da Propriedade */}
      <fieldset className="border border-gray-700 rounded-lg p-4 space-y-3">
        <legend className="px-2 text-sm font-semibold">
          {t('Dados da Propriedade')}
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Data da Compra */}
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-300">
              {t(FIELDS.purchaseDate)}
            </label>
            <DatePicker
              selected={purchaseDateObj}
              onChange={d => setPurchaseDateObj(d)}
              dateFormat="yyyy-MM-dd"
              placeholderText="yyyy-MM-dd"
              className="w-full text-sm px-2 py-1 bg-[#1F1F1F] border border-gray-600 rounded text-white placeholder-gray-500"
            />
          </div>

          {/* Número Propriedade */}
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-300">
              {t(FIELDS.propertyNumber)}
            </label>
            <input
              type="text"
              value={values.propertyNumber}
              onChange={e => handleChange('propertyNumber', e.target.value)}
              className="w-full text-sm px-2 py-1 bg-[#1F1F1F] border border-gray-600 rounded text-white placeholder-gray-500"
            />
          </div>

          {/* Parcel */}
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-300">
              {t(FIELDS.parcel)}
            </label>
            <input
              type="text"
              value={values.parcel}
              onChange={e => handleChange('parcel', e.target.value)}
              className="w-full text-sm px-2 py-1 bg-[#1F1F1F] border border-gray-600 rounded text-white placeholder-gray-500"
            />
          </div>
        </div>
      </fieldset>

      {/* Localização */}
      <fieldset className="border border-gray-700 rounded-lg p-4 space-y-3">
        <legend className="px-2 text-sm font-semibold">{t('Localização')}</legend>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {(['address','county','state','coordinates'] as FieldKey[]).map(key => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1 text-gray-300">
                {t(FIELDS[key])}
              </label>
              <input
                type="text"
                value={values[key]}
                onChange={e => handleChange(key, e.target.value)}
                className="w-full text-sm px-2 py-1 bg-[#1F1F1F] border border-gray-600 rounded text-white placeholder-gray-500"
              />
            </div>
          ))}
        </div>
      </fieldset>

      {/* Tamanho do Terreno */}
      <fieldset className="border border-gray-700 rounded-lg p-4 space-y-3">
        <legend className="px-2 text-sm font-semibold">{t('Tamanho do Terreno')}</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['squareFeet','acres','lotMeasurements'] as FieldKey[]).map(key => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1 text-gray-300">
                {t(FIELDS[key])}
              </label>
              <input
                type="text"
                value={values[key]}
                onChange={e => handleChange(key, e.target.value)}
                className="w-full text-sm px-2 py-1 bg-[#1F1F1F] border border-gray-600 rounded text-white placeholder-gray-500"
              />
            </div>
          ))}
        </div>
      </fieldset>

      {/* Zoneamento */}
      <fieldset className="border border-gray-700 rounded-lg p-4 space-y-3">
        <legend className="px-2 text-sm font-semibold">{t('Zoneamento')}</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['zoningCode','zoningType','notesZone'] as FieldKey[]).map(key => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1 text-gray-300">
                {t(FIELDS[key])}
              </label>
              <input
                type="text"
                value={values[key]}
                onChange={e => handleChange(key, e.target.value)}
                className="w-full text-sm px-2 py-1 bg-[#1F1F1F] border border-gray-600 rounded text-white placeholder-gray-500"
              />
            </div>
          ))}
        </div>
      </fieldset>

      {/* Serviços */}
      <fieldset className="border border-gray-700 rounded-lg p-4 space-y-3">
        <legend className="px-2 text-sm font-semibold">{t('Serviços')}</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['water','waterDesc','electricity','electricityDesc','sewer','sewerDesc'] as FieldKey[]).map(key => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1 text-gray-300">
                {t(FIELDS[key])}
              </label>
              <input
                type="text"
                value={values[key]}
                onChange={e => handleChange(key, e.target.value)}
                className="w-full text-sm px-2 py-1 bg-[#1F1F1F] border border-gray-600 rounded text-white placeholder-gray-500"
              />
            </div>
          ))}
        </div>
      </fieldset>

      {/* Extras */}
      <fieldset className="border border-gray-700 rounded-lg p-4 space-y-3">
        <legend className="px-2 text-sm font-semibold">{t('Extras')}</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(['floodZone','propertyDesc','legalDesc','hoa','optionalNotes'] as FieldKey[]).map(key => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1 text-gray-300">
                {t(FIELDS[key])}
              </label>
              {key === 'floodZone' ? (
                <input
                  type="checkbox"
                  checked={values.floodZone === 'true'}
                  onChange={e => handleChange('floodZone', e.target.checked.toString())}
                  className="h-4 w-4 text-[#D4AF37] bg-[#1F1F1F] border-gray-600 rounded"
                />
              ) : key === 'hoa' ? (
                <select
                  value={values.hoa}
                  onChange={e => handleChange('hoa', e.target.value)}
                  className="w-full text-sm px-2 py-1 bg-[#1F1F1F] border border-gray-600 rounded text-white"
                >
                  <option value="">{t('Selecione')}</option>
                  <option value="Sim">{t('Sim')}</option>
                  <option value="Não">{t('Não')}</option>
                </select>
              ) : key === 'images' || key === 'documents' ? (
                <input
                  type="file"
                  multiple
                  className="w-full text-sm text-gray-200"
                />
              ) : (
                <input
                  type="text"
                  value={values[key]}
                  onChange={e => handleChange(key, e.target.value)}
                  className="w-full text-sm px-2 py-1 bg-[#1F1F1F] border border-gray-600 rounded text-white placeholder-gray-500"
                />
              )}
            </div>
          ))}
        </div>
      </fieldset>

      {/* Botões de Ação */}
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm py-1 px-4 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
        >
          ← {t('Voltar')}
        </button>
        <button
          type="submit"
          className="text-sm py-1 px-4 bg-[#D4AF37] text-black rounded hover:bg-[#D4AF37]/90 transition"
        >
          {t('Salvar Propriedade')}
        </button>
      </div>
    </form>
  )
}
