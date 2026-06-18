/** @type {import('next').NextConfig} */
const cloudName =
  globalThis.process?.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "ddxstobvd";

const nextConfig = {
  transpilePackages: ["@repo/tokens", "@repo/ui"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: `/${cloudName}/**`,
      },
    ],
  },
};

export default nextConfig;
