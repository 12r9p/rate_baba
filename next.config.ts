import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Docker用
  productionBrowserSourceMaps: true,
  webpack: (config, { dev, isServer }) => {
    if (!dev) {
      config.optimization.minimize = false;
    }
    
    // Treat bun:sqlite as external (it's built-in to Bun)
    if (isServer) {
        config.externals.push({
            'bun:sqlite': 'commonjs bun:sqlite',
        });
    }

    return config;
  },
};

export default nextConfig;
