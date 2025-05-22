// src/app/propriedades/[numero]/vender/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslation } from '../../../hooks/useTranslation'

type PropertyOption = { numero: string; parcel: string; endereco: string }
type Cost = { type: string; value: number }
type Credit = { type: string; value: number }

export default function VenderPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const params = useParams()
  const rawNumero = params.numero
  const initialNumero = Array.isArray(rawNumero) ? rawNumero[0] : (rawNumero || '')

  const [propsOptions, setPropsOptions] = useState<PropertyOption[]>([])
  const [numero, setNumero]             = useState<string>(initialNumero)
  const [saleDate, setSaleDate]         = useState<string>('')
  const [saleValue, setSaleValue]       = useState<number>(0)

  // novos campos
  const [buyerName, setBuyerName]       = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [downPayment, setDownPayment]   = useState<number>(0)
  const [installmentCount, setInstallmentCount] = useState<number>(1)
  const [installmentValue, setInstallmentValue] = useState<number>(0)

  const [commType, setCommType]   = useState<'percent' | 'fixed'>('percent')
  const [commValue, setCommValue] = useState<number>(0)
  const [stampType, setStampType] = useState<'percent' | 'fixed'>('percent')
  const [stampValue, setStampValue] = useState<number>(0)

  const costTypes = [
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
    'e-Recording Service Fee'
  ]
  const creditTypes = ['County Taxes', 'Assessments']

  const [costs, setCosts]     = useState<Cost[]>(costTypes.map(type => ({ type, value: 0 })))
  const [credits, setCredits] = useState<Credit[]>(creditTypes.map(type => ({ type, value: 0 })))

  // loading & status
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  // carrega só propriedades disponíveis
  useEffect(() => {
    fetch('/api/propriedades?onlyAvailable=true', { cache: 'no-store' })
      .then(res => res.json())
      .then(body => {
        if (body.ok && Array.isArray(body.properties)) {
          setPropsOptions(body.properties as PropertyOption[])
        } else {
          console.error('Formato inesperado:', body)
        }
      })
      .catch(err => console.error('Erro ao carregar propriedades:', err))
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSubmitting(true)
    setStatusMessage('Registrando...')

    const stateCommission = commType === 'percent'
      ? saleValue * (commValue / 100)
      : commValue

    const docStamps = stampType === 'percent'
      ? saleValue * (stampValue / 100)
      : stampValue

    const propObj = propsOptions.find(o => o.numero === numero)

    const payload = {
      saleDate,
      propriedade: numero,
      parcel:       propObj?.parcel||'',  
      endereco: propObj?.endereco || '',
      buyerName,
      paymentMethod,
      downPayment,
      installmentCount,
      installmentValue,
      custos: Object.fromEntries(costs.map(c => [c.type, c.value])),
      creditos: Object.fromEntries(credits.map(c => [c.type, c.value])),
      saleValue,
      stateCommission,
      docStamps
    }

    const res = await fetch('/api/propriedades/vender', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      setStatusMessage('Venda registrada')
      setTimeout(() => router.push('/propriedades'), 1000)
    } else {
      setIsSubmitting(false)
      setStatusMessage('')
      alert(t('errorSaving'))
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-[#2C2C2C] rounded-lg mt-8 text-white">
      <h1 className="text-2xl font-bold mb-6">{t('sellProperty')} #{numero}</h1>
      <form onSubmit={onSubmit} className="space-y-4">

        {/* Data da Venda */}
        <div>
          <label className="block mb-1">{t('saleDate')}</label>
          <input
            type="date"
            value={saleDate}
            onChange={e => setSaleDate(e.target.value)}
            className="w-full px-3 py-2 rounded bg-black"
            required
          />
        </div>

        {/* Propriedade */}
        <div>
          <label className="block mb-1">{t('property')}</label>
          <select
            value={numero}
            onChange={e => setNumero(e.target.value)}
            className="w-full px-3 py-2 rounded bg-black"
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

        {/* Nome do Comprador */}
        <div>
          <label className="block mb-1">{t('buyerName')}</label>
          <input
            type="text"
            value={buyerName}
            onChange={e => setBuyerName(e.target.value)}
            className="w-full px-3 py-2 rounded bg-black"
            required
          />
        </div>

        {/* Método de Pagamento */}
        <div>
          <label className="block mb-1">{t('paymentMethod')}</label>
          <select
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 rounded bg-black"
            required
          >
            <option value="">{t('choosePaymentMethod')}</option>
            <option value="À vista">À vista</option>
            <option value="A prazo">A prazo</option>
          </select>
        </div>

        {/* Entrada */}
        <div>
          <label className="block mb-1">{t('downPayment')}</label>
          <input
            type="number"
            value={downPayment}
            onChange={e => setDownPayment(+e.target.value)}
            className="w-full px-3 py-2 rounded bg-black"
          />
        </div>

        {/* Qtde Parcelas */}
        <div>
          <label className="block mb-1">{t('installmentCount')}</label>
          <input
            type="number"
            value={installmentCount}
            onChange={e => setInstallmentCount(+e.target.value)}
            className="w-full px-3 py-2 rounded bg-black"
          />
        </div>

        {/* Valor da Parcela */}
        <div>
          <label className="block mb-1">{t('installmentValue')}</label>
          <input
            type="number"
            value={installmentValue}
            onChange={e => setInstallmentValue(+e.target.value)}
            className="w-full px-3 py-2 rounded bg-black"
          />
        </div>

        {/* Sale Price */}
        <div>
          <label className="block mb-1">{t('salePrice')}</label>
          <input
            type="number"
            value={saleValue}
            onChange={e => setSaleValue(+e.target.value)}
            className="w-full px-3 py-2 rounded bg-black"
            required
          />
        </div>

        {/* State Commission */}
        <div>
          <label className="block mb-1">{t('stateCommission')}</label>
          <div className="flex space-x-2">
            <select
              value={commType}
              onChange={e => setCommType(e.target.value as any)}
              className="px-2 py-1 rounded bg-black"
            >
              <option value="percent">%</option>
              <option value="fixed">{t('fixed')}</option>
            </select>
            <input
              type="number"
              value={commValue}
              onChange={e => setCommValue(+e.target.value)}
              className="flex-1 px-3 py-2 rounded bg-black"
            />
          </div>
        </div>

        {/* Documents Stamps */}
        <div>
          <label className="block mb-1">{t('docStamps')}</label>
          <div className="flex space-x-2">
            <select
              value={stampType}
              onChange={e => setStampType(e.target.value as any)}
              className="px-2 py-1 rounded bg-black"
            >
              <option value="percent">%</option>
              <option value="fixed">{t('fixed')}</option>
            </select>
            <input
              type="number"
              value={stampValue}
              onChange={e => setStampValue(+e.target.value)}
              className="flex-1 px-3 py-2 rounded bg-black"
            />
          </div>
        </div>

        {/* Custos */}
        <fieldset className="border border-gray-700 rounded p-4 space-y-2">
          <legend className="px-2 text-sm font-medium">{t('costs')}</legend>
          {costs.map((c, idx) => (
            <div key={c.type} className="flex items-center space-x-2">
              <span className="whitespace-nowrap">{c.type}:</span>
              <input
                type="number"
                value={c.value}
                onChange={e => {
                  const v = +e.target.value
                  setCosts(cs => {
                    const nxt = [...cs]
                    nxt[idx] = { ...nxt[idx], value: v }
                    return nxt
                  })
                }}
                className="flex-1 px-2 py-1 rounded bg-black"
              />
            </div>
          ))}
        </fieldset>

        {/* Créditos */}
        <fieldset className="border border-gray-700 rounded p-4 space-y-2">
          <legend className="px-2 text-sm font-medium">{t('credits')}</legend>
          {credits.map((c, idx) => (
            <div key={c.type} className="flex items-center space-x-2">
              <span className="whitespace-nowrap">{c.type}:</span>
              <input
                type="number"
                value={c.value}
                onChange={e => {
                  const v = +e.target.value
                  setCredits(cs => {
                    const nxt = [...cs]
                    nxt[idx] = { ...nxt[idx], value: v }
                    return nxt
                  })
                }}
                className="flex-1 px-2 py-1 rounded bg-black"
              />
            </div>
          ))}
        </fieldset>

        {/* status message */}
        {statusMessage && (
          <div className="text-sm text-gray-300">
            {statusMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 rounded transition ${
            isSubmitting
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isSubmitting ? 'Registrando...' : t('confirmSale')}
        </button>
      </form>
    </div>
  )
}
