'use server';

import type { ContactFormData, QuoteFormData } from '@/lib/types';
import {
  sendContactNotification,
  sendQuoteNotification,
  sendClientContactConfirmation,
  sendClientQuoteConfirmation,
} from '@/lib/email';

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

  // 1. Send instant email notification to Ekaagra Admin
  let adminResult;
  try {
    adminResult = await sendContactNotification(data);
  } catch (error) {
    console.error('Contact admin email dispatch exception:', error);
    adminResult = { success: false, method: 'error' as const, error: String(error) };
  }

  // 2. Send confirmation email to the Client
  let clientResult;
  try {
    clientResult = await sendClientContactConfirmation(data);
  } catch (error) {
    console.error('Contact client email dispatch exception:', error);
    clientResult = { success: false, method: 'error' as const, error: String(error) };
  }

  const isDelivered = adminResult.success;

  return {
    success: true,
    emailDelivered: isDelivered,
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

  // 1. Send instant quote notification to Ekaagra Admin
  let adminResult;
  try {
    adminResult = await sendQuoteNotification(data);
  } catch (error) {
    console.error('Quote admin email dispatch exception:', error);
    adminResult = { success: false, method: 'error' as const, error: String(error) };
  }

  // 2. Send confirmation email to the Client
  let clientResult;
  try {
    clientResult = await sendClientQuoteConfirmation(data);
  } catch (error) {
    console.error('Quote client email dispatch exception:', error);
    clientResult = { success: false, method: 'error' as const, error: String(error) };
  }

  const isDelivered = adminResult.success;

  return {
    success: true,
    emailDelivered: isDelivered,
    message: isDelivered
      ? "Thank you! Your project enquiry and scope details have been received. We'll analyze your requirements and send a customized roadmap and estimate."
      : "Thank you! Your project enquiry and scope details have been received. We'll analyze your requirements shortly.",
  };
}
