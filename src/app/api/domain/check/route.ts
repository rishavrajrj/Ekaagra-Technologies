import { NextResponse } from 'next/server';
import { domainProvider } from '@/lib/domain/provider';
import type { DomainCheckRequest } from '@/lib/domain/types';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as DomainCheckRequest;
    if (!body || typeof body.domain !== 'string') {
      return NextResponse.json(
        { error: 'Invalid domain query parameter provided.' },
        { status: 400 }
      );
    }

    const response = await domainProvider.checkDomain(body);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Domain check error:', error);
    return NextResponse.json(
      { error: 'Unable to check domain allowance at this time.' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get('domain') || '';
  const planId = searchParams.get('planId') || undefined;
  const category = searchParams.get('category') || undefined;

  const response = await domainProvider.checkDomain({
    domain,
    selectedPlanId: planId,
    businessCategory: category,
  });

  return NextResponse.json(response);
}
