import { NextResponse } from 'next/server';

/**
 * DEPRECATED: The location detection and geocoding pipeline has been retired.
 * Google Maps links are stored directly as plain URLs with no server-side resolution or geocoding.
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Location detection pipeline has been retired. Google Maps links are stored as direct text URLs.',
    },
    { status: 410 }
  );
}

