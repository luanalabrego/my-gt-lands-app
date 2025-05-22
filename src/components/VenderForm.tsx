'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { useRouter } from 'next/navigation'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

type Cost = { type: string; value: string }
type Credit = { type: string; value: string }
type PropertyOption = { numero: string; endereco: string }

type VenderFormProps = {
  numero: string
  onClose: () => void
}

export default function VenderForm({ numero, onClose }: VenderFormProps) {
  const { t } = useTranslation()
  const router = useRouter()

  // ----- Estados do formulário -----
  const [propsOptions, setPropsOptions] = useState<PropertyOption[]>([])
  const [selectedNumero, setSelectedNumero] = useState<string>('')
  const [saleDateObj, setSaleDateObj] = useState<Date | null>(null)
  const [buyerName, setBuyerName] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [downPayment, setDownPayment] = useState<string>('')
  const [installmentCount, setInstallmentCount] = useState<string>('')
  const [installmentValue, setInstallmentValue] = useState<string>('')
  const [saleValue, setSaleValue] = useState<string>('')
  const [commType, setCommType] = useState<'percent'|'fixed'>('percent')
  const [commValue, setCommValue] = useState<string>('')
  const [stampType, setStampType] = useState<'percent'|'fixed'>('percent')
  const [stampValue, setStampValue] = useState<string>('')

  useEffect(() => {
    fetch('/api/propriedades?onlyAvailable=true', { cache: 'no-store' })
      .then(res => res.json())
      .then(body => {
        if (body.ok && Array.isArray(body.properties)) {
          setPropsOptions(body.properties)
        } else {
          console.error('Formato inesperado:', body)
        }
      })
      .catch(err => console.error('Erro ao carregar propriedades:', err))
  }, [])
  
  

  // (custos e créditos omitidos para brevidade...)
  const costTypes: string[] = [
    'Title Wave (Search Fee)',
    'Closing Fee',
    'Doc Prep Fee',
    'All Doc (RON)',
    'Lien Search',
    'Owner Title Insurance',
    'Complemento Insurance',
    'Fee Real Estate',
    'Recording Fee County Clerks',
    'Property Taxes',
    'Fee City Assessments',
    'Notary Fee',
    'Liens',
    'Special district Assessments',
    'e-Recording Service Fee',
    'Outras Saídas'
  ]
  const creditTypes: string[] = [
    'County Taxes',
    'Assessments'
  ]
  
  const [costs, setCosts] = useState<Cost[]>(costTypes.map(type => ({ type, value: '' })))
  const [credits, setCredits] = useState<Credit[]>(creditTypes.map(type => ({ type, value: '' })))

  // ----- Handler de envio -----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const saleValNum  = parseFloat(saleValue)  || 0
    const commValNum  = parseFloat(commValue)  || 0
    const stampValNum = parseFloat(stampValue) || 0

    const stateCommission =
      commType === 'percent'
        ? saleValNum * (commValNum / 100)
        : commValNum

    const docStamps =
      stampType === 'percent'
        ? saleValNum * (stampValNum / 100)
        : stampValNum

    const payload = {
      saleDate: saleDateObj ? saleDateObj.toISOString().slice(0, 10) : '',
      propriedade: selectedNumero,
      buyerName,
      paymentMethod,
      downPayment,
      installmentCount,
      installmentValue,
      custos: Object.fromEntries(costs.map(c => [c.type, c.value])),
      creditos: Object.fromEntries(credits.map(c => [c.type, c.value])),
      saleValue,
      stateCommission,
      docStamps,
    }

    const res = await fetch('/api/propriedades/vender', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      onClose()
      router.refresh()
    } else {
      alert(t('errorSaving'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Propriedade */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-300">
          {t('property')}
        </label>
        <select
          value={selectedNumero}
          onChange={e => setSelectedNumero(e.target.value)}
          className="w-full px-3 py-2 bg-[#1F1F1F] border border-gray-600 rounded text-white"
          required
        >
          <option value="">{t('chooseProperty')}</option>
          {propsOptions.map(o => (
            <option key={o.numero} value={o.numero}>
              #{o.numero} – {o.endereco}
            </option>
          ))}
        </select>
      </div>

      {/* Data da Venda */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-300">
          {t('saleDate')}
        </label>
        <DatePicker
          selected={saleDateObj}
          onChange={date => setSaleDateObj(date)}
          dateFormat="yyyy-MM-dd"
          placeholderText="YYYY-MM-DD"
          className="w-full px-3 py-2 bg-[#1F1F1F] border border-gray-600 rounded text-white"
          required
        />
      </div>

      {/* Nome do Comprador */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-300">
          {t('buyerName')}
        </label>
        <input
          type="text"
          value={buyerName}
          onChange={e => setBuyerName(e.target.value)}
          className="w-full px-3 py-2 bg-[#1F1F1F] border border-gray-600 rounded text-white"
          required
        />
      </div>

      {/* Método de Pagamento */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-300">
          {t('paymentMethod')}
        </label>
        <input
          type="text"
          value={paymentMethod}
          onChange={e => setPaymentMethod(e.target.value)}
          className="w-full px-3 py-2 bg-[#1F1F1F] border border-gray-600 rounded text-white"
        />
      </div>

      {/* Entrada */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-300">
          {t('downPayment')}
        </label>
        <input
          type="number"
          value={downPayment}
          onChange={e => setDownPayment(e.target.value)}
          className="w-full px-3 py-2 bg-[#1F1F1F] border border-gray-600 rounded text-white"
        />
      </div>

      {/* Qtde Parcelas */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-300">
          {t('installmentCount')}
        </label>
        <input
          type="number"
          value={installmentCount}
          onChange={e => setInstallmentCount(e.target.value)}
          className="w-full px-3 py-2 bg-[#1F1F1F] border border-gray-600 rounded text-white"
        />
      </div>

      {/* Valor da Parcela */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-300">
          {t('installmentValue')}
        </label>
        <input
          type="number"
          value={installmentValue}
          onChange={e => setInstallmentValue(e.target.value)}
          className="w-full px-3 py-2 bg-[#1F1F1F] border border-gray-600 rounded text-white"
        />
      </div>

      {/* Sale Price */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-300">
          {t('salePrice')}
        </label>
        <input
          type="number"
          value={saleValue}
          onChange={e => setSaleValue(e.target.value)}
          className="w-full px-3 py-2 bg-[#1F1F1F] border border-gray-600 rounded text-white"
          required
        />
      </div>

      {/* State Commission */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-300">
          {t('stateCommission')}
        </label>
        <div className="flex space-x-2">
          <select
            value={commType}
            onChange={e => setCommType(e.target.value as any)}
            className="px-2 py-1 bg-[#1F1F1F] border border-gray-600 rounded text-white"
          >
            <option value="percent">%</option>
            <option value="fixed">{t('fixed')}</option>
          </select>
          <input
            type="number"
            value={commValue}
            onChange={e => setCommValue(e.target.value)}
            className="flex-1 px-3 py-2 bg-[#1F1F1F] border border-gray-600 rounded text-white"
          />
        </div>
      </div>

      {/* Documents Stamps */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-300">
          {t('docStamps')}
        </label>
        <div className="flex space-x-2">
          <select
            value={stampType}
            onChange={e => setStampType(e.target.value as any)}
            className="px-2 py-1 bg-[#1F1F1F] border border-gray-600 rounded text-white"
          >
            <option value="percent">%</option>
            <option value="fixed">{t('fixed')}</option>
          </select>
          <input
            type="number"
            value={stampValue}
            onChange={e => setStampValue(e.target.value)}
            className="flex-1 px-3 py-2 bg-[#1F1F1F] border border-gray-600 rounded text-white"
          />
        </div>
      </div>

      {/* Custos */}
<fieldset className="border border-gray-600 rounded p-4 space-y-2">
  <legend className="px-2 text-sm font-medium text-gray-300">
    {t('costs')}
  </legend>
  {costs.map((c, idx) => (
    <div key={c.type} className="flex items-center space-x-2">
      <span className="whitespace-nowrap text-gray-300">{c.type}:</span>
      <input
        type="number"
        value={c.value}
        onChange={e => {
          const v = e.target.value
          setCosts(cs => {
            const nxt = [...cs]
            nxt[idx] = { ...nxt[idx], value: v }
            return nxt
          })
        }}
        className="flex-1 px-2 py-1 bg-[#1F1F1F] border border-gray-600 rounded text-white"
      />
    </div>
  ))}
</fieldset>

{/* Créditos */}
<fieldset className="border border-gray-600 rounded p-4 space-y-2">
  <legend className="px-2 text-sm font-medium text-gray-300">
    {t('credits')}
  </legend>
  {credits.map((c, idx) => (
    <div key={c.type} className="flex items-center space-x-2">
      <span className="whitespace-nowrap text-gray-300">{c.type}:</span>
      <input
        type="text"
        value={c.value}
        onChange={e => {
          const v = e.target.value
          setCredits(cs => {
            const nxt = [...cs]
            nxt[idx] = { ...nxt[idx], value: v }
            return nxt
          })
        }}
        className="flex-1 px-2 py-1 bg-[#1F1F1F] border border-gray-600 rounded text-white"
      />
    </div>
  ))}
</fieldset>


      {/* Ações */}
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onClose}
          className="text-sm px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 text-white">
          {t('cancel')}
        </button>
        <button
          type="submit"
          className="text-sm px-4 py-2 bg-[#D4AF37] rounded hover:bg-[#D4AF37]/90 text-black">
          {t('confirmSale')}
        </button>
      </div>
    </form>
  )
}
