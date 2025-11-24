import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración para GitHub Pages
  output: 'export',
  // Desactiva la optimización de imágenes (requerido para GitHub Pages)
  images: {
    unoptimized: true,
  },
  // BasePath para GitHub Pages (ajusta si tu repositorio tiene otro nombre)
  basePath: '/ZEUS_SAFETY',
  assetPrefix: '/ZEUS_SAFETY',
};

export default nextConfig;
