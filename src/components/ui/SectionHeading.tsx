import * as React from 'react';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  alignment?: 'left' | 'center';
  className?: string;
}

export function SectionHeading({ title, subtitle, alignment = 'left', className = '' }: SectionHeadingProps) {
  return (
    <div className={`flex flex-col gap-2 ${alignment === 'center' ? 'items-center text-center' : 'items-start text-left'} ${className}`}>
      <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="max-w-2xl text-lg text-slate-600">
          {subtitle}
        </p>
      )}
    </div>
  );
}
