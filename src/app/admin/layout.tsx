import type { Metadata } from 'next';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

export const metadata: Metadata = {
  title: {
    default: 'Operations HQ | Ekaagra Technologies Admin',
    template: '%s | Ekaagra Admin',
  },
  description: 'Executive management portal for Ekaagra Technologies.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
