'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CadastrarClientePage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [cpf, setCpf] = useState('')
  const [obs, setObs] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      setError('O nome do cliente é obrigatório.')
      return
    }
    setError('')

    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, telefone, email, cpf, obs }),
      })
      const data = await res.json()
      if (!data.ok) {
        setError(data.error || 'Falha ao cadastrar cliente.')
        return
      }
      router.push('/clientes')
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar com o servidor.')
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Novo Cliente</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-[#2C2C2C] p-6 rounded-2xl shadow-lg"
      >
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div>
          <label className="block text-white mb-1">Nome do Cliente*</label>
          <input
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-[#383838] text-white"
          />
        </div>

        <div>
          <label className="block text-white mb-1">Telefone</label>
          <input
            type="tel"
            value={telefone}
            onChange={e => setTelefone(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#383838] text-white"
          />
        </div>

        <div>
          <label className="block text-white mb-1">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#383838] text-white"
          />
        </div>

        <div>
          <label className="block text-white mb-1">CPF</label>
          <input
            type="text"
            value={cpf}
            onChange={e => setCpf(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#383838] text-white"
          />
        </div>

        <div>
          <label className="block text-white mb-1">Obs</label>
          <textarea
            value={obs}
            onChange={e => setObs(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-[#383838] text-white"
          />
        </div>

        <div className="flex justify-end space-x-4 mt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-500 transition"
          >
            Voltar
          </button>
          <button
            type="submit"
            className="bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#D4AF37]/90 transition"
          >
            Salvar Cliente
          </button>
        </div>
      </form>
    </div>
  )
}
