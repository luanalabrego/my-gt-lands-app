// src/context/LanguageContext.tsx
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Lang = 'pt'|'en'|'es'

interface LanguageContextValue {
  lang: Lang
  setLang: (l: Lang) => void
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('pt')

  // ao montar, lê do localStorage
  useEffect(() => {
    const stored = (localStorage.getItem('lang') as Lang) || 'pt'
    setLangState(stored)
  }, [])

  // quando muda, persiste
  function setLang(l: Lang) {
    localStorage.setItem('lang', l)
    setLangState(l)
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

// hook de conveniência
export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be inside LanguageProvider')
  return ctx
}
