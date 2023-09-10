import * as Sentry from "@sentry/react"

export default function setupSentry() {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.DEV ? "development" : "production",

      integrations: [new Sentry.BrowserTracing({ traceFetch: false })],

      beforeBreadcrumb(breadcrumb, hint) {
        if (
          breadcrumb.category === "fetch" &&
          breadcrumb.data &&
          breadcrumb.data.url.includes("spotify.com")
        ) {
          // remove ids from spotify urls
          breadcrumb.data.url = "spotify.com/..."
        }
        return breadcrumb
      },

      tracesSampleRate: 1.0,

      autoSessionTracking: false,
      sendClientReports: false,
    })
  }
}
