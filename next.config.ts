import type { NextConfig } from "next";

// Backend NLP service base URL.
// - Local dev:   http://127.0.0.1:8080
// - In Docker:   http://nlp-service:8080 (set via NLP_SERVICE_URL env)
const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL ?? "http://127.0.0.1:8080";

const nextConfig: NextConfig = {
  // Emit a self-contained server build for lean Docker images (Dockerfile.web)
  output: "standalone",
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
        destination: `${NLP_SERVICE_URL}/api/v1/paraphrase`,
      },
      {
        source: '/api/paraphrase/:path*',
        destination: `${NLP_SERVICE_URL}/api/v1/paraphrase/:path*`,
      },
    ];
  },
};

export default nextConfig;
