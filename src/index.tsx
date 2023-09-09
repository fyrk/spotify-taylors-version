import * as Sentry from "@sentry/react"
import { render } from "preact"
import Main from "./Main"
import "./index.css"

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.DEV ? "development" : "production",
    integrations: [new Sentry.BrowserTracing()],
    tracesSampleRate: 1.0,
  })
}

render(<Main />, document.getElementById("app"))
