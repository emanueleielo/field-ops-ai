import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/login",
    "/signup",
    "/auth/callback",
    "/privacy",
    "/terms",
    "/forgot-password",
  ];

  // Check if current path is a public route
  const _isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith("/auth/")
  );

  // Landing page is public
  const isLandingPage = pathname === "/";

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
  if (!user && isDashboardRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // If user is authenticated and trying to access auth pages
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/documents";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users from landing to dashboard
  if (user && isLandingPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/documents";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
