import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pages publiques toujours accessibles
  if (pathname === "/login" || pathname === "/apropos"
    || pathname.startsWith("/api/auth")
    || pathname.startsWith("/extrait")
    || pathname.startsWith("/api/extrait")
    || pathname.startsWith("/videos/")
    || pathname.startsWith("/thumbnails/")) {
    return NextResponse.next();
  }

  // Zone admin : vérifie le cookie admin (JWT)
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    const adminCookie = req.cookies.get("super8_admin");
    if (!adminCookie) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    return NextResponse.next();
  }

  // Zone publique : vérifie le cookie famille
  const familleCookie = req.cookies.get("super8_famille");
  if (!familleCookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
