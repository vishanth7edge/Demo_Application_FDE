/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    // Undo vi.stubEnv / vi.stubGlobal / vi.spyOn after every test.
    unstubEnvs: true,
    unstubGlobals: true,
    restoreMocks: true,
  },
})
