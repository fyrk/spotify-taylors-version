import * as Sentry from "@sentry/react"
import { SpotifyApi, User } from "@spotify/web-api-ts-sdk"
import { useEffect, useState } from "preact/hooks"
import { BaseButton, Button, Fallback, Scaffold } from "../components"
import {
  NO_PROGRESS,
  Progress,
  ReplaceError,
  ScanResult,
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
      <Sentry.ErrorBoundary
        fallback={({ error }) => {
          if (
            error instanceof Error &&
            // @spotify/web-api-ts-sdk/src/responsevalidation/DefaultResponseValidator.ts:13
            error.message.includes("The app has exceeded its rate limits")
          ) {
            return (
              <Fallback
                title="The app has exceeded Spotify’s rate limits"
                text="Please wait some time and try again later"
              />
            )
          }
          return (
            <Fallback
              error={error instanceof Error ? error.toString() : null}
            />
          )
        }}
      >
        <AppContent onGotUser={setUser} onLogout={onLogout} spotify={spotify} />
      </Sentry.ErrorBoundary>
    </Scaffold>
  )
}

/**
 * Move app's content here so error fallback still shows header and logout button.
 */
const AppContent = ({
  onGotUser,
  onLogout,
  spotify,
}: {
  onGotUser: (user: User) => void
  onLogout: () => void
  spotify: SpotifyApi
}) => {
  const [asyncError, setAsyncError] = useState<Error>(null)
  if (asyncError) {
    throw asyncError
  }

  const [state, setState] = useState<
    "scanning" | "selecting" | "replacing" | "finished"
  >("scanning")
  const [progress, setProgress] = useState<Progress>(NO_PROGRESS)
  const [scanResult, setScanResult] = useState<ScanResult>(null)
  const [replaceErrors, setReplaceErrors] = useState<ReplaceError[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const user = await spotify.currentUser.profile()
        onGotUser(user)
        setScanResult(await scanUserPlaylists(spotify, user, setProgress))
        setState("selecting")
      } catch (e) {
        setAsyncError(e)
      }
    })()
  }, [])

  switch (state) {
    case "scanning":
      return (
        <ProgressDisplay title="Scanning your playlists" progress={progress} />
      )
    case "selecting":
      return (
        <PlaylistEditor
          scanResult={scanResult}
          onDoReplace={async selectedTracks => {
            setProgress(NO_PROGRESS)
            setState("replacing")
            const selectedPlaylists: SelectedPlaylist[] = scanResult.playlists
              .map((p, i) => ({ p, s: selectedTracks[i] }))
              .filter(({ s }) => s.size > 0)
              .map(({ p, s }) => ({
                id: p.id,
                name: p.name,
                snapshot_id: p.snapshot_id,
                stolenIdsToRemove: Array.from(s),
                newTracks: p.replacements
                  .filter(r => s.has(r.stolen.id))
                  .map(r => ({
                    position: r.position,
                    taylorsVersionId: r.taylorsVersionIds[0],
                  })),
              }))
            setReplaceErrors(
              await replaceTracks(spotify, selectedPlaylists, setProgress),
            )
            setState("finished")
          }}
          spotify={spotify}
        />
      )
    case "replacing":
      return <ProgressDisplay title="Replacing songs" progress={progress} />
    case "finished":
      return (
        <div class="w-full p-6">
          <div class="mx-auto w-full max-w-2xl text-center">
            <div class="mb-8 text-2xl">
              Your playlists have been updated to (Taylor’s Version)!
            </div>
            <Button onClick={onLogout}>Back to Home</Button>
            {replaceErrors.length > 0 && (
              <div class="mt-10 text-center text-red-300">
                Tracks in the following{" "}
                {replaceErrors.length === 1 ? "playlist" : "playlists"} may not
                have been fully updated:{" "}
                {replaceErrors.map(e => e.playlist.name.toString()).join(", ")}
              </div>
            )}
          </div>
        </div>
      )
  }
}

const LogOutButton = ({
  user,
  onLogout,
}: {
  user: User
  onLogout: () => void
}) => {
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
