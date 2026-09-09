import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import SchoolQuoteConfigurator from '@/components/schools/SchoolQuoteConfigurator';
import type { SchoolProductId } from '@/lib/schoolPricing';
import {
  createPageMetadata,
  webPageSchema,
  serviceSchema,
  SITE_URL,
} from '@/lib/seo.config';

export const metadata: Metadata = createPageMetadata({
  title: 'Configure Your School Technology Plan | Ekaagra Technologies',
  description:
    'Calculate transparent Year 1 setup and annual renewal estimates for your school website, CMS, and student-tiered ERP platform. Select modules, check domain availability, and receive a formal institutional proposal.',
  path: '/schools/configure',
  keywords: [
    'school ERP quote calculator',
    'school website pricing estimate',
    'school management system configurator',
    'CBSE school technology package',
    'school ERP Bihar cost',
  ],
});

interface ConfigurePageProps {
  searchParams?: Promise<{ plan?: string }>;
}

const VALID_PRODUCT_IDS: SchoolProductId[] = [
  'school-website',
  'school-website-cms',
  'school-erp',
  'school-complete',
];

export default async function ConfigureSchoolPlanPage({
  searchParams,
}: ConfigurePageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const rawPlan = resolvedParams?.plan;
  const initialProductId: SchoolProductId =
    rawPlan && VALID_PRODUCT_IDS.includes(rawPlan as SchoolProductId)
      ? (rawPlan as SchoolProductId)
      : 'school-complete';

  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      {/* Structured Data Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageSchema({
              name: 'Configure Your School Plan | Ekaagra Technologies',
              description:
                'Interactive 8-step configurator to tailor school website, CMS, and ERP capacity with instant transparent estimates.',
              url: `${SITE_URL}/schools/configure`,
            })
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            serviceSchema({
              name: 'School Technology Plan Configurator',
              description:
                'Customized institutional quotes for school websites, staff CMS, and student-tiered ERP systems.',
              url: `${SITE_URL}/schools/configure`,
            })
          ),
        }}
      />

      <div className="site-container pt-6 pb-2">
        <Breadcrumbs
          items={[
            { label: 'School Solutions', href: '/schools' },
            { label: 'Plan Configurator' },
          ]}
        />
      </div>

      {/* Header Banner */}
      <div className="site-container py-6 border-b border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <Link
              href="/schools"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4338CA] hover:text-[#3730A3] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to School Solutions Overview</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] tracking-tight">
              Configure Your School Plan
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Step-by-step interactive specification: select your product tier, capacity, optional modules, and domain allowance to generate a verified institutional proposal.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2 p-3 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs text-xs text-[#131B2E]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-extrabold block">Transparent Pricing</span>
              <span className="text-[11px] text-[#64748B]">Zero hidden renewal or setup costs</span>
            </div>
          </div>
        </div>
      </div>

      {/* 8-Step Interactive Configurator Component */}
      <div className="site-container py-8 sm:py-12">
        <div className="max-w-5xl mx-auto">
          <SchoolQuoteConfigurator initialProductId={initialProductId} />
        </div>
      </div>
    </div>
  );
}
