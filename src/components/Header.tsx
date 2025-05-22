'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Home,
  MapPin,
  ClipboardList,
  DollarSign,
  Calculator,
  LogOut,
  User,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';

type NavItem = {
  href: string;
  key: string;
  Icon: React.ComponentType<{ size: number; className?: string }>;
  children?: NavItem[];
};

export default function Header() {
  const pathname = usePathname();
  const { lang, setLang } = useLanguage();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  if (pathname === '/login') return null;

  const navLinks: NavItem[] = [
    { href: '/dashboard',    key: 'dashboard',  Icon: Home         },
    { href: '/propriedades', key: 'properties', Icon: MapPin       },
    { href: '/clientes',     key: 'clients',    Icon: User         },
    {
      href: '/financeiro',
      key: 'financials',
      Icon: DollarSign,
      children: [
        { href: '/financeiro',                  key: 'financials',  Icon: DollarSign  },
        { href: '/financeiro/calculadora',      key: 'calculator',  Icon: Calculator  },
      ],
    },
    { href: '/tarefas',      key: 'tasks',      Icon: ClipboardList },
  ];

  return (
    <header className="relative w-full bg-black px-6 py-4 flex items-center justify-between">
      <Link href="/dashboard" className="flex items-center space-x-2">
        <Image src="/logo.png" alt="G&T Lands" width={40} height={40} />
        <span className="text-xl font-bold text-white">G&amp;T Lands</span>
      </Link>

      {/* desktop menu */}
      <nav className="hidden md:flex items-center space-x-6">
        {navLinks.map(({ href, key, Icon, children }) => {
          const active    = pathname === href || (children?.some(c => pathname === c.href) ?? false);
          const isParent  = Array.isArray(children) && children.length > 0;

          if (!isParent) {
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
                <Icon size={18} className="mr-1 text-[#D4AF37]" />
                {t(key)}
              </Link>
            );
          }

          // item com submenu
          return (
            <div key={href} className="relative group">
              <button
                className={
                  active
                    ? 'flex items-center text-white'
                    : 'flex items-center text-gray-300 hover:text-white'
                }
              >
                <Icon size={18} className="mr-1 text-[#D4AF37]" />
                {t(key)}
                <span className="ml-1 text-xs">▾</span>
              </button>
              <div className="absolute top-full left-0 mt-2 hidden group-hover:flex hover:flex flex-col bg-[#2C2C2C] rounded shadow-lg z-10">
                {children.map(({ href: chHref, key: chKey, Icon: ChIcon }) => (
                  <Link
                    key={chHref}
                    href={chHref}
                    className={
                      pathname === chHref
                        ? 'flex items-center px-4 py-2 text-white bg-black'
                        : 'flex items-center px-4 py-2 text-gray-300 hover:text-white'
                    }
                  >
                    <ChIcon size={16} className="mr-1 text-[#D4AF37]" />
                    {t(chKey)}
                  </Link>
                ))}
              </div>
            </div>
          );
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
          <LogOut size={18} className="mr-1 text-[#D4AF37]" />
          {t('logout')}
        </Link>
      </nav>

      {/* mobile menu (hamburger) */}
      <div className="flex items-center md:hidden">
        <select
          value={lang}
          onChange={e => setLang(e.target.value as any)}
          className="mr-2 px-2 py-1 bg-gray-900 border border-gray-600 text-white rounded"
        >
          <option value="pt">PT</option>
          <option value="en">EN</option>
          <option value="es">ES</option>
        </select>

        <button
          onClick={() => setMenuOpen(prev => !prev)}
          className="text-white"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={24} className="text-[#D4AF37]" /> : <Menu size={24} className="text-[#D4AF37]" />}
        </button>

        {menuOpen && (
          <div className="absolute top-full right-6 mt-2 w-48 bg-[#2C2C2C] rounded-lg shadow-lg p-4 flex flex-col space-y-2 z-50">
            {navLinks.map(({ href, key, Icon, children }) => {
              // link principal
              const items = children ?? [{ href, key, Icon }];
              return items.map(({ href: iHref, key: iKey, Icon: IIcon }) => (
                <Link
                  key={iHref}
                  href={iHref}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center text-white hover:text-gold py-1"
                >
                  <IIcon size={18} className="mr-1 text-[#D4AF37]" />
                  {t(iKey)}
                </Link>
              ));
            })}

            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="flex items-center text-gray-300 hover:text-white py-1"
            >
              <LogOut size={18} className="mr-1 text-[#D4AF37]" />
              {t('logout')}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
