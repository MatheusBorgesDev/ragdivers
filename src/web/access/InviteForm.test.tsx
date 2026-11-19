import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InviteForm } from './InviteForm'

const refresh = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

afterEach(() => {
  vi.unstubAllGlobals()
  refresh.mockReset()
})

it('shows "Código inválido." after a 401', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ error: 'invalid_code' }, { status: 401 })))
  render(<InviteForm />)
  await userEvent.type(screen.getByLabelText('Código de convite'), 'ZZZZZ-ZZZZZ')
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Código inválido.')
  expect(refresh).not.toHaveBeenCalled()
})

it('refreshes the page after a valid code', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ role: 'friend', consented: false })))
  render(<InviteForm />)
  await userEvent.type(screen.getByLabelText('Código de convite'), 'K7M2Q-9XH4T')
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  await vi.waitFor(() => expect(refresh).toHaveBeenCalledOnce())
})
