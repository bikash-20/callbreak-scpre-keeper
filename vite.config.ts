import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * PWA notes:
 * - `registerType: 'autoUpdate'` swaps in a new service worker on deploy so
 *   returning users are never stuck on a stale build.
 * - Workbox precaches the exact hashed build output, which means the app is
 *   fully functional offline even on a user's very first visit.
 * - `navigateFallback` makes any in-app navigation fall back to index.html.
 */
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'robots.txt'],
      manifest: {
        name: 'Callbreak Scorekeeper',
        short_name: 'Callbreak',
        description:
          'Offline-first scorekeeper for four-player Callbreak. Track bids, tricks, cumulative scores and winners.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#171821',
        background_color: '#171821',
        categories: ['games', 'utilities', 'productivity'],
        icons: [
          {
            src: '/pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
});
