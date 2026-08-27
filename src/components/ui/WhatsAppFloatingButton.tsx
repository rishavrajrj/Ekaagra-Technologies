'use client';

import { buildGeneralInquiryWhatsAppUrl } from '@/lib/whatsapp';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppFloatingButton() {
  const whatsappUrl = buildGeneralInquiryWhatsAppUrl();

  return (
    <aside aria-label="WhatsApp Support Link">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Ekaagra Technologies on WhatsApp"
        title="Chat on WhatsApp"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white p-3.5 sm:px-4 sm:py-3.5 rounded-full shadow-2xl shadow-[#25D366]/40 hover:shadow-2xl hover:shadow-[#25D366]/60 hover:scale-105 active:scale-95 transition-all duration-300 group cursor-pointer"
      >
        <div className="relative flex items-center justify-center">
          <MessageCircle className="w-6 h-6 fill-current text-white" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full animate-ping opacity-75" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-100 rounded-full" />
        </div>
        <span className="hidden sm:inline text-xs font-extrabold tracking-wider uppercase pr-1">
          Chat on WhatsApp
        </span>
      </a>
    </aside>
  );
}
