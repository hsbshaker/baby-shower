import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { runAmazonSync } from '@/lib/sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Registry pages are a few hundred KB; cap what we accept from a caller.
const MAX_HTML_BYTES = 4 * 1024 * 1024;

function isAuthorized(request: NextRequest, secret: string): boolean {
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match && match[1] === secret) return true;
  }
  const querySecret = request.nextUrl.searchParams.get('secret');
  if (querySecret && querySecret === secret) return true;
  return false;
}

/**
 * Optional JSON body `{ "html": "<registry page>" }`. When present, the
 * sync parses that HTML instead of fetching Amazon itself. This is the
 * GitHub Actions path: the runner fetches the page and posts it here.
 */
async function readProvidedHtml(request: NextRequest): Promise<string | undefined> {
  if (request.method !== 'POST') return undefined;
  const type = request.headers.get('content-type') ?? '';
  if (!type.includes('application/json')) return undefined;
  try {
    const body = (await request.json()) as { html?: unknown };
    if (typeof body.html !== 'string' || body.html.length === 0) return undefined;
    if (body.html.length > MAX_HTML_BYTES) return undefined;
    return body.html;
  } catch {
    return undefined;
  }
}

async function handleSync(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.SYNC_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'SYNC_SECRET not configured' }, { status: 500 });
  }

  if (!isAuthorized(request, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const html = await readProvidedHtml(request);
  const result = await runAmazonSync(html ? { html } : {});

  if (result.status === 'ok') {
    revalidatePath('/');
  }

  return NextResponse.json({ ...result, source: html ? 'provided-html' : 'fetched' }, { status: 200 });
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}
