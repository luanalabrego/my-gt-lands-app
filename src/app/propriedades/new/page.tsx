'use client'

import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useTranslation } from '@/hooks/useTranslation'
import { useState } from 'react'

const FIELDS = {
  purchaseDate: 'Data da Compra',
  propertyNumber: 'Número Propriedade',
  description: 'Descrição',
  parcel: 'Parcel',
  address: 'Endereço',
  county: 'Condado',
  state: 'Estado',
  squareFeet: 'Square Feet',
  acres: 'Acres',
  zoningCode: 'Zoning Code',
  zoningType: 'Zoning Type',
  lotMeasurements: 'Medidas do Lote',
  propertyTax: 'Property Tax',
  water: 'Água',
  waterDesc: 'Descrição Água',
  electricity: 'Luz',
  electricityDesc: 'Descrição Luz',
  sewer: 'Esgoto',
  sewerDesc: 'Descrição Esgoto',
  floodZone: 'Flood Zone',
  propertyDesc: 'Descrição do Imóvel',
  notesZone: 'Notes Zone',
  minimumLotArea: 'Minimum Lot Area',
  coordinates: 'Coordinates',
  legalDesc: 'Legal Description',
  hoa: 'HOA',
  hoaName: 'Nome do HOA',
  hoaValue: 'Valor (Hoa)',
  hoaPeriod: 'Período (Hoa)',
  optionalNotes: 'Notas (Opcional)',
  // Para uploads, enviaremos nomes dos arquivos (ou vazios)
  images: 'Imagens',
  documents: 'Documentos',
}

export default function CadastrarPropriedade() {
  const { t } = useTranslation()
  const [values, setValues] = useState(
    Object.fromEntries(Object.keys(FIELDS).map(k => [k, '']))
  )
  const [purchaseDateObj, setPurchaseDateObj] = useState<Date | null>(null)

  const handleChange = (key: string, v: string) =>
    setValues(prev => ({ ...prev, [key]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // já gravou em values via handleChange e DatePicker
    const resp = await fetch('/api/propriedades/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const body = await resp.json()
    if (!body.ok) {
      alert('Erro ao salvar: ' + (body.error || resp.statusText))
    } else {
      alert('Propriedade salva com sucesso!')
      // opcional: resetar form
      setValues(Object.fromEntries(Object.keys(FIELDS).map(k => [k, ''])))
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
        <legend className="px-2 text-sm font-semibold">{t('Dados da Propriedade')}</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-300">
              {t(FIELDS.purchaseDate)}
            </label>
            <DatePicker
              selected={purchaseDateObj}
              onChange={d => {
                setPurchaseDateObj(d)
                handleChange('purchaseDate', d ? d.toISOString().slice(0, 10) : '')
              }}
              dateFormat="yyyy-MM-dd"
              placeholderText="yyyy-MM-dd"
              className="w-full text-sm px-2 py-1 bg-[#1F1F1F] border border-gray-600 rounded text-white placeholder-gray-500"
            />
          </div>
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
        </div>
      </fieldset>

      {/* Localização */}
      <fieldset className="border border-gray-700 rounded-lg p-4 space-y-3">
        <legend className="px-2 text-sm font-semibold">{t('Localização')}</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {['parcel','address','county','state'].map(key => (
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
          {['squareFeet','acres','minimumLotArea'].map(key => (
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
          {['zoningCode','zoningType','notesZone'].map(key => (
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
          {['water','waterDesc','electricity','electricityDesc','sewer','sewerDesc'].map(key => (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {['hoa','hoaName','hoaValue','hoaPeriod','optionalNotes','images','documents'].map(key => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1 text-gray-300">
                {t(FIELDS[key])}
              </label>
              {key === 'images' || key === 'documents' ? (
                <input type="file" multiple className="w-full text-sm text-gray-200" />
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

      {/* Botão de envio */}
      <div className="flex justify-end">
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
