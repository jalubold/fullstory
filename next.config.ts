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
      // The sales page moved to an address per design (and per blank-book orientation).
      { source: "/create/new", has: [{ type: "query", key: "template", value: "(?<template>[a-z0-9-]+)" }], destination: "/templates/:template/start", permanent: false },
      { source: "/create/new", has: [{ type: "query", key: "orientation", value: "(?<orientation>square|landscape|portrait)" }], destination: "/create/blank/:orientation", permanent: false },
      { source: "/create/new", destination: "/create", permanent: false },
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
