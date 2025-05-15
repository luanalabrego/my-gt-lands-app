// src/components/LoginForm.tsx
'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      await signInWithEmailAndPassword(auth, email, senha)
      router.push('/dashboard')
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') setErro('Usuário não encontrado')
      else if (err.code === 'auth/wrong-password') setErro('Senha incorreta')
      else setErro('Erro ao fazer login')
      console.error(err)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="relative w-full max-w-sm sm:max-w-md">
      {/* Ghost box atrás */}
      <div className="absolute inset-0 bg-gray-dark/30 border border-gray-600 rounded-3xl scale-105"></div>

      <form
        onSubmit={handleLogin}
        className="relative bg-gray-dark rounded-3xl shadow-xl p-6 sm:p-8 space-y-6 z-10"
      >
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <Image src="/logo.png" alt="Logo G&T Lands" width={100} height={100} />
        </div>

        <h2 className="text-sm sm:text-base text-gray-300 text-center">
          Faça seu login
        </h2>

        {erro && <p className="text-red-500 text-center">{erro}</p>}

        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 sm:py-3 bg-black border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
              className="w-full px-4 py-2 sm:py-3 bg-black border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={carregando}
          className="
            w-full py-2 sm:py-3
            text-white text-sm sm:text-base font-medium rounded-lg
            bg-[#D4AF37] hover:bg-[#D4AF37]/90
            transition focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-opacity-50
          "
        >
          {carregando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
