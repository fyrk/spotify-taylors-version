import { useState } from "preact/hooks"
import { Button, ExternalLink, Scaffold } from "./components"
import noScooterCircle from "/img/no_scooter_circle.svg?url"
import spotifyIconWhite from "/img/spotify_icon_white.svg?url"

export default function Home({
  authError,
  onLogin,
}: {
  authError: string
  onLogin: () => Promise<void>
}) {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <Scaffold>
      <div class="mx-10 text-center">
        <div class="mb-8 mt-8 sm:mt-24">
          <img
            class="mx-auto h-32 w-32 rounded-full sm:h-40 sm:w-40"
            src={noScooterCircle}
          />
        </div>
        <h1 class="mb-8 text-[max(min(10vw,7rem),5rem)] font-bold leading-none">
          Taylor’s Version
        </h1>
        <div class="mx-auto mb-16 max-w-md text-[max(min(2.5vw,1.8rem),1.5rem)] sm:max-w-none">
          Find and replace Taylor&nbsp;Swift’s stolen songs in your Spotify
          playlists
        </div>
        <div class="mb-3">
          <Button
            class="bg-spotify-green disabled:brightness-50"
            disabled={isLoading}
            onClick={async () => {
              if (isLoading) return
              setIsLoading(true)
              try {
                await onLogin()
              } finally {
                setIsLoading(false)
              }
            }}
          >
            <span class="flex items-center gap-4">
              <img src={spotifyIconWhite} class="h-[1.5em] w-[1.5em]" />
              Log in with Spotify
            </span>
          </Button>
          {authError != null && (
            <div class="mt-2 text-lg text-red-300">
              Authentication failed. Please try again.
              {authError !== "" && (
                <>
                  <br />
                  <div class="text-xs">{authError}</div>
                </>
              )}
            </div>
          )}
        </div>
        <div class="mx-auto mb-6 max-w-xs">
          <small>
            Your account data is processed locally and never leaves your device.{" "}
            <ExternalLink href="https://github.com/FlorianRaediker/spotify-taylors-version">
              View the source code here
            </ExternalLink>
          </small>
        </div>
        <div class="mx-auto max-w-md text-2xl text-red-400">
          This site is not yet generally available and will not work for you,
          due to Spotify being very slow with reviewing this App.
        </div>
      </div>
    </Scaffold>
  )
}
