import React from 'react';

export default function Footer() {
  return (
    <footer
      className=""
      style={{ backgroundColor: 'var(--bg-container)', borderTop: '1px solid var(--border-default)' }}
    >
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-between text-sm">
          <p className="text-[var(--text-default)]">Klarna Developer Playground</p>
          <p className="text-[var(--text-muted)]">Built for integration testing and demos</p>
        </div>
      </div>
    </footer>
  );
}
