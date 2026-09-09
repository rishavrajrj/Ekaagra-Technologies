import { NextRequest, NextResponse } from 'next/server';
import { getSchoolsServerClient } from '@/lib/schoolsDb';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { route_id, latitude, longitude, accuracy, heading, speed, status, recorded_at } = body;

    if (!route_id || typeof route_id !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid route_id' }, { status: 400 });
    }

    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      Number.isNaN(latitude) ||
      Number.isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json({ error: 'Invalid latitude or longitude coordinates' }, { status: 400 });
    }

    const schoolsDb = getSchoolsServerClient();
    if (!schoolsDb) {
      return NextResponse.json(
        { error: 'Database client not available' },
        { status: 503 }
      );
    }

    const record = {
      route_id: route_id.trim(),
      latitude: Number(latitude.toFixed(7)),
      longitude: Number(longitude.toFixed(7)),
      accuracy: accuracy != null && !Number.isNaN(Number(accuracy)) ? Number(Number(accuracy).toFixed(2)) : null,
      heading: heading != null && !Number.isNaN(Number(heading)) ? Number(Number(heading).toFixed(2)) : null,
      speed: speed != null && !Number.isNaN(Number(speed)) ? Number(Number(speed).toFixed(2)) : null,
      status: status === 'completed' || status === 'idle' ? status : 'active',
      recorded_at: recorded_at && !Number.isNaN(new Date(recorded_at).getTime()) ? new Date(recorded_at).toISOString() : new Date().toISOString(),
    };

    const { data, error } = await schoolsDb
      .from('school_transport_live_locations')
      .insert([record])
      .select('id, route_id, latitude, longitude, accuracy, heading, speed, status, recorded_at')
      .single();

    if (error) {
      console.error('[LiveLocationAPI] Insert error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    console.error('[LiveLocationAPI] Unexpected error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const routeId = searchParams.get('route_id');

    if (!routeId) {
      return NextResponse.json({ error: 'route_id parameter is required' }, { status: 400 });
    }

    const schoolsDb = getSchoolsServerClient();
    if (!schoolsDb) {
      return NextResponse.json(
        { error: 'Database client not available' },
        { status: 503 }
      );
    }

    const { data, error } = await schoolsDb
      .from('school_transport_live_locations')
      .select('id, route_id, latitude, longitude, accuracy, heading, speed, status, recorded_at')
      .eq('route_id', routeId.trim())
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
