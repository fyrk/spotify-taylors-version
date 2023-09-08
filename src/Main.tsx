import { IRedirectionStrategy, SpotifyApi } from "@spotify/web-api-ts-sdk"
import { useEffect, useState } from "preact/hooks"
import Home from "./Home"
import { createApiClient } from "./api"
import App from "./app/App"

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
        const sdk = createApiClient(new NoRedirectionStrategy())
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
      <App
        onLogout={() => {
          spotify.logOut()
          setSpotify(null)
        }}
        spotify={spotify}
      />
    )
  }

  return (
    <Home
      authError={authError}
      onLogin={async () => {
        try {
          const sdk = createApiClient()
          const { authenticated } = await sdk.authenticate()
          if (authenticated) {
            // this should never be reached since authenticate redirects
            setSpotify(sdk)
          }
        } catch (e: Error | unknown) {
          console.error(e)
          setAuthError(e.toString() || "")
        }
      }}
    />
  )
}
