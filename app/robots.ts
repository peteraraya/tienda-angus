import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'], // Protect admin routes and APIs from indexing
    },
    sitemap: 'https://www.confeccionesangus.cl/sitemap.xml',
  }
}