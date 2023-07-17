import { faviconsPlugin } from "@darkobits/vite-plugin-favicons"
import preact from "@preact/preset-vite"
import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    preact(),
    faviconsPlugin({
      icons: {
        favicons: {
          source: "./public/no_scooter.png",
        },
      },
    }),
  ],
  server: {
    port: 3000,
    strictPort: true,
    host: true,
  },
})
