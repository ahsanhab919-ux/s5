import Analytics from "@/analysers/Analytics";
import FeatureEndpointsApplier from "@/components/appliers/FeatureEndpointsApplier";
import FeaturePopupApplier from "@/components/appliers/FeaturePopupApplier";
import SettingApplier from "@/components/appliers/SettingApplier";
import ToastApplier from "@/components/appliers/ToastApplier";
import WalletApplier from "@/components/appliers/WalletApplier";
import WalletSocketApplier from "@/components/appliers/WalletSocketApplier";
import { LoginModal, RegisterModal } from "@/components/auth/AuthModal";
import { Login } from "@/components/auth/components/Login";
import { Register } from "@/components/auth/components/Register";
import UploadProgressIndicator from "@/components/tools/common/UploadProgressIndicator";
import Providers from "@/providers";
import LandingPageRedirectProvider from "@/providers/RedirectProvider";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import { ThemeScript } from "@/components/common/ThemeScript";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shothik AI",
  description: "Shothik AI is a platform for AI-powered tools and services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Pre-hydration theme script to avoid light→dark flash on reload */}
        {/* Pre-hydration theme script to avoid light→dark flash on reload */}
        <ThemeScript />

        {process.env.NODE_ENV === "production" && (
          <script
            src="https://rybbit.shothik.live/api/script.js"
            data-site-id="7e1390f29be4"
            defer
          ></script>
        )}
      </head>
      <body
        className={`${manrope.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=GTM-PPRFW7NP`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        <LandingPageRedirectProvider>
          <Providers>
            {/* Appliers */}
            <SettingApplier />
            <ToastApplier />
            <WalletApplier />
            <WalletSocketApplier />
            <FeatureEndpointsApplier />
            <FeaturePopupApplier />
            <UploadProgressIndicator />

            {/* login modal  */}
            <LoginModal>
              <Login />
            </LoginModal>
            <RegisterModal>
              <Register />
            </RegisterModal>

            <div>{children}</div>
          </Providers>
          <Analytics />
        </LandingPageRedirectProvider>
      </body>
    </html>
  );
}
