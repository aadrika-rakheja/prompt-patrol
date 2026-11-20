import type { Verdict } from '../../types';

interface VerdictBadgeProps {
  verdict: Verdict;
}

const verdictConfig: Record<
  Verdict,
  { label: string; className: string }
> = {
  blocked: {
    label: 'Blocked',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  succeeded: {
    label: 'Succeeded',
    className: 'bg-red-500/15 text-red-400 border-red-500/30',
  },
  benign_pass: {
    label: 'Benign Pass',
    className: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  },
  false_positive: {
    label: 'False Positive',
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  error: {
    label: 'Error',
    className: 'bg-red-900/30 text-red-300 border-red-800/40',
  },
  inconclusive: {
    label: 'Inconclusive',
    className: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  },
};

export default function VerdictBadge({ verdict }: VerdictBadgeProps) {
  const config = verdictConfig[verdict] ?? verdictConfig.inconclusive;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
