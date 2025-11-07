import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 匹配根路径下的简短路径 (例如: /251, /abc123, /jiage)
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
    ];

    if (!excludedPaths.includes(slug)) {
      // 重定向到 /q/[slug]
      const url = request.nextUrl.clone();
      url.pathname = `/q/${slug}`;

      // 使用307临时重定向,保持原始请求方法
      return NextResponse.redirect(url, 307);
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
     * - api 路由
     * - 文件扩展名 (.*\\..*)
     */
    '/((?!_next/static|_next/image|_next/data|favicon.ico|api/).*)',
  ],
};
