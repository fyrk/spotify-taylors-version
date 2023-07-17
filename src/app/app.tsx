import { SpotifyApi } from "@spotify/web-api-ts-sdk"
import { route } from "preact-router"
import { useEffect, useState } from "preact/hooks"
import {
  IRedirectionStrategy,
  User,
} from "../../node_modules/@spotify/web-api-ts-sdk/src/types"
import {
  createApiClient,
  getAllUsersPlaylists,
  getPlaylistWithTracks,
} from "../api"
import Scaffold from "../scaffold"
import { PlaylistsView } from "./components"
import { PlaylistReplacements, getTrackReplacements } from "./util"

export default function App(_props: any) {
  const [user, setUser] = useState<User>(null)
  const [replaces, setReplaces] = useState<{
    spotify: SpotifyApi
    playlists: PlaylistReplacements[]
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

        const simplifiedPlaylists = (
          await getAllUsersPlaylists(spotify)
        ).filter(p => p.owner.uri === user.uri)

        const playlists = (
          await Promise.allSettled(
            simplifiedPlaylists.map(p => getPlaylistWithTracks(spotify, p)),
          )
        )
          .map(result => {
            if (result.status === "fulfilled") return result.value
            throw Error(result.reason)
          })
          .map(p => getTrackReplacements(p))
          .filter(p => p.replacements.length > 0)

        setReplaces({ playlists, spotify })
      }
    })()
  }, [])

  return (
    <Scaffold>
      <header class="mb-8 w-full items-center justify-between bg-[#303030] px-4 py-3 sm:px-7 sm:py-4">
        <div class="my-2 inline-block text-2xl font-bold sm:text-4xl">
          Taylor’s Version
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
        <div class="text-center">Scanning your playlists...</div>
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
