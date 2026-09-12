'use client';

import React from 'react';
import { Bus, MapPin, Navigation, ShieldCheck } from 'lucide-react';
import type { SchoolWebsiteData } from '@/lib/schoolWebsiteContract';

interface SchoolTransportProps {
  data: SchoolWebsiteData;
}

export default function SchoolTransport({ data }: SchoolTransportProps) {
  const { transport, school, branding } = data;

  // STRICT CONDITIONAL: If transport is not operated, do not render this section!
  if (!transport.isOperated) {
    return null;
  }

  return (
    <section id="transport" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 space-y-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <span
              className="text-xs font-bold uppercase tracking-wider block"
              style={{ color: branding.primaryColor || '#4338CA' }}
            >
              Logistics &amp; Safety
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              School Bus Fleet &amp; Transport Network
            </h2>
            <p className="text-xs text-slate-500">
              Safe, GPS-monitored student transportation covering designated regional transit points.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {transport.hasGpsTracking && (
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                GPS Enabled
              </span>
            )}
            {transport.totalRoutes ? (
              <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold">
                {transport.totalRoutes} Active Routes
              </span>
            ) : null}
          </div>
        </div>

        {/* Routes Grid */}
        {transport.routes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {transport.routes.map((route, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs space-y-3 hover:border-indigo-300 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: branding.primaryColor || '#4338CA' }}
                    >
                      <Bus className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900">{route.name}</h3>
                  </div>
                  {route.vehicleNumber && (
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[10px] font-bold text-slate-700">
                      {route.vehicleNumber}
                    </span>
                  )}
                </div>

                {route.routeCoverage && (
                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Coverage / Stops</div>
                    <p className="line-clamp-2">{route.routeCoverage}</p>
                  </div>
                )}

                {route.stopsCount && (
                  <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                    <MapPin className="w-3 h-3 text-indigo-500" />
                    <span>{route.stopsCount} designated student stops</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            Official transport network operates across surrounding neighborhoods with CCTV and attendant supervision.
          </div>
        )}
      </div>
    </section>
  );
}
