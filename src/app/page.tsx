import { cookies } from 'next/headers'
import { INVITE_COOKIE, inviteFromCookieValue } from '@/server/access/session'
import { getSql } from '@/server/db/client'
import { InviteForm } from '@/web/access/InviteForm'

export default async function Home() {
  const store = await cookies()
  const invite = await inviteFromCookieValue(store.get(INVITE_COOKIE)?.value, getSql())

  if (!invite) {
    return (
      <section className="flex flex-col gap-6">
        <p>O RAGDivers está aberto só para convidados, por enquanto.</p>
        <InviteForm />
        <p className="text-sm text-neutral-400">Demonstração em breve.</p>
      </section>
    )
  }

  return <p>Convite aceito. O chat chega na próxima etapa.</p>
}
