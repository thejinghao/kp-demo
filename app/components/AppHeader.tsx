import Link from 'next/link';

export default function AppHeader({ title, backHref, backLabel = 'Back to Apps' }: { title: string; backHref?: string; backLabel?: string }) {
  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {backHref ? (
            <Link href={backHref} className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              ← {backLabel}
            </Link>
          ) : (
            <div className="w-20" />
          )}
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
          <div className="w-20" />
        </div>
      </div>
    </header>
  );
}
