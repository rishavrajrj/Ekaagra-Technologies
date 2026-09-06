import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { verifyBusinessOnboardingToken, getBusinessProjectDetails } from '@/lib/businessProjectsDb';
import ClientDesignReviewPortal from '@/components/forms/ClientDesignReviewPortal';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import { ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const verified = await verifyBusinessOnboardingToken(token);

  if (!verified.isValid || !verified.project) {
    return {
      title: 'Design Review | Ekaagra Technologies',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `Design Concept Review — ${verified.project.project_name} | Ekaagra Technologies`,
    description: `Inspect and approve custom design concept for ${verified.project.project_name}.`,
    robots: { index: false, follow: false },
  };
}

export default async function DesignReviewPage({ params }: PageProps) {
  const { token } = await params;

  if (!token || token.trim() === '') {
    notFound();
  }

  const verified = await verifyBusinessOnboardingToken(token);

  if (!verified.isValid || !verified.project) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-[#131B2E] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#E2E8F0] p-8 shadow-xl text-center space-y-6">
          <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-[#131B2E]">Invalid or Expired Design Link</h1>
            <p className="text-xs text-[#64748B] leading-relaxed">
              {verified.error || 'This design review link is invalid or has expired.'}
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 w-full py-3 bg-[#131B2E] hover:bg-[#4338CA] text-white rounded-xl text-xs font-bold transition-colors"
          >
            <span>Return to Ekaagra Homepage</span>
          </Link>
        </div>
      </div>
    );
  }

  const projectDetails = await getBusinessProjectDetails(verified.project.id);
  const activeReview =
    projectDetails.designReviews && projectDetails.designReviews.length > 0
      ? projectDetails.designReviews[0]
      : undefined;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#131B2E]">
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Logo size="sm" />
          </Link>

          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
            🎨 Design Review Portal
          </span>
        </div>
      </header>

      <main className="py-6 sm:py-10">
        <ClientDesignReviewPortal
          token={token}
          project={verified.project}
          activeReview={activeReview}
        />
      </main>
    </div>
  );
}
