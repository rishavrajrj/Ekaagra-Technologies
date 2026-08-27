import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import type { ContactFormData, QuoteFormData } from './types';
import {
  getWhatsAppChatUrl,
  buildContactSubmissionWhatsAppUrl,
  buildQuoteSubmissionWhatsAppUrl,
} from './whatsapp';

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ekaagratechnologies@gmail.com';
export const FROM_EMAIL =
  process.env.FROM_EMAIL || 'Ekaagra Technologies <notifications@ekaagratechnologies.site>';

export interface EmailDispatchResult {
  success: boolean;
  method: 'resend' | 'smtp' | 'unconfigured' | 'error';
  messageId?: string;
  error?: string;
}

/**
 * Format client phone number into clean WhatsApp URL for Admin reply
 */
function getClientWhatsAppLink(phone: string, clientName: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const greeting = `Hi ${clientName}, thank you for reaching out to Ekaagra Technologies! We received your enquiry and would love to discuss your requirements.`;
  return getWhatsAppChatUrl(greeting, formattedPhone);
}

/**
 * Helper to mask email for safe server logging
 */
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return 'unknown';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `*@${domain}`;
  return `${user.slice(0, 2)}***@${domain}`;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. ADMIN NOTIFICATION TEMPLATES (Sent to Ekaagra Admin)
 * ─────────────────────────────────────────────────────────────────────────────
 */

function generateContactEmailHtml(data: ContactFormData): string {
  const waLink = getClientWhatsAppLink(data.phone, data.name);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; margin: 0; padding: 20px; color: #131B2E; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #4338CA; padding: 24px 32px; color: #ffffff; text-align: left; }
    .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 800; }
    .header p { margin: 0; font-size: 13px; color: #E0E7FF; }
    .body { padding: 32px; }
    .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #F97360; margin-bottom: 12px; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .table td { padding: 10px 12px; border-bottom: 1px solid #F1F5F9; font-size: 13px; }
    .label { color: #64748B; font-weight: 600; width: 35%; }
    .value { color: #0F172A; font-weight: 700; }
    .desc-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; font-size: 13px; line-height: 1.6; color: #334155; margin-bottom: 24px; }
    .btn { display: inline-block; padding: 12px 20px; border-radius: 10px; font-size: 12px; font-weight: 700; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; }
    .btn-wa { background: #25D366; color: #ffffff !important; }
    .btn-mail { background: #4338CA; color: #ffffff !important; }
    .footer { background: #FAF7F2; padding: 16px 32px; text-align: center; font-size: 11px; color: #94A3B8; border-top: 1px solid #E2E8F0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>🚀 New Client Enquiry Received</h1>
      <p>Ekaagra Technologies Contact Form</p>
    </div>
    <div class="body">
      <div class="section-title">Client Details</div>
      <table class="table">
        <tr>
          <td class="label">Full Name:</td>
          <td class="value">${data.name}</td>
        </tr>
        <tr>
          <td class="label">Phone Number:</td>
          <td class="value"><a href="tel:${data.phone}" style="color: #4338CA; text-decoration: none;">${data.phone}</a></td>
        </tr>
        <tr>
          <td class="label">Email Address:</td>
          <td class="value"><a href="mailto:${data.email}" style="color: #4338CA; text-decoration: none;">${data.email}</a></td>
        </tr>
        <tr>
          <td class="label">Requested Service:</td>
          <td class="value" style="color: #4338CA;">${data.service}</td>
        </tr>
        ${data.organization ? `
        <tr>
          <td class="label">Organization / Business:</td>
          <td class="value">${data.organization}</td>
        </tr>` : ''}
        ${data.budget ? `
        <tr>
          <td class="label">Estimated Budget:</td>
          <td class="value" style="color: #16A34A; font-weight: 800;">${data.budget}</td>
        </tr>` : ''}
        ${data.preferredContact ? `
        <tr>
          <td class="label">Preferred Contact Method:</td>
          <td class="value">${data.preferredContact}</td>
        </tr>` : ''}
      </table>

      <div class="section-title">Project Requirements</div>
      <div class="desc-box">
        ${data.description.replace(/\n/g, '<br/>')}
      </div>

      <div class="section-title">Instant Quick Actions</div>
      <div style="margin-top: 8px;">
        <a href="${waLink}" target="_blank" class="btn btn-wa" style="margin-right: 8px;">💬 Reply on WhatsApp</a>
        <a href="mailto:${data.email}?subject=${encodeURIComponent(`Regarding your enquiry for ${data.service} - Ekaagra Technologies`)}" class="btn btn-mail">✉️ Reply by Email</a>
      </div>
    </div>
    <div class="footer">
      Sent automatically from Ekaagra Technologies Website Server Actions
    </div>
  </div>
</body>
</html>
`;
}

function generateQuoteEmailHtml(data: QuoteFormData): string {
  const waLink = getClientWhatsAppLink(data.phone, data.name);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; margin: 0; padding: 20px; color: #131B2E; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #4338CA; padding: 24px 32px; color: #ffffff; text-align: left; }
    .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 800; }
    .header p { margin: 0; font-size: 13px; color: #E0E7FF; }
    .body { padding: 32px; }
    .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #F97360; margin-bottom: 12px; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .table td { padding: 10px 12px; border-bottom: 1px solid #F1F5F9; font-size: 13px; }
    .label { color: #64748B; font-weight: 600; width: 35%; }
    .value { color: #0F172A; font-weight: 700; }
    .desc-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; font-size: 13px; line-height: 1.6; color: #334155; margin-bottom: 24px; }
    .btn { display: inline-block; padding: 12px 20px; border-radius: 10px; font-size: 12px; font-weight: 700; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; }
    .btn-wa { background: #25D366; color: #ffffff !important; }
    .btn-mail { background: #4338CA; color: #ffffff !important; }
    .badge { display: inline-block; background: #EEF2FF; color: #4338CA; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; border: 1px solid #C7D2FE; }
    .footer { background: #FAF7F2; padding: 16px 32px; text-align: center; font-size: 11px; color: #94A3B8; border-top: 1px solid #E2E8F0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>💼 New Project Quote Request</h1>
      <p>Ekaagra Technologies Scope &amp; Estimation Form</p>
    </div>
    <div class="body">
      <div class="section-title">Client Information</div>
      <table class="table">
        <tr>
          <td class="label">Full Name:</td>
          <td class="value">${data.name}</td>
        </tr>
        ${data.organization ? `
        <tr>
          <td class="label">Organization / Business:</td>
          <td class="value">${data.organization}</td>
        </tr>` : ''}
        <tr>
          <td class="label">Phone:</td>
          <td class="value"><a href="tel:${data.phone}" style="color: #4338CA; text-decoration: none;">${data.phone}</a></td>
        </tr>
        <tr>
          <td class="label">Email:</td>
          <td class="value"><a href="mailto:${data.email}" style="color: #4338CA; text-decoration: none;">${data.email}</a></td>
        </tr>
      </table>

      <div class="section-title">Project Scope &amp; Budget</div>
      <table class="table">
        <tr>
          <td class="label">Project Type:</td>
          <td class="value"><span class="badge">${data.projectType}</span></td>
        </tr>
        ${data.budget ? `
        <tr>
          <td class="label">Estimated Budget:</td>
          <td class="value" style="color: #16A34A; font-weight: 800;">${data.budget}</td>
        </tr>` : ''}
        ${data.timeline ? `
        <tr>
          <td class="label">Target Launch Timeline:</td>
          <td class="value">${data.timeline}</td>
        </tr>` : ''}
        ${data.expectedUsers ? `
        <tr>
          <td class="label">Expected Audience/Users:</td>
          <td class="value">${data.expectedUsers}</td>
        </tr>` : ''}
      </table>

      <div class="section-title">Project Details &amp; Objectives</div>
      <div class="desc-box">
        ${data.description.replace(/\n/g, '<br/>')}
      </div>

      ${data.features ? `
      <div class="section-title">Key Desired Features</div>
      <div class="desc-box">
        ${data.features.replace(/\n/g, '<br/>')}
      </div>` : ''}

      <div class="section-title">Instant Quick Actions</div>
      <div style="margin-top: 8px;">
        <a href="${waLink}" target="_blank" class="btn btn-wa" style="margin-right: 8px;">💬 Chat on WhatsApp</a>
        <a href="mailto:${data.email}?subject=${encodeURIComponent(`Project Proposal: ${data.projectType} for ${data.name} - Ekaagra Technologies`)}" class="btn btn-mail">✉️ Send Proposal by Email</a>
      </div>
    </div>
    <div class="footer">
      Sent automatically from Ekaagra Technologies Website Server Actions
    </div>
  </div>
</body>
</html>
`;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 2. CLIENT CONFIRMATION TEMPLATES (Sent to Client's submitted email)
 * ─────────────────────────────────────────────────────────────────────────────
 */

function generateClientContactConfirmationHtml(data: ContactFormData): string {
  const ekaagraWhatsAppUrl = buildContactSubmissionWhatsAppUrl(data);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; margin: 0; padding: 20px; color: #131B2E; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #131B2E; padding: 28px 32px; color: #ffffff; text-align: left; }
    .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #ffffff; }
    .header p { margin: 0; font-size: 13px; color: #94A3B8; }
    .body { padding: 32px; }
    .greeting { font-size: 16px; font-weight: 700; color: #131B2E; margin-bottom: 12px; }
    .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
    .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #4338CA; margin-bottom: 12px; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .table td { padding: 9px 12px; border-bottom: 1px solid #F1F5F9; font-size: 13px; }
    .label { color: #64748B; font-weight: 600; width: 35%; }
    .value { color: #0F172A; font-weight: 700; }
    .highlight-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px; margin-bottom: 24px; text-align: center; }
    .btn-wa { display: inline-block; background: #25D366; color: #ffffff !important; padding: 12px 24px; border-radius: 10px; font-size: 13px; font-weight: 800; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px; }
    .footer { background: #FAF7F2; padding: 20px 32px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Ekaagra Technologies</h1>
      <p>Premium Website &amp; Digital Product Studio</p>
    </div>
    <div class="body">
      <div class="greeting">Hi ${data.name},</div>
      <p class="text">
        Thank you for getting in touch with us! We have successfully received your enquiry regarding <strong>${data.service}</strong>.
      </p>
      <p class="text">
        Our technical team is reviewing your project requirements and will prepare a tailored consultation and proposal for you within <strong>24 hours</strong>.
      </p>

      <div class="section-title">Your Submitted Details</div>
      <table class="table">
        <tr>
          <td class="label">Service:</td>
          <td class="value">${data.service}</td>
        </tr>
        ${data.organization ? `
        <tr>
          <td class="label">Organization:</td>
          <td class="value">${data.organization}</td>
        </tr>` : ''}
        ${data.budget ? `
        <tr>
          <td class="label">Target Budget:</td>
          <td class="value">${data.budget}</td>
        </tr>` : ''}
        <tr>
          <td class="label">Contact Phone:</td>
          <td class="value">${data.phone}</td>
        </tr>
      </table>

      <div class="highlight-box">
        <div style="font-size: 13px; font-weight: 700; color: #131B2E; margin-bottom: 6px;">Need a faster discussion or immediate quote?</div>
        <div style="font-size: 12px; color: #64748B; margin-bottom: 14px;">Connect with our lead engineer directly on WhatsApp:</div>
        <a href="${ekaagraWhatsAppUrl}" target="_blank" class="btn-wa">💬 Discuss on WhatsApp</a>
      </div>
    </div>
    <div class="footer">
      <strong>Ekaagra Technologies</strong><br/>
      Website: <a href="https://ekaagratechnologies.in" style="color: #4338CA; text-decoration: none;">ekaagratechnologies.in</a>
    </div>
  </div>
</body>
</html>
`;
}

function generateClientQuoteConfirmationHtml(data: QuoteFormData): string {
  const ekaagraWhatsAppUrl = buildQuoteSubmissionWhatsAppUrl(data);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; margin: 0; padding: 20px; color: #131B2E; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #131B2E; padding: 28px 32px; color: #ffffff; text-align: left; }
    .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #ffffff; }
    .header p { margin: 0; font-size: 13px; color: #94A3B8; }
    .body { padding: 32px; }
    .greeting { font-size: 16px; font-weight: 700; color: #131B2E; margin-bottom: 12px; }
    .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
    .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #4338CA; margin-bottom: 12px; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .table td { padding: 9px 12px; border-bottom: 1px solid #F1F5F9; font-size: 13px; }
    .label { color: #64748B; font-weight: 600; width: 35%; }
    .value { color: #0F172A; font-weight: 700; }
    .highlight-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px; margin-bottom: 24px; text-align: center; }
    .btn-wa { display: inline-block; background: #25D366; color: #ffffff !important; padding: 12px 24px; border-radius: 10px; font-size: 13px; font-weight: 800; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px; }
    .footer { background: #FAF7F2; padding: 20px 32px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Ekaagra Technologies</h1>
      <p>Project Scope &amp; Estimation Team</p>
    </div>
    <div class="body">
      <div class="greeting">Hi ${data.name},</div>
      <p class="text">
        Thank you for submitting your project quote request! We have logged your requirements for <strong>${data.projectType}</strong>.
      </p>
      <p class="text">
        Our engineering team is analyzing your specifications and calculating a transparent milestone-based estimate and technical roadmap for you.
      </p>

      <div class="section-title">Submitted Project Scope</div>
      <table class="table">
        <tr>
          <td class="label">Project Type:</td>
          <td class="value">${data.projectType}</td>
        </tr>
        ${data.organization ? `
        <tr>
          <td class="label">Organization:</td>
          <td class="value">${data.organization}</td>
        </tr>` : ''}
        ${data.budget ? `
        <tr>
          <td class="label">Target Budget:</td>
          <td class="value">${data.budget}</td>
        </tr>` : ''}
        ${data.timeline ? `
        <tr>
          <td class="label">Target Timeline:</td>
          <td class="value">${data.timeline}</td>
        </tr>` : ''}
      </table>

      <div class="highlight-box">
        <div style="font-size: 13px; font-weight: 700; color: #131B2E; margin-bottom: 6px;">Want to review your quote right now?</div>
        <div style="font-size: 12px; color: #64748B; margin-bottom: 14px;">Message us directly with your submitted scope on WhatsApp:</div>
        <a href="${ekaagraWhatsAppUrl}" target="_blank" class="btn-wa">💬 Discuss on WhatsApp</a>
      </div>
    </div>
    <div class="footer">
      <strong>Ekaagra Technologies</strong><br/>
      Website: <a href="https://ekaagratechnologies.in" style="color: #4338CA; text-decoration: none;">ekaagratechnologies.in</a>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 3. UNIVERSAL EMAIL DISPATCHER (Resend -> Nodemailer -> Unconfigured Guard)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export async function sendEmail({
  to,
  subject,
  htmlContent,
  replyTo,
}: {
  to: string;
  subject: string;
  htmlContent: string;
  replyTo?: string;
}): Promise<EmailDispatchResult> {
  // 1. Check for Resend API Key
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey && resendApiKey.trim() !== '') {
    try {
      const resend = new Resend(resendApiKey);
      const res = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html: htmlContent,
        replyTo: replyTo || undefined,
      });

      if (res.error) {
        console.error(
          `[RESEND RESULT] success=false recipient=${maskEmail(to)} error=${res.error.message}`
        );
        return { success: false, method: 'resend', error: res.error.message };
      }

      console.log(
        `[RESEND RESULT] success=true messageId=${res.data?.id} recipient=${maskEmail(to)}`
      );
      return { success: true, method: 'resend', messageId: res.data?.id };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(
        `[RESEND RESULT] success=false recipient=${maskEmail(to)} exception=${errorMessage}`
      );
      return { success: false, method: 'error', error: errorMessage };
    }
  }

  // 2. Check for standard SMTP credentials
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = Number(process.env.SMTP_PORT) || 587;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: FROM_EMAIL,
        to,
        subject,
        html: htmlContent,
        replyTo: replyTo || undefined,
      });

      console.log(
        `[SMTP RESULT] success=true messageId=${info.messageId} recipient=${maskEmail(to)}`
      );
      return { success: true, method: 'smtp', messageId: info.messageId };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(
        `[SMTP RESULT] success=false recipient=${maskEmail(to)} exception=${errorMessage}`
      );
      return { success: false, method: 'error', error: errorMessage };
    }
  }

  // 3. Fallback when no email provider credentials exist
  console.warn(
    `[EMAIL UNCONFIGURED] Lead received, but email delivery credentials are not set. (Set RESEND_API_KEY in .env.local or Vercel Environment Variables). Intended recipient: <${maskEmail(to)}>`
  );
  return {
    success: false,
    method: 'unconfigured',
    error: 'Email delivery credentials (RESEND_API_KEY / SMTP) are not configured in the environment.',
  };
}

/**
 * Dispatch Admin Notification for Contact Form
 */
export async function sendContactNotification(data: ContactFormData) {
  const subject = `New Website Enquiry — ${data.name} (${data.service})`;
  const html = generateContactEmailHtml(data);
  return sendEmail({
    to: ADMIN_EMAIL,
    subject,
    htmlContent: html,
    replyTo: data.email,
  });
}

/**
 * Dispatch Admin Notification for Quote Form
 */
export async function sendQuoteNotification(data: QuoteFormData) {
  const subject = `New Project Quote Request — ${data.name} (${data.projectType})`;
  const html = generateQuoteEmailHtml(data);
  return sendEmail({
    to: ADMIN_EMAIL,
    subject,
    htmlContent: html,
    replyTo: data.email,
  });
}

/**
 * Dispatch Client Confirmation for Contact Form
 */
export async function sendClientContactConfirmation(data: ContactFormData) {
  const subject = 'We received your enquiry — Ekaagra Technologies';
  const html = generateClientContactConfirmationHtml(data);
  return sendEmail({
    to: data.email,
    subject,
    htmlContent: html,
    replyTo: ADMIN_EMAIL,
  });
}

/**
 * Dispatch Client Confirmation for Quote Form
 */
export async function sendClientQuoteConfirmation(data: QuoteFormData) {
  const subject = 'We received your quote request — Ekaagra Technologies';
  const html = generateClientQuoteConfirmationHtml(data);
  return sendEmail({
    to: data.email,
    subject,
    htmlContent: html,
    replyTo: ADMIN_EMAIL,
  });
}
