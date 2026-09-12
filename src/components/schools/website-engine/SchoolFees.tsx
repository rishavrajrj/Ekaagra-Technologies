'use client';

import React from 'react';
import { IndianRupee, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import type { SchoolWebsiteData } from '@/lib/schoolWebsiteContract';

interface SchoolFeesProps {
  data: SchoolWebsiteData;
}

export default function SchoolFees({ data }: SchoolFeesProps) {
  const { fees, school, branding } = data;

  if (!fees.hasFeeStructure || fees.items.length === 0) {
    return null;
  }

  return (
    <section id="fees" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Section Header */}
        <div className="max-w-2xl space-y-2">
          <span
            className="text-xs font-bold uppercase tracking-wider block"
            style={{ color: branding.primaryColor || '#4338CA' }}
          >
            Statutory Transparency
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Institutional Fee Structure
          </h2>
          <p className="text-xs text-slate-500">
            Transparent breakdown of tuition, development, and academic amenity fees as approved by the School Management Committee.
          </p>
        </div>

        {/* Fee Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-extrabold">
                <th className="py-3 px-4">Fee Category</th>
                <th className="py-3 px-4">Applicable Grades</th>
                <th className="py-3 px-4">Frequency</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fees.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{item.category}</td>
                  <td className="py-3 px-4 text-slate-600">{item.classes || 'All Grades'}</td>
                  <td className="py-3 px-4 text-slate-500">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium">
                      {item.frequency}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-extrabold text-slate-900 text-right">
                    ₹{item.amountINR.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {fees.notes && (
          <p className="text-[11px] text-slate-500 leading-relaxed italic">
            Note: {fees.notes}
          </p>
        )}
      </div>
    </section>
  );
}
