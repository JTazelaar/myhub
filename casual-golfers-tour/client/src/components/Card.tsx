import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white shadow-md ring-1 ring-green-100 p-5 ${className}`}>{children}</div>
  );
}
