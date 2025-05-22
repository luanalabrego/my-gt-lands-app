// src/app/propriedades/vender/page.tsx
import React, { Suspense } from 'react'
import VenderClient from './VenderClient'

export default function Page({
  searchParams
}: {
  searchParams: { numero?: string }
}) {
  const numero = searchParams.numero || ''

  return (
    <Suspense fallback={<p>Carregando formulário...</p>}>
      <VenderClient numero={numero} />
    </Suspense>
  )
}
