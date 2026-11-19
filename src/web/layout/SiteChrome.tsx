export function SiteHeader() {
  return (
    <header className="border-b border-neutral-800 px-4 py-3">
      <h1 className="text-lg font-semibold">RAGDivers</h1>
      <p className="text-sm text-neutral-400">an unofficial Helldivers 2 companion</p>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-800 px-4 py-3 text-xs text-neutral-400">
      RAGDivers is an unofficial fan project, not affiliated with or endorsed by Arrowhead Game Studios or Sony
      Interactive Entertainment.
    </footer>
  )
}
