import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Loaded natively by Node (WASM / native bindings must not be bundled).
  serverExternalPackages: ["@electric-sql/pglite", "pg", "sharp", "pdf-lib", "fontkit", "heic-decode", "libheif-js"],
  // Fonts are read from disk by the PDF renderer.
  outputFileTracingIncludes: {
    "/api/**/*": ["./src/assets/fonts/**/*"],
  },
  images: { unoptimized: true },
  // Retired pages. Query strings (e.g. ?category=wedding) are passed through.
  async redirects() {
    return [
      { source: "/create/template", destination: "/templates", permanent: false },
      { source: "/pricing", destination: "/", permanent: true },
    ];
  },
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
