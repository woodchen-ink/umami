import { type NextRequest, NextResponse } from 'next/server';
import { matchesConfiguredPath } from '@/lib/match-configured-path';

export const config = {
  matcher: '/:path*',
};

const TRACKER_PATH = '/script.js';
const COLLECT_PATH = '/api/send';
const LOGIN_PATH = '/login';
const BASE_PATH = process.env.BASE_PATH || '';

const apiHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, DELETE, POST, PUT',
  'Access-Control-Max-Age': process.env.CORS_MAX_AGE || '86400',
  'Cache-Control': 'no-cache',
};

const trackerHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=86400, must-revalidate',
};

function customCollectEndpoint(request: NextRequest) {
  const collectEndpoint = process.env.COLLECT_API_ENDPOINT;

  if (collectEndpoint) {
    const url = request.nextUrl.clone();

    if (matchesConfiguredPath(url.pathname, collectEndpoint, BASE_PATH)) {
      url.pathname = COLLECT_PATH;
      return NextResponse.rewrite(url, { headers: apiHeaders });
    }
  }
}

function customScriptName(request: NextRequest) {
  const scriptName = process.env.TRACKER_SCRIPT_NAME;

  if (scriptName) {
    const url = request.nextUrl.clone();
    const names = scriptName.split(',').map(name => name.trim().replace(/^\/+/, ''));

    if (names.find(name => matchesConfiguredPath(url.pathname, name, BASE_PATH))) {
      url.pathname = TRACKER_PATH;
      return NextResponse.rewrite(url, { headers: trackerHeaders });
    }
  }
}

function customScriptUrl(request: NextRequest) {
  const scriptUrl = process.env.TRACKER_SCRIPT_URL;

  if (scriptUrl && matchesConfiguredPath(request.nextUrl.pathname, TRACKER_PATH, BASE_PATH)) {
    return NextResponse.rewrite(scriptUrl, { headers: trackerHeaders });
  }
}

function disableLogin(request: NextRequest) {
  const loginDisabled = process.env.DISABLE_LOGIN;

  if (loginDisabled && matchesConfiguredPath(request.nextUrl.pathname, LOGIN_PATH, BASE_PATH)) {
    return new NextResponse('Access denied', { status: 403 });
  }
}

function shortLinkRedirect(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let normalizedPath = pathname;

  if (BASE_PATH && pathname.startsWith(BASE_PATH)) {
    normalizedPath = pathname.slice(BASE_PATH.length) || '/';
  }

  const shortLinkPattern = /^\/([a-zA-Z0-9_-]+)$/;
  const match = normalizedPath.match(shortLinkPattern);

  if (!match) {
    return;
  }

  const slug = match[1];
  const excludedPaths = new Set([
    'api',
    'links',
    'websites',
    'teams',
    'pixels',
    'settings',
    'profile',
    'admin',
    'login',
    'logout',
    'realtime',
    'share',
    'reports',
    'console',
    'dashboard',
    'boards',
    'sso',
    'q',
    'p',
  ]);

  if (excludedPaths.has(slug)) {
    return;
  }

  const url = request.nextUrl.clone();
  url.pathname = `${BASE_PATH}/q/${slug}`;

  return NextResponse.redirect(url, 307);
}

export default function middleware(req: NextRequest) {
  const fns = [
    customCollectEndpoint,
    customScriptName,
    customScriptUrl,
    disableLogin,
    shortLinkRedirect,
  ];

  for (const fn of fns) {
    const res = fn(req);
    if (res) {
      return res;
    }
  }

  return NextResponse.next();
}
