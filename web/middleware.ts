import { NextResponse, type NextRequest } from "next/server";

// Cookie name for auth token
const ACCESS_TOKEN_COOKIE = "fieldops_access_token";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Get token from cookie
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const isAuthenticated = !!token;

  // Admin routes - handled separately via client-side auth
  const isAdminRoute = pathname.startsWith("/admin");
  if (isAdminRoute) {
    return NextResponse.next();
  }

  // Public routes that don't require authentication
  const publicRoutes = [
    "/login",
    "/signup",
    "/auth/callback",
    "/privacy",
    "/terms",
    "/forgot-password",
  ];

  const isPublicRoute =
    publicRoutes.some(
      (route) => pathname === route || pathname.startsWith("/auth/")
    ) || pathname === "/"; // Landing page is public

  // Dashboard routes that require authentication
  const isDashboardRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/documents") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/simulator") ||
    pathname.startsWith("/billing") ||
    pathname.startsWith("/activity") ||
    pathname.startsWith("/settings");

  // If user is not authenticated and trying to access protected route
  if (!isAuthenticated && isDashboardRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // If user is authenticated and trying to access auth pages
  if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/documents";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users from landing to dashboard
  if (isAuthenticated && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/documents";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
