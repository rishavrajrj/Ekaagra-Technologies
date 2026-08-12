import type { Metadata } from 'next';
import ContactForm from '@/components/forms/ContactForm';
import { Mail, Phone, Clock, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact | Ekaagra Technologies',
  description: 'Have an idea, business requirement, or project in mind? Tell us what you need and we\'ll help you plan the right solution.',
};

export default function ContactPage() {
  return (
    <div className="bg-[#090d16] text-slate-100 min-h-screen">
      {/* Hero */}
      <section className="py-20 sm:py-24 border-b border-white/[0.08] bg-tech-grid relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            START A CONVERSATION
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
            Let&apos;s talk about your project.
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Tell us what you&apos;re trying to achieve. We&apos;ll help turn the requirement into a practical digital solution.
          </p>
        </div>
      </section>

      {/* Main 2-Column Split Section */}
      <section className="py-20 border-b border-white/[0.08] bg-[#0b0f19]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Left Info Column */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-4">
                <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
                  EKAAGRA STUDIO CONTACT
                </span>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">
                  Direct Line &amp; Project Inquiry
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  We review every project proposal within 24 hours. Whether you need a full school ERP, custom Android application, or institutional web platform, we are ready to discuss.
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-start gap-4 bg-[#0e1320] p-4 rounded-xl border border-white/5">
                  <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-400 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-white uppercase block">Response Time</span>
                    <span className="text-xs text-slate-400 block mt-0.5">Within 24 business hours</span>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-[#0e1320] p-4 rounded-xl border border-white/5">
                  <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-400 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-white uppercase block">Headquarters</span>
                    <span className="text-xs text-slate-400 block mt-0.5">Ekaagra Technologies • India</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Form Column */}
            <div className="lg:col-span-7">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

