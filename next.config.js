/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['wappalyzer', 'cheerio'],
  },
}

module.exports = nextConfig
