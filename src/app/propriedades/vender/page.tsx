// src/app/propriedades/vender/page.tsx
import React, { Suspense } from 'react'
export const dynamic = 'force-dynamic'
import VenderClient from './VenderClient'

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ numero?: string }>
}) {
  const { numero = '' } = await searchParams


  return (
    <Suspense fallback={<p>Carregando formulário...</p>}>
      <VenderClient numero={numero} />
    </Suspense>
  )
}
