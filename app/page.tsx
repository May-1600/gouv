import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1
        className="text-5xl font-bold tracking-tight"
        style={{ fontFamily: 'var(--font-title)' }}
      >
        Chrono-Macron
      </h1>
      <p className="max-w-lg text-center text-lg text-gray-600">
        Explorez les mandats présidentiels 2017–2027 à travers les données publiques
        françaises, dans un paysage 3D interactif.
      </p>
      <Link
        href="/experience"
        className="glass-panel px-8 py-4 text-lg font-semibold transition-transform hover:scale-105"
        style={{ fontFamily: 'var(--font-title)' }}
      >
        Entrer dans l&apos;expérience →
      </Link>
      <p className="mt-12 text-sm text-gray-400">
        Données : INSEE, Banque de France, data.gouv.fr — Licence Ouverte
      </p>
    </main>
  )
}
