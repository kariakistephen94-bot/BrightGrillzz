import type { NextConfig } from "next";

// Exact Supabase Storage host (from env), most reliable for next/image.
const supabaseHostname = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : undefined;
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  // Pin the workspace root to this folder. The parent directory is an old
  // prototype that also has a package-lock.json, so Turbopack would otherwise
  // infer it as the root and misclassify this App Router app as Pages Router
  // (which breaks the `next/headers` import in lib/supabase/server.ts).
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    // Allow menu photos served from Supabase Storage.
    remotePatterns: [
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
