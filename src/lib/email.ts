import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import type { ContactFormData, QuoteFormData, SchoolQuoteRequest, Order } from './types';
import type { SchoolPriceCalculation } from './schoolPricing';
import {
  getWhatsAppChatUrl,
  buildContactSubmissionWhatsAppUrl,
  buildQuoteSubmissionWhatsAppUrl,
  buildSchoolSubmissionWhatsAppUrl,
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
 * -----------------------------------------------------------------------------
 * 1. ADMIN NOTIFICATION TEMPLATES (Sent to Ekaagra Admin)
 * -----------------------------------------------------------------------------
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
 * -----------------------------------------------------------------------------
 * 2. CLIENT CONFIRMATION TEMPLATES (Sent to Client's submitted email)
 * -----------------------------------------------------------------------------
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
      Website: <a href="https://www.ekaagratechnologies.site" style="color: #4338CA; text-decoration: none;">ekaagratechnologies.site</a>
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
      Website: <a href="https://www.ekaagratechnologies.site" style="color: #4338CA; text-decoration: none;">ekaagratechnologies.site</a>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * -----------------------------------------------------------------------------
 * 3. UNIVERSAL EMAIL DISPATCHER (Resend -> Nodemailer -> Unconfigured Guard)
 * -----------------------------------------------------------------------------
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

/**
 * -----------------------------------------------------------------------------
 * SCHOOL SOLUTIONS EMAIL NOTIFICATIONS
 * -----------------------------------------------------------------------------
 */
interface EmailDomainDetails {
  choiceLabel: string;
  domainName: string;
  statusLabel: string;
  priceLabel: string;
  allowanceLabel: string;
  differenceLabel: string;
}

function getEmailDomainDetails(
  request: SchoolQuoteRequest,
  pricing: SchoolPriceCalculation
): EmailDomainDetails {
  const selection = request.domainSelection;
  const rawChoice =
    selection?.domainChoice ||
    request.domain?.domainChoice ||
    (request.domain ? 'NEW_DOMAIN' : 'DECIDE_LATER');
  const isExisting = rawChoice === 'EXISTING_DOMAIN' || rawChoice === 'existing';
  const isDecideLater =
    rawChoice === 'DECIDE_LATER' ||
    rawChoice === 'later' ||
    (!selection?.preferredDomain && !request.domain?.domain);
  const domain = selection?.preferredDomain || request.domain?.domain || '';

  if (isExisting) {
    return {
      choiceLabel: 'Existing Domain',
      domainName: domain || 'Existing Domain',
      statusLabel: 'Existing domain / DNS onboarding',
      priceLabel: '₹0 (School owned)',
      allowanceLabel: `₹${pricing.annualDomainAllowance}/year (Not utilized for existing domain)`,
      differenceLabel: '₹0',
    };
  }

  if (isDecideLater) {
    return {
      choiceLabel: 'Decide Later',
      domainName: 'Not selected',
      statusLabel: 'Domain to be decided before launch',
      priceLabel: 'Pending selection',
      allowanceLabel: `₹${pricing.annualDomainAllowance}/year included in plan`,
      differenceLabel: '₹0',
    };
  }

  // New Domain
  const isVerified = Boolean(pricing.isDomainPriceVerified);
  const price = pricing.domainCostINR;

  if (isVerified && price > 0) {
    const diff = pricing.domainUpgradeAmount;
    return {
      choiceLabel: 'New Domain',
      domainName: domain,
      statusLabel: 'Verified available',
      priceLabel: `₹${price.toLocaleString('en-IN')}/year`,
      allowanceLabel: `₹${pricing.annualDomainAllowance}/year included in plan`,
      differenceLabel: diff > 0 ? `+₹${diff.toLocaleString('en-IN')}` : '₹0 (Fully covered by plan allowance)',
    };
  }

  return {
    choiceLabel: 'New Domain',
    domainName: domain,
    statusLabel: 'Availability verification required',
    priceLabel: 'Not verified',
    allowanceLabel: `₹${pricing.annualDomainAllowance}/year`,
    differenceLabel: 'Pending verification',
  };
}

function generateSchoolQuoteEmailText(
  request: SchoolQuoteRequest,
  pricing: SchoolPriceCalculation
): string {
  const waLink = getClientWhatsAppLink(request.contact.phone, request.contact.fullName);
  const domainInfo = getEmailDomainDetails(request, pricing);

  return `
========================================
NEW SCHOOL SOLUTION ENQUIRY
========================================
Date: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)

SCHOOL PROFILE
----------------------------------------
School Name: ${request.school.schoolName}
Institution Type: ${request.school.schoolType}
Affiliation Board: ${request.school.board}
Location: ${request.school.city}, ${request.school.state}
Approx. Strength: ${request.school.approximateStudents} students
${request.school.currentWebsite ? `Current Website: ${request.school.currentWebsite}\n` : ''}${request.school.existingErp ? `Existing Software: ${request.school.existingErp}\n` : ''}${request.school.currentSoftware ? `Current Tools: ${request.school.currentSoftware}\n` : ''}${request.school.preferredLanguage ? `Preferred Language: ${request.school.preferredLanguage}\n` : ''}${request.school.requirements ? `Scope / Requirements: ${request.school.requirements}\n` : ''}
PRIMARY CONTACT
----------------------------------------
Name: ${request.contact.fullName}
Role / Designation: ${request.contact.designation}
Phone: ${request.contact.phone}
Email: ${request.contact.email}
${request.contact.whatsapp ? `WhatsApp: ${request.contact.whatsapp}\n` : ''}${request.contact.preferredContactMethod ? `Preferred Contact: ${request.contact.preferredContactMethod}\n` : ''}
SELECTED SOLUTION & PRICING
----------------------------------------
Product: ${pricing.productName}
${pricing.studentTierLabel ? `Capacity Tier: ${pricing.studentTierLabel}\n` : ''}${pricing.selectedAddonNames.length > 0 ? `Selected Add-ons:\n- ${pricing.selectedAddonNames.join('\n- ')}\n` : ''}
DOMAIN CONFIGURATION
----------------------------------------
Domain Choice: ${domainInfo.choiceLabel}
${domainInfo.choiceLabel === 'Existing Domain' ? `Domain: ${domainInfo.domainName}` : `Preferred Domain: ${domainInfo.domainName}`}
Status: ${domainInfo.statusLabel}
Domain Price: ${domainInfo.priceLabel}
Allowance: ${domainInfo.allowanceLabel}
${domainInfo.choiceLabel === 'Existing Domain' ? 'Domain Purchase Cost: ₹0' : `Domain Difference: ${domainInfo.differenceLabel}`}

FINANCIAL BREAKDOWN (VERIFIED)
----------------------------------------
Year 1 Estimated Total: ${pricing.totalEstimatedYearOne !== null ? `₹${pricing.totalEstimatedYearOne.toLocaleString('en-IN')}` : 'Custom Quote'}${pricing.isDomainPricePendingVerification ? ' (+ Domain difference if applicable after verification)' : ''}
Renewal From: ${pricing.totalRenewalFrom !== null ? `₹${pricing.totalRenewalFrom.toLocaleString('en-IN')}/year` : 'Custom Quote'}

QUICK ACTIONS
----------------------------------------
Reply on WhatsApp: ${waLink}
Reply via Email: mailto:${request.contact.email}
`;
}

function generateSchoolQuoteEmailHtml(
  request: SchoolQuoteRequest,
  pricing: SchoolPriceCalculation
): string {
  const waLink = getClientWhatsAppLink(request.contact.phone, request.contact.fullName);
  const domainInfo = getEmailDomainDetails(request, pricing);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New School Enquiry</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; line-height: 1.5; }
    .card { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #4338CA; padding: 24px 30px; color: #ffffff; text-align: left; }
    .header h1 { margin: 0 0 4px 0; font-size: 19px; font-weight: 800; color: #ffffff; }
    .header p { margin: 0; font-size: 13px; color: #e0e7ff; }
    .body { padding: 30px; }
    .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #4338CA; margin: 22px 0 10px 0; border-bottom: 2px solid #e0e7ff; padding-bottom: 6px; }
    .section-title:first-child { margin-top: 0; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .table td { padding: 8px 0; border-bottom: 1px solid #f8fafc; font-size: 13px; vertical-align: top; }
    .label { color: #64748b; font-weight: 600; width: 36%; }
    .value { color: #0f172a; font-weight: 600; }
    .price-box { background: #FAF7F2; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin-top: 14px; }
    .btn { display: inline-block; padding: 10px 18px; border-radius: 8px; font-size: 12px; font-weight: 700; text-decoration: none; text-align: center; margin-right: 8px; margin-bottom: 8px; }
    .btn-wa { background: #16a34a; color: #ffffff !important; }
    .btn-mail { background: #4338ca; color: #ffffff !important; }
    .footer { background: #f8fafc; padding: 14px 30px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>New School Solution Enquiry</h1>
      <p>School Technology Platform &bull; Ekaagra Technologies</p>
    </div>
    <div class="body">
      <div class="section-title">School Profile</div>
      <table class="table">
        <tr><td class="label">School Name:</td><td class="value">${request.school.schoolName}</td></tr>
        <tr><td class="label">Type / Board:</td><td class="value">${request.school.schoolType} &bull; ${request.school.board}</td></tr>
        <tr><td class="label">Location:</td><td class="value">${request.school.city}, ${request.school.state}</td></tr>
        <tr><td class="label">Approx. Strength:</td><td class="value">${request.school.approximateStudents} students</td></tr>
        ${request.school.currentWebsite ? `<tr><td class="label">Website:</td><td class="value">${request.school.currentWebsite}</td></tr>` : ''}
        ${request.school.existingErp ? `<tr><td class="label">Existing Software:</td><td class="value">${request.school.existingErp}</td></tr>` : ''}
      </table>

      <div class="section-title">Contact Information</div>
      <table class="table">
        <tr><td class="label">Contact Name:</td><td class="value">${request.contact.fullName} (${request.contact.designation})</td></tr>
        <tr><td class="label">Phone:</td><td class="value"><a href="tel:${request.contact.phone}">${request.contact.phone}</a></td></tr>
        <tr><td class="label">Email:</td><td class="value"><a href="mailto:${request.contact.email}">${request.contact.email}</a></td></tr>
        ${request.contact.whatsapp ? `<tr><td class="label">WhatsApp:</td><td class="value">${request.contact.whatsapp}</td></tr>` : ''}
      </table>

      <div class="section-title">Selected Solution &amp; Scope</div>
      <table class="table">
        <tr><td class="label">Product:</td><td class="value"><strong>${pricing.productName}</strong></td></tr>
        ${pricing.studentTierLabel ? `<tr><td class="label">Student Bracket:</td><td class="value">${pricing.studentTierLabel}</td></tr>` : ''}
        ${pricing.selectedAddonNames.length > 0 ? `<tr><td class="label">Optional Add-ons:</td><td class="value">${pricing.selectedAddonNames.join(', ')}</td></tr>` : ''}
      </table>

      <div class="section-title">Domain Configuration</div>
      <table class="table">
        <tr><td class="label">Domain Choice:</td><td class="value"><strong>${domainInfo.choiceLabel}</strong></td></tr>
        <tr><td class="label">${domainInfo.choiceLabel === 'Existing Domain' ? 'Domain:' : 'Preferred Domain:'}</td><td class="value font-mono"><strong>${domainInfo.domainName}</strong></td></tr>
        <tr><td class="label">Status:</td><td class="value">${domainInfo.statusLabel}</td></tr>
        <tr><td class="label">Domain Price:</td><td class="value">${domainInfo.priceLabel}</td></tr>
        <tr><td class="label">Plan Allowance:</td><td class="value">${domainInfo.allowanceLabel}</td></tr>
        <tr><td class="label">${domainInfo.choiceLabel === 'Existing Domain' ? 'Domain Purchase Cost:' : 'Domain Difference:'}</td><td class="value"><strong>${domainInfo.differenceLabel}</strong></td></tr>
      </table>

      <div class="price-box">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 13px; color: #64748b;">Year 1 Estimated Total:</span>
          <strong style="font-size: 16px; color: #4338ca;">${pricing.totalEstimatedYearOne !== null ? `₹${pricing.totalEstimatedYearOne.toLocaleString('en-IN')}` : 'Custom Quote'}${pricing.isDomainPricePendingVerification ? ' (+ Domain difference if applicable)' : ''}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="font-size: 12px; color: #64748b;">Annual Renewal From:</span>
          <strong style="font-size: 14px; color: #0f172a;">${pricing.totalRenewalFrom !== null ? `₹${pricing.totalRenewalFrom.toLocaleString('en-IN')}/year` : 'Custom Quote'}</strong>
        </div>
      </div>

      <div style="margin-top: 24px;">
        <a href="${waLink}" class="btn btn-wa">Reply on WhatsApp</a>
        <a href="mailto:${request.contact.email}" class="btn btn-mail">Reply via Email</a>
      </div>
    </div>
    <div class="footer">
      Ekaagra Technologies &bull; Motihari, Bihar &bull; Dedicated School Platforms
    </div>
  </div>
</body>
</html>
`;
}

function generateClientSchoolQuoteConfirmationHtml(
  request: SchoolQuoteRequest,
  pricing: SchoolPriceCalculation
): string {
  const domainInfo = getEmailDomainDetails(request, pricing);
  const ekaagraWhatsAppUrl = buildSchoolSubmissionWhatsAppUrl({
    schoolName: request.school.schoolName,
    contactName: request.contact.fullName,
    productName: pricing.productName,
    studentRange: pricing.studentTierLabel || undefined,
    yearOnePrice: pricing.totalEstimatedYearOne,
    renewalPrice: pricing.totalRenewalFrom,
    domainChoice: request.domainSelection?.domainChoice || request.domain?.domainChoice,
    domainName: request.domainSelection?.preferredDomain || request.domain?.domain,
    domainStatus: request.domainSelection?.domainStatus || request.domain?.domainStatus,
    isDomainPriceVerified: pricing.isDomainPriceVerified,
    domainDifference: pricing.domainUpgradeAmount,
    city: request.school.city,
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; margin: 0; padding: 20px; color: #131B2E; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #4338CA; padding: 28px 32px; color: #ffffff; text-align: left; }
    .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #ffffff; }
    .header p { margin: 0; font-size: 13px; color: #E0E7FF; }
    .body { padding: 32px; }
    .greeting { font-size: 16px; font-weight: 700; color: #131B2E; margin-bottom: 12px; }
    .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
    .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #4338CA; margin-bottom: 12px; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .table td { padding: 9px 12px; border-bottom: 1px solid #F1F5F9; font-size: 13px; }
    .label { color: #64748B; font-weight: 600; width: 40%; }
    .value { color: #0F172A; font-weight: 700; }
    .highlight-box { background: #FAF7F2; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center; }
    .btn-wa { display: inline-block; background: #25D366; color: #ffffff !important; padding: 12px 24px; border-radius: 10px; font-size: 13px; font-weight: 800; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px; }
    .footer { background: #FAF7F2; padding: 20px 32px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Ekaagra Technologies for Schools</h1>
      <p>School Technology &amp; ERP Solutions Team</p>
    </div>
    <div class="body">
      <div class="greeting">Dear ${request.contact.fullName},</div>
      <p class="text">
        Thank you for your interest in Ekaagra Technologies&apos; school platforms for <strong>${request.school.schoolName}</strong>. We have successfully received your configuration request.
      </p>

      <div class="section-title">Your Configured Solution</div>
      <table class="table">
        <tr><td class="label">Product Plan:</td><td class="value">${pricing.productName}</td></tr>
        ${pricing.studentTierLabel ? `<tr><td class="label">Capacity Bracket:</td><td class="value">${pricing.studentTierLabel}</td></tr>` : ''}
        <tr><td class="label">Domain Choice:</td><td class="value">${domainInfo.choiceLabel}</td></tr>
        ${domainInfo.domainName && domainInfo.domainName !== 'Not selected' ? `<tr><td class="label">${domainInfo.choiceLabel === 'Existing Domain' ? 'Domain:' : 'Preferred Domain:'}</td><td class="value font-mono">${domainInfo.domainName}</td></tr>` : ''}
        <tr><td class="label">Domain Status:</td><td class="value">${domainInfo.statusLabel}</td></tr>
        <tr>
          <td class="label">Estimated Year 1:</td>
          <td class="value" style="color: #4338CA;">${pricing.totalEstimatedYearOne !== null ? `₹${pricing.totalEstimatedYearOne.toLocaleString('en-IN')}` : 'Custom Enterprise Quote'}${pricing.isDomainPricePendingVerification ? ' (+ Domain difference if applicable after verification)' : ''}</td>
        </tr>
        <tr>
          <td class="label">Renewal From:</td>
          <td class="value">${pricing.totalRenewalFrom !== null ? `₹${pricing.totalRenewalFrom.toLocaleString('en-IN')}/year` : 'Custom Enterprise Quote'}</td>
        </tr>
      </table>

      <div class="highlight-box">
        <div style="font-size: 13px; font-weight: 700; color: #131B2E; margin-bottom: 6px;">Need an instant school walkthrough or live ERP demo?</div>
        <div style="font-size: 12px; color: #64748B; margin-bottom: 14px;">Connect with our educational technology specialist directly on WhatsApp:</div>
        <a href="${ekaagraWhatsAppUrl}" target="_blank" class="btn-wa">&bull; Discuss on WhatsApp</a>
      </div>
    </div>
    <div class="footer">
      <strong>Ekaagra Technologies</strong><br/>
      Website: <a href="https://www.ekaagratechnologies.site/schools" style="color: #4338CA; text-decoration: none;">ekaagratechnologies.site/schools</a><br/>
      Motihari, East Champaran, Bihar, India
    </div>
  </div>
</body>
</html>
`;
}

export async function sendSchoolQuoteNotification(
  request: SchoolQuoteRequest,
  pricing: SchoolPriceCalculation
): Promise<EmailDispatchResult> {
  const adminEmail = getAdminEmail();
  const subject = `[School Lead] ${request.school.schoolName} — ${pricing.productName}`;
  const html = generateSchoolQuoteEmailHtml(request, pricing);
  const text = generateSchoolQuoteEmailText(request, pricing);
  return sendEmail({
    to: adminEmail,
    subject,
    htmlContent: html,
    textContent: text,
    replyTo: request.contact.email,
    headers: {
      'Auto-Submitted': 'auto-generated',
      'X-Auto-Response-Suppress': 'All',
    },
    type: 'quote',
  });
}

export async function sendClientSchoolQuoteConfirmation(
  request: SchoolQuoteRequest,
  pricing: SchoolPriceCalculation
): Promise<EmailDispatchResult> {
  const adminEmail = getAdminEmail();
  const subject = `We received your school solution enquiry — ${request.school.schoolName}`;
  const html = generateClientSchoolQuoteConfirmationHtml(request, pricing);
  return sendEmail({
    to: request.contact.email,
    subject,
    htmlContent: html,
    replyTo: adminEmail,
    type: 'client_quote_confirmation',
  });
}

/**
 * -----------------------------------------------------------------------------
 * 3. PAYMENT RECEIPT & CONFIRMATION EMAILS
 * -----------------------------------------------------------------------------
 */

function generatePaymentReceiptEmailHtml(order: Order): string {
  const paidDate = order.paid_at ? new Date(order.paid_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : new Date().toLocaleDateString('en-IN');

  const formattedAmount = Number(order.amount_inr).toLocaleString('en-IN');
  const planName = order.metadata?.planName || order.service_type || 'Website Development';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt: ${order.order_number}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; line-height: 1.5; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #131B2E; padding: 28px; color: #ffffff; text-align: left; }
    .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; }
    .header p { margin: 0; font-size: 13px; color: #94a3b8; }
    .status-badge { display: inline-block; background: #10b981; color: #ffffff; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; text-transform: uppercase; margin-top: 10px; letter-spacing: 0.5px; }
    .body { padding: 28px; }
    .receipt-box { background: #FAF7F2; border: 1px solid #E2E8F0; border-radius: 8px; padding: 18px; margin-bottom: 24px; text-align: center; }
    .amount-display { font-size: 32px; font-weight: 800; font-family: monospace; color: #4338CA; margin: 8px 0; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    .label { color: #64748b; font-weight: 600; width: 40%; }
    .value { color: #0f172a; font-weight: 700; text-align: right; }
    .steps-box { background: #f8fafc; border-left: 4px solid #4338CA; padding: 14px 18px; margin-bottom: 24px; font-size: 13px; line-height: 1.6; color: #334155; }
    .footer { background: #f8fafc; padding: 16px 28px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Payment Confirmation &amp; Receipt</h1>
      <p>Thank you for choosing Ekaagra Technologies</p>
      <span class="status-badge">Payment Verified &amp; Confirmed</span>
    </div>
    <div class="body">
      <div class="receipt-box">
        <div style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Amount Paid (INR)</div>
        <div class="amount-display">&#8377;${formattedAmount}</div>
        <div style="font-size: 12px; color: #10b981; font-weight: 600;">&#10003; All Taxes &amp; Fees Included</div>
      </div>

      <table class="table">
        <tr>
          <td class="label">Order Number:</td>
          <td class="value">${order.order_number}</td>
        </tr>
        <tr>
          <td class="label">Customer Name:</td>
          <td class="value">${order.customer_name}</td>
        </tr>
        <tr>
          <td class="label">Service / Package:</td>
          <td class="value">${planName}</td>
        </tr>
        <tr>
          <td class="label">Payment Gateway:</td>
          <td class="value">${order.gateway_name}</td>
        </tr>
        ${order.gateway_payment_id ? `
        <tr>
          <td class="label">Transaction Reference:</td>
          <td class="value"><code style="font-size: 11px;">${order.gateway_payment_id}</code></td>
        </tr>` : ''}
        <tr>
          <td class="label">Date &amp; Time:</td>
          <td class="value">${paidDate}</td>
        </tr>
      </table>

      <div class="steps-box">
        <strong>What Happens Next?</strong><br/>
        Our engineering team has received your confirmed order and is initiating your project intake. You will receive private staging links to inspect responsiveness on mobile and desktop before official launch.
      </div>
    </div>
    <div class="footer">
      <strong>Ekaagra Technologies</strong> &bull; Motihari, East Champaran, Bihar - 845401, India<br/>
      Inquiries: <a href="mailto:${getAdminEmail()}" style="color: #4338CA; text-decoration: none;">${getAdminEmail()}</a> &bull; <a href="https://www.ekaagratechnologies.site" style="color: #4338CA; text-decoration: none;">ekaagratechnologies.site</a>
    </div>
  </div>
</body>
</html>
`;
}

function generatePaymentReceiptEmailText(order: Order): string {
  const formattedAmount = Number(order.amount_inr).toLocaleString('en-IN');
  return `=== EKAAGRA TECHNOLOGIES PAYMENT RECEIPT ===

Order Number: ${order.order_number}
Status: PAID
Amount Paid: INR ${formattedAmount}
Service: ${order.metadata?.planName || order.service_type}
Customer: ${order.customer_name}
Transaction ID: ${order.gateway_payment_id || 'N/A'}
Date: ${order.paid_at || new Date().toISOString()}

Thank you for choosing Ekaagra Technologies. Our team has received your confirmed order and is initiating project kickoff.

Ekaagra Technologies
Motihari, East Champaran, Bihar - 845401, India
`;
}

export async function sendClientPaymentReceiptEmail(order: Order): Promise<EmailDispatchResult> {
  const subject = `Payment Confirmed: Order ${order.order_number} — Ekaagra Technologies`;
  const html = generatePaymentReceiptEmailHtml(order);
  const text = generatePaymentReceiptEmailText(order);

  return sendEmail({
    to: order.customer_email,
    subject,
    htmlContent: html,
    textContent: text,
    replyTo: getAdminEmail(),
    type: 'client_contact_confirmation',
  });
}

export async function sendAdminPaymentNotificationEmail(order: Order): Promise<EmailDispatchResult> {
  const adminEmail = getAdminEmail();
  const formattedAmount = Number(order.amount_inr).toLocaleString('en-IN');
  const subject = `[PAYMENT SUCCESSFUL] ${order.order_number} — ₹${formattedAmount} (${order.customer_name})`;
  const html = generatePaymentReceiptEmailHtml(order);
  const text = generatePaymentReceiptEmailText(order);

  return sendEmail({
    to: adminEmail,
    subject,
    htmlContent: html,
    textContent: text,
    replyTo: order.customer_email,
    type: 'quote',
  });
}

/**
 * -----------------------------------------------------------------------------
 * 4. BUSINESS CLIENT PROJECT INTAKE EMAILS
 * -----------------------------------------------------------------------------
 */

export async function sendBusinessRequirementsInviteEmail(params: {
  clientName: string;
  clientEmail: string;
  projectName: string;
  onboardingUrl: string;
}): Promise<EmailDispatchResult> {
  const fullUrl = params.onboardingUrl.startsWith('http')
    ? params.onboardingUrl
    : `https://www.ekaagratechnologies.site${params.onboardingUrl}`;

  const subject = `Your Project Onboarding Workspace: ${params.projectName} — Ekaagra Technologies`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FAF7F2; margin: 0; padding: 20px; color: #131B2E; }
  .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; }
  .header { background: #4338CA; padding: 24px 32px; color: #ffffff; }
  .body { padding: 32px; }
  .btn { display: inline-block; background: #4338CA; color: #ffffff !important; padding: 14px 28px; border-radius: 12px; font-weight: 800; text-decoration: none; font-size: 14px; margin: 16px 0; }
  .footer { background: #FAF7F2; padding: 16px 32px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; }
</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 style="margin:0; font-size: 20px;">Project Confirmed &bull; Requirements Intake</h1>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #E0E7FF;">Ekaagra Technologies Client Onboarding</p>
    </div>
    <div class="body">
      <p>Dear <strong>${params.clientName}</strong>,</p>
      <p>We are excited to kick off <strong>${params.projectName}</strong> with you. To begin engineering your custom solution, please access your private Business Requirements Portal below:</p>
      <div style="text-align: center;">
        <a href="${fullUrl}" class="btn">Open Business Requirements Portal &rarr;</a>
      </div>
      <p style="font-size: 13px; color: #64748B; line-height: 1.6;">
        &bull; You can save your progress and resume at any time.<br/>
        &bull; <strong>Zero upfront payment:</strong> Your payment only becomes due after you review and approve your first design concept.<br/>
        &bull; Once submitted, our design team will begin preparing your concept mockup.
      </p>
    </div>
    <div class="footer">
      Ekaagra Technologies &bull; Motihari, East Champaran, Bihar &bull; questions? <a href="mailto:${getAdminEmail()}">${getAdminEmail()}</a>
    </div>
  </div>
</body>
</html>
`;

  const text = `Dear ${params.clientName},\n\nWe are excited to kick off ${params.projectName}. Please complete your project requirements here:\n${fullUrl}\n\nZero upfront payment: You will only be asked to pay after you review and approve your initial custom design concept.\n\nEkaagra Technologies`;

  return sendEmail({
    to: params.clientEmail,
    subject,
    htmlContent: html,
    textContent: text,
    replyTo: getAdminEmail(),
    type: 'client_contact_confirmation',
  });
}

export async function sendAdminRequirementsSubmittedEmail(params: {
  projectName: string;
  clientName: string;
  clientEmail: string;
  submissionId: string;
  projectNumber: string;
}): Promise<EmailDispatchResult> {
  const subject = `[REQUIREMENTS SUBMITTED] ${params.projectNumber} — ${params.projectName}`;
  const adminUrl = `https://www.ekaagratechnologies.site/admin/business-projects`;

  const html = `
<!DOCTYPE html><html><body style="font-family: sans-serif; padding: 20px; background: #FAF7F2;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 24px; border-radius: 12px; border: 1px solid #E2E8F0;">
    <h2 style="color: #4338CA; margin-top: 0;">Requirements Submitted for Review</h2>
    <p>Client <strong>${params.clientName}</strong> (${params.clientEmail}) has completed and submitted the detailed Business Requirements form for project <strong>${params.projectNumber} (${params.projectName})</strong>.</p>
    <p>Please inspect the submitted sections, verify domain/feature details, and proceed to the Design phase.</p>
    <a href="${adminUrl}" style="display:inline-block; background:#131B2E; color:white; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:13px;">Open Admin Projects Hub</a>
  </div>
</body></html>`;

  const text = `[REQUIREMENTS SUBMITTED] Project: ${params.projectNumber} (${params.projectName})\nClient: ${params.clientName} (${params.clientEmail})\n\nOpen admin: ${adminUrl}`;

  return sendEmail({
    to: getAdminEmail(),
    subject,
    htmlContent: html,
    textContent: text,
    replyTo: params.clientEmail,
    type: 'quote',
  });
}

export async function sendClientRequirementsConfirmationEmail(params: {
  clientName: string;
  clientEmail: string;
  projectName: string;
}): Promise<EmailDispatchResult> {
  const subject = `Requirements Received: ${params.projectName} — Ekaagra Technologies`;

  const html = `
<!DOCTYPE html><html><body style="font-family: sans-serif; padding: 20px; background: #FAF7F2;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 28px; border-radius: 12px; border: 1px solid #E2E8F0;">
    <h2 style="color: #10B981; margin-top: 0;">Requirements Submitted Successfully</h2>
    <p>Dear <strong>${params.clientName}</strong>,</p>
    <p>We have successfully received your detailed project requirements for <strong>${params.projectName}</strong>. Our engineering and design team is reviewing your specifications.</p>
    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <strong>What Happens Next?</strong><br/>
      1. We review your requirements and clarify any open questions.<br/>
      2. Our designers prepare your first custom concept/prototype.<br/>
      3. You review the design and approve or request revisions.<br/>
      4. <strong>No payment is due</strong> until you inspect and approve your design concept.
    </div>
    <p style="font-size: 12px; color: #64748B;">Thank you for partnering with Ekaagra Technologies.</p>
  </div>
</body></html>`;

  const text = `Dear ${params.clientName},\n\nWe have received your detailed requirements for ${params.projectName}. Our team will review them and proceed with your custom design concept.\n\nReminder: No payment is due until you review and approve the design.\n\nEkaagra Technologies`;

  return sendEmail({
    to: params.clientEmail,
    subject,
    htmlContent: html,
    textContent: text,
    replyTo: getAdminEmail(),
    type: 'client_contact_confirmation',
  });
}

export async function sendClarificationRequestEmail(params: {
  clientName: string;
  clientEmail: string;
  projectName: string;
  clarificationNotes: string;
  formUrl: string;
}): Promise<EmailDispatchResult> {
  const subject = `Clarification Needed for ${params.projectName} — Ekaagra Technologies`;

  const html = `
<!DOCTYPE html><html><body style="font-family: sans-serif; padding: 20px; background: #FAF7F2;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 28px; border-radius: 12px; border: 1px solid #E2E8F0;">
    <h2 style="color: #4338CA; margin-top: 0;">Clarification Needed</h2>
    <p>Dear <strong>${params.clientName}</strong>,</p>
    <p>Our team is reviewing the specifications for <strong>${params.projectName}</strong> and has a quick clarification request:</p>
    <div style="background: #FEF3C7; border: 1px solid #FDE68A; padding: 16px; border-radius: 8px; margin: 16px 0; color: #92400E; font-size: 14px;">
      "${params.clarificationNotes}"
    </div>
    <p>You can reply directly to this email or update your project details in your portal link:</p>
    <a href="${params.formUrl}" style="display:inline-block; background:#4338CA; color:white; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold;">Open Project Portal</a>
  </div>
</body></html>`;

  const text = `Dear ${params.clientName},\n\nOur team has a clarification request for ${params.projectName}:\n"${params.clarificationNotes}"\n\nYou can reply directly to this email or open your project portal: ${params.formUrl}\n\nEkaagra Technologies`;

  return sendEmail({
    to: params.clientEmail,
    subject,
    htmlContent: html,
    textContent: text,
    replyTo: getAdminEmail(),
    type: 'client_contact_confirmation',
  });
}

export async function sendDesignReadyClientEmail(params: {
  clientName: string;
  clientEmail: string;
  projectName: string;
  designUrl: string;
  reviewPortalUrl: string;
}): Promise<EmailDispatchResult> {
  const fullPortalUrl = params.reviewPortalUrl.startsWith('http')
    ? params.reviewPortalUrl
    : `https://www.ekaagratechnologies.site${params.reviewPortalUrl}`;

  const subject = `Your Custom Design Concept is Ready! — ${params.projectName}`;

  const html = `
<!DOCTYPE html><html><body style="font-family: sans-serif; padding: 20px; background: #FAF7F2;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 28px; border-radius: 12px; border: 1px solid #E2E8F0;">
    <h2 style="color: #4338CA; margin-top: 0;">Your Design Concept is Ready for Review!</h2>
    <p>Dear <strong>${params.clientName}</strong>,</p>
    <p>We are delighted to share the initial design concept for <strong>${params.projectName}</strong>.</p>
    <p>Please inspect the layout, typography, aesthetics, and responsiveness using the review portal:</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${fullPortalUrl}" style="display:inline-block; background:#4338CA; color:white; padding:14px 28px; border-radius:10px; text-decoration:none; font-weight:bold; font-size: 14px;">Review &amp; Approve Design &rarr;</a>
    </div>
    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 14px; border-radius: 8px; font-size: 12px; color: #475569;">
      &bull; <strong>Request Revisions:</strong> If you'd like changes, you can submit feedback directly in the portal.<br/>
      &bull; <strong>Approve:</strong> Once you are 100% happy with the design, approving it triggers the development milestone.
    </div>
  </div>
</body></html>`;

  const text = `Dear ${params.clientName},\n\nYour custom design concept for ${params.projectName} is ready for review:\n${fullPortalUrl}\n\nYou can review, request revisions, or approve the design directly in the portal.\n\nEkaagra Technologies`;

  return sendEmail({
    to: params.clientEmail,
    subject,
    htmlContent: html,
    textContent: text,
    replyTo: getAdminEmail(),
    type: 'client_contact_confirmation',
  });
}

export async function sendRequirementsApprovedClientEmail(params: {
  clientName: string;
  clientEmail: string;
  projectName: string;
}): Promise<EmailDispatchResult> {
  const subject = `Requirements Approved: Design Phase Started — ${params.projectName}`;

  const html = `
<!DOCTYPE html><html><body style="font-family: sans-serif; padding: 20px; background: #FAF7F2;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 28px; border-radius: 12px; border: 1px solid #E2E8F0;">
    <h2 style="color: #4338CA; margin-top: 0;">Requirements Approved &bull; Design In Progress</h2>
    <p>Dear <strong>${params.clientName}</strong>,</p>
    <p>Great news! Our engineering and creative team has reviewed and approved the technical requirements for <strong>${params.projectName}</strong>.</p>
    <div style="background: #EEF2FF; border: 1px solid #C7D2FE; padding: 16px; border-radius: 8px; margin: 16px 0; color: #3730A3; font-size: 13px;">
      Our UI/UX designers are now drafting your initial custom design concept and responsive layout prototype. You will receive an invitation to review and test the concept as soon as it is ready.
    </div>
    <p style="font-size: 12px; color: #64748B;">Reminder: Zero upfront payment is required at this stage. Billing only begins once you approve your design concept.</p>
  </div>
</body></html>`;

  const text = `Dear ${params.clientName},\n\nYour requirements for ${params.projectName} have been reviewed and approved! Our designers are now crafting your initial design prototype.\n\nEkaagra Technologies`;

  return sendEmail({
    to: params.clientEmail,
    subject,
    htmlContent: html,
    textContent: text,
    replyTo: getAdminEmail(),
    type: 'client_contact_confirmation',
  });
}

export async function sendAdminDesignRevisionRequestedEmail(params: {
  projectName: string;
  projectNumber: string;
  designVersion: number;
  clientFeedback: string;
  clientName: string;
}): Promise<EmailDispatchResult> {
  const subject = `[DESIGN REVISION REQUESTED] ${params.projectNumber} — Concept v${params.designVersion}`;
  const adminUrl = `https://www.ekaagratechnologies.site/admin/business-projects`;

  const html = `
<!DOCTYPE html><html><body style="font-family: sans-serif; padding: 20px; background: #FAF7F2;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 24px; border-radius: 12px; border: 1px solid #E2E8F0;">
    <h2 style="color: #D97706; margin-top: 0;">Design Revisions Requested</h2>
    <p>Client <strong>${params.clientName}</strong> has requested revisions on Concept v${params.designVersion} for project <strong>${params.projectNumber} (${params.projectName})</strong>.</p>
    <div style="background: #FFFBEB; border: 1px solid #FDE68A; padding: 16px; border-radius: 8px; margin: 16px 0; font-size: 13px; color: #92400E;">
      <strong>Client Feedback:</strong><br/>
      "${params.clientFeedback}"
    </div>
    <a href="${adminUrl}" style="display:inline-block; background:#131B2E; color:white; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:13px;">View Project Workspace</a>
  </div>
</body></html>`;

  const text = `[DESIGN REVISION REQUESTED] ${params.projectNumber} (v${params.designVersion})\nClient: ${params.clientName}\nFeedback: ${params.clientFeedback}`;

  return sendEmail({
    to: getAdminEmail(),
    subject,
    htmlContent: html,
    textContent: text,
    replyTo: getAdminEmail(),
    type: 'quote',
  });
}

export async function sendAdminDesignApprovedEmail(params: {
  projectName: string;
  projectNumber: string;
  designVersion: number;
  clientName: string;
}): Promise<EmailDispatchResult> {
  const subject = `🎉 [DESIGN APPROVED] ${params.projectNumber} — ${params.projectName}`;
  const adminUrl = `https://www.ekaagratechnologies.site/admin/business-projects`;

  const html = `
<!DOCTYPE html><html><body style="font-family: sans-serif; padding: 20px; background: #FAF7F2;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 24px; border-radius: 12px; border: 1px solid #E2E8F0;">
    <h2 style="color: #059669; margin-top: 0;">🎉 Design Concept Approved!</h2>
    <p>Client <strong>${params.clientName}</strong> has approved Design Concept v${params.designVersion} for project <strong>${params.projectNumber} (${params.projectName})</strong>.</p>
    <div style="background: #ECFDF5; border: 1px solid #A7F3D0; padding: 16px; border-radius: 8px; margin: 16px 0; font-size: 13px; color: #065F46;">
      <strong>Next Step:</strong> The milestone payment workflow is now UNLOCKED. You can create the milestone payment invoice and link for the client.
    </div>
    <a href="${adminUrl}" style="display:inline-block; background:#059669; color:white; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:13px;">Create Milestone Payment Link</a>
  </div>
</body></html>`;

  const text = `[DESIGN APPROVED] ${params.projectNumber} Concept v${params.designVersion} approved by ${params.clientName}. Payment milestone unlocked.\nAdmin: ${adminUrl}`;

  return sendEmail({
    to: getAdminEmail(),
    subject,
    htmlContent: html,
    textContent: text,
    replyTo: getAdminEmail(),
    type: 'quote',
  });
}

export async function sendClientPaymentMilestoneEmail(params: {
  clientName: string;
  clientEmail: string;
  projectName: string;
  milestoneTitle: string;
  amountINR: number;
  paymentUrl: string;
}): Promise<EmailDispatchResult> {
  const fullPaymentUrl = params.paymentUrl.startsWith('http')
    ? params.paymentUrl
    : `https://www.ekaagratechnologies.site${params.paymentUrl}`;

  const subject = `Milestone Invoice: ${params.milestoneTitle} — ${params.projectName}`;

  const html = `
<!DOCTYPE html><html><body style="font-family: sans-serif; padding: 20px; background: #FAF7F2;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 28px; border-radius: 12px; border: 1px solid #E2E8F0;">
    <h2 style="color: #4338CA; margin-top: 0;">Milestone Invoice &amp; Payment Link</h2>
    <p>Dear <strong>${params.clientName}</strong>,</p>
    <p>Following your approval of the design concept for <strong>${params.projectName}</strong>, your milestone invoice is ready:</p>
    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 18px; border-radius: 8px; margin: 18px 0;">
      <div style="font-size: 14px; font-weight: bold; color: #1E293B;">${params.milestoneTitle}</div>
      <div style="font-size: 24px; font-weight: 800; color: #4338CA; margin: 8px 0;">₹${params.amountINR.toLocaleString('en-IN')}</div>
      <div style="font-size: 12px; color: #64748B;">Secure payment via UPI, Credit/Debit Card, Net Banking (Razorpay)</div>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${fullPaymentUrl}" style="display:inline-block; background:#059669; color:white; padding:14px 28px; border-radius:10px; text-decoration:none; font-weight:bold; font-size: 14px;">Pay Securely Online &rarr;</a>
    </div>
    <p style="font-size: 12px; color: #64748B;">Once payment is received, development and engineering sprints will begin immediately.</p>
  </div>
</body></html>`;

  const text = `Dear ${params.clientName},\n\nMilestone Invoice for ${params.projectName}:\n${params.milestoneTitle}: ₹${params.amountINR.toLocaleString('en-IN')}\n\nPay here: ${fullPaymentUrl}\n\nEkaagra Technologies`;

  return sendEmail({
    to: params.clientEmail,
    subject,
    htmlContent: html,
    textContent: text,
    replyTo: getAdminEmail(),
    type: 'client_contact_confirmation',
  });
}

export interface SchoolChangeRequestEmailParams {
  clientName: string;
  clientEmail: string;
  schoolName: string;
  projectNumber?: string;
  sectionKey?: string;
  fieldLabel: string;
  reviewerMessage: string;
  suggestedValue?: string;
  onboardingUrl: string;
}

/**
 * Dispatches an automated email notification to the school client when a reviewer requests adjustments.
 */
export async function sendSchoolChangeRequestEmail(
  params: SchoolChangeRequestEmailParams
): Promise<EmailDispatchResult> {
  const appBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.ekaagratechnologies.site');

  const fullOnboardingUrl = params.onboardingUrl.startsWith('http')
    ? params.onboardingUrl
    : `${appBaseUrl.replace(/\/$/, '')}${params.onboardingUrl.startsWith('/') ? '' : '/'}${params.onboardingUrl}`;

  const subject = `Action Required: Onboarding Adjustments for ${params.schoolName} — Ekaagra Technologies`;

  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px 12px; background: #FAF7F2; color: #1E293B;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 32px 28px; border-radius: 16px; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
    <div style="margin-bottom: 24px; border-bottom: 1px solid #F1F5F9; padding-bottom: 16px;">
      <h2 style="color: #4338CA; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.02em;">EKAAGRA TECHNOLOGIES</h2>
    </div>
    <div style="background: #FEF3C7; border: 1px solid #FDE68A; border-radius: 10px; padding: 12px 16px; margin-bottom: 20px;">
      <span style="font-weight: 700; color: #92400E; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Action Required &bull; Intake Review</span>
    </div>
    <p style="font-size: 15px; line-height: 1.5; margin: 0 0 12px 0;">Dear <strong>${params.clientName || 'School Administrator'}</strong>,</p>
    <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
      Our verification team has completed a preliminary review of the onboarding data for <strong>${params.schoolName}</strong>. 
      To ensure the accuracy and quality of your digital platform, we have requested an update for the following item:
    </p>
    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748B; margin-bottom: 4px;">
        ${params.sectionKey ? `${params.sectionKey} &bull; ` : ''}Field
      </div>
      <div style="font-size: 15px; font-weight: 700; color: #0F172A; margin-bottom: 12px;">
        ${params.fieldLabel}
      </div>
      <div style="background: white; border: 1px solid #FED7AA; border-left: 4px solid #F97316; border-radius: 6px; padding: 12px 14px; margin-bottom: 12px;">
        <div style="font-size: 11px; font-weight: 700; color: #C2410C; margin-bottom: 4px;">REVIEWER NOTE</div>
        <div style="font-size: 13px; color: #7C2D12; line-height: 1.5;">${params.reviewerMessage}</div>
      </div>
      ${params.suggestedValue ? `
      <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 6px; padding: 10px 14px;">
        <div style="font-size: 11px; font-weight: 700; color: #1D4ED8; margin-bottom: 2px;">SUGGESTION</div>
        <div style="font-size: 13px; color: #1E40AF; font-family: monospace;">${params.suggestedValue}</div>
      </div>` : ''}
    </div>
    <div style="text-align: center; margin: 28px 0 20px 0;">
      <a href="${fullOnboardingUrl}" style="display: inline-block; background: #4338CA; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; box-shadow: 0 2px 6px rgba(67, 56, 202, 0.3);">
        Review &amp; Update in Onboarding Portal &rarr;
      </a>
    </div>
    <p style="font-size: 12px; color: #64748B; text-align: center; margin: 0 0 24px 0;">
      Or copy and paste this link in your browser:<br/>
      <a href="${fullOnboardingUrl}" style="color: #4338CA; word-break: break-all;">${fullOnboardingUrl}</a>
    </p>
    <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; font-size: 12px; color: #94A3B8;">
      Ekaagra Technologies Support Team &bull; <a href="mailto:${getAdminEmail()}" style="color: #64748B;">${getAdminEmail()}</a>
    </div>
  </div>
</body></html>`;

  const text = `Dear ${params.clientName || 'School Administrator'},\n\nOur verification team has requested an update for ${params.schoolName}:\n\nField: ${params.fieldLabel}\nReviewer Note: ${params.reviewerMessage}\n${params.suggestedValue ? `Suggested Value: ${params.suggestedValue}\n` : ''}\nPlease review and provide the corrected value via your onboarding portal:\n${fullOnboardingUrl}\n\nEkaagra Technologies Support`;

  return sendEmail({
    to: params.clientEmail,
    subject,
    htmlContent: html,
    textContent: text,
    replyTo: getAdminEmail(),
    type: 'client_contact_confirmation',
  });
}

export interface SchoolChangeRequestBatchItem {
  fieldLabel: string;
  sectionKey?: string;
  reviewerMessage: string;
  suggestedValue?: string;
}

export interface SchoolChangeRequestBatchEmailParams {
  clientName?: string;
  clientEmail: string;
  schoolName: string;
  projectNumber?: string;
  requests?: SchoolChangeRequestBatchItem[];
  items?: SchoolChangeRequestBatchItem[];
  onboardingUrl: string;
}

/**
 * Dispatches a single consolidated batch email notification containing all requested adjustments.
 */
export async function sendSchoolChangeRequestBatchEmail(
  params: SchoolChangeRequestBatchEmailParams
): Promise<EmailDispatchResult> {
  const reqList = params.requests || params.items || [];
  const count = reqList.length;
  if (count === 0) {
    return { success: false, method: 'error', error: 'No change requests provided to dispatch' };
  }

  const appBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.ekaagratechnologies.site');

  const fullOnboardingUrl = params.onboardingUrl.startsWith('http')
    ? params.onboardingUrl
    : `${appBaseUrl.replace(/\/$/, '')}${params.onboardingUrl.startsWith('/') ? '' : '/'}${params.onboardingUrl}`;

  const subject =
    count === 1
      ? `Action Required: 1 Adjustment Requested for ${params.schoolName} — Ekaagra Technologies`
      : `Action Required: ${count} Adjustments Requested for ${params.schoolName} — Ekaagra Technologies`;

  const itemCardsHtml = reqList
    .map(
      (req, idx) => `
    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px; margin-bottom: 16px;">
      <div style="margin-bottom: 8px;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748B;">
          ${req.sectionKey ? `${req.sectionKey} &bull; ` : ''}Item ${idx + 1}
        </span>
        <span style="background: #FEE2E2; color: #991B1B; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; margin-left: 8px;">
          CORRECTION NEEDED
        </span>
      </div>
      <div style="font-size: 15px; font-weight: 700; color: #0F172A; margin-bottom: 10px;">
        ${req.fieldLabel}
      </div>
      <div style="background: white; border: 1px solid #FED7AA; border-left: 4px solid #F97316; border-radius: 6px; padding: 10px 14px; margin-bottom: ${
        req.suggestedValue ? '8px' : '0'
      };">
        <div style="font-size: 11px; font-weight: 700; color: #C2410C; margin-bottom: 3px;">REVIEWER NOTE</div>
        <div style="font-size: 13px; color: #7C2D12; line-height: 1.5;">${req.reviewerMessage}</div>
      </div>
      ${
        req.suggestedValue
          ? `
      <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 6px; padding: 8px 12px; margin-top: 8px;">
        <div style="font-size: 11px; font-weight: 700; color: #1D4ED8; margin-bottom: 2px;">SUGGESTION</div>
        <div style="font-size: 13px; color: #1E40AF; font-family: monospace;">${req.suggestedValue}</div>
      </div>`
          : ''
      }
    </div>
  `
    )
    .join('');

  const textItems = reqList
    .map(
      (r, i) =>
        `${i + 1}. [${r.sectionKey ? `${r.sectionKey} - ` : ''}${r.fieldLabel}]\n   Reviewer Note: ${
          r.reviewerMessage
        }${r.suggestedValue ? `\n   Suggestion: ${r.suggestedValue}` : ''}`
    )
    .join('\n\n');

  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px 12px; background: #FAF7F2; color: #1E293B;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 32px 28px; border-radius: 16px; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
    <div style="margin-bottom: 24px; border-bottom: 1px solid #F1F5F9; padding-bottom: 16px;">
      <h2 style="color: #4338CA; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.02em;">EKAAGRA TECHNOLOGIES</h2>
    </div>
    <div style="background: #FEF3C7; border: 1px solid #FDE68A; border-radius: 10px; padding: 12px 16px; margin-bottom: 20px;">
      <span style="font-weight: 700; color: #92400E; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Action Required &bull; Intake Review (${count} ${
        count === 1 ? 'Item' : 'Items'
      })</span>
    </div>
    <p style="font-size: 15px; line-height: 1.5; margin: 0 0 12px 0;">Dear <strong>${
      params.clientName || 'School Administrator'
    }</strong>,</p>
    <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
      Our verification team has completed a review of the onboarding data for <strong>${
        params.schoolName
      }</strong>. 
      To ensure the accuracy and quality of your digital platform, we have requested adjustments for the following <strong>${count} ${
        count === 1 ? 'item' : 'items'
      }</strong>:
    </p>

    ${itemCardsHtml}

    <div style="text-align: center; margin: 28px 0 20px 0;">
      <a href="${fullOnboardingUrl}" style="display: inline-block; background: #4338CA; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; box-shadow: 0 2px 6px rgba(67, 56, 202, 0.3);">
        Review &amp; Update in Onboarding Portal &rarr;
      </a>
    </div>
    <p style="font-size: 12px; color: #64748B; text-align: center; margin: 0 0 24px 0;">
      Or copy and paste this link in your browser:<br/>
      <a href="${fullOnboardingUrl}" style="color: #4338CA; word-break: break-all;">${fullOnboardingUrl}</a>
    </p>
    <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; font-size: 12px; color: #94A3B8;">
      Ekaagra Technologies Support Team &bull; <a href="mailto:${getAdminEmail()}" style="color: #64748B;">${getAdminEmail()}</a>
    </div>
  </div>
</body></html>`;

  const text = `Dear ${
    params.clientName || 'School Administrator'
  },\n\nOur verification team has reviewed the onboarding data for ${
    params.schoolName
  } and requested ${count} adjustment(s):\n\n${textItems}\n\nPlease review and provide the corrected values via your onboarding portal:\n${fullOnboardingUrl}\n\nEkaagra Technologies Support`;

  return sendEmail({
    to: params.clientEmail,
    subject,
    htmlContent: html,
    textContent: text,
    replyTo: getAdminEmail(),
    type: 'client_contact_confirmation',
  });
}

