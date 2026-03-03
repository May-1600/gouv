import Link from 'next/link'

export default function Home() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--background)]">
      {/* Gradient background circles */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-[var(--era-optimism)] opacity-10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-[var(--era-present)] opacity-10 blur-[100px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-[var(--era-recovery)] opacity-5 blur-[80px]" />

      <main className="relative z-10 mx-auto max-w-2xl px-6 text-center">
        <div className="glass-panel p-10 sm:p-14">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-gray-500">
            2017 — 2027
          </p>
          <h1
            className="mb-4 text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl"
            style={{ fontFamily: 'var(--font-title)' }}
          >
            Chrono-Macron
          </h1>
          <p
            className="mb-8 text-base leading-relaxed text-gray-600 sm:text-lg"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Une exploration immersive des données publiques françaises
            à travers les mandats présidentiels d&apos;Emmanuel Macron.
          </p>

          <Link
            href="/experience"
            className="inline-block rounded-xl bg-[var(--foreground)] px-8 py-3.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg active:scale-100"
            style={{ fontFamily: 'var(--font-title)' }}
          >
            Explorer la timeline
          </Link>

          <div className="mt-8 flex justify-center gap-6 text-xs text-gray-400">
            <span>6 événements clés</span>
            <span>·</span>
            <span>3 indicateurs</span>
            <span>·</span>
            <span>Données INSEE &amp; BdF</span>
          </div>
        </div>
      </main>
    </div>
  )
}
