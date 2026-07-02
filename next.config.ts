import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Strip console.* at BUILD TIME via SWC (keeps console.error/warn).
  // This removes the entire call expression safely, so it never leaves the
  // orphaned-argument / dangling-paren breakage a source-level codemod caused.
  // Requires no babel config in the repo root (SWC must be active).
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  allowedDevOrigins: ['*'],
  async rewrites() {
    return [
      {
        source: '/api/paraphrase-with-variantV2',
        destination: 'http://127.0.0.1:8080/api/v1/paraphrase',
      },
      {
        source: '/api/paraphrase/:path*',
        destination: 'http://127.0.0.1:8080/api/v1/paraphrase/:path*',
      },
    ];
  },
};

export default nextConfig;
