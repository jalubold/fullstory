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
  // Retired pages. fullstory.pro is now Are We Compatible?: the photo album's
  // marketing and sales pages point to it. Existing customers' albums, orders,
  // downloads and share links are untouched. Temporary (307) so this can be
  // undone without browsers having cached it.
  async redirects() {
    const toCompat = (source: string, destination = "/") => ({ source, destination, permanent: false });
    return [
      toCompat("/how-it-works", "/compatible/how-it-works"),
      toCompat("/about"),
      toCompat("/faq"),
      toCompat("/explore"),
      toCompat("/pricing"),
      toCompat("/templates"),
      toCompat("/templates/:path*"),
      toCompat("/create"),
      toCompat("/create/:path*"),
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
