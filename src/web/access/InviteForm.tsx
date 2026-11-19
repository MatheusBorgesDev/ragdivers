'use client'

import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'

export function InviteForm() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSending(true)
    setError(null)
    try {
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      if (response.ok) router.refresh()
      else setError(response.status === 401 ? 'Código inválido.' : 'Não deu para conferir o código. Tente de novo.')
    } catch {
      setError('Não deu para conferir o código. Tente de novo.')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex max-w-sm flex-col gap-2">
      <label htmlFor="invite-code" className="text-sm">
        Código de convite
      </label>
      <input
        id="invite-code"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        placeholder="XXXXX-XXXXX"
        className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 font-mono"
      />
      <button type="submit" disabled={sending || code.trim() === ''} className="rounded bg-yellow-400 px-3 py-2 font-semibold text-neutral-950 disabled:opacity-50">
        Entrar
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </form>
  )
}
