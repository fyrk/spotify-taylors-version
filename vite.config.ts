import { faviconsPlugin } from "@darkobits/vite-plugin-favicons"
import preact from "@preact/preset-vite"
import replace from "@rollup/plugin-replace"
import { sentryVitePlugin } from "@sentry/vite-plugin"
import { defineConfig, loadEnv } from "vite"

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  return {
    plugins: [
      preact(),
      faviconsPlugin({
        icons: {
          favicons: {
            source: "./public/img/no_scooter_circle.svg",
          },
        },
      }),
      sentryVitePlugin({
        telemetry: false,
        org: env.SENTRY_ORG,
        project: env.SENTRY_PROJECT,
        url: env.SENTRY_URL,
        authToken: env.SENTRY_AUTH_TOKEN,
        release: {
          uploadLegacySourcemaps: ["dist"],
        },
      }),
    ],

    server: {
      port: 3000,
      strictPort: true,
      host: true,
    },
    build: {
      sourcemap: true,
      rollupOptions: {
        plugins: [
          replace({
            preventAssignment: true,
            // https://docs.sentry.io/platforms/javascript/guides/react/configuration/tree-shaking/
            __SENTRY_DEBUG__: false,
          }),
        ],
      },
    },
  }
})
