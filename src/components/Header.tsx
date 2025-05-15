'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Home, MapPin, ClipboardList, DollarSign, LogOut } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useTranslation } from '../hooks/useTranslation'

export default function Header() {
  const pathname = usePathname()
  const { lang, setLang } = useLanguage()
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)

  if (pathname === '/login') return null

  const navLinks = [
    { href: '/dashboard',    key: 'dashboard',    Icon: Home        },
    { href: '/propriedades', key: 'properties',   Icon: MapPin     },
    { href: '/tarefas',      key: 'tasks',        Icon: ClipboardList },
    { href: '/financeiro',   key: 'financials',   Icon: DollarSign  },
  ]

  return (
    <header className="relative w-full bg-black px-6 py-4 flex items-center justify-between">
      <Link href="/dashboard" className="flex items-center space-x-2">
        <Image src="/logo.png" alt="G&T Lands" width={40} height={40} />
        <span className="text-xl font-bold text-white">G&amp;T Lands</span>
      </Link>

      {/* desktop menu */}
      <nav className="hidden md:flex items-center space-x-6">
        {navLinks.map(({ href, key, Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={
                active
                  ? 'flex items-center text-white relative after:absolute after:-bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#D4AF37]'
                  : 'flex items-center text-gray-300 hover:text-white'
              }
            >
              <Icon size={18} className="mr-1" />
              {t(key)}
            </Link>
          )
        })}
        <select
          value={lang}
          onChange={e => setLang(e.target.value as any)}
          className="ml-4 px-2 py-1 bg-gray-900 border border-gray-600 text-white rounded"
        >
          <option value="pt">PT</option>
          <option value="en">EN</option>
          <option value="es">ES</option>
        </select>
        <Link
          href="/login"
          className="inline-flex items-center py-1 text-gray-300 hover:text-white ml-4"
        >
          <LogOut size={18} className="mr-1" />
          {t('logout')}
        </Link>
      </nav>

      {/* mobile language selector */}
      <select
        value={lang}
        onChange={e => setLang(e.target.value as any)}
        className="block md:hidden ml-4 px-2 py-1 bg-gray-900 border border-gray-600 text-white rounded"
      >
        <option value="pt">PT</option>
        <option value="en">EN</option>
        <option value="es">ES</option>
      </select>

      {/* mobile hamburger */}
      <button
        onClick={() => setMenuOpen(prev => !prev)}
        className="block md:hidden text-white ml-2"
        aria-label="Toggle menu"
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* mobile menu panel */}
      {menuOpen && (
        <div className="absolute top-full right-6 mt-2 w-48 bg-[#2C2C2C] rounded-lg shadow-lg p-4 flex flex-col space-y-2 z-50">
          {navLinks.map(({ href, key, Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center text-white hover:text-gold py-1"
            >
              <Icon size={18} className="mr-1" />
              {t(key)}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="flex items-center text-gray-300 hover:text-white py-1"
          >
            <LogOut size={18} className="mr-1" />
            {t('logout')}
          </Link>
        </div>
      )}
    </header>
)
}
