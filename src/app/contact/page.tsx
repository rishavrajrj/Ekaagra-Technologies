import type { Metadata } from 'next';
import ContactForm from '@/components/forms/ContactForm';
import { Mail, Phone, Clock, MapPin, Sparkles, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Have a project, website design, or software requirement in mind? Tell us what you need and receive a detailed proposal and estimate.',
};

export default function ContactPage() {
  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      {/* Hero */}
      <section className="py-20 sm:py-24 border-b border-[#E2E8F0] bg-warm-grid relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 relative z-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#F97360]" />
            START A CONVERSATION
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-[#131B2E] tracking-tight">
            Let&apos;s build something people remember.
          </h1>
          <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed">
            Tell us what you&apos;re trying to achieve. We&apos;ll help turn your requirement into a beautiful, practical website or application.
          </p>
        </div>
      </section>

      {/* Main 2-Column Split Section */}
      <section className="py-20 border-b border-[#E2E8F0] bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Left Info Column */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-4">
                <span className="text-xs font-mono font-bold text-[#F97360] uppercase tracking-widest block">
                  EKAAGRA DESIGN STUDIO
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#131B2E] tracking-tight">
                  Direct Consultation &amp; Inquiry
                </h2>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  We review every project proposal promptly within 24 hours. If you are planning a new business website, an institutional school portal, or custom software, we are ready to help.
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-[#E2E8F0]">
                <div className="flex items-start gap-4 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm">
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#131B2E] uppercase tracking-wider block">WhatsApp Support</span>
                    <a
                      href="https://api.whatsapp.com/send?text=Hello%20Ekaagra%20Technologies,%20I%20would%20like%20to%20discuss%20a%20project."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 block mt-1 transition-colors"
                    >
                      Connect on WhatsApp ↗
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm">
                  <div className="p-3 bg-[#4338CA]/10 text-[#4338CA] rounded-xl shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#131B2E] uppercase tracking-wider block">Prompt Consultation</span>
                    <span className="text-xs text-[#64748B] block mt-1">Proposal &amp; estimate within 24 hours</span>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm">
                  <div className="p-3 bg-[#F97360]/10 text-[#F97360] rounded-xl shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#131B2E] uppercase tracking-wider block">Headquarters</span>
                    <span className="text-xs text-[#64748B] block mt-1">Ekaagra Technologies • India</span>
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



