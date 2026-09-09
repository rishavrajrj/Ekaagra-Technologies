'use client';

import dynamic from 'next/dynamic';
import type { PublicTransportMapModel } from '@/lib/publicTransportUtils';

const PublicTransportRouteMap = dynamic(
  () => import('@/components/schools/maps/PublicTransportRouteMap'),
  { ssr: false }
);

interface SchoolTransportMapEmbedProps {
  model: PublicTransportMapModel;
  schoolBrandingColor?: string;
  className?: string;
}

export default function SchoolTransportMapEmbed({
  model,
  schoolBrandingColor,
  className,
}: SchoolTransportMapEmbedProps) {
  return (
    <PublicTransportRouteMap
      model={model}
      schoolBrandingColor={schoolBrandingColor}
      className={className}
    />
  );
}
