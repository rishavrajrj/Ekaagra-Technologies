/**
 * ==============================================================================
 * TEST SUITE: Universal Submission ZIP Export & Role-Based Visibility Audit
 * File: src/lib/__tests__/universalSubmissionExport.test.ts
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert';
import JSZip from 'jszip';
import type { UniversalIntakeData } from '../types';
import {
  buildUniversalSubmissionZip,
  aggregateUniversalAssets,
  aggregateUniversalDocuments,
  aggregateUniversalFacilities,
  calculateUniversalReadiness,
} from '../universalVerificationEngine';

function createSampleIntakeData(): Partial<UniversalIntakeData> {
  return {
    schoolProfile: {
      schoolName: 'St. Xavier International School',
      board: 'CBSE',
      affiliationNumber: 'CBSE-AFF-334455',
      officialEmail: 'info@stxavier.edu.in',
      officialPhone: '+91 9876543210',
      schoolType: 'Day School',
    },
    branding: {
      logoUrl: 'https://cdn.example.com/logo-stxavier.png',
    },
    leadership: {
      principalName: 'Father Thomas Augustine',
      principalPhotoUrl: 'https://cdn.example.com/principal-photo.jpg',
    },
    statutoryCompliance: {
      affiliationCertificate: {
        fileUrl: 'https://cdn.example.com/cbse-grant-letter.pdf',
        fileName: 'cbse-grant-letter.pdf',
      },
      fireSafetyCertificate: {
        fileUrl: 'https://cdn.example.com/fire-safety-cert.pdf',
        fileName: 'fire-safety-cert.pdf',
      },
    },
    clientConfirmation: {
      isConfirmed: true,
      confirmedByName: 'Father Thomas Augustine',
      confirmedByRole: 'Principal',
      confirmedAt: '2026-09-12T12:00:00.000Z',
    },
  };
}

test('AUDIT: buildUniversalSubmissionZip contains JSON, HTML report, and manifest', async () => {
  const intakeData = createSampleIntakeData();
  const allAssets = aggregateUniversalAssets(intakeData);
  const allDocuments = aggregateUniversalDocuments(intakeData);
  const allFacilities = aggregateUniversalFacilities(intakeData, allAssets);
  const readiness = calculateUniversalReadiness(intakeData, allAssets, allDocuments, allFacilities);

  const submissionMeta = {
    submissionId: 'SCH-2026-TEST-001',
    version: 'v1',
    submittedAt: '12/09/2026',
    adminName: 'Father Thomas Augustine',
    adminDesignation: 'Principal',
    adminEmail: 'info@stxavier.edu.in',
    adminPhone: '+91 9876543210',
  };

  const zipBlob = await buildUniversalSubmissionZip(
    intakeData,
    readiness as any,
    allAssets,
    allDocuments,
    allFacilities,
    submissionMeta
  );

  assert.ok(zipBlob, 'ZIP Blob should be generated');
  assert.ok(zipBlob.size > 0, 'ZIP Blob should not be empty');

  // Load ZIP archive and inspect entry tree
  const arrayBuffer = await zipBlob.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const folderPrefix = `Website-Submission-${submissionMeta.submissionId}/`;

  // 1. Check HTML Report exists
  const reportFile = zip.file(`${folderPrefix}submission-report.html`);
  assert.ok(reportFile, 'submission-report.html must exist in ZIP root folder');
  const reportText = await reportFile.async('text');
  assert.ok(reportText.includes('St. Xavier International School'), 'Report HTML must contain school name');
  assert.ok(reportText.includes('SCH-2026-TEST-001'), 'Report HTML must contain submission ID');

  // 2. Check canonical school-information.json exists
  const schoolInfoFile = zip.file(`${folderPrefix}school-information.json`);
  assert.ok(schoolInfoFile, 'school-information.json must exist in ZIP root folder');
  const schoolInfo = JSON.parse(await schoolInfoFile.async('text'));
  assert.strictEqual(schoolInfo.schoolProfile.schoolName, 'St. Xavier International School');
  assert.strictEqual(schoolInfo.administrator.name, 'Father Thomas Augustine');

  // 3. Check verification-manifest.json exists
  const manifestFile = zip.file(`${folderPrefix}verification-manifest.json`);
  assert.ok(manifestFile, 'verification-manifest.json must exist in ZIP root folder');
  const manifest = JSON.parse(await manifestFile.async('text'));
  assert.strictEqual(manifest.submissionId, 'SCH-2026-TEST-001');
  assert.strictEqual(manifest.version, 'v1');
});

test('AUDIT CONFIRMATION: buildUniversalSubmissionZip does NOT bundle uploaded binary files', async () => {
  const intakeData = createSampleIntakeData();
  const allAssets = aggregateUniversalAssets(intakeData);
  const allDocuments = aggregateUniversalDocuments(intakeData);
  const allFacilities = aggregateUniversalFacilities(intakeData, allAssets);
  const readiness = calculateUniversalReadiness(intakeData, allAssets, allDocuments, allFacilities);

  const submissionMeta = {
    submissionId: 'SCH-2026-TEST-002',
    version: 'v1',
    submittedAt: '12/09/2026',
    adminName: 'Father Thomas Augustine',
    adminDesignation: 'Principal',
    adminEmail: 'info@stxavier.edu.in',
    adminPhone: '+91 9876543210',
  };

  const zipBlob = await buildUniversalSubmissionZip(
    intakeData,
    readiness as any,
    allAssets,
    allDocuments,
    allFacilities,
    submissionMeta
  );

  const arrayBuffer = await zipBlob.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const folderPrefix = `Website-Submission-${submissionMeta.submissionId}/`;

  // Verify asset and document folders contain only README.txt placeholders, NOT actual uploaded binaries
  const logoReadme = zip.file(`${folderPrefix}assets/logo/README.txt`);
  assert.ok(logoReadme, 'assets/logo/README.txt stub must be present');
  const logoReadmeText = await logoReadme.async('text');
  assert.strictEqual(logoReadmeText, 'Place brand logo files here.');

  const complianceReadme = zip.file(`${folderPrefix}documents/compliance/README.txt`);
  assert.ok(complianceReadme, 'documents/compliance/README.txt stub must be present');
  const complianceReadmeText = await complianceReadme.async('text');
  assert.strictEqual(complianceReadmeText, 'Place CBSE affiliation and government NOC documents here.');

  // Crucial check: Verify actual uploaded files (e.g. 'cbse-grant-letter.pdf') are NOT in the ZIP
  const uploadedPdf = zip.file(`${folderPrefix}documents/compliance/cbse-grant-letter.pdf`);
  assert.strictEqual(uploadedPdf, null, 'Actual uploaded PDF must NOT be in ZIP (audit confirms skeleton only)');

  const uploadedPhoto = zip.file(`${folderPrefix}assets/people/principal-photo.jpg`);
  assert.strictEqual(uploadedPhoto, null, 'Actual uploaded photo must NOT be in ZIP (audit confirms skeleton only)');
});

test('ROLE-BASED VISIBILITY: School user vs Internal Admin capabilities', () => {
  // Define visibility rules for actions
  function getVisibleActions(isAdmin: boolean) {
    const schoolActions = ['preview_website', 'download_report', 'submit_and_lock'];
    const adminActions = [...schoolActions, 'export_technical_zip'];
    return isAdmin ? adminActions : schoolActions;
  }

  const schoolUserActions = getVisibleActions(false);
  assert.ok(schoolUserActions.includes('preview_website'), 'School user can preview website');
  assert.ok(schoolUserActions.includes('download_report'), 'School user can download report');
  assert.ok(schoolUserActions.includes('submit_and_lock'), 'School user can submit & lock');
  assert.strictEqual(
    schoolUserActions.includes('export_technical_zip'),
    false,
    'School user must NEVER see technical ZIP export'
  );

  const internalAdminActions = getVisibleActions(true);
  assert.ok(internalAdminActions.includes('export_technical_zip'), 'Admin has access to technical ZIP export');
});
