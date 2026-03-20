import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  base: '/M3/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        index:      resolve(__dirname, 'index.html'),
        tablet:     resolve(__dirname, 'tablet.html'),
        desktop:    resolve(__dirname, 'desktop.html'),
        timeattack: resolve(__dirname, 'timeattack.html'),
        phone341:   resolve(__dirname, 'phone341.html'),
        campaign:   resolve(__dirname, 'campaign.html'),
        // phone-418 is standalone CDN HTML — included so it's copied into dist
        phone418:   resolve(__dirname, 'platforms/phone-418/match3-v11-418px-phone.html'),
      },
    },
  },
  test: {
    environment: 'node',
  },
})
