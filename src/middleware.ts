import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const token = req.cookies.get("jwt_token");

    // Redirect to /auth/login if the user is not authenticated and trying to access protected routes
    if (pathname.startsWith("/dashboard") && !token) {
        return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    // Redirect to /dashboard if the user is authenticated and trying to access authentication routes
    if (pathname.startsWith("/auth") && token) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Allow public routes
    const publicRoutes = [
        "/",
        "/auth/login",
        "/auth/register",
        "/auth/forgot-password",
        "/auth/reset-password",
        "/auth/verify-email",
    ];
    if (publicRoutes.includes(pathname)) {
        return NextResponse.next();
    }

    // Default: block access
    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/auth/:path*"],
};
