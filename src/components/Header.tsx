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

export default function Header() {
  const pathname = usePathname();
  const { lang, setLang } = useLanguage();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(false);

  if (pathname === '/login') return null;

  const navLinks = [
    { href: '/dashboard',    key: 'dashboard',  Icon: Home         },
    { href: '/propriedades', key: 'properties', Icon: MapPin       },
    { href: '/clientes',     key: 'clients',    Icon: User         },
    {
      href: '/financeiro',
      key: 'financials',
      Icon: DollarSign,
      children: [
        { href: '/financeiro',              key: 'financials',  Icon: DollarSign  },
        { href: '/calculadora',  key: 'calculator',  Icon: Calculator  },
        { href: '/financeiro/custos-propriedades', key: 'propertyCosts',   Icon: ClipboardList, iconSize: 20 },
      ],
    },
  ];

  return (
    <header className="relative w-full bg-black px-6 py-4 flex items-center justify-between">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center space-x-2">
        <Image src="/logo.png" alt="G&T Lands" width={40} height={40} />
        <span className="text-xl font-bold text-white">G&amp;T Lands</span>
      </Link>

      {/* Menu desktop */}
      <nav className="hidden md:flex items-center space-x-6">
        {navLinks.map(({ href, key, Icon, children }) => {
          const isActive =
            pathname === href ||
            (children?.some(c => pathname === c.href) ?? false);

          // itens sem submenu
          if (!children) {
            return (
              <Link
                key={href}
                href={href}
                className={
                  isActive
                    ? 'flex items-center text-white relative after:absolute after:-bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#D4AF37]'
                    : 'flex items-center text-gray-300 hover:text-white'
                }
              >
                <Icon size={18} className="mr-1 text-[#D4AF37]" />
                {t(key)}
              </Link>
            );
          }

          // Financeiro com clique
          return (
            <div key={href} className="relative">
              <button
                onClick={() => setFinanceOpen(open => !open)}
                className={
                  isActive
                    ? 'flex items-center text-white'
                    : 'flex items-center text-gray-300 hover:text-white'
                }
              >
                <Icon size={18} className="mr-1 text-[#D4AF37]" />
                {t(key)}
                <span className="ml-1 text-xs">▾</span>
              </button>

              {financeOpen && (
                <div className="absolute top-full left-0 mt-1 flex flex-col bg-[#2C2C2C] rounded shadow-lg z-10">
                  {children.map(({ href: subHref, key: subKey, Icon: SubIcon }) => {
                    const subActive = pathname === subHref;
                    return (
                      <Link
                        key={subHref}
                        href={subHref}
                        className={
                          subActive
                            ? 'flex items-center px-4 py-2 text-white bg-black'
                            : 'flex items-center px-4 py-2 text-gray-300 hover:text-white'
                        }
                      >
                        <SubIcon size={16} className="mr-1 text-[#D4AF37]" />
                        {t(subKey)}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
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
          className="inline-flex items-center py-1 text-gray-300 hover:text-white ml-4"
        >
          <LogOut size={18} className="mr-1 text-[#D4AF37]" />
          {t('logout')}
        </Link>
      </nav>

      {/* Menu mobile */}
      <div className="flex items-center md:hidden">
        {/* idioma */}
        <select
          value={lang}
          onChange={e => setLang(e.target.value as any)}
          className="mr-2 px-2 py-1 bg-gray-900 border border-gray-600 text-white rounded"
        >
          <option value="pt">PT</option>
          <option value="en">EN</option>
          <option value="es">ES</option>
        </select>

        {/* hambúrguer */}
        <button
          onClick={() => setMenuOpen(prev => !prev)}
          className="text-white"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={24} className="text-[#D4AF37]" /> : <Menu size={24} className="text-[#D4AF37]" />}
        </button>

        {/* painel móvel */}
        {menuOpen && (
          <div className="absolute top-full right-6 mt-2 w-48 bg-[#2C2C2C] rounded-lg shadow-lg p-4 flex flex-col space-y-2 z-50">
            {navLinks.map(({ href, key, Icon, children }) => {
              const items = children ?? [{ href, key, Icon }];
              return items.map(({ href: iHref, key: iKey, Icon: IIcon }) => (
                <Link
                  key={iHref}
                  href={iHref}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center text-white hover:text-[#D4AF37] py-1"
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
