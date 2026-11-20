import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: LucideIcon;
  action?: ReactNode;
}

export default function EmptyState({
  title,
  message,
  icon: Icon = Inbox,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="rounded-full bg-dark-700 p-4">
        <Icon className="h-10 w-10 text-slate-500" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
        <p className="mt-1 max-w-md text-sm text-slate-400">{message}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
