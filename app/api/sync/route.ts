import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { runAmazonSync } from '@/lib/sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Registry pages are a few hundred KB; cap what we accept from a caller.
const MAX_HTML_BYTES = 4 * 1024 * 1024;

// The admin bookmarklet posts the registry page from amazon.com itself.
const ALLOWED_ORIGINS = new Set(['https://www.amazon.com', 'https://amazon.com']);

function corsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin') ?? '';
  if (!ALLOWED_ORIGINS.has(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
}

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
 * sync parses that HTML instead of fetching Amazon itself. Used by the
 * admin bookmarklet and the GitHub Actions workflow.
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
  const headers = corsHeaders(request);
  const secret = process.env.SYNC_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'SYNC_SECRET not configured' }, { status: 500, headers });
  }

  if (!isAuthorized(request, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  const html = await readProvidedHtml(request);
  const result = await runAmazonSync(html ? { html } : {});

  if (result.status === 'ok') {
    revalidatePath('/');
  }

  return NextResponse.json(
    { ...result, source: html ? 'provided-html' : 'fetched' },
    { status: 200, headers },
  );
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}
