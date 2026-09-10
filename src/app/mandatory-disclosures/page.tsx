import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, FileText, CheckCircle2, ArrowLeft, ExternalLink, School, Building2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Mandatory Public Disclosures (Appendix IX) | Ekaagra Technologies',
  description: 'Statutory school public disclosures, CBSE affiliation documentation, safety certifications and infrastructure reports.',
};

export default function MandatoryDisclosuresPage() {
  const disclosureSections = [
    {
      title: 'A. General Information',
      items: [
        { label: 'School Name', value: 'SparkNest Academy' },
        { label: 'Affiliation No. (CBSE)', value: '330892' },
        { label: 'School Code', value: '65432' },
        { label: 'Complete Address', value: 'NH-28, Main Campus Road, Bapudham, Motihari, Bihar - 845401' },
        { label: 'Principal Name & Qualification', value: 'Dr. Sarita Sharma (M.Sc., B.Ed., Ph.D.)' },
        { label: 'School Email ID', value: 'contact@sparknestacademy.edu.in' },
        { label: 'Contact Phone Numbers', value: '+91 94312 00000, +91 94312 00001' },
      ],
    },
    {
      title: 'B. Documents and Information',
      documents: [
        { name: 'Copies of Affiliation / Upgradation Letter & Recent Extension of Affiliation', file: 'Affiliation_Extension_Letter.pdf' },
        { name: 'Copies of Societies / Trust / Company Registration / Renewal Certificate', file: 'Trust_Deed_Registration.pdf' },
        { name: 'Copy of No Objection Certificate (NOC) Issued by the State Government', file: 'State_Govt_NOC.pdf' },
        { name: 'Copies of Recognition Certificate under RTE Act, 2009', file: 'RTE_Recognition_Order.pdf' },
        { name: 'Copy of Valid Building Safety Certificate (National Building Code)', file: 'Building_Safety_Certificate.pdf' },
        { name: 'Copy of Valid Fire Safety Certificate Issued by Competent Authority', file: 'Fire_Safety_Inspection_Certificate.pdf' },
        { name: 'Copy of Valid Water, Health & Sanitation Certificates', file: 'Safe_Drinking_Water_Sanitation_Certificate.pdf' },
      ],
    },
    {
      title: 'C. Result and Academics',
      documents: [
        { name: 'Fee Structure of the School (Annual Tuition & Component Heads)', file: 'Fee_Schedule_2026_2027.pdf' },
        { name: 'Annual Academic Calendar (Examinations, Terms, and Vacations)', file: 'Academic_Calendar_2026_27.pdf' },
        { name: 'List of School Management Committee (SMC)', file: 'SMC_Members_Roster.pdf' },
        { name: 'List of Parents Teachers Association (PTA) Members', file: 'PTA_Executive_Committee.pdf' },
        { name: 'Last Three-Year Result of the Board Examination (Class X & XII)', file: 'Three_Year_Board_Results_Summary.pdf' },
      ],
    },
    {
      title: 'D. Staff (Teaching)',
      items: [
        { label: 'Principal', value: '1' },
        { label: 'Total Number of Teachers', value: '54' },
        { label: 'PGT (Post Graduate Teachers)', value: '14' },
        { label: 'TGT (Trained Graduate Teachers)', value: '22' },
        { label: 'PRT (Primary Teachers)', value: '18' },
        { label: 'Teacher Section Ratio', value: '1.5 : 1' },
        { label: 'Details of Special Educator', value: 'Full-time Certified Special Needs Counsellor' },
        { label: 'Details of Wellness Teacher / Counsellor', value: 'Full-time Registered Psychologist' },
      ],
    },
    {
      title: 'E. School Infrastructure',
      items: [
        { label: 'Total Campus Area (in Square Mtrs)', value: '12,140 Sq. Mtrs (3.0 Acres)' },
        { label: 'Number and Size of Classrooms', value: '42 Rooms (500 Sq. Ft each)' },
        { label: 'Number and Size of Laboratories (Physics/Chem/Bio/Comp)', value: '5 Labs (800 Sq. Ft each)' },
        { label: 'Internet Facility', value: 'Yes (Gigabit High-Speed Fibre Optic LAN)' },
        { label: 'Number of Girls Toilets', value: '24' },
        { label: 'Number of Boys Toilets', value: '24' },
        { label: 'YouTube Video Link of School Campus Inspection', value: 'Official Campus Inspection Tour Available' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              CBSE Appendix IX Compliance
            </span>
            <Link
              href="/"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Website
            </Link>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Mandatory Public Disclosures
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              Information required by regulatory and education board authorities for statutory institutional transparency.
            </p>
          </div>
        </div>

        {/* Sections */}
        {disclosureSections.map((sec, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              {sec.title}
            </h2>

            {sec.items && (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {sec.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{item.label}</dt>
                    <dd className="font-bold text-slate-900 mt-0.5">{item.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {sec.documents && (
              <ul className="space-y-2 text-xs">
                {sec.documents.map((doc, docIdx) => (
                  <li
                    key={docIdx}
                    className="p-3 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition"
                  >
                    <div className="flex items-start space-x-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <span className="font-semibold text-slate-800 leading-snug">{doc.name}</span>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 shrink-0 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      View Document
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500 pt-4">
          Published under statutory compliance directives. Maintained &amp; verified by Ekaagra Technologies.
        </div>
      </div>
    </div>
  );
}
