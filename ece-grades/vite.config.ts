import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    lib: {
      entry: './src/grade.ts',
      name: 'Grade',
      fileName: 'grade',
    },
    rollupOptions: {
      // Make sure to set the format as 'es'
      output: {
        format: "es",
      },
    },
  }
})
