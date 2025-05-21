// src/app/propriedades/[numero]/vender/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslation } from '../../../hooks/useTranslation'

type PropertyOption = { numero: string; endereco: string }

export default function VenderPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const params = useParams()
  // useParams pode ser string ou string[]
  const rawNumero = params.numero
  const initialNumero = Array.isArray(rawNumero) ? rawNumero[0] : (rawNumero || '')

  const [propsOptions, setPropsOptions] = useState<PropertyOption[]>([])
  const [numero, setNumero]             = useState<string>(initialNumero)
  const [saleDate, setSaleDate]         = useState<string>('')
  const [saleValue, setSaleValue]       = useState<number>(0)

  // Novos campos
  const [buyerName, setBuyerName]               = useState<string>('')
  const [paymentMethod, setPaymentMethod]       = useState<string>('')
  const [downPayment, setDownPayment]           = useState<number>(0)
  const [installmentCount, setInstallmentCount] = useState<number>(1)
  const [installmentValue, setInstallmentValue] = useState<number>(0)

  const [commType, setCommType]   = useState<'percent'|'fixed'>('percent')
  const [commValue, setCommValue] = useState<number>(0)
  const [stampType, setStampType] = useState<'percent'|'fixed'>('percent')
  const [stampValue, setStampValue] = useState<number>(0)

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
    'e-Recording Service Fee'
  ]
  const creditTypes: string[] = [
    'County Taxes',
    'Assessments'
  ]

  const [costs, setCosts]     = useState<{ type: string; value: number }[]>(
    costTypes.map(type => ({ type, value: 0 }))
  )
  const [credits, setCredits] = useState<{ type: string; value: number }[]>(
    creditTypes.map(type => ({ type, value: 0 }))
  )

  useEffect(() => {
    fetch('/api/propriedades', { cache: 'no-store' })
      .then(res => res.json())
      .then(body => {
        // rows será string[][]
        const rows = (body.rows?.slice(1) as string[][]) || []
        setPropsOptions(
          rows.map((r: string[]) => ({
            numero: r[2],
            endereco: r[5]
          }))
        )
      })
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const stateCommission = commType === 'percent'
      ? saleValue * (commValue / 100)
      : commValue
    const docStamps = stampType === 'percent'
      ? saleValue * (stampValue / 100)
      : stampValue

    const payload = {
      saleDate,
      propriedade: numero,
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
      router.push('/propriedades')
    } else {
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
          <input
            type="text"
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 rounded bg-black"
            required
          />
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

        {/* Custos e Créditos (omitidos para brevidade) */}

        <button
          type="submit"
          className="w-full bg-green-500 py-2 rounded hover:bg-green-600 transition"
        >
          {t('confirmSale')}
        </button>
      </form>
    </div>
  )
}
