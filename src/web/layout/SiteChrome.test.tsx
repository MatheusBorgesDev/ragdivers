import { render, screen } from '@testing-library/react'
import { SiteFooter, SiteHeader } from './SiteChrome'

it('shows the subtitle and the non-affiliation notice', () => {
  render(
    <>
      <SiteHeader />
      <SiteFooter />
    </>,
  )
  expect(screen.getByRole('heading', { name: 'RAGDivers' })).toBeInTheDocument()
  expect(screen.getByText('an unofficial Helldivers 2 companion')).toBeInTheDocument()
  expect(screen.getByRole('contentinfo')).toHaveTextContent(/not affiliated.*Arrowhead.*Sony/i)
})
