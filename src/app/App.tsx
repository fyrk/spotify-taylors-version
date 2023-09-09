import { SpotifyApi, User } from "@spotify/web-api-ts-sdk"
import { useEffect, useState } from "preact/hooks"
import { JSX } from "preact/jsx-runtime"
import { BaseButton, Button, Scaffold } from "../components"
import {
  NO_PROGRESS,
  Progress,
  ScannedPlaylist,
  SelectedPlaylist,
} from "../types"
import PlaylistEditor from "./playlisteditor/PlaylistEditor"
import { replaceTracks } from "./replace"
import { scanUserPlaylists } from "./scan"
import noScooterCircle from "/img/no_scooter_circle.svg?url"

export default function App({
  onLogout,
  spotify,
}: {
  onLogout: () => void
  spotify: SpotifyApi
}) {
  const [user, setUser] = useState<User>(null)

  const [state, setState] = useState<
    "scanning" | "selecting" | "replacing" | "finished"
  >("scanning")
  const [scanProgress, setScanProgress] = useState<Progress>(NO_PROGRESS)
  const [playlists, setPlaylists] = useState<ScannedPlaylist[]>(null)

  useEffect(() => {
    ;(async () => {
      const user = await spotify.currentUser.profile()
      setUser(user)
      setPlaylists(await scanUserPlaylists(spotify, user, setScanProgress))
      setState("selecting")
    })()
  }, [])

  let content: JSX.Element
  switch (state) {
    case "scanning":
      content = (
        <ProgressDisplay
          title="Scanning your playlists"
          progress={scanProgress}
        />
      )
      break
    case "selecting":
      content = (
        <PlaylistEditor
          playlists={playlists}
          onDoReplace={async selectedTracks => {
            setState("replacing")
            const selectedPlaylists: SelectedPlaylist[] = playlists
              .filter((_, i) => selectedTracks[i].size > 0)
              .map((p, i) => ({
                id: p.id,
                name: p.name,
                snapshot_id: p.snapshot_id,
                stolenIdsToRemove: Array.from(selectedTracks[i]),
                newTracks: p.replacements
                  .filter(r => selectedTracks[i].has(r.stolen.id))
                  .map(r => ({
                    position: r.position,
                    taylorsVersionId: r.taylorsVersionIds[0],
                  })),
              }))
            await replaceTracks(spotify, selectedPlaylists, setScanProgress)
            setState("finished")
          }}
          spotify={spotify}
        />
      )
      break
    case "replacing":
      content = (
        <ProgressDisplay title="Replacing songs" progress={scanProgress} />
      )
      break
    case "finished":
      content = (
        <div class="w-full text-center">
          <div class="mb-8 text-2xl">
            Your playlists have been updated to (Taylor’s Version)!
          </div>
          <Button onClick={() => onLogout()}>Back to Home</Button>
        </div>
      )
      break
  }

  return (
    <Scaffold>
      <header class="flex w-full items-center justify-between bg-neutral-800 px-4 py-4 shadow-lg shadow-neutral-950 sm:px-7 sm:py-6">
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
      {content}
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
    <BaseButton
      class="bg-neutral-600 p-2 text-sm font-semibold shadow-sm shadow-neutral-950 sm:text-xl"
      onClick={onLogout}
    >
      <span class="flex items-center gap-2">
        <img
          src={profileImage && profileImage.url}
          class="h-[1.5em] w-[1.5em] rounded-full"
        />
        <span class="mr-1 whitespace-nowrap">Log out</span>
      </span>
    </BaseButton>
  )
}

const ProgressDisplay = ({
  title,
  progress,
}: {
  title: string
  progress: Progress
}) => {
  const p = progress.total > 0 ? (progress.current / progress.total) * 100 : 0
  return (
    <div class="w-full text-center">
      <div class="mb-8 text-3xl" id="scan-progress">
        {title}
      </div>
      <div
        class="mx-auto mb-3 h-3 w-44 rounded-full bg-neutral-600"
        role="progressbar"
        aria-labelledby="scan-progress"
        aria-valuenow={Math.round(p)}
      >
        <div
          class="h-full rounded-full bg-accent"
          style={{ width: `${p}%` }}
        ></div>
      </div>
      <div class="text-neutral-400">{progress.text || <>&nbsp;</>}</div>
    </div>
  )
}
