import * as React from 'react';

interface ProcessStepProps {
  number: string;
  title: string;
  description: string;
  isLast?: boolean;
  className?: string;
}

export function ProcessStep({ number, title, description, isLast = false, className = '' }: ProcessStepProps) {
  return (
    <div className={`relative flex gap-6 ${className}`}>
      <div className="flex flex-col items-center">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600">
          {number}
        </div>
        {!isLast && (
          <div className="my-2 h-full w-px bg-slate-200" aria-hidden="true" />
        )}
      </div>
      <div className={`pt-2 ${!isLast ? 'pb-10' : ''}`}>
        <h3 className="mb-2 text-xl font-bold text-slate-900">{title}</h3>
        <p className="text-slate-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default ProcessStep;
