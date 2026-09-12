import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSchoolPublicData } from '@/lib/schoolTenant';
import { buildSchoolWebsiteDataFromDb } from '@/lib/schoolWebsiteContract';
import SchoolWebsiteRenderer from '@/components/schools/website-engine/SchoolWebsiteRenderer';

interface SchoolSlugPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: SchoolSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSchoolPublicData(slug);
  if (!data) {
    return {
      title: 'School Not Found | Ekaagra School Platform',
      description: 'The requested school portal does not exist.',
    };
  }

  const schoolName = data.school.display_name || data.school.name;
  return {
    title: `${schoolName} | Official Portal`,
    description: `Official digital portal for ${schoolName}. Explore admissions, academics, notices, and facilities.`,
  };
}

export default async function SchoolSlugPage({ params }: SchoolSlugPageProps) {
  const { slug } = await params;
  const data = await getSchoolPublicData(slug);

  if (!data) {
    notFound();
  }

  const { school, profile, branding, campuses, transportEnabled } = data;

  // Build the normalized SchoolWebsiteData contract from database entities
  const websiteData = buildSchoolWebsiteDataFromDb(
    school,
    profile,
    branding,
    campuses,
    transportEnabled
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <SchoolWebsiteRenderer data={websiteData} viewMode="full" />
    </div>
  );
}
