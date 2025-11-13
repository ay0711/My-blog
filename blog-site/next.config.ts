import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  // When your repository has multiple package-lock files (monorepos or sibling folders),
  // Next can warn about inferred workspace root. Setting `outputFileTracingRoot`
  // tells Next the root used for server output tracing. Adjust this path if your
  // workspace layout differs.
  outputFileTracingRoot: path.resolve(__dirname, '..'),
  
  // Configure security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
