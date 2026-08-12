import * as React from 'react';

interface TechnologyBadgeProps {
  name: string;
  className?: string;
}

export function TechnologyBadge({ name, className = '' }: TechnologyBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200/50 ${className}`}>
      {name}
    </span>
  );
}
