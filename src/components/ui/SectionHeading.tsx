import * as React from 'react';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  alignment?: 'left' | 'center';
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  alignment = 'left',
  className = '',
}: SectionHeadingProps) {
  return (
    <div
      className={`flex flex-col ${
        alignment === 'center'
          ? 'items-center text-center mx-auto'
          : 'items-start text-left'
      } ${className}`}
    >
      {eyebrow && (
        <span className="section-eyebrow-badge mb-2.5">
          {eyebrow}
        </span>
      )}
      <h2 className="fluid-section-headline font-extrabold text-[#131B2E] tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="section-supporting-subtitle mt-2.5 sm:mt-3 text-slate-600 font-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
}
