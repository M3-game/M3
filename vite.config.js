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
        campaign:   resolve(__dirname, 'campaign.html'),
        rewardmode: resolve(__dirname, 'rewardmode.html'),
        sim:        resolve(__dirname, 'tablet-sim.html'),
        verses:     resolve(__dirname, 'verses.html'),
        phone:      resolve(__dirname, 'phone.html'),
        phoneVerses: resolve(__dirname, 'phone-verses.html'),
        phoneVersesSandbox: resolve(__dirname, 'phone-verses-sandbox.html'),
      },
    },
  },
  test: {
    environment: 'node',
  },
})
