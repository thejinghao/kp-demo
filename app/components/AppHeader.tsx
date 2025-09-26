import Link from 'next/link';

export default function AppHeader({ title, backHref, backLabel = 'Back to Apps' }: { title: string; backHref?: string; backLabel?: string }) {
  return (
    <header className="shadow-sm" style={{ backgroundColor: 'var(--bg-container)', borderBottom: '1px solid var(--border-default)' }}>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {backHref ? (
            <Link href={backHref} className="transition-colors text-[var(--text-muted)] hover:text-[var(--text-default)]">
              ← {backLabel}
            </Link>
          ) : (
            <div className="w-20" />
          )}
          <h1 className="text-2xl font-bold text-[var(--text-default)]">{title}</h1>
          <div className="w-20" />
        </div>
      </div>
    </header>
  );
}
