// src/hooks/useTranslation.tsx
'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'

export function useTranslation() {
  const { lang } = useLanguage()
  const [strings, setStrings] = useState<Record<string,string>>({})

  useEffect(() => {
    // importa dinamicamente o JSON correto
    import(`../locales/${lang}.json`)
      .then(mod => setStrings(mod.default))
      .catch(() => setStrings({}))
  }, [lang])

  function t(key: string): string {
    return strings[key] ?? key
  }

  return { t }
}
