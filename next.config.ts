import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración para GitHub Pages
  output: 'export',
  // Desactiva la optimización de imágenes (requerido para GitHub Pages)
  images: {
    unoptimized: true,
  },
  // Si tu repositorio no está en la raíz del dominio, descomenta y ajusta el basePath
  // basePath: '/ZEUS_SAFETY',
  // assetPrefix: '/ZEUS_SAFETY',
};

export default nextConfig;
