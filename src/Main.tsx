import * as Sentry from "@sentry/react"
import { IRedirectionStrategy, SpotifyApi } from "@spotify/web-api-ts-sdk"
import { useEffect, useState } from "preact/hooks"
import Home from "./Home"
import { createSpotifyApi } from "./api"
import App from "./app/App"
import { Fallback } from "./components"
import { trackPlausibleEvent } from "./helpers/plausible"

export default function Main() {
  const [spotify, setSpotify] = useState<SpotifyApi>(null)
  const [authError, setAuthError] = useState<string>(null)

  useEffect(() => {
    // check if user is already authenticated
    ;(async () => {
      try {
        // do not redirect here, since this means user is not authenticated, do nothing instead
        class NoRedirectionStrategy implements IRedirectionStrategy {
          public async redirect(_targetUrl: string | URL): Promise<void> {
            return
          }
          public async onReturnFromRedirect(): Promise<void> {}
        }
        const sdk = createSpotifyApi(new NoRedirectionStrategy())
        const { authenticated } = await sdk.authenticate()
        if (authenticated && !spotify) {
          setSpotify(sdk)
          trackPlausibleEvent("Authenticated")
        }
      } catch (e) {
        console.info("User is not authenticated", e)
      }
    })()
  }, [])

  useEffect(() => {
    // check for auth error in URL params
    const url = new URL(window.location.href)
    const error = url.searchParams.get("error")
    if (error) {
      url.searchParams.delete("error")
      const newUrl = url.search ? url.href : url.href.replace("?", "")
      window.history.replaceState({}, document.title, newUrl)

      switch (error) {
        // docs seem incomplete on error values, only access_denied is mentioned
        case "access_denied":
          break
        default:
          setAuthError(error)
          // maybe eventually capture more possible error values with this
          Sentry.captureMessage("Authentication error", { extra: { error } })
      }

      trackPlausibleEvent("Authentication error", { props: { error } })
    }
  }, [])

  if (spotify) {
    return (
      <Sentry.ErrorBoundary fallback={<Fallback />}>
        <App
          onLogout={state => {
            spotify.logOut()
            setSpotify(null)
            if (state !== "finished") {
              trackPlausibleEvent("Logout", { props: { state } })
            }
          }}
          spotify={spotify}
        />
      </Sentry.ErrorBoundary>
    )
  }

  return (
    <Sentry.ErrorBoundary fallback={<Fallback />}>
      <Home
        authError={authError}
        onLogin={async () => {
          trackPlausibleEvent("Login click")
          try {
            setAuthError(null)
            const sdk = createSpotifyApi()
            const { authenticated } = await sdk.authenticate()
            if (authenticated) {
              // this should never be reached since authenticate redirects
              setSpotify(sdk)
            }
          } catch (e) {
            setAuthError(e.toString() || "")
            // @ts-ignore
            const error = new Error("Authenticating failed", { cause: e })
            Sentry.captureException(error)
            trackPlausibleEvent("Authentication failed")
          }
        }}
      />
    </Sentry.ErrorBoundary>
  )
}
