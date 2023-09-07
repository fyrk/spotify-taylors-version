import { SpotifyApi } from "@spotify/web-api-ts-sdk"
import { useEffect, useState } from "preact/hooks"
import { User } from "../../node_modules/@spotify/web-api-ts-sdk/src/types"
import Scaffold from "../scaffold"
import { PlaylistsView } from "./components"
import {
  PlaylistScanProgress,
  ScannedPlaylist,
  scanUserPlaylists,
} from "./util"
import noScooterCircle from "/img/no_scooter_circle.svg?url"

export default function App({
  onLogout,
  spotify,
}: {
  onLogout: () => void
  spotify: SpotifyApi
}) {
  const [user, setUser] = useState<User>(null)
  const [scanProgress, setScanProgress] = useState<PlaylistScanProgress>({
    progress: 0,
    currentPlaylistName: null,
  })
  const [playlists, setPlaylists] = useState<ScannedPlaylist[]>(null)

  useEffect(() => {
    ;(async () => {
      const user = await spotify.currentUser.profile()
      setUser(user)
      const playlists = await scanUserPlaylists(spotify, user, setScanProgress)
      setPlaylists(playlists)
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
          <LogOutButton user={user} onLogout={onLogout} />
        </div>
      </header>
      {playlists == null ? (
        <ScanProgress scanProgress={scanProgress} />
      ) : (
        <PlaylistEditor
          playlists={playlists}
          onUpdatePlaylists={p => setPlaylists(p)}
          spotify={spotify}
        />
      )}
    </Scaffold>
  )
}

function LogOutButton({
  user,
  onLogout,
}: {
  user: User
  onLogout: () => void
}) {
  const profileImage =
    user && user.images.reduce((p, c) => (p.width < c.width ? c : p))
  return (
    <button
      class="rounded-full bg-[#555555] p-2 text-sm font-semibold sm:text-xl"
      onClick={onLogout}
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

const ScanProgress = ({
  scanProgress,
}: {
  scanProgress: PlaylistScanProgress
}) => {
  return (
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
  )
}

const PlaylistEditor = ({
  playlists,
  onUpdatePlaylists,
  spotify,
}: {
  playlists: ScannedPlaylist[]
  onUpdatePlaylists: (playlists: ScannedPlaylist[]) => void
  spotify: SpotifyApi
}) => {
  return (
    <div class="w-full grow p-5">
      <PlaylistsView
        playlists={playlists}
        spotify={spotify}
        onSelectPlaylist={(playlistIndex: number, selected: boolean) => {
          onUpdatePlaylists(
            playlists.map((p, i) => ({
              ...p,
              replacements: p.replacements.map(r => ({
                ...r,
                selected: i === playlistIndex ? selected : r.selected,
              })),
            })),
          )
        }}
        onSelectTrack={(
          playlistIndex: number,
          trackIndex: number,
          selected: boolean,
        ) => {
          onUpdatePlaylists(
            playlists.map((p, i) => ({
              ...p,
              replacements: p.replacements.map(r => ({
                ...r,
                selected:
                  i === playlistIndex && r.position === trackIndex
                    ? selected
                    : r.selected,
              })),
            })),
          )
        }}
      />
    </div>
  )
}
