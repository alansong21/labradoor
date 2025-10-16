const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://server:4000/api/:path*", // use container name
      },
    ];
  },
};

export default nextConfig;
