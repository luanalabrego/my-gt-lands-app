// src/app/login/page.tsx

import LoginForm from '@/components/LoginForm'

export const metadata = {
  title: 'Login – G&T Lands',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 py-8">
      <LoginForm />
    </div>
  )
}
