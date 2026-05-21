// middleware.js
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((request) => {
  const { nextUrl } = request;
  const isLoggedIn = !!request.auth;

  const isAuthPage =
    nextUrl.pathname.startsWith("/auth/login") ||
    nextUrl.pathname.startsWith("/auth/register");

  const isProtectedPage =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/files");

  // Giriş yapmış kullanıcı auth sayfasına gitmeye çalışıyorsa dashboard'a yönlendir
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Giriş yapmamış kullanıcı korumalı sayfaya erişmeye çalışıyorsa login'e yönlendir
  if (!isLoggedIn && isProtectedPage) {
    const loginUrl = new URL("/auth/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
