import type { Metadata } from 'next';
import SchoolOnboardingPortal from '@/components/schools/SchoolOnboardingPortal';
import { getSchoolsServerClient } from '@/lib/schoolsDb';

export const metadata: Metadata = {
  title: 'School Project Onboarding Portal | Ekaagra Technologies',
  description: 'Access your confirmed school project onboarding workspace.',
};

export const dynamic = 'force-dynamic';

export default async function SchoolOnboardingPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; token?: string }>;
}) {
  const { project, token } = await searchParams;

  let activeToken = token;

  if (!activeToken && project) {
    const schoolsDb = getSchoolsServerClient();
    if (schoolsDb) {
      const { data: proj } = await schoolsDb
        .from('school_projects')
        .select('id')
        .eq('project_number', project)
        .maybeSingle();

      if (proj) {
        const { data: inv } = await schoolsDb
          .from('school_onboarding_invitations')
          .select('token_hash')
          .eq('school_project_id', proj.id)
          .eq('is_revoked', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (inv) {
          activeToken = inv.token_hash;
        }
      }
    }
  }

  return <SchoolOnboardingPortal token={activeToken || ''} />;
}
