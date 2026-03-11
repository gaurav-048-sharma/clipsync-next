import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/edit-profile', '/upload-reel', '/upload-story'],
      },
    ],
    sitemap: 'https://clipsync-next.vercel.app/sitemap.xml',
  };
}
