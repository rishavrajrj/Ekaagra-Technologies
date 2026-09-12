'use client';

import React from 'react';
import { MapPin, Phone, Mail, Clock, ExternalLink } from 'lucide-react';
import type { SchoolWebsiteData } from '@/lib/schoolWebsiteContract';

interface SchoolContactProps {
  data: SchoolWebsiteData;
}

export default function SchoolContact({ data }: SchoolContactProps) {
  const { contact, campuses, school, branding } = data;

  return (
    <section id="contact" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 space-y-10">
        {/* Section Header */}
        <div className="max-w-2xl space-y-2">
          <span
            className="text-xs font-bold uppercase tracking-wider block"
            style={{ color: branding.primaryColor || '#4338CA' }}
          >
            Connect With Us
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Campus Locations &amp; Institutional Inquiries
          </h2>
          <p className="text-xs text-slate-500">
            Reach out to our administration desk for admissions, visits, and official correspondence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Contact Details Card */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: branding.primaryColor || '#4338CA' }}
              >
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Telephone</h3>
                <p className="text-xs text-slate-600">{contact.primaryPhone || 'Official Telephone'}</p>
                {contact.secondaryPhone && (
                  <p className="text-xs text-slate-500">{contact.secondaryPhone}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-200/60">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: branding.primaryColor || '#4338CA' }}
              >
                <Mail className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm text-slate-900">Official Email</h3>
                <p className="text-xs text-slate-600 truncate">{contact.primaryEmail || 'Official Email'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-200/60">
              <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Office Hours</h3>
                <p className="text-xs text-slate-600">{contact.officeHours}</p>
              </div>
            </div>
          </div>

          {/* Campus Addresses (Multi-Campus or Single Campus) */}
          <div className="md:col-span-2 space-y-4">
            {campuses.map((camp) => (
              <div
                key={camp.id}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                    <h4 className="font-extrabold text-sm text-slate-900">{camp.name}</h4>
                  </div>
                  {camp.isMainCampus && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                      Main Campus
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {camp.address}
                  {camp.city ? `, ${camp.city}` : ''}
                  {camp.state ? `, ${camp.state}` : ''}
                  {camp.postalCode ? ` - ${camp.postalCode}` : ''}
                </p>

                {camp.googleMapsUrl && (
                  <div className="pt-1">
                    <a
                      href={camp.googleMapsUrl.startsWith('http') ? camp.googleMapsUrl : `https://${camp.googleMapsUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      <span>Get Directions on Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
