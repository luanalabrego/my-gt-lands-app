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
    const unsub = onAuthStateChanged(auth, user => {
      if (user) router.replace('/')
      else router.replace('/login')
      setLoading(false)
    })
    return unsub
  }, [router])

  if (loading) return null
  return <Dashboard />
}
