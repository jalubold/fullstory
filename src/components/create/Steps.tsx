import { Check } from 'lucide-react';

const STEPS = ['Design', 'Photos', 'Customize', 'Share'];

export function Steps({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2 text-xs sm:gap-3" aria-label="Progress">
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-2 sm:gap-3">
          <span
            className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-medium ${i < current ? 'bg-ink text-paper' : i === current ? 'bg-accent text-white' : 'bg-paper-2 text-muted'}`}
            aria-current={i === current ? 'step' : undefined}
          >
            {i < current ? <Check size={12} /> : i + 1}
          </span>
          <span className={`hidden sm:inline ${i === current ? 'text-ink' : 'text-muted'}`}>{s}</span>
          {i < STEPS.length - 1 && <span className="h-px w-4 bg-line-strong sm:w-8" />}
        </li>
      ))}
    </ol>
  );
}
