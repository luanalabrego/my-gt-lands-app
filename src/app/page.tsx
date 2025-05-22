// src/app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import Dashboard from './dashboard/page'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Se estiver logado, vai para a rota /dashboard
        router.replace('/dashboard')
      } else {
        // Se não, vai para /login
        router.replace('/login')
      }
      setLoading(false)
    })
    return () => unsub()
  }, [router])

  if (loading) {
    // Você pode colocar um spinner aqui, se quiser
    return null
  }

  // Renderiza o dashboard assim que souber que user está logado
  return <Dashboard />
}
