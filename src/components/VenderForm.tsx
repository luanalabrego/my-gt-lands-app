// src/components/VenderForm.tsx
'use client'
import { useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { useRouter } from 'next/navigation'

type VenderFormProps = {
  numero: string
  onClose: () => void
}

export default function VenderForm({ numero, onClose }: VenderFormProps) {
  const { t } = useTranslation()
  const router = useRouter()
  // ... copiar aqui todos os useStates (saleDate, buyerName etc)
  // ... e o onSubmit
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* aqui todo o markup do formulário de venda */}
      <button
        type="button"
        onClick={onClose}
        className="text-sm px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
      >
        {t('cancel')}
      </button>
      <button
        type="submit"
        className="text-sm px-4 py-2 bg-[#D4AF37] rounded hover:bg-[#D4AF37]/90"
      >
        {t('confirmSale')}
      </button>
    </form>
  )
}
