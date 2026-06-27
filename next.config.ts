import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage signed URLs (hosted projects).
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/**" },
      // Local Supabase stack.
      { protocol: "http", hostname: "127.0.0.1", port: "54321", pathname: "/storage/**" },
    ],
  },
};

export default nextConfig;
