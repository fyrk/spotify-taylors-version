import { SpotifyApi, User } from "@spotify/web-api-ts-sdk"
import { useEffect, useState } from "preact/hooks"
import { Scaffold } from "../components"
import { PlaylistsView } from "./components"
import {
  PlaylistScanProgress,
  ScannedPlaylist,
  scanUserPlaylists,
} from "./scan"
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
      <header class="mb-8 flex w-full items-center justify-between bg-neutral-800 px-4 py-4 sm:px-7 sm:py-6">
        <div class="whitespace-nowrap text-2xl font-bold sm:text-4xl">
          <div class="inline-block">
            <img
              src={noScooterCircle}
              class="mr-3 inline-block h-[1.2em] w-[1.2em] align-text-bottom"
            />
          </div>
          <div class="inline-block">Taylor’s Version</div>
        </div>
        <div>
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
      class="rounded-full bg-neutral-600 p-2 text-sm font-semibold sm:text-xl"
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
    <div class="w-full text-center">
      <div class="mb-8 text-3xl" id="scan-progress">
        Scanning your playlists
      </div>
      <div
        class="mx-auto mb-3 h-3 w-44 rounded-full bg-neutral-600"
        role="progressbar"
        aria-labelledby="scan-progress"
        aria-valuenow={Math.round(scanProgress.progress * 100)}
      >
        <div
          class="h-full rounded-full bg-accent"
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
