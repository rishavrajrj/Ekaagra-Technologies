'use client';

import React, { useState } from 'react';
import type { SchoolWebsiteData } from '@/lib/schoolWebsiteContract';
import SchoolHeader from './SchoolHeader';
import SchoolHero from './SchoolHero';
import SchoolAbout from './SchoolAbout';
import SchoolLeadership from './SchoolLeadership';
import SchoolAcademics from './SchoolAcademics';
import SchoolFacilities from './SchoolFacilities';
import SchoolAdmissions from './SchoolAdmissions';
import SchoolFees from './SchoolFees';
import SchoolTransport from './SchoolTransport';
import SchoolHostel from './SchoolHostel';
import SchoolGallery from './SchoolGallery';
import SchoolMandatoryDisclosures from './SchoolMandatoryDisclosures';
import SchoolContact from './SchoolContact';
import SchoolFooter from './SchoolFooter';

export interface SchoolWebsiteRendererProps {
  data: SchoolWebsiteData;
  viewMode?: 'full' | 'tabbed';
  initialTab?: string;
  className?: string;
}

export default function SchoolWebsiteRenderer({
  data,
  viewMode = 'full',
  initialTab = 'home',
  className = '',
}: SchoolWebsiteRendererProps) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const handleSectionNavigate = (sectionKey: string) => {
    setActiveTab(sectionKey);
    if (viewMode === 'full') {
      const el = document.getElementById(sectionKey);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // If viewMode === 'tabbed' (used for structured page-by-page inspection in preview)
  if (viewMode === 'tabbed') {
    return (
      <div className={`flex flex-col min-h-full bg-white text-slate-900 ${className}`}>
        <SchoolHeader
          data={data}
          activeSection={activeTab}
          onSectionClick={handleSectionNavigate}
        />

        <main className="flex-1">
          {activeTab === 'home' && (
            <div className="space-y-0">
              <SchoolHero data={data} onCtaClick={handleSectionNavigate} />
              <SchoolAbout data={data} />
              <SchoolLeadership data={data} />
              <SchoolAcademics data={data} />
              <SchoolFacilities data={data} />
              {data.transport.isOperated && <SchoolTransport data={data} />}
              {data.hostel.isAvailable && <SchoolHostel data={data} />}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-0">
              <SchoolAbout data={data} />
              <SchoolLeadership data={data} />
            </div>
          )}

          {activeTab === 'academics' && <SchoolAcademics data={data} />}

          {activeTab === 'facilities' && <SchoolFacilities data={data} />}

          {activeTab === 'transport' && data.transport.isOperated && (
            <SchoolTransport data={data} />
          )}

          {activeTab === 'hostel' && data.hostel.isAvailable && (
            <SchoolHostel data={data} />
          )}

          {activeTab === 'admissions' && (
            <div className="space-y-0">
              <SchoolAdmissions
                data={data}
                onApplyClick={() => handleSectionNavigate('contact')}
              />
              <SchoolFees data={data} />
            </div>
          )}

          {activeTab === 'gallery' && data.gallery.length > 0 && (
            <SchoolGallery data={data} />
          )}

          {activeTab === 'disclosures' && (
            <SchoolMandatoryDisclosures data={data} />
          )}

          {activeTab === 'contact' && <SchoolContact data={data} />}
        </main>

        <SchoolFooter data={data} onSectionClick={handleSectionNavigate} />
      </div>
    );
  }

  // Full continuous page view (Standard public website layout)
  return (
    <div className={`flex flex-col min-h-screen bg-white text-slate-900 ${className}`}>
      <SchoolHeader
        data={data}
        activeSection={activeTab}
        onSectionClick={handleSectionNavigate}
      />

      <main className="flex-1 space-y-0">
        <SchoolHero data={data} onCtaClick={handleSectionNavigate} />
        <SchoolAbout data={data} />
        <SchoolLeadership data={data} />
        <SchoolAcademics data={data} />
        <SchoolFacilities data={data} />
        {data.transport.isOperated && <SchoolTransport data={data} />}
        {data.hostel.isAvailable && <SchoolHostel data={data} />}
        <SchoolAdmissions
          data={data}
          onApplyClick={() => handleSectionNavigate('contact')}
        />
        <SchoolFees data={data} />
        {data.gallery.length > 0 && <SchoolGallery data={data} />}
        <SchoolMandatoryDisclosures data={data} />
        <SchoolContact data={data} />
      </main>

      <SchoolFooter data={data} onSectionClick={handleSectionNavigate} />
    </div>
  );
}
