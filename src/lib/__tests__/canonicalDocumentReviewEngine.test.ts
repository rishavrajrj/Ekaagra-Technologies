import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  evaluateFieldComparison,
  normalizeComparisonText,
  calculateDerivedDocumentValidationStatus,
  getDocumentReviewDefinition,
  calculateDocumentCompletenessSummary,
  CANONICAL_DOCUMENT_REVIEW_DEFINITIONS,
  STRUCTURED_REPLACEMENT_REASONS,
} from '../canonicalDocumentReviewEngine';
import { CANONICAL_DOCUMENT_IDS } from '../canonicalDocuments';

describe('Canonical Document Review Engine', () => {
  it('should normalize comparison text properly', () => {
    assert.strictEqual(normalizeComparisonText('  Delhi Public  School '), 'delhi public school');
    assert.strictEqual(normalizeComparisonText(''), '');
    assert.strictEqual(normalizeComparisonText(undefined), '');
  });

  it('should evaluate field comparison accurately', () => {
    // When both are empty
    assert.strictEqual(evaluateFieldComparison(undefined, undefined), 'NOT_APPLICABLE');

    // When value is entered by school but OCR extracted value is missing (strict: never fabricate!)
    assert.strictEqual(
      evaluateFieldComparison('Delhi Public School', undefined),
      'REQUIRES_MANUAL_VERIFICATION'
    );
    assert.strictEqual(
      evaluateFieldComparison('Delhi Public School', ''),
      'REQUIRES_MANUAL_VERIFICATION'
    );

    // Exact or substring matches
    assert.strictEqual(
      evaluateFieldComparison('Delhi Public School', 'Delhi Public School'),
      'MATCH'
    );
    assert.strictEqual(
      evaluateFieldComparison('Delhi Public School', 'Delhi Public School, Sector 4'),
      'MATCH'
    );

    // Mismatches
    assert.strictEqual(
      evaluateFieldComparison('Delhi Public School', 'St. Xavier High School'),
      'MISMATCH'
    );
  });

  it('should calculate derived document validation status correctly', () => {
    // Missing document
    assert.strictEqual(
      calculateDerivedDocumentValidationStatus(undefined, undefined, []),
      'MISSING'
    );
    assert.strictEqual(
      calculateDerivedDocumentValidationStatus('placeholder', 'file.pdf', []),
      'MISSING'
    );

    // Expired document
    const pastDate = '2020-01-01';
    assert.strictEqual(
      calculateDerivedDocumentValidationStatus('https://example.com/doc.pdf', 'doc.pdf', [], pastDate),
      'EXPIRED'
    );

    // Mismatched fields flag as INVALID
    assert.strictEqual(
      calculateDerivedDocumentValidationStatus('https://example.com/doc.pdf', 'doc.pdf', [
        {
          fieldId: 'school_name',
          label: 'School Name',
          enteredValue: 'School A',
          extractedValue: 'School B',
          comparisonStatus: 'MISMATCH',
        },
      ]),
      'INVALID'
    );

    // Fields requiring manual verification flag as REQUIRES_MANUAL_VERIFICATION
    assert.strictEqual(
      calculateDerivedDocumentValidationStatus('https://example.com/doc.pdf', 'doc.pdf', [
        {
          fieldId: 'school_name',
          label: 'School Name',
          enteredValue: 'School A',
          extractedValue: undefined,
          comparisonStatus: 'REQUIRES_MANUAL_VERIFICATION',
        },
      ]),
      'REQUIRES_MANUAL_VERIFICATION'
    );

    // All match
    assert.strictEqual(
      calculateDerivedDocumentValidationStatus('https://example.com/doc.pdf', 'doc.pdf', [
        {
          fieldId: 'school_name',
          label: 'School Name',
          enteredValue: 'School A',
          extractedValue: 'School A',
          comparisonStatus: 'MATCH',
        },
      ]),
      'VALID'
    );
  });

  it('should provide comprehensive review definitions for all statutory documents', () => {
    const affDef = getDocumentReviewDefinition(CANONICAL_DOCUMENT_IDS.BOARD_AFFILIATION);
    assert.ok(affDef, 'Affiliation definition must exist');
    assert.strictEqual(affDef?.checklistId, 'cert-affiliation');
    assert.ok(affDef?.verificationChecklist.length >= 5, 'Must have detailed checklist items');

    const safetyDef = getDocumentReviewDefinition(CANONICAL_DOCUMENT_IDS.BUILDING_FIRE_SAFETY);
    assert.ok(safetyDef, 'Safety definition must exist');
    assert.strictEqual(safetyDef?.checklistId, 'cert-safety');
    assert.ok(safetyDef?.verificationChecklist.length >= 8, 'Must have comprehensive 8+ checklist items');

    const recogDef = getDocumentReviewDefinition(CANONICAL_DOCUMENT_IDS.SCHOOL_RECOGNITION_NOC);
    assert.ok(recogDef, 'Recognition definition must exist');

    const discDef = getDocumentReviewDefinition(CANONICAL_DOCUMENT_IDS.MANDATORY_PUBLIC_DISCLOSURE);
    assert.ok(discDef, 'Disclosure definition must exist');
  });

  it('should provide at least 11 structured replacement reasons', () => {
    assert.ok(STRUCTURED_REPLACEMENT_REASONS.length >= 11, 'Must have at least 11 replacement reasons');
    const reasonIds = STRUCTURED_REPLACEMENT_REASONS.map((r) => r.id);
    assert.ok(reasonIds.includes('wrong_document'));
    assert.ok(reasonIds.includes('illegible_scan'));
    assert.ok(reasonIds.includes('expired_validity'));
    assert.ok(reasonIds.includes('school_name_mismatch'));
    assert.ok(reasonIds.includes('address_mismatch'));
    assert.ok(reasonIds.includes('missing_pages'));
    assert.ok(reasonIds.includes('missing_signature_seal'));
  });

  it('should calculate document completeness summary and KPIs accurately', () => {
    const summary = calculateDocumentCompletenessSummary([
      {
        required: true,
        isPublicationBlocker: true,
        status: 'approved',
        fileUrl: 'https://example.com/aff.pdf',
        fileName: 'aff.pdf',
      },
      {
        required: true,
        isPublicationBlocker: true,
        status: 'rejected',
        fileUrl: 'https://example.com/safety.pdf',
        fileName: 'safety.pdf',
      },
      {
        required: true,
        isPublicationBlocker: true,
        status: 'pending',
        fileUrl: undefined,
        fileName: undefined,
      },
      {
        required: false,
        isPublicationBlocker: false,
        status: 'pending',
        fileUrl: 'https://example.com/trust.pdf',
        fileName: 'trust.pdf',
      },
    ]);

    assert.strictEqual(summary.totalRequired, 3);
    assert.strictEqual(summary.totalSubmitted, 3);
    assert.strictEqual(summary.totalApproved, 1);
    assert.strictEqual(summary.totalChangesRequested, 1);
    assert.strictEqual(summary.totalPendingReview, 1);
    // Publication blockers: 1 rejected + 1 unuploaded required
    assert.strictEqual(summary.totalPublicationBlockers, 2);
    // Percentage: 1 approved out of 3 required = 33%
    assert.strictEqual(summary.percentage, 33);
  });
});
