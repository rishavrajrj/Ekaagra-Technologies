import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { verifyBusinessOnboardingToken } from '@/lib/businessProjectsDb';
import BusinessRequirementsForm from '@/components/forms/BusinessRequirementsForm';
import { ShieldAlert, RefreshCw, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const verified = await verifyBusinessOnboardingToken(token);

  if (!verified.isValid || !verified.project) {
    return {
      title: 'Business Requirements Onboarding | Ekaagra Technologies',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `Project Requirements Intake — ${verified.project.project_name} | Ekaagra Technologies`,
    description: `Secure business requirements workspace for ${verified.project.project_name}.`,
    robots: { index: false, follow: false },
  };
}

export default async function BusinessRequirementsPage({ params }: PageProps) {
  const { token } = await params;

  if (!token || token.trim() === '') {
    notFound();
  }

  const verification = await verifyBusinessOnboardingToken(token);

  // If token is invalid, expired, or revoked, show a clean, secure error card
  if (!verification.isValid || !verification.project) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-[#131B2E] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#E2E8F0] p-8 shadow-xl text-center space-y-6">
          <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-[#131B2E]">
              Invalid or Expired Onboarding Link
            </h1>
            <p className="text-xs text-[#64748B] leading-relaxed">
              {verification.error ||
                'This project requirements link is either unrecognized, has expired, or was replaced by an updated link.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] text-xs text-left space-y-2">
            <div className="font-bold text-[#131B2E] uppercase tracking-wider text-[10px]">Need a new link?</div>
            <p className="text-[#64748B]">
              Reach out to your Ekaagra project manager or our technical engineering team in Motihari:
            </p>
            <div className="pt-1 space-y-1 font-mono text-[#4338CA] font-bold">
              <div>Email: ekaagratechnologies@gmail.com</div>
              <div>Phone: +91 94724 64645</div>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 w-full py-3 bg-[#131B2E] hover:bg-[#4338CA] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <span>Return to Ekaagra Homepage</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#131B2E]">
      {/* Top Navbar */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Logo size="sm" />
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold hidden sm:inline">
              🔒 Encrypted Project Workspace
            </span>
          </div>
        </div>
      </header>

      {/* Main Intake Form Container */}
      <main className="py-6 sm:py-10">
        <BusinessRequirementsForm
          token={token}
          project={verification.project}
          client={verification.client}
          initialDraft={verification.draftRequirements}
          initialStep={verification.currentStep || 1}
        />
      </main>
    </div>
  );
}
