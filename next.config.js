/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['supabase.co'],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Fix TypeScript/JavaScript module resolution
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // Custom webpack configuration to fix import issues
  webpack: config => {
    // Fix module resolution for .js/.ts confusion
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    // Ensure proper handling of TypeScript files
    config.resolve.extensions = ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json']

    return config
  },
}

module.exports = nextConfig
