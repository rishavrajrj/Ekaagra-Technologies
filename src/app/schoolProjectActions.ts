'use server';

import { verifyAdminSession } from '@/lib/adminAuth';
import { getSchoolsServerClient } from '@/lib/schoolsDb';
import { startSchoolOnboarding, verifyOnboardingToken } from '@/lib/schoolHandoff';
import { calculateIntakeCompleteness, deriveSlugFromSchoolName } from '@/lib/schoolIntake';
import { calculateExpeditedDeliveryFee } from '@/lib/schoolPricing';
import { executePlatformHandoff, mapCommercialProductToStep41Plan } from '@/lib/schoolHandoffToPlatform';
import { populateSchoolDatabaseEntities } from '@/lib/schoolDatabaseProvisioning';
import type {
  SchoolProject,
  SchoolProjectFilter,
  SchoolMediaStatus,
  UniversalIntakeData,
  SchoolProjectCustomField,
  SchoolProjectCustomRequirement,
  WebsiteApprovalRecord,
  FieldReviewStatus,
  MediaReviewStatus,
} from '@/lib/types';
import {
  evaluateSchoolReviewState,
  buildVerifiedSchoolWebsiteDataset,
  type OverallReviewEvaluation,
} from '@/lib/schoolReviewEngine';
import {
  approveWebsiteSpecification,
  type ApproverInfo,
} from '@/lib/websiteSpecificationContract';
import { evaluateWebsitePublicationReadiness } from '@/lib/websiteDataStatus';
import { validateCampusAcademicPayload } from '@/lib/campusAcademicScopeService';

import crypto from 'crypto';
import { hashToken } from '@/lib/schoolHandoff';
import {
  generateDeskMessage,
  type DeskMessageGenerationRequest,
  type DeskMessageGenerationResult,
} from '@/lib/schoolDeskMessageGenerator';
import {
  generateContentRecommendation,
  type ContentRecommendationRequest,
  type ContentRecommendationResult,
} from '@/lib/contentRecommendationService';

export async function startSchoolOnboardingAction(leadId: string) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized: Admin session required to start onboarding.' };
  }

  try {
    const result = await startSchoolOnboarding(leadId, {
      name: 'Ekaagra Administrator',
      email: 'admin@ekaagratechnologies.com',
      role: 'staff_admin',
    });
    return result;
  } catch (err: any) {
    console.error('[ACTION ERROR] startSchoolOnboardingAction:', err);
    return { success: false, error: err.message || 'Internal server error during onboarding initiation.' };
  }
}

export async function createDirectSchoolProjectAction(input: {
  schoolName: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  primaryContactDesignation?: string;
  productId: 'school-website' | 'school-website-cms' | 'school-erp' | 'school-complete';
  city?: string;
  state?: string;
}) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized: Admin session required.' };
  }

  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    return { success: false, error: 'Schools DB not configured.' };
  }

  try {
    const currentYear = new Date().getFullYear();
    const { count: projectCount } = await schoolsDb
      .from('school_projects')
      .select('*', { count: 'exact', head: true });

    const nextSeq = (projectCount || 0) + 1;
    const projectNumber = `SCH-${currentYear}-${String(nextSeq).padStart(4, '0')}`;
    const invitationCode = `ONB-${currentYear}-${String(nextSeq).padStart(4, '0')}`;

    const rawSecretToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawSecretToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: newProject, error: projectCreateError } = await schoolsDb
      .from('school_projects')
      .insert([
        {
          project_number: projectNumber,
          domain: 'SCHOOL',
          source: 'ADMIN_SCHOOL_INTAKE',
          lead_reference: `ADMIN-${Date.now()}`,
          source_system: 'EKAAGRA_ADMIN_INTAKE',
          school_name: input.schoolName.trim(),
          product_id: input.productId,
          status: 'onboarding_invited',
          media_status: 'not_started',
          completeness_percentage: 0,
          primary_contact_name: input.primaryContactName.trim(),
          primary_contact_email: input.primaryContactEmail.trim(),
          primary_contact_phone: input.primaryContactPhone.trim(),
          primary_contact_designation: input.primaryContactDesignation || 'School Principal',
          city: input.city || 'Motihari',
          state: input.state || 'Bihar',
          commercial_summary: {
            createdVia: 'ADMIN_DIRECT_INTAKE',
          },
          metadata: {
            domain: 'SCHOOL',
            source: 'ADMIN_SCHOOL_INTAKE',
            createdVia: 'ADMIN_DIRECT_INTAKE',
          },
        },
      ])
      .select()
      .single();

    if (projectCreateError || !newProject) {
      return { success: false, error: projectCreateError?.message || 'Failed to create school project.' };
    }

    await schoolsDb.from('school_onboarding_invitations').insert([
      {
        school_project_id: newProject.id,
        invitation_code: invitationCode,
        token_hash: tokenHash,
        expires_at: expiresAt,
        is_revoked: false,
      },
    ]);

    return {
      success: true,
      project: newProject as SchoolProject,
      invitationCode,
      onboardingUrl: `/school-onboarding/${invitationCode}`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error creating school project' };
  }
}

export async function fetchSchoolProjectsAction(filter?: SchoolProjectFilter) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized', projects: [], total: 0 };
  }

  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    return { success: false, error: 'Schools DB not configured', projects: [], total: 0 };
  }

  try {
    let query = schoolsDb.from('school_projects').select('*', { count: 'exact' });

    if (filter?.productId && filter.productId !== 'ALL') {
      query = query.eq('product_id', filter.productId);
    }
    if (filter?.status && filter.status !== 'ALL') {
      query = query.eq('status', filter.status);
    }
    if (filter?.mediaStatus && filter.mediaStatus !== 'ALL') {
      query = query.eq('media_status', filter.mediaStatus);
    }
    if (filter?.query && filter.query.trim()) {
      const q = `%${filter.query.trim()}%`;
      query = query.or(`school_name.ilike.${q},project_number.ilike.${q},primary_contact_name.ilike.${q}`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      success: true,
      projects: (data || []) as SchoolProject[],
      total: count || 0,
    };
  } catch (err: any) {
    console.error('[ACTION ERROR] fetchSchoolProjectsAction:', err);
    return { success: false, error: err.message, projects: [], total: 0 };
  }
}

export async function getSchoolProjectDetailsAction(projectId: string) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized' };
  }

  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    return { success: false, error: 'Schools DB not configured' };
  }

  try {
    const { data: project, error: pErr } = await schoolsDb
      .from('school_projects')
      .select('*')
      .eq('id', projectId)
      .single();
    if (pErr || !project) throw new Error('Project not found');

    const { data: currentSubmission } = await schoolsDb
      .from('school_intake_submissions')
      .select('*')
      .eq('school_project_id', projectId)
      .eq('is_current', true)
      .maybeSingle();

    const { data: changeRequests } = await schoolsDb
      .from('school_intake_change_requests')
      .select('*')
      .eq('school_project_id', projectId)
      .order('created_at', { ascending: false });

    const { data: customFields } = await schoolsDb
      .from('school_project_custom_fields')
      .select('*')
      .eq('school_project_id', projectId)
      .order('sort_order', { ascending: true });

    const { data: customRequirements } = await schoolsDb
      .from('school_project_custom_requirements')
      .select('*')
      .eq('school_project_id', projectId)
      .order('created_at', { ascending: false });

    const { data: approvedSnapshot } = await schoolsDb
      .from('school_approved_snapshots')
      .select('*')
      .eq('school_project_id', projectId)
      .order('created_at', { ascending: false })
      .maybeSingle();

    const { data: invitation } = await schoolsDb
      .from('school_onboarding_invitations')
      .select('*')
      .eq('school_project_id', projectId)
      .eq('is_revoked', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const reviewEvaluation = evaluateSchoolReviewState(
      project as SchoolProject,
      currentSubmission,
      changeRequests || []
    );

    return {
      success: true,
      project: project as SchoolProject,
      currentSubmission,
      changeRequests: changeRequests || [],
      customFields: (customFields || []) as SchoolProjectCustomField[],
      customRequirements: (customRequirements || []) as SchoolProjectCustomRequirement[],
      approvedSnapshot,
      invitation,
      reviewEvaluation,
    };
  } catch (err: any) {
    console.error('[ACTION ERROR] getSchoolProjectDetailsAction:', err);
    return { success: false, error: err.message };
  }
}

export async function verifySchoolTokenAction(token: string) {
  try {
    const verification = await verifyOnboardingToken(token);
    if (!verification.valid || !verification.project) {
      return { success: false, error: verification.error || 'Invalid onboarding link.' };
    }

    const schoolsDb = getSchoolsServerClient()!;
    const projectId = verification.project.id;

    const { data: latestSubmission } = await schoolsDb
      .from('school_intake_submissions')
      .select('*')
      .eq('school_project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: changeRequests } = await schoolsDb
      .from('school_intake_change_requests')
      .select('*')
      .eq('school_project_id', projectId)
      .eq('status', 'open');

    const { data: customFields } = await schoolsDb
      .from('school_project_custom_fields')
      .select('*')
      .eq('school_project_id', projectId)
      .order('sort_order', { ascending: true });

    const { data: customRequirements } = await schoolsDb
      .from('school_project_custom_requirements')
      .select('*')
      .eq('school_project_id', projectId)
      .order('created_at', { ascending: false });

    return {
      success: true,
      project: verification.project,
      invitation: verification.invitation,
      submission: latestSubmission,
      changeRequests: changeRequests || [],
      customFields: (customFields || []) as SchoolProjectCustomField[],
      customRequirements: (customRequirements || []) as SchoolProjectCustomRequirement[],
    };
  } catch (err: any) {
    console.error('[ACTION ERROR] verifySchoolTokenAction:', err);
    return { success: false, error: err.message };
  }
}

export async function saveSchoolIntakeDraftAction(
  token: string,
  payload: Partial<UniversalIntakeData>,
  customData: Record<string, unknown> = {}
) {
  const verification = await verifyOnboardingToken(token);
  if (!verification.valid || !verification.project) {
    return { success: false, error: verification.error || 'Invalid session' };
  }

  const schoolsDb = getSchoolsServerClient()!;
  const projectId = verification.project.id;

  try {
    // Ensure internal tenant slug is cleanly populated without requiring administrator intervention
    if (payload.schoolProfile) {
      if (!payload.schoolProfile.slug && (payload.schoolProfile.schoolName || verification.project.school_name)) {
        payload.schoolProfile.slug = deriveSlugFromSchoolName(payload.schoolProfile.schoolName || verification.project.school_name);
      }
      if (!payload.schoolProfile.platformSubdomain && payload.schoolProfile.slug) {
        payload.schoolProfile.platformSubdomain = `${payload.schoolProfile.slug}.ekaagraschools.in`;
      }
      if (!payload.schoolProfile.preferredPublicUrl && payload.schoolProfile.slug) {
        payload.schoolProfile.preferredPublicUrl = `https://${payload.schoolProfile.slug}.edu.in`;
      }
    }

    // Authoritative Server-Side Delivery Price Validation (Zero Client Trust)
    if (payload.projectDelivery) {
      const isUrgent = payload.projectDelivery.deliveryPriority === 'urgent';
      const canonicalFee = calculateExpeditedDeliveryFee(verification.project.product_id as any);
      payload.projectDelivery.expeditedFeeINR = isUrgent ? canonicalFee : 0;
      payload.projectDelivery.isUrgentRequested = isUrgent;
      if (!isUrgent) {
        payload.projectDelivery.urgentConfirmed = false;
        if (payload.projectDelivery.paymentStatus !== 'paid') {
          payload.projectDelivery.paymentStatus = 'not_requested';
        }
      }
    }

    const completeness = calculateIntakeCompleteness(verification.project.product_id, payload);

    await schoolsDb
      .from('school_projects')
      .update({
        completeness_percentage: completeness.percentage,
        status: verification.project.status === 'onboarding_invited' ? 'onboarding_in_progress' : verification.project.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    const { data: existingSub } = await schoolsDb
      .from('school_intake_submissions')
      .select('id')
      .eq('school_project_id', projectId)
      .eq('is_current', true)
      .maybeSingle();

    if (existingSub) {
      await schoolsDb
        .from('school_intake_submissions')
        .update({
          intake_payload: payload,
          custom_fields_data: customData,
          completeness_percentage: completeness.percentage,
          status: 'draft',
        })
        .eq('id', existingSub.id);
    } else {
      await schoolsDb.from('school_intake_submissions').insert([
        {
          school_project_id: projectId,
          version_number: 1,
          is_current: true,
          submitted_by_name: verification.project.primary_contact_name,
          submitted_by_email: verification.project.primary_contact_email,
          intake_payload: payload,
          custom_fields_data: customData,
          completeness_percentage: completeness.percentage,
          status: 'draft',
        },
      ]);
    }

    return {
      success: true,
      percentage: completeness.percentage,
      missingFields: completeness.missingFields,
    };
  } catch (err: any) {
    console.error('[ACTION ERROR] saveSchoolIntakeDraftAction:', err);
    return { success: false, error: err.message };
  }
}

export async function submitSchoolIntakeAction(
  token: string,
  payload: UniversalIntakeData,
  customData: Record<string, unknown> = {},
  changeSummary?: string
) {
  const verification = await verifyOnboardingToken(token);
  if (!verification.valid || !verification.project) {
    return { success: false, error: verification.error || 'Invalid session' };
  }

  const schoolsDb = getSchoolsServerClient()!;
  const projectId = verification.project.id;

  try {
    // Ensure internal tenant slug is cleanly populated without requiring administrator intervention
    if (payload.schoolProfile) {
      if (!payload.schoolProfile.slug && (payload.schoolProfile.schoolName || verification.project.school_name)) {
        payload.schoolProfile.slug = deriveSlugFromSchoolName(payload.schoolProfile.schoolName || verification.project.school_name);
      }
      if (!payload.schoolProfile.platformSubdomain && payload.schoolProfile.slug) {
        payload.schoolProfile.platformSubdomain = `${payload.schoolProfile.slug}.ekaagraschools.in`;
      }
      if (!payload.schoolProfile.preferredPublicUrl && payload.schoolProfile.slug) {
        payload.schoolProfile.preferredPublicUrl = `https://${payload.schoolProfile.slug}.edu.in`;
      }
    }

    // Authoritative Server-Side Delivery Price Validation (Zero Client Trust)
    if (payload.projectDelivery) {
      const isUrgent = payload.projectDelivery.deliveryPriority === 'urgent';
      const canonicalFee = calculateExpeditedDeliveryFee(verification.project.product_id as any);
      payload.projectDelivery.expeditedFeeINR = isUrgent ? canonicalFee : 0;
      payload.projectDelivery.isUrgentRequested = isUrgent;
      if (!isUrgent) {
        payload.projectDelivery.urgentConfirmed = false;
        if (payload.projectDelivery.paymentStatus !== 'paid') {
          payload.projectDelivery.paymentStatus = 'not_requested';
        }
      }
    }

    // Authoritative Server-Side Campus Academic Scope Validation (Zero Client Trust)
    const campuses = payload.campuses || [];
    if (campuses.length > 0) {
      for (const c of campuses) {
        const scopeValidation = validateCampusAcademicPayload(c.id, payload);
        if (!scopeValidation.isValid) {
          return {
            success: false,
            error: `Academic Scope Validation failed for ${c.name || 'Campus'}: ${scopeValidation.errors.join('; ')}`,
          };
        }
      }
    } else {
      const scopeValidation = validateCampusAcademicPayload('main-campus', payload);
      if (!scopeValidation.isValid) {
        return {
          success: false,
          error: `Academic Scope Validation failed: ${scopeValidation.errors.join('; ')}`,
        };
      }
    }

    const completeness = calculateIntakeCompleteness(verification.project.product_id, payload);

    await schoolsDb
      .from('school_intake_submissions')
      .update({ is_current: false })
      .eq('school_project_id', projectId);

    const { count: priorCount } = await schoolsDb
      .from('school_intake_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('school_project_id', projectId);

    const versionNumber = (priorCount || 0) + 1;
    const isResubmission = verification.project.status === 'changes_requested';
    const newStatus = isResubmission ? 'resubmitted' : 'submitted';

    const { data: newSub, error: subErr } = await schoolsDb
      .from('school_intake_submissions')
      .insert([
        {
          school_project_id: projectId,
          version_number: versionNumber,
          is_current: true,
          submitted_by_name: verification.project.primary_contact_name,
          submitted_by_email: verification.project.primary_contact_email,
          change_summary: changeSummary || (versionNumber === 1 ? 'Initial submission' : 'Resubmission with requested changes'),
          intake_payload: payload,
          custom_fields_data: customData,
          completeness_percentage: completeness.percentage,
          status: newStatus,
        },
      ])
      .select()
      .single();

    if (subErr) throw subErr;

    if (isResubmission) {
      await schoolsDb
        .from('school_intake_change_requests')
        .update({
          status: 'resolved',
          resolution_notes: `Resolved in version ${versionNumber}`,
          resolved_at: new Date().toISOString(),
        })
        .eq('school_project_id', projectId)
        .eq('status', 'open');
    }

    await schoolsDb
      .from('school_projects')
      .update({
        status: newStatus,
        completeness_percentage: completeness.percentage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    const currentYear = new Date().getFullYear();
    await schoolsDb.from('school_project_audit_events').insert([
      {
        school_project_id: projectId,
        audit_number: `AUD-SCH-${currentYear}-${Date.now().toString().slice(-6)}`,
        action: isResubmission ? 'intake_resubmitted' : 'intake_submitted',
        actor_name: verification.project.primary_contact_name,
        actor_role: 'school_representative',
        previous_status: verification.project.status,
        new_status: newStatus,
        details: {
          versionNumber,
          completeness: completeness.percentage,
          changeSummary,
        },
      },
    ]);

    return {
      success: true,
      versionNumber,
      status: newStatus,
      completeness: completeness.percentage,
    };
  } catch (err: any) {
    console.error('[ACTION ERROR] submitSchoolIntakeAction:', err);
    return { success: false, error: err.message };
  }
}

export async function updateFieldReviewStatusAction(
  projectId: string,
  sectionKey: string,
  fieldKey: string,
  status: FieldReviewStatus,
  notes?: string
) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return { success: false, error: 'Unauthorized' };
  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) return { success: false, error: 'Schools DB not configured' };

  try {
    const { data: project, error: pErr } = await schoolsDb
      .from('school_projects')
      .select('metadata')
      .eq('id', projectId)
      .single();
    if (pErr || !project) throw new Error('Project not found');

    const meta = project.metadata || {};
    const fieldReviews = meta.fieldReviews || {};

    fieldReviews[fieldKey] = {
      sectionKey,
      fieldKey,
      status,
      notes,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Ekaagra Reviewer',
    };

    const updatedMetadata = {
      ...meta,
      fieldReviews,
    };

    const { error: updErr } = await schoolsDb
      .from('school_projects')
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (updErr) throw updErr;

    const currentYear = new Date().getFullYear();
    await schoolsDb.from('school_project_audit_events').insert([
      {
        school_project_id: projectId,
        audit_number: `AUD-SCH-${currentYear}-${Date.now().toString().slice(-6)}`,
        action: status === 'verified' || status === 'approved' ? 'field_approved' : 'field_review_updated',
        actor_name: 'Ekaagra Reviewer',
        actor_role: 'internal_reviewer',
        details: { sectionKey, fieldKey, status, notes },
      },
    ]);

    return { success: true };
  } catch (err: any) {
    console.error('[ACTION ERROR] updateFieldReviewStatusAction:', err);
    return { success: false, error: err.message };
  }
}

export async function updateMediaAssetReviewStatusAction(
  projectId: string,
  assetId: string,
  status: MediaReviewStatus,
  notes?: string
) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return { success: false, error: 'Unauthorized' };
  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) return { success: false, error: 'Schools DB not configured' };

  try {
    const { data: project, error: pErr } = await schoolsDb
      .from('school_projects')
      .select('metadata, media_status')
      .eq('id', projectId)
      .single();
    if (pErr || !project) throw new Error('Project not found');

    const meta = project.metadata || {};
    const mediaReviews = meta.mediaReviews || {};

    mediaReviews[assetId] = {
      assetId,
      status,
      notes,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Ekaagra Reviewer',
    };

    const updatedMetadata = {
      ...meta,
      mediaReviews,
    };

    let newMediaStatus = project.media_status;
    if (status === 'changes_requested') {
      newMediaStatus = 'changes_requested';
    } else if (status === 'approved') {
      newMediaStatus = 'package_in_progress';
    }

    const { error: updErr } = await schoolsDb
      .from('school_projects')
      .update({
        metadata: updatedMetadata,
        media_status: newMediaStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (updErr) throw updErr;

    const currentYear = new Date().getFullYear();
    await schoolsDb.from('school_project_audit_events').insert([
      {
        school_project_id: projectId,
        audit_number: `AUD-SCH-${currentYear}-${Date.now().toString().slice(-6)}`,
        action: status === 'approved' ? 'media_approved' : 'media_review_updated',
        actor_name: 'Ekaagra Reviewer',
        actor_role: 'internal_reviewer',
        details: { assetId, status, notes },
      },
    ]);

    return { success: true };
  } catch (err: any) {
    console.error('[ACTION ERROR] updateMediaAssetReviewStatusAction:', err);
    return { success: false, error: err.message };
  }
}

export async function createFieldChangeRequestAction(input: {
  projectId: string;
  sectionKey: string;
  fieldKey: string;
  currentValue?: string;
  reason: string;
  suggestedValue?: string;
  reviewerMessage: string;
}) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return { success: false, error: 'Unauthorized' };
  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) return { success: false, error: 'Schools DB not configured' };

  try {
    const { data: inserted, error: crError } = await schoolsDb
      .from('school_intake_change_requests')
      .insert([
        {
          school_project_id: input.projectId,
          section_key: input.sectionKey,
          field_key: input.fieldKey,
          request_type: 'correction',
          reason: input.reason,
          request_comment: input.reviewerMessage,
          current_value: input.currentValue || null,
          previous_value: input.currentValue || null,
          suggested_value: input.suggestedValue || null,
          requested_by: 'Ekaagra Reviewer',
          status: 'waiting_for_school',
        },
      ])
      .select()
      .single();

    if (crError) throw crError;

    const { data: project } = await schoolsDb
      .from('school_projects')
      .select('metadata')
      .eq('id', input.projectId)
      .single();

    if (project) {
      const meta = project.metadata || {};
      const fieldReviews = meta.fieldReviews || {};
      fieldReviews[input.fieldKey] = {
        sectionKey: input.sectionKey,
        fieldKey: input.fieldKey,
        status: 'changes_requested',
        notes: input.reviewerMessage,
        updatedAt: new Date().toISOString(),
        updatedBy: 'Ekaagra Reviewer',
      };

      await schoolsDb
        .from('school_projects')
        .update({
          status: 'changes_requested',
          metadata: { ...meta, fieldReviews },
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.projectId);
    }

    const currentYear = new Date().getFullYear();
    await schoolsDb.from('school_project_audit_events').insert([
      {
        school_project_id: input.projectId,
        audit_number: `AUD-SCH-${currentYear}-${Date.now().toString().slice(-6)}`,
        action: 'field_change_requested',
        actor_name: 'Ekaagra Reviewer',
        actor_role: 'internal_reviewer',
        details: {
          sectionKey: input.sectionKey,
          fieldKey: input.fieldKey,
          reason: input.reason,
          reviewerMessage: input.reviewerMessage,
        },
      },
    ]);

    return { success: true, changeRequest: inserted };
  } catch (err: any) {
    console.error('[ACTION ERROR] createFieldChangeRequestAction:', err);
    return { success: false, error: err.message };
  }
}

export async function createMediaChangeRequestAction(input: {
  projectId: string;
  assetId: string;
  assetTitle: string;
  reason: string;
  reviewerMessage: string;
}) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return { success: false, error: 'Unauthorized' };
  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) return { success: false, error: 'Schools DB not configured' };

  try {
    const { data: inserted, error: crError } = await schoolsDb
      .from('school_intake_change_requests')
      .insert([
        {
          school_project_id: input.projectId,
          section_key: 'media',
          field_key: input.assetId,
          asset_id: input.assetId,
          request_type: 'replacement',
          reason: input.reason,
          request_comment: input.reviewerMessage,
          current_value: input.assetTitle,
          previous_value: input.assetTitle,
          requested_by: 'Ekaagra Reviewer',
          status: 'waiting_for_school',
        },
      ])
      .select()
      .single();

    if (crError) throw crError;

    const { data: project } = await schoolsDb
      .from('school_projects')
      .select('metadata')
      .eq('id', input.projectId)
      .single();

    if (project) {
      const meta = project.metadata || {};
      const mediaReviews = meta.mediaReviews || {};
      mediaReviews[input.assetId] = {
        assetId: input.assetId,
        status: 'changes_requested',
        notes: input.reviewerMessage,
        updatedAt: new Date().toISOString(),
        updatedBy: 'Ekaagra Reviewer',
      };

      await schoolsDb
        .from('school_projects')
        .update({
          status: 'changes_requested',
          media_status: 'changes_requested',
          metadata: { ...meta, mediaReviews },
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.projectId);
    }

    const currentYear = new Date().getFullYear();
    await schoolsDb.from('school_project_audit_events').insert([
      {
        school_project_id: input.projectId,
        audit_number: `AUD-SCH-${currentYear}-${Date.now().toString().slice(-6)}`,
        action: 'media_replacement_requested',
        actor_name: 'Ekaagra Reviewer',
        actor_role: 'internal_reviewer',
        details: {
          assetId: input.assetId,
          assetTitle: input.assetTitle,
          reason: input.reason,
          reviewerMessage: input.reviewerMessage,
        },
      },
    ]);

    return { success: true, changeRequest: inserted };
  } catch (err: any) {
    console.error('[ACTION ERROR] createMediaChangeRequestAction:', err);
    return { success: false, error: err.message };
  }
}

export async function respondToChangeRequestAction(input: {
  token: string;
  requestId: string;
  schoolResponse: string;
  updatedValue?: string;
}) {
  const verification = await verifyOnboardingToken(input.token);
  if (!verification.valid || !verification.project) {
    return { success: false, error: verification.error || 'Invalid onboarding session' };
  }

  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) return { success: false, error: 'Schools DB not configured' };

  try {
    const { data: cr, error: crFetchErr } = await schoolsDb
      .from('school_intake_change_requests')
      .select('*')
      .eq('id', input.requestId)
      .eq('school_project_id', verification.project.id)
      .single();

    if (crFetchErr || !cr) {
      return { success: false, error: 'Change request not found' };
    }

    const { error: updErr } = await schoolsDb
      .from('school_intake_change_requests')
      .update({
        school_response: input.schoolResponse,
        school_updated_value: input.updatedValue || cr.current_value,
        status: 'ready_for_review',
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.requestId);

    if (updErr) throw updErr;

    const currentYear = new Date().getFullYear();
    await schoolsDb.from('school_project_audit_events').insert([
      {
        school_project_id: verification.project.id,
        audit_number: `AUD-SCH-${currentYear}-${Date.now().toString().slice(-6)}`,
        action: 'school_updated_field',
        actor_name: verification.project.primary_contact_name,
        actor_role: 'school_representative',
        details: {
          requestId: input.requestId,
          sectionKey: cr.section_key,
          fieldKey: cr.field_key,
          schoolResponse: input.schoolResponse,
          updatedValue: input.updatedValue,
        },
      },
    ]);

    return { success: true };
  } catch (err: any) {
    console.error('[ACTION ERROR] respondToChangeRequestAction:', err);
    return { success: false, error: err.message };
  }
}

export async function resolveChangeRequestAction(
  projectId: string,
  requestId: string,
  resolutionNotes?: string
) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return { success: false, error: 'Unauthorized' };
  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) return { success: false, error: 'Schools DB not configured' };

  try {
    const { data: cr, error: crErr } = await schoolsDb
      .from('school_intake_change_requests')
      .select('*')
      .eq('id', requestId)
      .eq('school_project_id', projectId)
      .single();

    if (crErr || !cr) throw new Error('Change request not found');

    await schoolsDb
      .from('school_intake_change_requests')
      .update({
        status: 'resolved',
        resolution_notes: resolutionNotes || 'Approved by administrator',
        resolved_at: new Date().toISOString(),
        resolved_by: 'Ekaagra Reviewer',
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    // Update field or media review in project metadata
    const { data: project } = await schoolsDb
      .from('school_projects')
      .select('metadata')
      .eq('id', projectId)
      .single();

    if (project) {
      const meta = project.metadata || {};
      if (cr.asset_id) {
        const mediaReviews = meta.mediaReviews || {};
        mediaReviews[cr.asset_id] = {
          assetId: cr.asset_id,
          status: 'approved',
          notes: resolutionNotes || 'Resolved and approved',
          updatedAt: new Date().toISOString(),
          updatedBy: 'Ekaagra Reviewer',
        };
        await schoolsDb.from('school_projects').update({ metadata: { ...meta, mediaReviews } }).eq('id', projectId);
      } else if (cr.field_key) {
        const fieldReviews = meta.fieldReviews || {};
        fieldReviews[cr.field_key] = {
          sectionKey: cr.section_key,
          fieldKey: cr.field_key,
          status: 'verified',
          notes: resolutionNotes || 'Resolved and approved',
          updatedAt: new Date().toISOString(),
          updatedBy: 'Ekaagra Reviewer',
        };
        await schoolsDb.from('school_projects').update({ metadata: { ...meta, fieldReviews } }).eq('id', projectId);
      }
    }

    const currentYear = new Date().getFullYear();
    await schoolsDb.from('school_project_audit_events').insert([
      {
        school_project_id: projectId,
        audit_number: `AUD-SCH-${currentYear}-${Date.now().toString().slice(-6)}`,
        action: 'change_request_resolved',
        actor_name: 'Ekaagra Reviewer',
        actor_role: 'internal_reviewer',
        details: { requestId, resolutionNotes },
      },
    ]);

    return { success: true };
  } catch (err: any) {
    console.error('[ACTION ERROR] resolveChangeRequestAction:', err);
    return { success: false, error: err.message };
  }
}

export async function finalApproveSchoolProjectAction(projectId: string, approverNotes?: string) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return { success: false, error: 'Unauthorized' };
  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) return { success: false, error: 'Schools DB not configured' };

  try {
    const { data: project } = await schoolsDb
      .from('school_projects')
      .select('*')
      .eq('id', projectId)
      .single();
    if (!project) throw new Error('Project not found');

    const { data: submission } = await schoolsDb
      .from('school_intake_submissions')
      .select('*')
      .eq('school_project_id', projectId)
      .eq('is_current', true)
      .single();
    if (!submission) throw new Error('No active intake submission found.');

    const { data: changeRequests } = await schoolsDb
      .from('school_intake_change_requests')
      .select('*')
      .eq('school_project_id', projectId);

    // Run authoritative review engine
    const evalResult = evaluateSchoolReviewState(
      project as SchoolProject,
      submission,
      changeRequests || []
    );

    if (evalResult.websiteReadiness !== 'READY') {
      return {
        success: false,
        error: `Cannot approve: Website readiness is BLOCKED. ${evalResult.websiteReadinessReason}`,
        blockers: evalResult.blockers,
      };
    }

    const currentYear = new Date().getFullYear();
    const snapshotNumber = `SNAP-${project.project_number}-V${submission.version_number}`;
    const planCode = mapCommercialProductToStep41Plan(project.product_id);

    // Save final approved snapshot
    await schoolsDb.from('school_approved_snapshots').insert([
      {
        school_project_id: projectId,
        snapshot_number: snapshotNumber,
        version_number: submission.version_number,
        approved_by: 'Ekaagra Review Team',
        school_name: project.school_name,
        product_id: project.product_id,
        student_tier_id: project.student_tier_id || null,
        commercial_reference: project.lead_reference,
        snapshot_data: submission.intake_payload,
        step41_entitlement_plan: planCode,
        step42_provisioning_status: 'pending',
      },
    ]);

    const updatedMetadata = {
      ...(project.metadata || {}),
      finalApproval: {
        approvedAt: new Date().toISOString(),
        approvedBy: 'Ekaagra Review Team',
        notes: approverNotes || 'Final website specification and intake approved.',
      },
    };

    await schoolsDb
      .from('school_projects')
      .update({
        status: 'approved',
        media_status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: 'Ekaagra Review Team',
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    await schoolsDb.from('school_project_audit_events').insert([
      {
        school_project_id: projectId,
        audit_number: `AUD-SCH-${currentYear}-${Date.now().toString().slice(-6)}`,
        action: 'final_approval',
        actor_name: 'Ekaagra Review Team',
        actor_role: 'approver',
        previous_status: project.status,
        new_status: 'approved',
        details: { snapshotNumber, approverNotes },
      },
    ]);

    return { success: true, snapshotNumber };
  } catch (err: any) {
    console.error('[ACTION ERROR] finalApproveSchoolProjectAction:', err);
    return { success: false, error: err.message };
  }
}

export async function requestProjectChangesAction(
  projectId: string,
  sectionKey: string,
  requestComment: string,
  fieldKey?: string | null
) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized' };
  }

  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    return { success: false, error: 'Schools DB not configured' };
  }

  try {
    const { error: crError } = await schoolsDb.from('school_intake_change_requests').insert([
      {
        school_project_id: projectId,
        section_key: sectionKey,
        field_key: fieldKey || null,
        request_comment: requestComment,
        requested_by: 'Ekaagra Reviewer',
        status: 'waiting_for_school',
      },
    ]);

    if (crError) throw crError;

    await schoolsDb
      .from('school_projects')
      .update({
        status: 'changes_requested',
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    const currentYear = new Date().getFullYear();
    await schoolsDb.from('school_project_audit_events').insert([
      {
        school_project_id: projectId,
        audit_number: `AUD-SCH-${currentYear}-${Date.now().toString().slice(-6)}`,
        action: 'changes_requested',
        actor_name: 'Ekaagra Reviewer',
        actor_role: 'internal_reviewer',
        previous_status: 'under_review',
        new_status: 'changes_requested',
        details: { sectionKey, fieldKey, requestComment },
      },
    ]);

    return { success: true };
  } catch (err: any) {
    console.error('[ACTION ERROR] requestProjectChangesAction:', err);
    return { success: false, error: err.message };
  }
}

export async function approveSchoolProjectAction(projectId: string) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized' };
  }

  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    return { success: false, error: 'Schools DB not configured' };
  }

  try {
    const { data: project } = await schoolsDb
      .from('school_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (!project) throw new Error('Project not found');

    const { data: submission } = await schoolsDb
      .from('school_intake_submissions')
      .select('*')
      .eq('school_project_id', projectId)
      .eq('is_current', true)
      .single();

    if (!submission) {
      throw new Error('No active intake submission found. Cannot approve an empty project.');
    }

    const currentYear = new Date().getFullYear();
    const snapshotNumber = `SNAP-${project.project_number}-V${submission.version_number}`;
    const planCode = mapCommercialProductToStep41Plan(project.product_id);

    const { error: snapError } = await schoolsDb.from('school_approved_snapshots').insert([
      {
        school_project_id: projectId,
        snapshot_number: snapshotNumber,
        version_number: submission.version_number,
        approved_by: 'Ekaagra Review Team',
        school_name: project.school_name,
        product_id: project.product_id,
        student_tier_id: project.student_tier_id || null,
        commercial_reference: project.lead_reference,
        snapshot_data: submission.intake_payload,
        step41_entitlement_plan: planCode,
        step42_provisioning_status: 'pending',
      },
    ]);

    if (snapError) throw snapError;

    await schoolsDb
      .from('school_projects')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: 'Ekaagra Review Team',
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    await schoolsDb.from('school_project_audit_events').insert([
      {
        school_project_id: projectId,
        audit_number: `AUD-SCH-${currentYear}-${Date.now().toString().slice(-6)}`,
        action: 'project_approved',
        actor_name: 'Ekaagra Review Team',
        actor_role: 'approver',
        previous_status: project.status,
        new_status: 'approved',
        details: { snapshotNumber, versionNumber: submission.version_number },
      },
    ]);

    // Automatically provision normalized school database entities (Zero manual re-entry!)
    let provisioningResult = null;
    try {
      provisioningResult = await populateSchoolDatabaseEntities(projectId, submission.intake_payload);
    } catch (provErr: any) {
      console.warn('[PROVISIONING ON APPROVAL WARNING]:', provErr.message);
    }

    return { success: true, snapshotNumber, provisioningResult };
  } catch (err: any) {
    console.error('[ACTION ERROR] approveSchoolProjectAction:', err);
    return { success: false, error: err.message };
  }
}

export async function provisionApprovedSchoolAction(projectId: string) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized' };
  }

  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    return { success: false, error: 'Schools DB not configured' };
  }

  try {
    const { data: submission } = await schoolsDb
      .from('school_intake_submissions')
      .select('*')
      .eq('school_project_id', projectId)
      .eq('is_current', true)
      .single();

    if (!submission) {
      return { success: false, error: 'No current intake submission found for provisioning.' };
    }

    const result = await populateSchoolDatabaseEntities(projectId, submission.intake_payload);
    return result;
  } catch (err: any) {
    console.error('[ACTION ERROR] provisionApprovedSchoolAction:', err);
    return { success: false, error: err.message };
  }
}

export async function triggerPlatformHandoffAction(projectId: string) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized' };
  }

  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    return { success: false, error: 'Schools DB not configured' };
  }

  try {
    const { data: project } = await schoolsDb
      .from('school_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (!project) throw new Error('Project not found');

    const { data: submission } = await schoolsDb
      .from('school_intake_submissions')
      .select('*')
      .eq('school_project_id', projectId)
      .eq('is_current', true)
      .maybeSingle();

    const { data: changeRequests } = await schoolsDb
      .from('school_intake_change_requests')
      .select('*')
      .eq('school_project_id', projectId);

    const evalResult = evaluateSchoolReviewState(
      project as SchoolProject,
      submission,
      changeRequests || []
    );

    if (evalResult.websiteReadiness !== 'READY') {
      return {
        success: false,
        error: `Provisioning handoff blocked: ${evalResult.websiteReadinessReason}`,
      };
    }

    if (project.status !== 'approved' && !project.metadata?.finalApproval) {
      return {
        success: false,
        error: 'Provisioning handoff blocked: Human administrator final approval is required before execution.',
      };
    }

    const result = await executePlatformHandoff(projectId, {
      name: 'Ekaagra Platform Admin',
      role: 'platform_engineer',
      email: 'admin@ekaagratechnologies.com',
    });

    if (result.success) {
      await schoolsDb
        .from('school_projects')
        .update({
          status: 'handed_off',
          handoff_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);
    }

    return result;
  } catch (err: any) {
    console.error('[ACTION ERROR] triggerPlatformHandoffAction:', err);
    return { success: false, error: err.message };
  }
}

export async function updateMediaStatusAction(projectId: string, mediaStatus: SchoolMediaStatus) {
  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    return { success: false, error: 'Schools DB not configured' };
  }

  try {
    await schoolsDb
      .from('school_projects')
      .update({
        media_status: mediaStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    const currentYear = new Date().getFullYear();
    await schoolsDb.from('school_project_audit_events').insert([
      {
        school_project_id: projectId,
        audit_number: `AUD-SCH-${currentYear}-${Date.now().toString().slice(-6)}`,
        action: 'media_status_updated',
        actor_name: 'System / User',
        actor_role: 'updater',
        details: { newMediaStatus: mediaStatus },
      },
    ]);

    return { success: true };
  } catch (err: any) {
    console.error('[ACTION ERROR] updateMediaStatusAction:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Intelligent Role-Aware Desk Message Generation Action for Section 3
 * Verifies session security, sanitizes user inputs (Zero Client Trust),
 * and generates role-tailored first-person desk messages.
 */
export async function generateDeskMessageAction(
  token: string,
  payload: DeskMessageGenerationRequest
): Promise<DeskMessageGenerationResult> {
  const verification = await verifyOnboardingToken(token);
  if (!verification.valid || !verification.project) {
    return {
      success: false,
      message: '',
      effectiveDesignation: '',
      roleFamily: 'custom',
      wordCount: 0,
      source: 'generated',
      requestId: payload.requestId,
      error: verification.error || 'Invalid or expired onboarding session.',
    };
  }

  try {
    // Sanitization of input fields (Zero Client Trust)
    const sanitizedRequest: DeskMessageGenerationRequest = {
      personId: String(payload.personId || '').slice(0, 100),
      fullName: String(payload.fullName || '').slice(0, 150).replace(/[<>{}]/g, ''),
      officialDesignation: String(payload.officialDesignation || '').slice(0, 100).replace(/[<>{}]/g, ''),
      otherDesignation: String(payload.otherDesignation || '').slice(0, 100).replace(/[<>{}]/g, ''),
      academicQualifications: String(payload.academicQualifications || '').slice(0, 200).replace(/[<>{}]/g, ''),
      isPrincipal: Boolean(payload.isPrincipal),
      schoolContext: {
        schoolName: String(payload.schoolContext?.schoolName || verification.project.school_name || '').slice(0, 150).replace(/[<>{}]/g, ''),
        brandTone: String(payload.schoolContext?.brandTone || '').slice(0, 60),
        city: String(payload.schoolContext?.city || '').slice(0, 100),
        state: String(payload.schoolContext?.state || '').slice(0, 100),
        mottoOrTagline: String(payload.schoolContext?.mottoOrTagline || '').slice(0, 200).replace(/[<>{}]/g, ''),
      },
      requestId: payload.requestId,
    };

    return await generateDeskMessage(sanitizedRequest);
  } catch (err: any) {
    console.error('[ACTION ERROR] generateDeskMessageAction:', err);
    return {
      success: false,
      message: '',
      effectiveDesignation: '',
      roleFamily: 'custom',
      wordCount: 0,
      source: 'generated',
      requestId: payload.requestId,
      error: err.message || 'Failed to generate desk message.',
    };
  }
}

/**
 * Intelligent Content Recommendation Action for Section 24
 * Verifies session security, sanitizes inputs, enforces Rule 26 (minimum data exposure),
 * and generates fact-based website recommendations or policy templates.
 */
export async function generateContentRecommendationAction(
  token: string,
  request: ContentRecommendationRequest
): Promise<ContentRecommendationResult> {
  const verification = await verifyOnboardingToken(token);
  if (!verification.valid || !verification.project) {
    return {
      fieldKey: request.fieldKey,
      generatedText: '',
      sourceFields: [],
      sourceLabels: [],
      confidence: 'low',
      requiresReview: false,
      sourceFingerprint: '',
      warnings: [verification.error || 'Invalid or expired onboarding session.'],
    };
  }

  try {
    // Sanitization and minimum data exposure (Rule 26: never expose credentials, auth tokens, or private data)
    const raw = request.intakeData || {};
    const sanitizedIntake: Partial<UniversalIntakeData> = {
      schoolProfile: {
        schoolName: String(raw.schoolProfile?.schoolName || verification.project.school_name || '').slice(0, 150),
        legalInstitutionName: String(raw.schoolProfile?.legalInstitutionName || '').slice(0, 150),
        yearOfEstablishment: String(raw.schoolProfile?.yearOfEstablishment || '').slice(0, 10),
        board: String(raw.schoolProfile?.board || '').slice(0, 50),
        affiliationNumber: String(raw.schoolProfile?.affiliationNumber || '').slice(0, 50),
        schoolType: String(raw.schoolProfile?.schoolType || '').slice(0, 100),
        city: String(raw.schoolProfile?.city || '').slice(0, 100),
        state: String(raw.schoolProfile?.state || '').slice(0, 100),
        country: String(raw.schoolProfile?.country || 'India').slice(0, 100),
        officialPhone: String(raw.schoolProfile?.officialPhone || '').slice(0, 50),
        officialEmail: String(raw.schoolProfile?.officialEmail || '').slice(0, 100),
        preferredPublicUrl: String(raw.schoolProfile?.preferredPublicUrl || '').slice(0, 150),
      } as any,
      campuses: Array.isArray(raw.campuses)
        ? (raw.campuses as any[]).slice(0, 10).map((c) => ({
            id: c.id,
            name: String(c.name || '').slice(0, 100),
            address: String(c.address || '').slice(0, 200),
            city: String(c.city || '').slice(0, 100),
            state: String(c.state || '').slice(0, 100),
            pin: String(c.pin || '').slice(0, 10),
            contactPhone: String(c.contactPhone || '').slice(0, 30),
            facilities: Array.isArray(c.facilities) ? c.facilities.slice(0, 30) : [],
            isMainCampus: Boolean(c.isMainCampus),
          })) as any
        : [],
      brandingDesign: {
        brandTone: String(raw.brandingDesign?.brandTone || '').slice(0, 60),
        taglineOrMotto: String(raw.brandingDesign?.taglineOrMotto || raw.brandingDesign?.motto || '').slice(0, 200),
        motto: String(raw.brandingDesign?.motto || '').slice(0, 200),
        coreValues: Array.isArray(raw.brandingDesign?.coreValues) ? raw.brandingDesign.coreValues.slice(0, 10) : [],
      } as any,
      schoolContent: {
        aboutSchool: (raw.schoolContent?.aboutSchool as any) || '',
        vision: (raw.schoolContent?.vision as any) || '',
        mission: (raw.schoolContent?.mission as any) || '',
        coreValues: Array.isArray(raw.schoolContent?.coreValues) ? raw.schoolContent.coreValues.slice(0, 10) : [],
        educationalPhilosophy: (raw.schoolContent?.educationalPhilosophy as any) || '',
        teachingMethodology: (raw.schoolContent?.teachingMethodology as any) || '',
        awardsAndAchievements: Array.isArray(raw.schoolContent?.awardsAndAchievements)
          ? raw.schoolContent.awardsAndAchievements.slice(0, 15)
          : [],
      } as any,
      leadership: {
        principalName: String(raw.leadership?.principalName || '').slice(0, 100),
        principalDesignation: String(raw.leadership?.principalDesignation || 'Principal').slice(0, 60),
        principalQualification: String(raw.leadership?.principalQualification || '').slice(0, 100),
        principalMessage: String(raw.leadership?.principalMessage || '').slice(0, 1500),
        managementMembers: Array.isArray(raw.leadership?.managementMembers)
          ? raw.leadership.managementMembers.slice(0, 5).map((m) => ({
              name: String(m.name || '').slice(0, 100),
              designation: String(m.designation || '').slice(0, 60),
            }))
          : [],
      } as any,
      facilitiesConfig: raw.facilitiesConfig ? { ...raw.facilitiesConfig } : undefined,
      institutionStructure: raw.institutionStructure ? { ...raw.institutionStructure } : undefined,
      staffFaculty: raw.staffFaculty ? { ...raw.staffFaculty } : undefined,
      admissions: raw.admissions ? { ...raw.admissions } : undefined,
      attendanceConfig: raw.attendanceConfig ? { ...raw.attendanceConfig } : undefined,
      transportConfig: raw.transportConfig ? { ...raw.transportConfig } : undefined,
      hostelConfig: raw.hostelConfig ? { ...raw.hostelConfig } : undefined,
      legalPolicies: raw.legalPolicies ? { ...raw.legalPolicies } : undefined,
    };

    return generateContentRecommendation({
      fieldKey: request.fieldKey,
      intakeData: sanitizedIntake,
      tone: request.tone,
      length: request.length,
      variationSeed: request.variationSeed,
    });
  } catch (err: any) {
    console.error('[ACTION ERROR] generateContentRecommendationAction:', err);
    return {
      fieldKey: request.fieldKey,
      generatedText: '',
      sourceFields: [],
      sourceLabels: [],
      confidence: 'low',
      requiresReview: false,
      sourceFingerprint: '',
      warnings: [err.message || 'Failed to generate recommendation.'],
    };
  }
}

export async function updateProjectProductAction(
  token: string,
  productId: 'school-website' | 'school-website-cms' | 'school-erp' | 'school-complete'
) {
  const verification = await verifyOnboardingToken(token);
  if (!verification.valid || !verification.project) {
    return { success: false, error: verification.error || 'Invalid session' };
  }

  const validProducts = ['school-website', 'school-website-cms', 'school-erp', 'school-complete'];
  if (!validProducts.includes(productId)) {
    return { success: false, error: 'Invalid product selected' };
  }

  const schoolsDb = getSchoolsServerClient()!;
  try {
    const { error } = await schoolsDb
      .from('school_projects')
      .update({
        product_id: productId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', verification.project.id);

    if (error) throw error;
    return { success: true, productId };
  } catch (err: any) {
    console.error('[ACTION ERROR] updateProjectProductAction:', err);
    return { success: false, error: err.message };
  }
}

export async function approveWebsiteSpecificationAction(
  token: string,
  approver: ApproverInfo,
  notes?: string,
  clientIntakeData?: Partial<UniversalIntakeData>
): Promise<{
  success: boolean;
  approvalRecord?: WebsiteApprovalRecord;
  isNewVersion?: boolean;
  message?: string;
  error?: string;
}> {
  const verification = await verifyOnboardingToken(token);
  if (!verification.valid || !verification.project) {
    return { success: false, error: verification.error || 'Invalid onboarding session.' };
  }

  const schoolsDb = getSchoolsServerClient()!;
  const projectId = verification.project.id;

  try {
    // 1. Fetch current submission
    const { data: existingSub, error: subFetchErr } = await schoolsDb
      .from('school_intake_submissions')
      .select('*')
      .eq('school_project_id', projectId)
      .eq('is_current', true)
      .maybeSingle();

    if (subFetchErr) throw subFetchErr;

    const currentPayload: UniversalIntakeData = existingSub?.intake_payload || (clientIntakeData as UniversalIntakeData);
    if (!currentPayload) {
      return { success: false, error: 'No onboarding intake submission found to approve.' };
    }

    // Merge client-supplied verified draft if available
    const effectiveIntake: UniversalIntakeData = clientIntakeData
      ? { ...currentPayload, ...clientIntakeData }
      : currentPayload;

    // 2. Authoritative Publication Readiness Validation & Structured Blocker Diagnostic
    const publicationValidation = evaluateWebsitePublicationReadiness(effectiveIntake);
    if (!publicationValidation.isReady) {
      if (process.env.NODE_ENV !== 'production') {
        const structuredLog = publicationValidation.blockers.map((b) => ({
          id: b.id,
          section: b.section,
          field: b.field,
          status: b.status,
          severity: b.severity,
          route: b.route,
          anchor: b.anchor,
          reason: b.reason,
          source: b.source,
          applicability: b.applicability,
        }));
        console.log('[SUBMIT & LOCK BLOCKERS DIAGNOSTIC]:', JSON.stringify(structuredLog, null, 2));
      }
      return {
        success: false,
        error: `Approval rejected: ${publicationValidation.blockers.length} unresolved blocker(s) exist.`,
      };
    }

    // 3. Concurrency check: check if already approved with identical snapshot
    const currentApproval = existingSub?.intake_payload?.websiteRequirements?.currentApproval;
    const approvalRes = approveWebsiteSpecification(effectiveIntake, approver, notes);

    if (!approvalRes.success || !approvalRes.approvalRecord) {
      return {
        success: false,
        error: approvalRes.message || 'Server approval preconditions not met.',
      };
    }

    // Idempotent: existing approval has identical snapshot hash
    if (!approvalRes.isNewVersion && currentApproval && currentApproval.status === 'approved') {
      return {
        success: true,
        approvalRecord: currentApproval,
        isNewVersion: false,
        message: 'Specification already approved with identical content. Existing approval retained.',
      };
    }

    // 3. New legitimate version: archive previous into history
    const prevHistory = existingSub?.intake_payload?.websiteRequirements?.approvalHistory || [];
    const updatedHistory = currentApproval
      ? [{ ...currentApproval, status: 'superseded' as const }, ...prevHistory]
      : prevHistory;

    const updatedWebReq = {
      ...(effectiveIntake.websiteRequirements || {}),
      currentApproval: approvalRes.approvalRecord,
      approvalHistory: updatedHistory,
      websiteApproved: true,
      websiteApprovedAt: approvalRes.approvalRecord.approvedAt,
      websiteApprovedBy: approvalRes.approvalRecord.approvedBy.name,
      websiteApprovalNotes: approvalRes.approvalRecord.notes,
    };

    const finalPayload: UniversalIntakeData = {
      ...effectiveIntake,
      websiteRequirements: updatedWebReq,
    };

    // 4. Atomically persist to database
    if (existingSub) {
      await schoolsDb
        .from('school_intake_submissions')
        .update({
          intake_payload: finalPayload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSub.id);
    } else {
      await schoolsDb.from('school_intake_submissions').insert([
        {
          school_project_id: projectId,
          version_number: 1,
          is_current: true,
          submitted_by_name: approver.name,
          submitted_by_email: approver.email,
          intake_payload: finalPayload,
          completeness_percentage: 100,
          status: 'draft',
        },
      ]);
    }

    // 5. Audit event
    const currentYear = new Date().getFullYear();
    await schoolsDb.from('school_project_audit_events').insert([
      {
        school_project_id: projectId,
        audit_number: `AUD-SCH-${currentYear}-${Date.now().toString().slice(-6)}`,
        action: 'website_specification_approved',
        actor_name: approver.name,
        actor_role: approver.role || 'administrator',
        previous_status: verification.project.status,
        new_status: verification.project.status,
        details: {
          specificationVersion: approvalRes.approvalRecord.specificationVersion,
          specificationHash: approvalRes.approvalRecord.specificationHash,
          approverEmail: approver.email,
          approvedAt: approvalRes.approvalRecord.approvedAt,
        },
      },
    ]);

    return {
      success: true,
      approvalRecord: approvalRes.approvalRecord,
      isNewVersion: true,
      message: approvalRes.message,
    };
  } catch (err: any) {
    console.error('[ACTION ERROR] approveWebsiteSpecificationAction:', err);
    return { success: false, error: err.message || 'Internal server error during website specification approval.' };
  }
}

export async function reopenWebsiteSpecificationAction(
  token: string,
  reason: string = 'Reopened for administrative edits'
): Promise<{ success: boolean; error?: string }> {
  const verification = await verifyOnboardingToken(token);
  if (!verification.valid || !verification.project) {
    return { success: false, error: verification.error || 'Invalid session' };
  }

  const schoolsDb = getSchoolsServerClient()!;
  const projectId = verification.project.id;

  try {
    const { data: existingSub } = await schoolsDb
      .from('school_intake_submissions')
      .select('*')
      .eq('school_project_id', projectId)
      .eq('is_current', true)
      .maybeSingle();

    if (!existingSub || !existingSub.intake_payload) {
      return { success: false, error: 'No active intake submission found.' };
    }

    const payload: UniversalIntakeData = existingSub.intake_payload;
    const currentApproval = payload.websiteRequirements?.currentApproval;
    const prevHistory = payload.websiteRequirements?.approvalHistory || [];

    let updatedHistory = prevHistory;
    if (currentApproval) {
      const supersededRecord = {
        ...currentApproval,
        status: 'superseded' as const,
        invalidationReason: reason,
        invalidatedAt: new Date().toISOString(),
      };
      updatedHistory = [supersededRecord, ...prevHistory];
    }

    const updatedWebReq = {
      ...(payload.websiteRequirements || {}),
      currentApproval: currentApproval
        ? {
            ...currentApproval,
            status: 'superseded' as const,
            invalidationReason: reason,
            invalidatedAt: new Date().toISOString(),
          }
        : undefined,
      approvalHistory: updatedHistory,
      websiteApproved: false,
      websiteApprovedAt: undefined,
      websiteApprovedBy: undefined,
    };

    await schoolsDb
      .from('school_intake_submissions')
      .update({
        intake_payload: {
          ...payload,
          websiteRequirements: updatedWebReq,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingSub.id);

    return { success: true };
  } catch (err: any) {
    console.error('[ACTION ERROR] reopenWebsiteSpecificationAction:', err);
    return { success: false, error: err.message };
  }
}


