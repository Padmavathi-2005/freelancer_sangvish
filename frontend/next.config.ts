import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/dashboard/gig-applications',
        destination: '/dashboard/applications',
        permanent: true,
      },
      {
        source: '/dashboard/client-orders',
        destination: '/dashboard/orders',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
