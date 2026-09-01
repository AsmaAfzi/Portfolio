import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isValidSessionToken, SESSION_COOKIE } from "@/lib/auth";

const protectedApiPrefixes = ["/api/projects", "/api/theme", "/api/upload"];

function isProtectedApi(pathname: string, method: string) {
  if (method === "GET" && pathname === "/api/projects") return false;
  if (method === "GET" && pathname === "/api/theme") return false;
  return protectedApiPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin/login";
  const authed = isValidSessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/admin") && !isLogin && !authed) {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  if (isLogin && authed) {
    return NextResponse.redirect(new URL("/admin/projects", request.url));
  }

  if (isProtectedApi(pathname, request.method) && !authed) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/projects",
    "/api/projects/:path*",
    "/api/theme",
    "/api/upload",
  ],
};
