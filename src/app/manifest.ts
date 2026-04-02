import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PetGo',
    short_name: 'PetGo',
    description: 'ペット同伴OK施設の検索・予約・レビュープラットフォーム',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1B5E20',
    icons: [
      {
        src: '/icon-192x192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/icon-512x512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
    ],
  }
}
