'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CadastrarClientePage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  // ... outros campos ...

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // chamar sua API para criar cliente...
    router.push('/clientes') // volta pra lista
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-white">Cadastrar Cliente</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={e => setNome(e.target.value)}
          className="w-full px-3 py-2 rounded-lg"
          required
        />
        {/* outros inputs aqui */}
        <button
          type="submit"
          className="bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#D4AF37]/90 transition"
        >
          Salvar
        </button>
      </form>
    </div>
  )
}
