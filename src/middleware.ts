import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 匹配根路径下的简短路径 (例如: /251, /abc123)
  // 排除已知的路由前缀，如 /api, /q, /p, /_next, 等
  const shortLinkPattern = /^\/([a-zA-Z0-9_-]+)$/;
  const match = pathname.match(shortLinkPattern);

  if (match) {
    const slug = match[1];

    // 排除已知的应用路由
    const excludedPaths = [
      'api',
      'links',
      'websites',
      'teams',
      'pixels',
      'settings',
      'profile',
      'admin',
      'login',
      'realtime',
      'share',
      'reports',
      'console',
      'q',
      'p',
    ];

    if (!excludedPaths.includes(slug)) {
      // 重写URL到 /q/[slug] 而不是重定向，这样可以保持原URL
      const url = request.nextUrl.clone();
      url.pathname = `/q/${slug}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了:
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (favicon 文件)
     * - public 文件夹中的文件
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
