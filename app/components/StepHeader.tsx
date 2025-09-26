import { ReactNode } from 'react';

export default function StepHeader({ number, title, right, children }: { number: string | number; title: string; right?: ReactNode; children?: ReactNode }) {
  return (
    <div className="step mb-4">
      <div className="step-number">{number}</div>
      <div className="step-title-row">
        <h3 className="heading-s text-[var(--text-default)]">{title}</h3>
        {right}
      </div>
      {children ? (
        <p className="step-body body-s text-[var(--text-muted)]">{children}</p>
      ) : null}
    </div>
  );
}
