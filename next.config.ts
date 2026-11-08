import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Loaded natively by Node (WASM / native bindings must not be bundled).
  serverExternalPackages: ["@electric-sql/pglite", "pg", "sharp", "pdf-lib", "fontkit"],
  // Fonts are read from disk by the PDF renderer.
  outputFileTracingIncludes: {
    "/api/**/*": ["./src/assets/fonts/**/*"],
  },
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
