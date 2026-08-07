import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // This MUST match your GitHub repo name exactly, wrapped in slashes.
  // If you name the repo something other than "project-tiger", change this to match.
  base: '/project-tiger/',
})
