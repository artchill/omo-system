import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Locale is resolved per request (cookie / user preference), not from the URL.
// See src/i18n/request.ts.
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // This is a login-gated, fully dynamic app (everything depends on who is
  // signed in), so there is no static shell to optimise. cacheComponents and
  // partialPrefetching from the starter template are deliberately left off to
  // keep behaviour simple and the Cloudflare adapters' job easier.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
