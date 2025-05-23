// src/components/VenderClient.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '../../../hooks/useTranslation'

type PropertyOption = { numero: string; parcel: string; endereco: string }
type Cost = { type: string; value: number }
type Credit = { type: string; value: number }

interface VenderClientProps {
  numero: string
  onClose?: () => void

}

export default function VenderClient({ numero, onClose = () => {} }: VenderClientProps) {
  const { t } = useTranslation()
  const router = useRouter()

  // lista de propriedades disponíveis
  const [propertyOptions, setPropertyOptions] = useState<PropertyOption[]>([])
  const [selectedProperty, setSelectedProperty] = useState<PropertyOption | null>(null)

  // lista de clientes
  const [clientNames, setClientNames] = useState<string[]>([])
  const [buyerName, setBuyerName] = useState('')

  // campos do formulário
  const [saleDate, setSaleDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [downPayment, setDownPayment] = useState(0)
  const [installmentCount, setInstallmentCount] = useState(1)
  const [installmentValue, setInstallmentValue] = useState(0)
  const [saleValue, setSaleValue] = useState(0)
  const [commType, setCommType] = useState<'percent' | 'fixed'>('percent')
  const [commValue, setCommValue] = useState(0)
  const [stampType, setStampType] = useState<'percent' | 'fixed'>('percent')
  const [stampValue, setStampValue] = useState(0)

  // custos e créditos
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
  const [costs, setCosts] = useState<Cost[]>(costTypes.map(type => ({ type, value: 0 })))
  const [credits, setCredits] = useState<Credit[]>(creditTypes.map(type => ({ type, value: 0 })))

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  // 1) Carrega propriedades disponíveis
  useEffect(() => {
    fetch('/api/propriedades?onlyAvailable=true', { cache: 'no-store' })
      .then(res => res.json())
      .then(body => {
        if (body.ok) {
          const rows: string[][] = body.rows.slice(1)    // pula header
          const opts: PropertyOption[] = rows.map(r => ({
            numero: r[1],
            parcel: r[3],
            endereco: r[4],
          }))
          setPropertyOptions(opts)
        }
      })
      .catch(console.error)
  }, [])

  // 2) Define propriedade selecionada inicial
  useEffect(() => {
    if (propertyOptions.length) {
      const match = propertyOptions.find(p => p.numero === numero)
      setSelectedProperty(match || propertyOptions[0])
    }
  }, [propertyOptions, numero])

  // 3) Carrega nomes de clientes
  useEffect(() => {
    fetch('/api/clientes', { cache: 'no-store' })
      .then(res => res.json())
      .then(body => {
        if (body.ok) {
          setClientNames(body.rows.slice(1).map((r: any[]) => r[0]))
        }
      })
      .catch(console.error)
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProperty) {
      alert(t('selectProperty'))
      return
    }
    if (!saleDate || !saleValue || !paymentMethod || !buyerName) {
      alert(t('fillRequiredFields'))
      return
    }

    setIsSubmitting(true)
    setStatusMessage(t('registering'))

    const stateCommission =
      commType === 'percent'
        ? saleValue * (commValue / 100)
        : commValue
    const docStamps =
      stampType === 'percent'
        ? saleValue * (stampValue / 100)
        : stampValue

    const payload = {
      saleDate,
      propriedade: selectedProperty.numero,
      parcel: selectedProperty.parcel,
      endereco: selectedProperty.endereco,
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

    try {
      const res = await fetch('/api/propriedades/vender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Erro no servidor')
      setStatusMessage(t('saleRegistered'))
      onClose()                    // fecha o modal
      router.push('/propriedades') // navega de volta
    } catch (err: any) {
      console.error(err)
      setIsSubmitting(false)
      setStatusMessage('')
      alert(t('errorSaving'))
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-[#2C2C2C] rounded-lg mt-8 text-white">
      <h1 className="text-2xl font-bold mb-6">
        {t('sellProperty')} #{selectedProperty?.numero}
      </h1>

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

        {/* Seletor de Propriedade */}
        <div>
          <label className="block mb-1">{t('property')}</label>
          <select
            value={selectedProperty?.numero || ''}
            onChange={e => {
              const novo = propertyOptions.find(p => p.numero === e.target.value)
              setSelectedProperty(novo || null)
            }}
            className="w-full px-3 py-2 rounded bg-black text-white"
            required
          >
            <option value="">{t('selectProperty')}</option>
            {propertyOptions.map(p => (
              <option key={p.numero} value={p.numero}>
                {`#${p.numero} – ${p.endereco}`}
              </option>
            ))}
          </select>
        </div>

       {/* Nome do Comprador */}
<div>
  <label className="block mb-1">{t('buyerName')}</label>
  <select
    value={buyerName}
    onChange={e => setBuyerName(e.target.value)}
    className="appearance-auto w-full px-3 py-2 bg-[#1F1F1F] border border-gray-600 rounded text-white"
    required
  >
    <option value="">{t('selectBuyer')}</option>
    {clientNames.map((name, i) => (
      <option key={i} value={name}>
        {name}
      </option>
    ))}
  </select>
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
            <option value="À vista">{t('cash')}</option>
            <option value="A prazo">{t('installment')}</option>
          </select>
        </div>

        {/* Down Payment */}
        <div>
          <label className="block mb-1">{t('downPayment')}</label>
          <input
            type="number"
            value={downPayment}
            onChange={e => setDownPayment(+e.target.value)}
            className="w-full px-3 py-2 rounded bg-black"
          />
        </div>

        {/* Parcelas */}
        <div>
          <label className="block mb-1">{t('installmentCount')}</label>
          <input
            type="number"
            value={installmentCount}
            onChange={e => setInstallmentCount(+e.target.value)}
            className="w-full px-3 py-2 rounded bg-black"
          />
        </div>

        <div>
          <label className="block mb-1">{t('installmentValue')}</label>
          <input
            type="number"
            value={installmentValue}
            onChange={e => setInstallmentValue(+e.target.value)}
            className="w-full px-3 py-2 rounded bg-black"
          />
        </div>

        {/* Valor da Venda */}
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

        {/* Comissão */}
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

        {/* Document Stamps */}
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

        {statusMessage && (
          <div className="text-sm text-gray-300">{statusMessage}</div>
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
          {isSubmitting ? t('registering') : t('confirmSale')}
        </button>
      </form>
    </div>
  )
}
