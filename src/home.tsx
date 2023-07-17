import { route } from "preact-router"
import { useState } from "preact/hooks"
import { AccessToken } from "../node_modules/@spotify/web-api-ts-sdk/src/types"
import { createApiClient } from "./api"
import Scaffold from "./scaffold"
import spotifyWhite from "/img/spotify_white.svg?url"

export default function Home(_props: any) {
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string>(null)

  return (
    <Scaffold>
      <div></div>
      <div class="mx-10 text-center">
        <h1 class="mb-5 text-[max(min(10vw,7rem),5rem)] font-bold leading-none">
          Taylor’s Version
        </h1>
        <div class="mb-16 text-[max(min(2.5vw,1.8rem),1.5rem)]">
          Detect, replace, and block Taylor Swift’s stolen songs on Spotify
        </div>
        <div class="mb-3">
          <button
            class="whitespace-nowrap rounded-full bg-[#1db954] p-5"
            disabled={isLoading}
            onClick={async () => {
              if (isLoading) return
              setIsLoading(true)
              setAuthError(null)
              let accessToken: AccessToken
              try {
                accessToken = await createApiClient().authenticate()
              } catch (e) {
                console.error(e)
                setAuthError(e.toString() || "")
                setIsLoading(false)
                return
              }
              if (accessToken.access_token !== "") {
                // if authenticate did not redirect, user is already authenticated
                route("/app")
              }
              setIsLoading(false)
            }}
          >
            <span class="flex items-center gap-4 text-2xl">
              <img src={spotifyWhite} class="h-[1.5em] w-[1.5em]" />
              Log in with Spotify
            </span>
          </button>
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
        <div class="mx-auto max-w-xs text-sm text-neutral-400">
          Your account data is processed locally and never leaves your device.{" "}
          <a
            class="text-green-200 hover:underline"
            href="https://github.com/FlorianRaediker/spotify-taylors-version"
            rel="noopener"
          >
            View the source code here
          </a>
        </div>
      </div>
    </Scaffold>
  )
}
