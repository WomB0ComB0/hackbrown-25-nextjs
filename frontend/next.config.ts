import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        "node:path": false,
        "node:crypto": false,
        "node:fs": false,
      };
    }

    // Add rule to handle .node files
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
      type: 'javascript/auto',
    });

    return config;
  },
  async rewrites() {
    return [
      {
        source: '/models/:path*',
        destination: 'https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/main/:path*'
      }
    ];
  }
};

export default nextConfig;
