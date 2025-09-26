import Link from 'next/link';
import Image from 'next/image';

export default function AppHeader({ title, backHref, backLabel = 'Back to Apps' }: { title: string; backHref?: string; backLabel?: string }) {
  return (
    <header
      className="bg-[var(--bg-page)]"
      style={{ borderBottom: '1px solid rgba(229,231,235,0.5)' }}
    >
      <div className="mx-auto max-w-7xl px-4 py-5 flex items-stretch justify-between gap-6">
        <div className="flex items-stretch gap-4">
          <div className="self-stretch flex items-center">
            <Image
              src="/klarna-badge.png"
              alt="Klarna"
              width={169}
              height={72}
              className="h-full w-auto"
              style={{ maxHeight: 56 }}
              priority
            />
          </div>
          <div className="self-center">
            {backHref ? (
              <div>
                <Link
                  href={backHref}
                  className="body-m text-[var(--text-muted)] hover:text-[var(--text-default)] transition-colors"
                >
                  ← {backLabel}
                </Link>
              </div>
            ) : null}
            <h1 className="heading-m text-[var(--text-default)]">{title}</h1>
          </div>
        </div>
        <div className="shrink-0 self-center">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-default)'
            }}
          >
            <span className="opacity-80">MID:</span>
            <span className="font-semibold">N055491</span>
          </div>
        </div>
      </div>
    </header>
  );
}
