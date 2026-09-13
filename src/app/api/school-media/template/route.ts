import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: 'Ekaagra Direct Digital Asset Specifications',
    version: '2.0.0',
    pipeline: 'Direct Client-Optimized Upload Engine',
    description:
      'All campus media and statutory documents are optimized client-side (converted to modern WebP format with lossless compression) and pushed directly to secure cloud storage and registered in the project database.',
    specifications: {
      supportedImageFormats: ['WebP', 'PNG', 'JPEG', 'SVG'],
      supportedDocumentFormats: ['PDF'],
      maxFileSizeMB: 15,
      autoOptimization: {
        enabled: true,
        targetFormat: 'image/webp',
        maxDimensionPx: 2560,
        qualityRatio: 0.85,
        storageBucket: 'school-assets',
      },
      categories: [
        {
          category: 'Branding & Identity',
          items: ['Official School Logo (Transparent PNG or SVG)', 'School Crest / Trust Emblem'],
        },
        {
          category: 'Leadership Portraits',
          items: ['Principal Portrait', 'Chairman / Management Portraits'],
        },
        {
          category: 'Campus Photography',
          items: ['Exterior Facade', 'Entrance Gate', 'Reception Lobby', 'Classrooms', 'Corridors'],
        },
        {
          category: 'Academic & Campus Facilities',
          items: ['Science Labs', 'Computer Labs', 'Library', 'Playground / Sports Grounds', 'Auditorium', 'Transport Fleet'],
        },
        {
          category: 'Compliance & Statutory Disclosures',
          items: ['Society Registration', 'Affiliation Certificate', 'Fire Safety Certificate', 'NOC', 'Fee Structure'],
        },
      ],
    },
    directUploadSupported: true,
  });
}
