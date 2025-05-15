'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '../context/LanguageContext'
import { useTranslation } from '../hooks/useTranslation'

export default function Header() {
  const pathname = usePathname()
  const { lang, setLang } = useLanguage()
  const { t } = useTranslation()

  if (pathname === '/login') return null

  const navLinks = [
    { href: '/dashboard',    key: 'dashboard'  },
    { href: '/propriedades', key: 'properties' },
    { href: '/tarefas',      key: 'tasks'      },
    { href: '/financeiro',   key: 'financials' }
  ]

  return (
    <header className="w-full bg-black px-6 py-4 flex items-center justify-between">
      <Link href="/dashboard" className="flex items-center space-x-2">
        <Image src="/logo.png" alt="G&T Lands" width={40} height={40} />
        <span className="text-xl font-bold text-white">G&amp;T Lands</span>
      </Link>

      <nav className="flex items-center space-x-6">
        {navLinks.map(({ href, key }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={
                active
                  ? 'text-white relative after:absolute after:-bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#D4AF37]'
                  : 'text-gray-300 hover:text-white'
              }
            >
              {t(key)}
            </Link>
          )
        })}

        {/* Seletor de idioma */}
        <select
          value={lang}
          onChange={e => setLang(e.target.value as any)}
          className="ml-4 px-2 py-1 bg-gray-900 border border-gray-600 text-white rounded"
        >
          <option value="pt">PT</option>
          <option value="en">EN</option>
          <option value="es">ES</option>
        </select>

        {/* Logout */}
        <Link
          href="/login"
          className="inline-block py-1 text-gray-300 hover:text-white ml-4"
        >
          {t('logout')}
        </Link>
      </nav>
    </header>
  )
}
