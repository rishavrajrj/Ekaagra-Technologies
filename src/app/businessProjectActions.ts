'use server';

import { verifyAdminSession } from '@/lib/adminAuth';
import {
  createBusinessProjectFromLead,
  getBusinessProjects,
  getBusinessProjectDetails,
  generateBusinessOnboardingToken,
  verifyBusinessOnboardingToken,
  saveDraftBusinessRequirements,
  submitFinalBusinessRequirements,
  updateRequirementsReviewStatus,
  createDesignReview,
  submitDesignClientFeedback,
  updateBusinessProjectStatus,
  addProjectNote,
  deleteBusinessProjectAsset,
} from '@/lib/businessProjectsDb';
import { createOrderRecord, isSupabaseConfigured } from '@/lib/supabase';
import { generateOrderNumber, isRazorpayConfigured, createRazorpayOrder } from '@/lib/razorpay';
import { calculateVerifiedOrderTotal } from '@/lib/pricingEngine';
import type {
  BusinessProjectFilter,
  BusinessProjectStatus,
  BusinessRequirementsData,
} from '@/lib/types';
import {
  sendBusinessRequirementsInviteEmail,
  sendAdminRequirementsSubmittedEmail,
  sendClientRequirementsConfirmationEmail,
  sendClarificationRequestEmail,
  sendRequirementsApprovedClientEmail,
  sendDesignReadyClientEmail,
  sendAdminDesignRevisionRequestedEmail,
  sendAdminDesignApprovedEmail,
  sendClientPaymentMilestoneEmail,
} from '@/lib/email';

/**
 * -----------------------------------------------------------------------------
 * ADMIN SERVER ACTIONS (Protected by verifyAdminSession)
 * -----------------------------------------------------------------------------
 */

export async function createBusinessProjectAction(
  leadId: string,
  overrides?: { projectName?: string; serviceType?: string; assignedTeam?: string }
) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return { success: false, error: 'Unauthorized. Admin session required.' };
  }

  const result = await createBusinessProjectFromLead(leadId, overrides);

  // If newly created and email present, attempt sending onboarding invitation email
  if (result.success && result.project && result.token && !result.isExisting) {
    try {
      const projectDetails = await getBusinessProjectDetails(result.project.id);
      const recipientEmail = projectDetails.client?.email || projectDetails.project?.lead?.email;
      const recipientName = projectDetails.client?.name || projectDetails.project?.lead?.name || 'Valued Client';

      if (recipientEmail) {
        await sendBusinessRequirementsInviteEmail({
          clientName: recipientName,
          clientEmail: recipientEmail,
          projectName: result.project.project_name,
          onboardingUrl: result.onboardingUrl || `/business-requirements/${result.token}`,
        });
      }
    } catch (emailErr) {
      console.warn('[NON-FATAL] Failed to send onboarding invite email:', emailErr);
    }
  }

  return result;
}

export async function fetchBusinessProjectsAction(filter: BusinessProjectFilter = {}) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return { success: false, projects: [], total: 0, error: 'Unauthorized.' };
  }

  return getBusinessProjects(filter);
}

export async function fetchBusinessProjectDetailsAction(projectId: string) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return { success: false, error: 'Unauthorized.' };
  }

  return getBusinessProjectDetails(projectId);
}

export async function updateBusinessProjectStatusAction(
  projectId: string,
  newStatus: BusinessProjectStatus,
  adminNotes?: string
) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return { success: false, error: 'Unauthorized.' };
  }

  return updateBusinessProjectStatus(projectId, newStatus, adminNotes);
}

export async function regenerateBusinessOnboardingTokenAction(projectId: string) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return { success: false, error: 'Unauthorized.' };
  }

  const res = await generateBusinessOnboardingToken(projectId);
  if (!res.success || !res.rawToken) {
    return { success: false, error: res.error || 'Failed to generate new token.' };
  }

  return {
    success: true,
    token: res.rawToken,
    onboardingUrl: `/business-requirements/${res.rawToken}`,
  };
}

export async function updateRequirementsReviewAction(params: {
  projectId: string;
  submissionId: string;
  reviewStatus: 'REVIEWED' | 'CLARIFICATION_REQUESTED' | 'UNDER_REVIEW';
  adminNotes?: string;
  clarificationNotes?: string;
  clientEmail?: string;
  clientName?: string;
  projectName?: string;
  onboardingUrl?: string;
}) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return { success: false, error: 'Unauthorized.' };
  }

  const result = await updateRequirementsReviewStatus({
    projectId: params.projectId,
    submissionId: params.submissionId,
    reviewStatus: params.reviewStatus,
    adminNotes: params.adminNotes,
    clarificationNotes: params.clarificationNotes,
    reviewerName: 'Ekaagra Admin',
  });

  // If clarification was requested, notify client via email
  if (result.success && params.reviewStatus === 'CLARIFICATION_REQUESTED' && params.clientEmail && params.clarificationNotes) {
    try {
      await sendClarificationRequestEmail({
        clientName: params.clientName || 'Valued Client',
        clientEmail: params.clientEmail,
        projectName: params.projectName || 'Your Project',
        clarificationNotes: params.clarificationNotes,
        formUrl: params.onboardingUrl || 'https://www.ekaagratechnologies.site',
      });
    } catch (e) {
      console.warn('[CLARIFICATION EMAIL NON-FATAL]', e);
    }
  }

  // If requirements were approved (REVIEWED), notify client that design has begun
  if (result.success && params.reviewStatus === 'REVIEWED' && params.clientEmail) {
    try {
      await sendRequirementsApprovedClientEmail({
        clientName: params.clientName || 'Valued Client',
        clientEmail: params.clientEmail,
        projectName: params.projectName || 'Your Project',
      });
    } catch (e) {
      console.warn('[REQUIREMENTS APPROVED EMAIL NON-FATAL]', e);
    }
  }

  return result;
}

export async function createDesignReviewAction(params: {
  projectId: string;
  designTitle: string;
  designUrl: string;
  designNotes?: string;
  clientEmail?: string;
  clientName?: string;
  projectName?: string;
  token?: string;
}) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return { success: false, error: 'Unauthorized.' };
  }

  const result = await createDesignReview({
    projectId: params.projectId,
    designTitle: params.designTitle,
    designUrl: params.designUrl,
    designNotes: params.designNotes,
  });

  // Notify client that design concept is ready for inspection
  if (result.success && params.clientEmail && params.token) {
    try {
      await sendDesignReadyClientEmail({
        clientName: params.clientName || 'Valued Client',
        clientEmail: params.clientEmail,
        projectName: params.projectName || 'Your Project',
        designUrl: params.designUrl,
        reviewPortalUrl: `/design-review/${params.token}`,
      });
    } catch (e) {
      console.warn('[DESIGN READY EMAIL NON-FATAL]', e);
    }
  }

  return result;
}

export async function addProjectNoteAction(projectId: string, content: string) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return { success: false, error: 'Unauthorized.' };
  }

  return addProjectNote({
    projectId,
    authorName: 'Ekaagra Admin',
    content,
  });
}

/**
 * Admin Action: Generate post-design payment milestone ONLY after Design Approval
 */
export async function createPostDesignPaymentMilestoneAction(params: {
  projectId: string;
  leadId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amountINR: number;
  milestoneTitle: string;
}) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return { success: false, error: 'Unauthorized.' };
  }

  // Strictly verify project is in DESIGN_APPROVED status
  const projectRes = await getBusinessProjectDetails(params.projectId);
  if (!projectRes.success || !projectRes.project) {
    return { success: false, error: 'Project not found.' };
  }

  const status = projectRes.project.project_status;
  if (
    status !== 'DESIGN_APPROVED' &&
    status !== 'PAYMENT_PENDING' &&
    status !== 'PAID' &&
    status !== 'DEVELOPMENT'
  ) {
    return {
      success: false,
      error: `Payment cannot be requested yet. Current status is ${status.replace('_', ' ')}. Payment can only be requested AFTER design concept has been approved by client.`,
    };
  }

  const verified = calculateVerifiedOrderTotal({
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    customerPhone: params.customerPhone,
    serviceType: projectRes.project.service_type,
    isCustomPaymentLink: true,
    customAmountINR: params.amountINR,
    customDescription: params.milestoneTitle,
  });

  if (!verified.isValid) {
    return { success: false, error: verified.error || 'Failed to verify payment amount.' };
  }

  const orderNumber = generateOrderNumber();
  let gatewayOrderId: string | undefined;

  if (isRazorpayConfigured()) {
    const razorpayRes = await createRazorpayOrder({
      amountInPaise: verified.amountInPaise,
      currency: 'INR',
      receipt: orderNumber,
      notes: {
        orderNumber,
        projectId: params.projectId,
        customerName: params.customerName.trim(),
        customerEmail: params.customerEmail.trim(),
        serviceType: projectRes.project.service_type,
        milestoneTitle: params.milestoneTitle,
      },
    });

    if (razorpayRes.success && razorpayRes.data) {
      gatewayOrderId = razorpayRes.data.id;
    }
  }

  // Create order record linked to project
  if (isSupabaseConfigured()) {
    const dbRes = await createOrderRecord({
      lead_id: params.leadId || projectRes.project.lead_id || null,
      order_number: orderNumber,
      customer_name: params.customerName.trim(),
      customer_email: params.customerEmail.trim(),
      customer_phone: params.customerPhone.trim(),
      service_type: projectRes.project.service_type,
      amount_inr: params.amountINR,
      payment_status: 'PENDING',
      gateway_name: 'RAZORPAY',
      gateway_order_id: gatewayOrderId || null,
      metadata: {
        organizationName: projectRes.project.project_name,
        notes: `Post-design milestone: ${params.milestoneTitle}`,
        milestoneDescription: params.milestoneTitle,
        isCustomLink: true,
      },
    });

    if (!dbRes.success) {
      return { success: false, error: dbRes.error || 'Failed to save milestone order.' };
    }

    // Update project status to PAYMENT_PENDING
    await updateBusinessProjectStatus(params.projectId, 'PAYMENT_PENDING', `Payment requested for ${params.milestoneTitle}: ₹${params.amountINR}`);
  }

  const paymentUrl = `/pay/${orderNumber}`;

  // Send Milestone Invoice email to client
  if (params.customerEmail) {
    try {
      await sendClientPaymentMilestoneEmail({
        clientName: params.customerName || 'Valued Client',
        clientEmail: params.customerEmail,
        projectName: projectRes.project.project_name,
        milestoneTitle: params.milestoneTitle,
        amountINR: params.amountINR,
        paymentUrl,
      });
    } catch (emailErr) {
      console.warn('[MILESTONE EMAIL NON-FATAL]', emailErr);
    }
  }

  return {
    success: true,
    orderNumber,
    paymentUrl,
  };
}

/**
 * -----------------------------------------------------------------------------
 * CLIENT SERVER ACTIONS (Protected by Token Validation)
 * -----------------------------------------------------------------------------
 */

export async function verifyBusinessTokenAction(rawToken: string) {
  return verifyBusinessOnboardingToken(rawToken);
}

export async function saveDraftRequirementsAction(params: {
  rawToken: string;
  sectionKey: string;
  sectionData: Record<string, unknown>;
  currentStep: number;
}) {
  return saveDraftBusinessRequirements(params);
}

export async function submitFinalRequirementsAction(params: {
  rawToken: string;
  payload: BusinessRequirementsData;
  contactName: string;
  contactEmail: string;
}) {
  const result = await submitFinalBusinessRequirements(params);

  // Send transactional emails upon submission
  if (result.success) {
    try {
      // 1. Notify Ekaagra Admin
      await sendAdminRequirementsSubmittedEmail({
        projectName: result.projectName || 'Business Project',
        clientName: params.contactName,
        clientEmail: params.contactEmail,
        submissionId: result.submissionId || '',
        projectNumber: result.projectNumber || '',
      });

      // 2. Send confirmation to Client
      await sendClientRequirementsConfirmationEmail({
        clientName: params.contactName,
        clientEmail: params.contactEmail,
        projectName: result.projectName || 'Your Project',
      });
    } catch (emailErr) {
      console.warn('[SUBMISSION EMAIL NON-FATAL]', emailErr);
    }
  }

  return result;
}

export async function submitDesignFeedbackAction(params: {
  rawToken: string;
  reviewId: string;
  decision: 'APPROVED' | 'REVISION_REQUESTED';
  feedback?: string;
  clientName?: string;
}) {
  const result = await submitDesignClientFeedback(params);

  if (result.success) {
    try {
      if (params.decision === 'APPROVED') {
        await sendAdminDesignApprovedEmail({
          projectName: result.projectName || 'Business Project',
          projectNumber: result.projectNumber || 'BUS-PROJECT',
          designVersion: result.designVersion || 1,
          clientName: params.clientName || 'Client',
        });
      } else {
        await sendAdminDesignRevisionRequestedEmail({
          projectName: result.projectName || 'Business Project',
          projectNumber: result.projectNumber || 'BUS-PROJECT',
          designVersion: result.designVersion || 1,
          clientFeedback: params.feedback || 'Adjustments requested',
          clientName: params.clientName || 'Client',
        });
      }
    } catch (err) {
      console.warn('[DESIGN FEEDBACK EMAIL NON-FATAL]', err);
    }
  }

  return result;
}

export async function deleteBusinessProjectAssetAction(params: {
  rawToken?: string;
  projectId?: string;
  assetId: string;
}) {
  if (params.projectId) {
    const isAuth = await verifyAdminSession();
    if (!isAuth) {
      return { success: false, error: 'Unauthorized. Admin session required.' };
    }
  }
  return deleteBusinessProjectAsset(params);
}
