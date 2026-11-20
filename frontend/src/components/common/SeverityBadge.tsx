interface SeverityBadgeProps {
  severity: string;
}

const severityConfig: Record<string, { label: string; className: string }> = {
  critical: {
    label: 'Critical',
    className: 'bg-red-500/15 text-red-400 border-red-500/30',
  },
  high: {
    label: 'High',
    className: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  },
  medium: {
    label: 'Medium',
    className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  },
  low: {
    label: 'Low',
    className: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  },
  none: {
    label: 'None',
    className: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  },
};

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  const key = severity.toLowerCase();
  const config = severityConfig[key] ?? {
    label: severity,
    className: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
