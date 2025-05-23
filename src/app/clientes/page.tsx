'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Cliente = [string, string, string, string, string] // [nome, telefone, email, cpf, obs]
type PropertyRow = string[]                        // todas as colunas da planilha de propriedades

export default function ListaClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [properties, setProperties] = useState<PropertyRow[]>([])

  // carrega todos os clientes
  useEffect(() => {
    fetch('/api/usuario')
      .then(res => res.json())
      .then(data => {
        if (data.ok) setClientes(data.rows.slice(1)) // remove header
      })
  }, [])

  // carrega todas as propriedades
  useEffect(() => {
    fetch('/api/propriedades')
      .then(res => res.json())
      .then(data => {
        if (data.ok) setProperties(data.rows.slice(1))
      })
  }, [])

  return (
    <div className="p-6">
      {/* Cabeçalho com título e botão */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Clientes</h1>
        <Link
          href="/clientes/cadastrar"
          className="bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#D4AF37]/90 transition"
        >
          + Novo Cliente
        </Link>
      </div>

      {/* Tabela dentro de um card */}
      <div className="overflow-x-auto bg-[#2C2C2C] rounded-2xl shadow-lg">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-[#383838]">
              {['Nome', 'Telefone', 'E-mail', 'CPF', 'Propriedade', 'Obs'].map(h => (
                <th
                  key={h}
                  className="text-left px-4 py-2 text-sm font-semibold text-white"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clientes.map((row, i) => {
              const [nome, telefone, email, cpf, obs] = row
              // encontra a propriedade cujo comprador (coluna 59) bate com o nome do cliente
              const prop = properties.find(p => (p[59] || '').trim() === nome)
              // exibe número da propriedade (coluna 2) ou traço
              const propDisplay = prop ? (prop[2] || '—') : '—'

              return (
                <tr
                  key={i}
                  className={i % 2 === 0 ? 'bg-[#2C2C2C]' : 'bg-[#252525]'}
                >
                  <td className="px-4 py-2 text-sm text-white break-words">
                    {nome || '—'}
                  </td>
                  <td className="px-4 py-2 text-sm text-white break-words">
                    {telefone || '—'}
                  </td>
                  <td className="px-4 py-2 text-sm text-white break-words">
                    {email || '—'}
                  </td>
                  <td className="px-4 py-2 text-sm text-white break-words">
                    {cpf || '—'}
                  </td>
                  <td className="px-4 py-2 text-sm text-white break-words">
                    {propDisplay}
                  </td>
                  <td className="px-4 py-2 text-sm text-white break-words">
                    {obs || '—'}
                  </td>
                </tr>
              )
            })}
            {clientes.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-400">
                  Nenhum cliente cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
