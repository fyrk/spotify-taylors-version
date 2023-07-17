import { SpotifyApi } from "@spotify/web-api-ts-sdk"
import { useEffect, useRef, useState } from "preact/hooks"
import { Track } from "../../node_modules/@spotify/web-api-ts-sdk/src/types"
import { PlaylistPlaceholderIcon, TrackPlaceholderIcon } from "../icons"
import { ScannedPlaylist, TrackReplacement } from "./util"

export const PlaylistsView = ({
  playlists,
  spotify,
}: {
  playlists: ScannedPlaylist[]
  spotify: SpotifyApi
}) => {
  const [extended, setExtended] = useState<string>(null)
  return (
    <div class="mx-auto w-full max-w-7xl">
      {playlists.map(playlist => (
        <PlaylistView
          playlist={playlist}
          isExtended={extended === playlist.id}
          onToggle={() =>
            extended === playlist.id
              ? setExtended(null)
              : setExtended(playlist.id)
          }
          spotify={spotify}
        />
      ))}
    </div>
  )
}

const PlaylistView = ({
  playlist,
  isExtended,
  onToggle,
  spotify,
}: {
  playlist: ScannedPlaylist
  isExtended: boolean
  onToggle: () => void
  spotify: SpotifyApi
}) => {
  const ref = useRef<HTMLDivElement>()

  useEffect(() => {
    if (isExtended) ref.current.scrollIntoView({ behavior: "smooth" })
  }, [isExtended])

  return (
    <div
      class="mb-7 w-full cursor-pointer rounded-lg bg-[#202020] p-3 hover:bg-[#282828]"
      onClick={() => onToggle()}
      ref={ref}
    >
      <div class="sticky top-0 flex items-center gap-5 bg-inherit p-4">
        {playlist.images[0] ? (
          <img src={playlist.images[0].url} class="h-24 w-24" />
        ) : (
          <PlaylistPlaceholderIcon class="h-24 w-24" />
        )}

        <div class="text-2xl">{playlist.name}</div>
      </div>
      {isExtended && (
        <div class="p-4">
          {playlist.replacements.map(r => {
            return <ReplacementView replacement={r} spotify={spotify} />
          })}
        </div>
      )}
    </div>
  )
}

const ReplacementView = ({
  replacement,
  spotify,
}: {
  replacement: TrackReplacement
  spotify: SpotifyApi
}) => {
  const TrackView = ({ track }: { track: Track }) => (
    <div class="flex min-w-0 gap-3">
      {track && track.album.images[0] ? (
        <img src={track.album.images[0].url} class="h-12 w-12" />
      ) : (
        <TrackPlaceholderIcon class="h-12 w-12" />
      )}
      <div class="min-w-0">
        <div class="overflow-hidden text-ellipsis whitespace-nowrap">
          {track && track.name}
        </div>
        <div class="overflow-hidden text-ellipsis whitespace-nowrap text-neutral-400">
          {track && track.album.name}
        </div>
      </div>
    </div>
  )

  const [taylorsTrack, setTaylorsTrack] = useState<Track>(null)

  useEffect(() => {
    ;(async () => {
      setTaylorsTrack(await spotify.tracks.get(replacement.taylorsVersionId))
    })()
  }, [])

  return (
    <div class="my-5 flex items-center last:mb-0">
      <div class="self-start">
        <div class="flex h-12 w-6 items-center pr-3 text-right leading-[3rem] text-neutral-400">
          <div class="grow">{replacement.position}</div>
        </div>
      </div>
      <div class="min-w-0 sm:flex sm:grow">
        <div class="mb-3 sm:mb-0 sm:w-[calc(50%_-_1.5rem)] sm:min-w-0">
          <TrackView track={replacement.stolen} />
        </div>
        <div class="flex min-w-0 sm:w-[calc(50%_+_1.5rem)] sm:min-w-0">
          <div class="mr-3 flex h-12 w-12 flex-none items-center justify-end sm:mr-0 sm:justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={10}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
              />
            </svg>
          </div>
          <div class="min-w-0 grow">
            <TrackView track={taylorsTrack} />
          </div>
        </div>
      </div>
    </div>
  )
}
