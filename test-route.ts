import { NextRequest, NextResponse } from 'next/server';

// Standard Next.js API Route format
export async function GET(
  request: NextRequest,
  context?: { params?: Record<string, string> }
): Promise<NextResponse> {
  return NextResponse.json({ message: 'test' });
}