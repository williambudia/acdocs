/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/acdocs',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
