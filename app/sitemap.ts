import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // As this is a single page application essentially from the public view,
  // we just have the root URL. If there were public product pages, 
  // we would fetch them and add them here.
  return [
    {
      url: 'https://www.confeccionesangus.cl',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]
}