import type { Format } from '../types';
import { FORMAT_LABELS } from '../types';

const FORMAT_STYLES: Record<Format, string> = {
  scramble: 'bg-violet-100 text-violet-700',
  best_ball: 'bg-sky-100 text-sky-700',
  alternate_shot: 'bg-amber-100 text-amber-700',
  one_v_one: 'bg-rose-100 text-rose-700'
};

export function FormatBadge({ format }: { format: Format }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${FORMAT_STYLES[format]}`}>
      {FORMAT_LABELS[format]}
    </span>
  );
}
