/**
 * Home Page — placeholder
 *
 * Propósito: rota raiz. Será substituída pelo Marketplace na Fase 4.
 * Por enquanto: smoke test do setup (Tailwind + design tokens funcionando).
 */
export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="card max-w-md w-full bg-card border border-border rounded-xl p-8 shadow-lg text-center">
        <div className="display text-3xl font-bold text-text mb-2">RadarAuto</div>
        <p className="text-muted text-sm mb-6">
          Setup pronto. Próximo passo: implementar features.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold text-sm">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          Ambiente OK
        </div>
      </div>
    </main>
  );
}
