import { NextResponse } from 'next/server';
import fs from 'fs';

export async function GET() {
  const filePath = 'd:\\Antigravity Projects\\Schools\\SCHOOL_PROJECT_MEDIA\\00_READ_ME_FIRST\\HOW_TO_SEND_YOUR_FILES.pdf';
  if (fs.existsSync(filePath)) {
    const fileBuffer = fs.readFileSync(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=HOW_TO_SEND_YOUR_FILES.pdf',
      },
    });
  }

  return NextResponse.json({ error: 'Media guideline file not found' }, { status: 404 });
}
