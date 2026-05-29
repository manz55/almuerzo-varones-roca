/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Esto le dice a Next.js que genere archivos estáticos compatibles con Netlify
  images: {
    unoptimized: true, // Importante para que no falle al subir fotos
  },
}

module.exports = nextConfig