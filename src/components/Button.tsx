import Link from 'next/link'
import React from 'react'

interface ButtonProps extends React.ComponentProps<typeof Link> {
  variant?: 'gold' // você pode adicionar outros no futuro
}

export default function Button({
  variant = 'gold',
  className = '',
  ...props
}: ButtonProps) {
  const base = 'px-4 py-2 rounded-lg font-medium transition'
  const variants = {
    gold: 'bg-gold text-black border border-gold hover:bg-gold/90',
    // se quiser, adicione silver, danger, etc.
  }
  return (
    <Link
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
