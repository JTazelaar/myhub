export function EmptyState({ emoji = '⛳', title, subtitle }: { emoji?: string; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-green-200 bg-green-50/50 py-16 text-center">
      <span className="text-5xl">{emoji}</span>
      <p className="font-display text-lg font-semibold text-green-800">{title}</p>
      {subtitle && <p className="max-w-md text-sm text-green-600">{subtitle}</p>}
    </div>
  );
}
