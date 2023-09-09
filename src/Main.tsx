import * as Sentry from "@sentry/react"
import { IRedirectionStrategy, SpotifyApi } from "@spotify/web-api-ts-sdk"
import { useEffect, useState } from "preact/hooks"
import Home from "./Home"
import { createSpotifyApi } from "./api"
import App from "./app/App"
import { Fallback } from "./components"

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
        }
      } catch (e) {
        console.info("User is not authenticated", e)
      }
    })()
  }, [])

  if (spotify) {
    return (
      <Sentry.ErrorBoundary fallback={<Fallback />}>
        <App
          onLogout={() => {
            spotify.logOut()
            setSpotify(null)
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
          }
        }}
      />
    </Sentry.ErrorBoundary>
  )
}
