import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import type { ContactFormData, QuoteFormData } from './types';
import {
  getWhatsAppChatUrl,
  buildContactSubmissionWhatsAppUrl,
  buildQuoteSubmissionWhatsAppUrl,
} from './whatsapp';

export function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL?.trim() || 'ekaagratechnologies@gmail.com';
}

export function getFromEmail(): string {
  return (
    process.env.FROM_EMAIL?.trim() ||
    'Ekaagra Technologies <notifications@ekaagratechnologies.site>'
  );
}

export const ADMIN_EMAIL = getAdminEmail();
export const FROM_EMAIL = getFromEmail();

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

function generateContactEmailText(data: ContactFormData): string {
  const waLink = getClientWhatsAppLink(data.phone, data.name);
  return `[NEW LEAD] WEBSITE ENQUIRY

CLIENT DETAILS
----------------------------------------
Name: ${data.name}
Phone: ${data.phone}
Email: ${data.email}
Service: ${data.service}
${data.organization ? `Organization: ${data.organization}\n` : ''}${data.budget ? `Budget: ${data.budget}\n` : ''}${data.preferredContact ? `Preferred Contact: ${data.preferredContact}\n` : ''}
PROJECT REQUIREMENTS
----------------------------------------
${data.description}

QUICK ACTIONS
----------------------------------------
Reply on WhatsApp: ${waLink}
Reply via Email: mailto:${data.email}
`;
}

function generateContactEmailHtml(data: ContactFormData): string {
  const waLink = getClientWhatsAppLink(data.phone, data.name);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Lead: Website Enquiry</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; line-height: 1.5; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #0f172a; padding: 20px 28px; color: #ffffff; text-align: left; }
    .header h1 { margin: 0 0 4px 0; font-size: 17px; font-weight: 700; color: #ffffff; }
    .header p { margin: 0; font-size: 13px; color: #94a3b8; }
    .body { padding: 28px; }
    .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin: 20px 0 10px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
    .section-title:first-child { margin-top: 0; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .table td { padding: 8px 0; border-bottom: 1px solid #f8fafc; font-size: 13px; vertical-align: top; }
    .label { color: #64748b; font-weight: 600; width: 35%; }
    .value { color: #0f172a; font-weight: 600; }
    .value a { color: #2563eb; text-decoration: none; }
    .desc-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; font-size: 13px; line-height: 1.6; color: #334155; white-space: pre-wrap; margin-bottom: 24px; }
    .actions-wrap { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
    .btn { display: inline-block; padding: 10px 18px; border-radius: 6px; font-size: 12px; font-weight: 600; text-decoration: none; text-align: center; margin-right: 8px; margin-bottom: 8px; }
    .btn-wa { background: #16a34a; color: #ffffff !important; }
    .btn-mail { background: #0f172a; color: #ffffff !important; }
    .footer { background: #f8fafc; padding: 14px 28px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>New Website Enquiry</h1>
      <p>Internal Lead Notification</p>
    </div>
    <div class="body">
      <div class="section-title">Client Information</div>
      <table class="table">
        <tr>
          <td class="label">Name:</td>
          <td class="value">${data.name}</td>
        </tr>
        <tr>
          <td class="label">Phone:</td>
          <td class="value"><a href="tel:${data.phone}">${data.phone}</a></td>
        </tr>
        <tr>
          <td class="label">Email:</td>
          <td class="value"><a href="mailto:${data.email}">${data.email}</a></td>
        </tr>
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
        ${data.preferredContact ? `
        <tr>
          <td class="label">Preferred Contact:</td>
          <td class="value">${data.preferredContact}</td>
        </tr>` : ''}
      </table>

      <div class="section-title">Requirements &amp; Message</div>
      <div class="desc-box">${data.description}</div>

      <div class="actions-wrap">
        <a href="${waLink}" target="_blank" class="btn btn-wa">Reply on WhatsApp</a>
        <a href="mailto:${data.email}?subject=${encodeURIComponent(`Regarding your enquiry for ${data.service} - Ekaagra Technologies`)}" class="btn btn-mail">Reply via Email</a>
      </div>
    </div>
    <div class="footer">
      Internal Lead Notification &bull; Ekaagra Technologies
    </div>
  </div>
</body>
</html>
`;
}

function generateQuoteEmailText(data: QuoteFormData): string {
  const waLink = getClientWhatsAppLink(data.phone, data.name);
  return `[NEW LEAD] PROJECT QUOTE REQUEST

CLIENT DETAILS
----------------------------------------
Name: ${data.name}
${data.organization ? `Organization: ${data.organization}\n` : ''}Phone: ${data.phone}
Email: ${data.email}

PROJECT SCOPE & BUDGET
----------------------------------------
Project Type: ${data.projectType}
${data.budget ? `Estimated Budget: ${data.budget}\n` : ''}${data.timeline ? `Target Launch Timeline: ${data.timeline}\n` : ''}${data.expectedUsers ? `Expected Users/Audience: ${data.expectedUsers}\n` : ''}
PROJECT DESCRIPTION & OBJECTIVES
----------------------------------------
${data.description}
${data.features ? `\nKEY DESIRED FEATURES\n----------------------------------------\n${data.features}\n` : ''}
QUICK ACTIONS
----------------------------------------
Reply on WhatsApp: ${waLink}
Reply via Email: mailto:${data.email}
`;
}

function generateQuoteEmailHtml(data: QuoteFormData): string {
  const waLink = getClientWhatsAppLink(data.phone, data.name);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Lead: Project Quote Request</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; line-height: 1.5; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #0f172a; padding: 20px 28px; color: #ffffff; text-align: left; }
    .header h1 { margin: 0 0 4px 0; font-size: 17px; font-weight: 700; color: #ffffff; }
    .header p { margin: 0; font-size: 13px; color: #94a3b8; }
    .body { padding: 28px; }
    .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin: 20px 0 10px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
    .section-title:first-child { margin-top: 0; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .table td { padding: 8px 0; border-bottom: 1px solid #f8fafc; font-size: 13px; vertical-align: top; }
    .label { color: #64748b; font-weight: 600; width: 35%; }
    .value { color: #0f172a; font-weight: 600; }
    .value a { color: #2563eb; text-decoration: none; }
    .badge { display: inline-block; background: #f1f5f9; color: #0f172a; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; border: 1px solid #e2e8f0; }
    .desc-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; font-size: 13px; line-height: 1.6; color: #334155; white-space: pre-wrap; margin-bottom: 20px; }
    .actions-wrap { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
    .btn { display: inline-block; padding: 10px 18px; border-radius: 6px; font-size: 12px; font-weight: 600; text-decoration: none; text-align: center; margin-right: 8px; margin-bottom: 8px; }
    .btn-wa { background: #16a34a; color: #ffffff !important; }
    .btn-mail { background: #0f172a; color: #ffffff !important; }
    .footer { background: #f8fafc; padding: 14px 28px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>New Project Quote Request</h1>
      <p>Internal Lead Notification</p>
    </div>
    <div class="body">
      <div class="section-title">Client Information</div>
      <table class="table">
        <tr>
          <td class="label">Name:</td>
          <td class="value">${data.name}</td>
        </tr>
        ${data.organization ? `
        <tr>
          <td class="label">Organization:</td>
          <td class="value">${data.organization}</td>
        </tr>` : ''}
        <tr>
          <td class="label">Phone:</td>
          <td class="value"><a href="tel:${data.phone}">${data.phone}</a></td>
        </tr>
        <tr>
          <td class="label">Email:</td>
          <td class="value"><a href="mailto:${data.email}">${data.email}</a></td>
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
          <td class="label">Target Budget:</td>
          <td class="value">${data.budget}</td>
        </tr>` : ''}
        ${data.timeline ? `
        <tr>
          <td class="label">Timeline:</td>
          <td class="value">${data.timeline}</td>
        </tr>` : ''}
        ${data.expectedUsers ? `
        <tr>
          <td class="label">Expected Audience:</td>
          <td class="value">${data.expectedUsers}</td>
        </tr>` : ''}
      </table>

      <div class="section-title">Project Requirements</div>
      <div class="desc-box">${data.description}</div>

      ${data.features ? `
      <div class="section-title">Key Desired Features</div>
      <div class="desc-box">${data.features}</div>` : ''}

      <div class="actions-wrap">
        <a href="${waLink}" target="_blank" class="btn btn-wa">Reply on WhatsApp</a>
        <a href="mailto:${data.email}?subject=${encodeURIComponent(`Project Proposal: ${data.projectType} for ${data.name} - Ekaagra Technologies`)}" class="btn btn-mail">Reply via Email</a>
      </div>
    </div>
    <div class="footer">
      Internal Lead Notification &bull; Ekaagra Technologies
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

export interface SendEmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  type?: 'contact' | 'quote' | 'client_contact_confirmation' | 'client_quote_confirmation' | 'test';
}

export async function sendEmail({
  to,
  subject,
  htmlContent,
  textContent,
  replyTo,
  headers,
  type = 'contact',
}: SendEmailOptions): Promise<EmailDispatchResult> {
  const fromEmail = getFromEmail();
  const resendApiKey = process.env.RESEND_API_KEY?.trim();

  // Validate critical fields
  if (!to || !to.trim()) {
    console.error(`[EMAIL DISPATCH FAILED] type=${type} error=Missing recipient 'to'`);
    return { success: false, method: 'error', error: "Missing recipient 'to'" };
  }
  if (!fromEmail || !fromEmail.trim()) {
    console.error(`[EMAIL DISPATCH FAILED] type=${type} error=Missing sender 'from'`);
    return { success: false, method: 'error', error: "Missing sender 'from'" };
  }
  if (!subject || !subject.trim()) {
    console.error(`[EMAIL DISPATCH FAILED] type=${type} error=Missing 'subject'`);
    return { success: false, method: 'error', error: "Missing 'subject'" };
  }
  if (!htmlContent || !htmlContent.trim()) {
    console.error(`[EMAIL DISPATCH FAILED] type=${type} error=Missing 'htmlContent'`);
    return { success: false, method: 'error', error: "Missing 'htmlContent'" };
  }

  // 1. Check for Resend API Key
  if (resendApiKey && resendApiKey !== '') {
    try {
      const resend = new Resend(resendApiKey);
      const res = await resend.emails.send({
        from: fromEmail,
        to: to.trim(),
        subject: subject.trim(),
        html: htmlContent,
        text: textContent || undefined,
        replyTo: replyTo?.trim() || undefined,
        headers: headers || undefined,
      });

      if (res.error) {
        console.error(
          `[RESEND WEBSITE EMAIL FAILED]\ntype=${type}\nerror=${res.error.message}`
        );
        return { success: false, method: 'resend', error: res.error.message };
      }

      console.log(
        `[RESEND WEBSITE EMAIL SUCCESS]\ntype=${type}\nmessageId=${res.data?.id}\nrecipient=${maskEmail(to)}`
      );
      return { success: true, method: 'resend', messageId: res.data?.id };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(
        `[RESEND WEBSITE EMAIL FAILED]\ntype=${type}\nerror=${errorMessage}`
      );
      return { success: false, method: 'error', error: errorMessage };
    }
  }

  // 2. Check for standard SMTP credentials
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
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
        from: fromEmail,
        to: to.trim(),
        subject: subject.trim(),
        html: htmlContent,
        text: textContent || undefined,
        replyTo: replyTo?.trim() || undefined,
        headers: headers || undefined,
      });

      console.log(
        `[SMTP RESULT] type=${type} success=true messageId=${info.messageId} recipient=${maskEmail(to)}`
      );
      return { success: true, method: 'smtp', messageId: info.messageId };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(
        `[SMTP RESULT] type=${type} success=false recipient=${maskEmail(to)} exception=${errorMessage}`
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
export async function sendContactNotification(data: ContactFormData): Promise<EmailDispatchResult> {
  const adminEmail = getAdminEmail();
  const subject = `[New Lead] Website Enquiry — ${data.name}`;
  const html = generateContactEmailHtml(data);
  const text = generateContactEmailText(data);
  return sendEmail({
    to: adminEmail,
    subject,
    htmlContent: html,
    textContent: text,
    replyTo: data.email,
    headers: {
      'Auto-Submitted': 'auto-generated',
      'X-Auto-Response-Suppress': 'All',
    },
    type: 'contact',
  });
}

/**
 * Dispatch Admin Notification for Quote Form
 */
export async function sendQuoteNotification(data: QuoteFormData): Promise<EmailDispatchResult> {
  const adminEmail = getAdminEmail();
  const subject = `[New Lead] Project Quote Request — ${data.name}`;
  const html = generateQuoteEmailHtml(data);
  const text = generateQuoteEmailText(data);
  return sendEmail({
    to: adminEmail,
    subject,
    htmlContent: html,
    textContent: text,
    replyTo: data.email,
    headers: {
      'Auto-Submitted': 'auto-generated',
      'X-Auto-Response-Suppress': 'All',
    },
    type: 'quote',
  });
}

/**
 * Dispatch Client Confirmation for Contact Form
 */
export async function sendClientContactConfirmation(data: ContactFormData): Promise<EmailDispatchResult> {
  const adminEmail = getAdminEmail();
  const subject = 'We received your enquiry — Ekaagra Technologies';
  const html = generateClientContactConfirmationHtml(data);
  return sendEmail({
    to: data.email,
    subject,
    htmlContent: html,
    replyTo: adminEmail,
    type: 'client_contact_confirmation',
  });
}

/**
 * Dispatch Client Confirmation for Quote Form
 */
export async function sendClientQuoteConfirmation(data: QuoteFormData): Promise<EmailDispatchResult> {
  const adminEmail = getAdminEmail();
  const subject = 'We received your quote request — Ekaagra Technologies';
  const html = generateClientQuoteConfirmationHtml(data);
  return sendEmail({
    to: data.email,
    subject,
    htmlContent: html,
    replyTo: adminEmail,
    type: 'client_quote_confirmation',
  });
}


