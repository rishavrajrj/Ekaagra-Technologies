'use server';

import type { ContactFormData, QuoteFormData, LeadFilter, LeadStatus } from '@/lib/types';
import {
  ADMIN_EMAIL,
  FROM_EMAIL,
  sendContactNotification,
  sendQuoteNotification,
  sendClientContactConfirmation,
  sendClientQuoteConfirmation,
} from '@/lib/email';
import {
  createLead,
  getLeads,
  getLeadStats,
  updateLeadStatus,
  updateLeadNotes,
} from '@/lib/supabase';
import { authenticateAdmin, logoutAdmin, verifyAdminSession } from '@/lib/adminAuth';
import { redirect } from 'next/navigation';

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return 'unknown';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `*@${domain}`;
  return `${user.slice(0, 2)}***@${domain}`;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PUBLIC ACTIONS: Contact & Quote Form Submissions
 * ─────────────────────────────────────────────────────────────────────────────
 */

export async function submitContactForm(data: ContactFormData) {
  // Validate required fields
  if (!data.name || !data.phone || !data.email || !data.service || !data.description) {
    return { success: false, message: 'Please fill in all required fields.' };
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  // Phone validation (basic)
  if (data.phone.length < 10) {
    return { success: false, message: 'Please enter a valid phone number.' };
  }

  // 1. Persist lead to Supabase Database (Source of truth)
  let leadRecordId: string | undefined;
  try {
    const leadInsertRes = await createLead({
      source: 'CONTACT_FORM',
      type: 'CONTACT',
      status: 'NEW',
      name: data.name,
      organization: data.organization || null,
      phone: data.phone,
      email: data.email,
      service: data.service,
      budget: data.budget || null,
      description: data.description,
      preferred_contact: data.preferredContact || null,
    });

    if (leadInsertRes.success && leadInsertRes.data) {
      leadRecordId = leadInsertRes.data.id;
    }
  } catch (dbError) {
    console.error('[CONTACT SUBMISSION] Database insertion exception:', dbError);
  }

  const isResendConfigured = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== '');

  console.log(
    `[CONTACT SUBMISSION] emailFunctionCalled=true adminRecipient=${maskEmail(ADMIN_EMAIL)} from=${FROM_EMAIL} resendConfigured=${isResendConfigured}`
  );

  // 2. Send instant email notification to Ekaagra Admin
  let adminResult;
  try {
    adminResult = await sendContactNotification(data);
  } catch (error) {
    console.error('[CONTACT SUBMISSION] admin error:', error);
    adminResult = { success: false, method: 'error' as const, error: String(error) };
  }

  // 3. Send confirmation email to the Client
  let clientResult;
  try {
    clientResult = await sendClientContactConfirmation(data);
  } catch (error) {
    console.error('[CONTACT SUBMISSION] client confirmation error:', error);
    clientResult = { success: false, method: 'error' as const, error: String(error) };
  }

  const isDelivered = adminResult.success;

  return {
    success: true,
    leadId: leadRecordId,
    emailDelivered: isDelivered,
    adminMessageId: adminResult.messageId,
    clientMessageId: clientResult.messageId,
    message: isDelivered
      ? "Thank you! Your enquiry has been received. Our team will review your requirements and get back to you within 24 hours."
      : "Thank you! Your enquiry has been received. Our team will review your requirements shortly.",
  };
}

export async function submitQuoteForm(data: QuoteFormData) {
  if (!data.name || !data.phone || !data.email || !data.projectType || !data.description) {
    return { success: false, message: 'Please fill in all required fields.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  if (data.phone.length < 10) {
    return { success: false, message: 'Please enter a valid phone number.' };
  }

  // 1. Persist quote request to Supabase Database (Source of truth)
  let leadRecordId: string | undefined;
  try {
    const leadInsertRes = await createLead({
      source: 'QUOTE_FORM',
      type: 'QUOTE',
      status: 'NEW',
      name: data.name,
      organization: data.organization || null,
      phone: data.phone,
      email: data.email,
      project_type: data.projectType,
      description: data.description,
      features: data.features || null,
      expected_users: data.expectedUsers || null,
      budget: data.budget || null,
      timeline: data.timeline || null,
    });

    if (leadInsertRes.success && leadInsertRes.data) {
      leadRecordId = leadInsertRes.data.id;
    }
  } catch (dbError) {
    console.error('[QUOTE SUBMISSION] Database insertion exception:', dbError);
  }

  const isResendConfigured = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== '');

  console.log(
    `[QUOTE SUBMISSION] emailFunctionCalled=true adminRecipient=${maskEmail(ADMIN_EMAIL)} from=${FROM_EMAIL} resendConfigured=${isResendConfigured}`
  );

  // 2. Send instant quote notification to Ekaagra Admin
  let adminResult;
  try {
    adminResult = await sendQuoteNotification(data);
  } catch (error) {
    console.error('[QUOTE SUBMISSION] admin error:', error);
    adminResult = { success: false, method: 'error' as const, error: String(error) };
  }

  // 3. Send confirmation email to the Client
  let clientResult;
  try {
    clientResult = await sendClientQuoteConfirmation(data);
  } catch (error) {
    console.error('[QUOTE SUBMISSION] client confirmation error:', error);
    clientResult = { success: false, method: 'error' as const, error: String(error) };
  }

  const isDelivered = adminResult.success;

  return {
    success: true,
    leadId: leadRecordId,
    emailDelivered: isDelivered,
    adminMessageId: adminResult.messageId,
    clientMessageId: clientResult.messageId,
    message: isDelivered
      ? "Thank you! Your project enquiry and scope details have been received. We'll analyze your requirements and send a customized roadmap and estimate."
      : "Thank you! Your project enquiry and scope details have been received. We'll analyze your requirements shortly.",
  };
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ADMIN ACTIONS (Protected by verifyAdminSession)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export async function adminLoginAction(password: string) {
  const success = await authenticateAdmin(password);
  if (!success) {
    return { success: false, message: 'Invalid administrative password.' };
  }
  return { success: true };
}

export async function adminLogoutAction() {
  await logoutAdmin();
  redirect('/admin/login');
}

export async function fetchLeadsAction(filter: LeadFilter = {}) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return { success: false, leads: [], total: 0, error: 'Unauthorized. Please login to access leads.' };
  }

  return getLeads(filter);
}

export async function fetchLeadStatsAction() {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return {
      success: false,
      stats: { total: 0, new: 0, contacted: 0, qualified: 0, proposalSent: 0, converted: 0, lost: 0 },
      error: 'Unauthorized.',
    };
  }

  return getLeadStats();
}

export async function updateLeadStatusAction(leadId: string, status: LeadStatus) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return { success: false, error: 'Unauthorized.' };
  }

  return updateLeadStatus(leadId, status);
}

export async function updateLeadNotesAction(leadId: string, notes: string) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return { success: false, error: 'Unauthorized.' };
  }

  return updateLeadNotes(leadId, notes);
}
