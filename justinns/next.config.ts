import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "simplyilm.com", 
      "via.placeholder.com"
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lcxcjohrfvmzkdtuveeh.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
