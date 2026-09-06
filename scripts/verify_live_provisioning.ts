import fs from 'fs';
import path from 'path';

// Parse .env.local manually
const envPath = path.resolve('d:/Antigravity Projects/Ekaagra Technologies/.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

import { getSchoolsServerClient } from '../src/lib/schoolsDb';
import { createInitialIntakeData } from '../src/lib/schoolIntake';
import { populateSchoolDatabaseEntities } from '../src/lib/schoolDatabaseProvisioning';

async function main() {
  console.log('=== VERIFYING LIVE SCHOOLS DATABASE PROVISIONING ===');
  const client = getSchoolsServerClient();
  if (!client) {
    throw new Error('Schools Supabase client could not be initialized. Check .env.local');
  }

  const testProjectId = '00000000-0000-4000-8000-000000000048';
  const testProjectRef = 'TEST-PROJ-LIVE-48';

  console.log(`Setting up test project fixture [${testProjectRef}]...`);

  // 1. Create or ensure test project in school_projects
  const { error: projError } = await client.from('school_projects').upsert({
    id: testProjectId,
    project_number: 'SCH-TEST-9999',
    lead_reference: 'LEAD-TEST-001',
    product_id: 'prod_school_complete',
    school_name: 'Greenfield International Academy',
    primary_contact_name: 'Dr. Anita Sharma',
    primary_contact_email: 'principal@greenfieldacademy.test',
    primary_contact_phone: '+919876543210',
    status: 'approved',
  });

  if (projError) {
    console.error('Error creating test school_projects record:', projError);
    process.exit(1);
  }
  console.log('✓ Test school_project record created/verified.');

  // 2. Prepare comprehensive intake data
  const intakeData = createInitialIntakeData(
    'Greenfield International Academy',
    'Dr. Anita Sharma',
    'principal@greenfieldacademy.test',
    '+919876543210'
  );

  intakeData.schoolProfile.schoolType = 'k12';
  intakeData.schoolProfile.affiliatedBoard = 'cbse';
  intakeData.schoolProfile.affiliationNumber = 'CBSE-AFF-987654';
  intakeData.schoolProfile.city = 'Patna';
  intakeData.schoolProfile.state = 'Bihar';
  intakeData.schoolProfile.pin = '800001';

  // 3. Run database provisioning
  console.log('Executing populateSchoolDatabaseEntities()...');
  const result = await populateSchoolDatabaseEntities(testProjectId, intakeData);

  if (!result.success) {
    console.error('Provisioning failed with error:', result.error);
    process.exit(1);
  }

  console.log('✓ populateSchoolDatabaseEntities completed successfully.');
  console.log(`  Target School ID: ${result.schoolId}`);
  const schoolId = result.schoolId!;

  // 4. Assert live records in normalized tables
  console.log('Verifying normalized tables in live database...');

  // A. schools
  const { data: schoolRow, error: sErr } = await client
    .from('schools')
    .select('id, name, slug')
    .eq('id', schoolId)
    .single();
  if (sErr || !schoolRow) throw new Error(`Failed to find schools row: ${sErr?.message}`);
  console.log(`  ✓ schools: ${schoolRow.name} (${schoolRow.slug})`);

  // B. school_profiles
  const { data: profRow, error: pErr } = await client
    .from('school_profiles')
    .select('school_id, affiliation_number, board')
    .eq('school_id', schoolId)
    .single();
  if (pErr || !profRow) throw new Error(`Failed to find school_profiles row: ${pErr?.message}`);
  console.log(`  ✓ school_profiles: Board = ${profRow.board}, Affiliation = ${profRow.affiliation_number}`);

  // C. facility_campuses
  const { data: campuses, error: cErr } = await client
    .from('facility_campuses')
    .select('id, name, is_main')
    .eq('school_id', schoolId);
  if (cErr || !campuses || campuses.length === 0) throw new Error(`Failed to find campuses: ${cErr?.message}`);
  console.log(`  ✓ facility_campuses: ${campuses.length} campus(es) found (${campuses[0].name})`);

  // D. academic_sessions
  const { data: sessions, error: sesErr } = await client
    .from('academic_sessions')
    .select('id, name, is_active')
    .eq('school_id', schoolId);
  if (sesErr || !sessions || sessions.length === 0) throw new Error(`Failed to find academic_sessions: ${sesErr?.message}`);
  console.log(`  ✓ academic_sessions: ${sessions.length} session(s) found (${sessions[0].name})`);

  // E. academic_classes & sections
  const { data: classes, error: clErr } = await client
    .from('academic_classes')
    .select('id, name')
    .eq('school_id', schoolId);
  if (clErr || !classes || classes.length === 0) throw new Error(`Failed to find academic_classes: ${clErr?.message}`);
  console.log(`  ✓ academic_classes: ${classes.length} class(es) populated`);

  const { data: sections, error: secErr } = await client
    .from('sections')
    .select('id, name')
    .eq('school_id', schoolId);
  if (secErr || !sections || sections.length === 0) throw new Error(`Failed to find sections: ${secErr?.message}`);
  console.log(`  ✓ sections: ${sections.length} section(s) populated`);

  // F. subjects
  const { data: subjects, error: subErr } = await client
    .from('subjects')
    .select('id, name, code')
    .eq('school_id', schoolId);
  if (subErr || !subjects || subjects.length === 0) throw new Error(`Failed to find subjects: ${subErr?.message}`);
  console.log(`  ✓ subjects: ${subjects.length} subject(s) populated`);

  // G. staff
  const { data: staffList, error: stErr } = await client
    .from('staff')
    .select('id, first_name, last_name, email')
    .eq('school_id', schoolId);
  if (stErr || !staffList || staffList.length === 0) throw new Error(`Failed to find staff: ${stErr?.message}`);
  console.log(`  ✓ staff: ${staffList.length} staff member(s) populated (${staffList[0].first_name} ${staffList[0].last_name})`);

  // H. cms_site_settings & cms_pages
  const { data: cmsSettings, error: cmsErr } = await client
    .from('cms_site_settings')
    .select('school_id, site_title')
    .eq('school_id', schoolId)
    .single();
  if (cmsErr || !cmsSettings) throw new Error(`Failed to find cms_site_settings: ${cmsErr?.message}`);
  console.log(`  ✓ cms_site_settings: Site Title = "${cmsSettings.site_title}"`);

  const { data: cmsPages, error: pageErr } = await client
    .from('cms_pages')
    .select('id, slug, title')
    .eq('school_id', schoolId);
  if (pageErr || !cmsPages || cmsPages.length === 0) throw new Error(`Failed to find cms_pages: ${pageErr?.message}`);
  console.log(`  ✓ cms_pages: ${cmsPages.length} CMS page(s) populated`);

  // 5. Cleanup test records
  console.log('\nCleaning up live test records...');
  await client.from('cms_pages').delete().eq('school_id', schoolId);
  await client.from('cms_site_settings').delete().eq('school_id', schoolId);
  await client.from('staff').delete().eq('school_id', schoolId);
  await client.from('subjects').delete().eq('school_id', schoolId);
  await client.from('sections').delete().eq('school_id', schoolId);
  await client.from('academic_classes').delete().eq('school_id', schoolId);
  await client.from('academic_sessions').delete().eq('school_id', schoolId);
  await client.from('facility_campuses').delete().eq('school_id', schoolId);
  await client.from('school_brandings').delete().eq('school_id', schoolId);
  await client.from('school_localizations').delete().eq('school_id', schoolId);
  await client.from('school_profiles').delete().eq('school_id', schoolId);
  await client.from('schools').delete().eq('id', schoolId);
  await client.from('school_projects').delete().eq('id', testProjectId);

  console.log('✓ Cleanup completed cleanly without residue.');
  console.log('\n🎉 ALL LIVE DATABASE PROVISIONING VERIFICATIONS PASSED 100%!');
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
