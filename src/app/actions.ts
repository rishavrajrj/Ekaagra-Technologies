'use server';

import type { ContactFormData, QuoteFormData } from '@/lib/types';

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

  // TODO: Connect to Supabase or email service
  console.log('Contact form submission:', data);
  
  return { success: true, message: 'Thank you! Your enquiry has been received. We\'ll review your requirements and get back to you.' };
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

  console.log('Quote form submission:', data);
  
  return { success: true, message: 'Thank you! Your project enquiry has been received. We\'ll review your requirements and get back to you.' };
}
