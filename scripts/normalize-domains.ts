/**
 * Ekaagra Technologies — Domain Architecture Normalization & Data Cleanup Script
 * Run with: node --env-file=.env.local -r tsx/register scripts/normalize-domains.ts
 */

import { createClient } from '@supabase/supabase-js';

async function run() {
  console.log('===============================================================');
  console.log('EKAAGRA OPERATIONS HQ — DATA DOMAIN NORMALIZATION');
  console.log('===============================================================\n');

  const mainUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const mainKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  const schoolsUrl = process.env.SCHOOLS_SUPABASE_URL;
  const schoolsKey = process.env.SCHOOLS_SUPABASE_SERVICE_ROLE_KEY || process.env.SCHOOLS_SUPABASE_ANON_KEY;

  if (!mainUrl || !mainKey) {
    console.error('ERROR: Main Supabase credentials not found in environment.');
    process.exit(1);
  }

  const mainDb = createClient(mainUrl, mainKey);
  const schoolsDb = schoolsUrl && schoolsKey ? createClient(schoolsUrl, schoolsKey) : null;

  console.log('1. Checking Main DB projects for school contamination...');
  const { data: allProjects, error: projErr } = await mainDb
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (projErr) {
    console.error('Failed to fetch projects:', projErr.message);
    process.exit(1);
  }

  console.log(`Found ${allProjects.length} total records in Main DB 'projects' table.`);

  // 1. Separate School Projects in Main DB
  const schoolInMain = allProjects.filter(
    (p) =>
      p.project_type === 'SCHOOL' ||
      p.project_number?.startsWith('SCH-') ||
      /school|sparknest|academy|vidyalaya/i.test(p.project_name || '')
  );

  console.log(`Identified ${schoolInMain.length} rogue school record(s) in Main DB 'projects':`);
  for (const sProj of schoolInMain) {
    console.log(`  - [${sProj.project_number}] ${sProj.project_name} (ID: ${sProj.id})`);

    // Verify it exists in Schools DB
    if (schoolsDb) {
      const { data: inSchoolsDb } = await schoolsDb
        .from('school_projects')
        .select('id, project_number, school_name')
        .or(`project_number.eq.${sProj.project_number},school_name.ilike.%${sProj.project_name}%`)
        .maybeSingle();

      if (inSchoolsDb) {
        console.log(`    ✓ Preserved in Schools DB as: [${inSchoolsDb.project_number}] ${inSchoolsDb.school_name}`);
      } else {
        console.log(`    ⚠️ Not in Schools DB — syncing to Schools DB first...`);
        await schoolsDb.from('school_projects').insert([
          {
            project_number: sProj.project_number,
            school_name: sProj.project_name,
            product_id: 'school-website',
            status: 'onboarding_in_progress',
            completeness_percentage: 15,
            primary_contact_name: 'School Administrator',
            primary_contact_email: 'admin@school.com',
            primary_contact_phone: '9472464645',
            city: 'Motihari',
            state: 'Bihar',
            source_system: 'EKAAGRA_MIGRATION',
          },
        ]);
        console.log(`    ✓ Synced to Schools DB.`);
      }
    }

    // Clean child records from Main DB to avoid foreign key violations
    await mainDb.from('business_onboarding_tokens').delete().eq('project_id', sProj.id);
    await mainDb.from('business_requirements').delete().eq('project_id', sProj.id);
    await mainDb.from('business_requirement_submissions').delete().eq('project_id', sProj.id);
    await mainDb.from('business_requirement_assets').delete().eq('project_id', sProj.id);
    await mainDb.from('design_reviews').delete().eq('project_id', sProj.id);
    await mainDb.from('project_activity').delete().eq('project_id', sProj.id);
    await mainDb.from('project_notes').delete().eq('project_id', sProj.id);

    // Delete rogue school project from Main DB projects table
    const { error: delErr } = await mainDb.from('projects').delete().eq('id', sProj.id);
    if (delErr) {
      console.error(`    ✗ Failed to remove from Main DB:`, delErr.message);
    } else {
      console.log(`    ✓ Safely removed rogue school project from Main DB Business projects table.`);
    }
  }

  // 2. Deduplicate repeated test runs in Business Projects
  console.log('\n2. Deduplicating repeated test entries in Business Projects...');
  const { data: currentBusinessProjects } = await mainDb
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  const seenNames = new Map<string, string>(); // name -> keptId
  let duplicateCount = 0;

  for (const p of currentBusinessProjects || []) {
    const key = p.project_name.trim().toLowerCase();
    // Only deduplicate obvious test runs with multiple copies
    if (key === 'apex industrial website' || key === 'bravo logistics') {
      if (!seenNames.has(key)) {
        seenNames.set(key, p.id);
        console.log(`  Keeping latest canonical copy: [${p.project_number}] ${p.project_name}`);
      } else {
        // Redundant duplicate test copy
        await mainDb.from('business_onboarding_tokens').delete().eq('project_id', p.id);
        await mainDb.from('business_requirements').delete().eq('project_id', p.id);
        await mainDb.from('business_requirement_submissions').delete().eq('project_id', p.id);
        await mainDb.from('business_requirement_assets').delete().eq('project_id', p.id);
        await mainDb.from('design_reviews').delete().eq('project_id', p.id);
        await mainDb.from('project_activity').delete().eq('project_id', p.id);
        await mainDb.from('project_notes').delete().eq('project_id', p.id);
        await mainDb.from('projects').delete().eq('id', p.id);
        duplicateCount++;
      }
    }
  }
  console.log(`  ✓ Removed ${duplicateCount} redundant test-run duplicate rows.`);

  // 3. Normalize all remaining Business Projects
  console.log('\n3. Enforcing domain = "BUSINESS" on remaining projects...');
  const { data: remainingProjects } = await mainDb.from('projects').select('id, project_number, project_name');
  for (const p of remainingProjects || []) {
    await mainDb
      .from('projects')
      .update({
        project_type: 'BUSINESS',
        domain: 'BUSINESS',
      })
      .eq('id', p.id);
    console.log(`  ✓ [${p.project_number}] ${p.project_name} -> domain: BUSINESS`);
  }

  // 4. Normalize Leads
  console.log('\n4. Normalizing Leads domain tagging...');
  const { data: leads } = await mainDb.from('leads').select('*');
  let schoolLeadsCount = 0;
  let businessLeadsCount = 0;

  for (const l of leads || []) {
    const isSchool = Boolean(
      l.commercial_product_id?.toLowerCase().includes('school') ||
      l.service?.toLowerCase().includes('school') ||
      l.project_type?.toLowerCase().includes('school') ||
      l.description?.toLowerCase().includes('school name:') ||
      (l.organization && /school|vidyalaya|academy|institution|college|convent|gurukul/i.test(l.organization))
    );

    const targetDomain = isSchool ? 'SCHOOL' : 'BUSINESS';
    await mainDb.from('leads').update({ lead_domain: targetDomain }).eq('id', l.id);

    if (isSchool) schoolLeadsCount++;
    else businessLeadsCount++;
  }
  console.log(`  ✓ Classified ${schoolLeadsCount} School leads and ${businessLeadsCount} Business leads.`);

  // 5. Normalize Orders
  console.log('\n5. Normalizing Orders domain tagging...');
  const { data: orders } = await mainDb.from('orders').select('*');
  let schoolOrdersCount = 0;
  let businessOrdersCount = 0;

  for (const o of orders || []) {
    const isSchool = Boolean(
      o.service_type?.toLowerCase().includes('school') ||
      o.plan_id?.toLowerCase().includes('school') ||
      o.metadata?.domain === 'SCHOOL'
    );

    const targetDomain = isSchool ? 'SCHOOL' : 'BUSINESS';
    await mainDb.from('orders').update({ domain: targetDomain }).eq('id', o.id);

    if (isSchool) schoolOrdersCount++;
    else businessOrdersCount++;
  }
  console.log(`  ✓ Tagged ${schoolOrdersCount} School orders and ${businessOrdersCount} Business orders.`);

  console.log('\n===============================================================');
  console.log('✓ DOMAIN NORMALIZATION COMPLETE');
  console.log('===============================================================\n');
}

run().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
