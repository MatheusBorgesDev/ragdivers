import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Tailwind 4 through Turbopack's loader, as the Next 16.4 template does (no PostCSS config).
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
}

export default nextConfig
