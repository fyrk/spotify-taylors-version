import { SpotifyApi } from "@spotify/web-api-ts-sdk"
import { route } from "preact-router"
import { useEffect, useState } from "preact/hooks"
import {
  IRedirectionStrategy,
  User,
} from "../../node_modules/@spotify/web-api-ts-sdk/src/types"
import { createApiClient } from "../api"
import Scaffold from "../scaffold"
import { PlaylistsView } from "./components"
import {
  PlaylistScanProgress,
  ScannedPlaylist,
  scanUserPlaylists,
} from "./util"
import noScooterCircle from "/img/no_scooter_circle.svg?url"

export default function App(_props: any) {
  const [user, setUser] = useState<User>(null)
  const [scanProgress, setScanProgress] = useState<PlaylistScanProgress>({
    progress: 0,
    currentPlaylistName: null,
  })
  const [replaces, setReplaces] = useState<{
    spotify: SpotifyApi
    playlists: ScannedPlaylist[]
  }>(null)

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
      const spotify = createApiClient(new HomeRedirectionStrategy())
      const accessToken = await spotify.authenticate()
      if (accessToken.access_token === "") {
        route("/")
      } else {
        const user = await spotify.currentUser.profile()
        setUser(user)

        const playlists = await scanUserPlaylists(
          spotify,
          user,
          setScanProgress,
        )

        setReplaces({ playlists, spotify })
      }
    })()
  }, [])

  return (
    <Scaffold>
      <header class="mb-8 w-full bg-[#303030] px-4 py-3 sm:px-7 sm:py-4">
        <div class="inline-block text-2xl font-bold sm:text-4xl">
          <div class="inline-block">
            <img
              src={noScooterCircle}
              class="mr-3 inline-block h-[1.2em] w-[1.2em]"
            />
          </div>
          <div class="my-2 inline-block">Taylor’s Version</div>
        </div>
        <div class="float-right my-2 inline-block align-middle">
          <LogOutButton
            user={user}
            onLogOut={() => {
              localStorage.removeItem(
                "spotify-sdk:AuthorizationCodeWithPKCEStrategy:token",
              )
              route("/")
            }}
          />
        </div>
      </header>
      {replaces == null ? (
        <div class="text-center">
          <div class="mb-2 text-lg">Scanning your playlists...</div>
          <div class="h-2 w-44 rounded-full bg-neutral-600">
            <div
              class="h-full rounded-full bg-[#1db954]"
              style={{ width: `${scanProgress.progress * 100}%` }}
            ></div>
          </div>
          <div class="text-neutral-400">
            {scanProgress.currentPlaylistName || <>&nbsp;</>}
          </div>
        </div>
      ) : (
        <div class="w-full grow p-5">
          <PlaylistsView
            playlists={replaces.playlists}
            spotify={replaces.spotify}
          />
        </div>
      )}
    </Scaffold>
  )
}

function LogOutButton({
  user,
  onLogOut,
}: {
  user: User
  onLogOut: () => void
}) {
  const profileImage =
    user && user.images.reduce((p, c) => (p.width < c.width ? c : p))
  return (
    <button
      class="rounded-full bg-[#555555] p-2 text-sm font-semibold sm:text-xl"
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
  )
}
