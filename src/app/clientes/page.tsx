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
      <h1 className="text-2xl font-bold mb-4">Clientes</h1>
      <Link
        href="/clientes/cadastrar"
        className="inline-block mb-4 bg-blue-600 text-white px-4 py-2 rounded"
      >
        + Novo Cliente
      </Link>

      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-200">
            {['Nome','Telefone','E-mail','CPF','Obs'].map(h => (
              <th key={h} className="border px-2 py-1 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {clientes.map((row, i) => (
            <tr key={i} className="even:bg-gray-100">
              {row.map((cell, j) => (
                <td key={j} className="border px-2 py-1">{cell || '—'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
