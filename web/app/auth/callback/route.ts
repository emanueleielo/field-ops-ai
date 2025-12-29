import { NextResponse } from "next/server";

/**
 * OAuth callback route.
 *
 * Note: OAuth is not supported in the backend-proxy architecture.
 * This route exists only to handle any lingering OAuth redirects
 * and redirect users to the login page with an error.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  // OAuth is not supported - redirect to login with error
  return NextResponse.redirect(
    `${origin}/login?error=OAuth is not supported. Please use email and password.`
  );
}
