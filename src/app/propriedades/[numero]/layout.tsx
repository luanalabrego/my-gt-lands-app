// src/app/propriedades/[numero]/layout.tsx
'use client'

import { ReactNode } from 'react'

export default function PropertyLayout({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-xl mx-auto bg-[#2C2C2C] p-6 rounded-2xl shadow-lg mt-8 text-white">
      {children}
    </div>
  )
}
