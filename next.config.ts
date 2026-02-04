
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable Turbopack to prevent memory issues
  experimental: {
    // Reduce memory usage during development
    workerThreads: false,
    cpus: 1,
  },
  eslint: {
    // Disable ESLint during builds for now
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during builds for now
    ignoreBuildErrors: true,
  },
  // Optimize webpack bundle
  webpack: (config: any, { isServer, dev }: { isServer: boolean; dev: boolean }) => {
    // Client-side optimizations
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };

      // Reduce bundle size in development
      if (dev) {
        config.optimization = {
          ...config.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
              },
              mapbox: {
                test: /[\\/]node_modules[\\/]mapbox-gl[\\/]/,
                name: 'mapbox',
                chunks: 'all',
                priority: 10,
              },
            },
          },
        };
      }
    }

    return config;
  },

  // Image optimization
  images: {
    domains: ['localhost'],
    unoptimized: false,
  },

  // Production optimizations
  poweredByHeader: false,
  compress: true,

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Reduce memory usage
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
};

module.exports = nextConfig;


