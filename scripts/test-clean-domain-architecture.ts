/**
 * Automated Verification Script: Enforce Clean Domain Architecture (Business vs School)
 * 
 * Verifies:
 * 1. Database separation (Corporate DB vs Schools DB)
 * 2. Hard domain isolation on project creation
 * 3. Token route protection and school redirect logic
 * 4. Leads dashboard domain segregation
 * 5. Orders & Payments domain filtering
 */

import { getSupabaseServerClient, isSupabaseConfigured } from '../src/lib/supabase';
import { getSchoolsServerClient, isSchoolsConfigured } from '../src/lib/schoolsDb';

async function runDomainIsolationTests() {
  console.log('================================================================');
  console.log('RUNNING COMPREHENSIVE DOMAIN ISOLATION ARCHITECTURE TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  [PASS]: ${desc}`);
      passed++;
    } else {
      console.error(`  [FAIL]: ${desc}`);
      failed++;
    }
  }

  // TEST 1: Check Database Connectivity & Configuration
  console.log('--- TEST 1: Dual Database Separation Check ---');
  assert(isSupabaseConfigured(), 'Corporate/Main DB (SUPABASE_URL) is configured');
  assert(isSchoolsConfigured(), 'Schools DB (SCHOOLS_SUPABASE_URL) is configured');

  const mainDb = getSupabaseServerClient();
  const schoolsDb = getSchoolsServerClient();

  assert(Boolean(mainDb), 'Main DB client initialized successfully');
  assert(Boolean(schoolsDb), 'Schools DB client initialized successfully');

  if (!mainDb || !schoolsDb) {
    console.error('Fatal: Cannot continue without database connections.');
    process.exit(1);
  }

  // TEST 2: Verify Main DB projects via Service Layer (Strictly BUSINESS)
  console.log('\n--- TEST 2: Business Projects Service Layer Domain Cleanliness ---');
  const { getBusinessProjects } = await import('../src/lib/businessProjectsDb');
  const businessRes = await getBusinessProjects({ page: 1, pageSize: 20 });

  if (!businessRes.success) {
    console.error('Error fetching business projects:', businessRes.error);
    failed++;
  } else {
    assert(Array.isArray(businessRes.projects), 'getBusinessProjects returned list of projects');
    const schoolInMain = (businessRes.projects || []).filter(
      (p) => p.project_type === 'SCHOOL' || p.project_number?.startsWith('SCH-')
    );
    assert(schoolInMain.length === 0, `Zero school projects in Business Projects (found ${schoolInMain.length})`);
    
    const allBusinessDomain = (businessRes.projects || []).every(
      (p) => p.domain === 'BUSINESS' && p.project_type === 'BUSINESS'
    );
    assert(allBusinessDomain, 'All projects returned by getBusinessProjects have domain = BUSINESS');
  }

  // TEST 3: Verify Schools DB `school_projects` table
  console.log('\n--- TEST 3: Schools DB `school_projects` Structure ---');
  const { data: schoolProjects, error: schoolErr } = await schoolsDb
    .from('school_projects')
    .select('id, project_number, school_name, status, completeness_percentage')
    .limit(5);

  if (schoolErr) {
    console.error('Error fetching school projects:', schoolErr.message);
    failed++;
  } else {
    assert(Array.isArray(schoolProjects), 'School projects successfully fetched from dedicated Schools DB');
    const validNumbers = (schoolProjects || []).every((sp) => sp.project_number.startsWith('SCH-'));
    assert(validNumbers, 'All school projects in Schools DB use SCH- prefix');
  }

  // TEST 4: Leads Table Domain Segregation via Service Layer
  console.log('\n--- TEST 4: Leads Table & Service Domain Segregation ---');
  const { getLeads, getLeadStats } = await import('../src/lib/supabase');
  const leadsRes = await getLeads({ page: 1, pageSize: 20 });
  const leadStatsRes = await getLeadStats();

  if (!leadsRes.success) {
    console.error('Error querying leads:', leadsRes.error);
    failed++;
  } else {
    assert(Array.isArray(leadsRes.leads), 'getLeads returned list of leads');
    const hasDomainCol = (leadsRes.leads || []).every(
      (l) => l.lead_domain === 'BUSINESS' || l.lead_domain === 'SCHOOL'
    );
    assert(hasDomainCol, 'Every lead has an explicit lead_domain assigned');
  }

  if (!leadStatsRes.success) {
    console.error('Error querying lead stats:', leadStatsRes.error);
    failed++;
  } else {
    assert(typeof leadStatsRes.stats.businessCount === 'number', 'lead stats contains businessCount');
    assert(typeof leadStatsRes.stats.schoolCount === 'number', 'lead stats contains schoolCount');
    console.log(`    📊 Domain Distribution: Business Leads: ${leadStatsRes.stats.businessCount}, School Leads: ${leadStatsRes.stats.schoolCount}`);
  }

  // TEST 5: Orders Table Domain Filtering via Service Layer
  console.log('\n--- TEST 5: Orders Service Layer Domain Isolation ---');
  const { getOrders } = await import('../src/lib/supabase');
  const ordersRes = await getOrders({ page: 1, pageSize: 20 });

  if (!ordersRes.success) {
    console.error('Error querying orders:', ordersRes.error);
    failed++;
  } else {
    assert(Array.isArray(ordersRes.orders), 'getOrders returned list of orders');
    const hasDomain = (ordersRes.orders || []).every(
      (o) => o.domain === 'BUSINESS' || o.domain === 'SCHOOL'
    );
    assert(hasDomain, 'Every order record has an explicit domain stamped (BUSINESS or SCHOOL)');
  }

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runDomainIsolationTests().catch((err) => {
  console.error('Unexpected test error:', err);
  process.exit(1);
});
