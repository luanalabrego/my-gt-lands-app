'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Cliente = [string, string, string, string, string] // [nome, telefone, email, cpf, obs]

export default function ListaClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])

  useEffect(() => {
    fetch('/api/clientes')
      .then(res => res.json())
      .then(data => {
        if (data.ok) setClientes(data.rows.slice(1)) // remove header
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
              {['Nome', 'Telefone', 'E-mail', 'CPF', 'Obs'].map((h) => (
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
            {clientes.map((row, i) => (
              <tr
                key={i}
                className={i % 2 === 0 ? 'bg-[#2C2C2C]' : 'bg-[#252525]'}
              >
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className="px-4 py-2 text-sm text-white break-words"
                  >
                    {cell || '—'}
                  </td>
                ))}
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-6 text-gray-400"
                >
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
