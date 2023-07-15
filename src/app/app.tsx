import { SpotifyApi } from "@spotify/web-api-ts-sdk"
import { route } from "preact-router"
import { useEffect, useState } from "preact/hooks"
import {
  IRedirectionStrategy,
  User,
} from "../../node_modules/@spotify/web-api-ts-sdk/src/types"
import { createApiClient } from "../api"

export default function App(_props: any) {
  const [spotify, setSpotify] = useState<SpotifyApi>(null)

  useEffect(() => {
    ;(async () => {
      // do not redirect here, since this means user is not authenticated
      // route to Home instead
      class HomeRedirectionStrategy implements IRedirectionStrategy {
        public async redirect(_targetUrl: string | URL): Promise<void> {
          route("/")
        }
        public async onReturnFromRedirect(): Promise<void> {}
      }
      const client = createApiClient(new HomeRedirectionStrategy())
      await client.authenticate()
      setSpotify(client)
    })()
  }, [])

  return (
    <>
      <header class="flex w-full items-center justify-between bg-[#303030] px-8 py-7">
        <span class="text-4xl font-bold">Taylor’s Version</span>
        <LogOutButton
          spotify={spotify}
          onLogOut={() => {
            localStorage.removeItem(
              "spotify-sdk:AuthorizationCodeWithPKCEStrategy:token",
            )
            route("/")
          }}
        />
      </header>
      <main></main>
    </>
  )
}

function LogOutButton({
  spotify,
  onLogOut,
}: {
  spotify: SpotifyApi
  onLogOut: () => void
}) {
  const [user, setUser] = useState<User>(null)

  useEffect(() => {
    ;(async () => {
      if (spotify != null) setUser(await spotify.currentUser.profile())
    })()
  }, [spotify])

  const profileImage =
    user && user.images.reduce((p, c) => (p.width < c.width ? c : p))
  return (
    <>
      <button
        class="rounded-full bg-[#555555] p-2 text-xl font-semibold"
        onClick={onLogOut}
      >
        <span class="flex items-center gap-2">
          <img
            src={profileImage && profileImage.url}
            class="h-[1.5em] w-[1.5em] rounded-full"
          />
          <span class="mr-1 whitespace-nowrap">Log out</span>
        </span>
      </button>
    </>
  )
}
