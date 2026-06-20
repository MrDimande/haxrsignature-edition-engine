import type { NextConfig } from "next";
import path from "path";
import { InvitationAliasPlugin } from "./lib/webpack/invitation-alias-plugin";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  transpilePackages: [
    "motion",
    "motion-dom",
    "motion-utils",
    "framer-motion",
  ],
  webpack: (config) => {
    config.resolve.plugins = config.resolve.plugins ?? [];
    config.resolve.plugins.push(new InvitationAliasPlugin());

    config.resolve.alias = {
      ...config.resolve.alias,
      "@data": path.resolve(__dirname, "data"),
      "@lib": path.resolve(__dirname, "lib"),
      "@engines": path.resolve(__dirname, "engines"),
      "@legacy/jessicakhulaya/page": path.resolve(
        __dirname,
        "jessicakhulaya/src/app/page.tsx"
      ),
      "@legacy/jessicakhulaya/globals.css": path.resolve(
        __dirname,
        "jessicakhulaya/src/app/globals.css"
      ),
      "@legacy/jessicakhulaya/context": path.resolve(
        __dirname,
        "jessicakhulaya/src/lib/context.tsx"
      ),
      "@legacy/lobolo/page": path.resolve(
        __dirname,
        "lobolojessicaesamuel/src/app/page.tsx"
      ),
      "@legacy/lobolo/globals.css": path.resolve(
        __dirname,
        "lobolojessicaesamuel/src/app/globals.css"
      ),
      "@legacy/lobolo/lenis": path.resolve(
        __dirname,
        "lobolojessicaesamuel/src/components/LenisProvider.tsx"
      ),
      "@legacy/traditional/page": path.resolve(
        __dirname,
        "jessicaesamueltraditionalwedding/src/app/page.tsx"
      ),
      "@legacy/traditional/globals.css": path.resolve(
        __dirname,
        "jessicaesamueltraditionalwedding/src/app/globals.css"
      ),
    };

    return config;
  },
};

export default nextConfig;
