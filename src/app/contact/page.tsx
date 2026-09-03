import type { Metadata } from 'next';
import ContactForm from '@/components/forms/ContactForm';
import { Mail, Clock, MapPin, Sparkles, MessageSquare } from 'lucide-react';
import { createPageMetadata, webPageSchema, SITE_URL, BRAND_EMAIL } from '@/lib/seo.config';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { buildGeneralInquiryWhatsAppUrl } from '@/lib/whatsapp';

export const metadata: Metadata = createPageMetadata({
  title: 'Contact Ekaagra Technologies — Website Developer in Motihari, Bihar',
  description:
    'Contact Ekaagra Technologies for custom website design, web applications, school ERP systems, and business software in Motihari, Bihar. Reach us via inquiry form, email, or direct WhatsApp.',
  path: '/contact',
});

export default function ContactPage() {
  const whatsappUrl = buildGeneralInquiryWhatsAppUrl();

  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageSchema({
              name: 'Contact Ekaagra Technologies',
              description:
                'Get in touch with Ekaagra Technologies for website design and software development in Motihari, Bihar.',
              url: `${SITE_URL}/contact`,
            })
          ),
        }}
      />
      <div className="site-container pt-6 pb-2">
        <Breadcrumbs items={[{ label: 'Contact Us' }]} />
      </div>

      {/* Hero */}
      <section className="py-16 sm:py-20 border-b border-[#E2E8F0] bg-warm-grid relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="site-container text-center space-y-4 relative z-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#F97360]" />
            START A CONVERSATION • MOTIHARI, BIHAR
          </span>
          <h1 className="fluid-hero-headline font-extrabold text-[#131B2E] tracking-tight">
            Let&apos;s build something people remember.
          </h1>
          <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed">
            Tell us what you&apos;re trying to achieve. We&apos;ll help turn your requirement into a beautiful, practical website or application.
          </p>
        </div>
      </section>

      {/* Main 2-Column Split Section */}
      <section className="py-12 sm:py-16 border-b border-[#E2E8F0] bg-[#FAF7F2]">
        <div className="site-container">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
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
                  We review every project proposal promptly within 24 hours. If you are planning a new business website, an institutional school portal, or custom software in Motihari or anywhere in Bihar, we are ready to help.
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-[#E2E8F0]">
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
                    <span className="text-xs font-bold text-[#131B2E] uppercase tracking-wider block">Studio Location</span>
                    <span className="text-xs text-[#64748B] block mt-1">Motihari, East Champaran, Bihar, India</span>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm">
                  <div className="p-3 bg-emerald-500/10 text-emerald-700 rounded-xl shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#131B2E] uppercase tracking-wider block">Email Inquiries</span>
                    <a href={`mailto:${BRAND_EMAIL}`} className="text-xs text-[#4338CA] hover:underline block mt-1 truncate">
                      {BRAND_EMAIL}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm">
                  <div className="p-3 bg-[#25D366]/10 text-[#25D366] rounded-xl shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#131B2E] uppercase tracking-wider block">Instant WhatsApp</span>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#4338CA] font-semibold hover:underline block mt-1"
                    >
                      Chat with us on WhatsApp &rarr;
                    </a>
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



