import { SpotifyApi, Track } from "@spotify/web-api-ts-sdk"
import { useEffect, useRef, useState } from "preact/hooks"
import { Checkbox, ExternalLink } from "../../components"
import { PlaylistPlaceholderIcon } from "../../icons"
import { ScannedPlaylist } from "../../types"
import ReplacementView from "./ReplacementView"

export default function PlaylistView({
  playlist,
  selection,
  isExtended,
  onToggle,
  onSelectPlaylist,
  onSelectTrack,
  spotify,
}: {
  playlist: ScannedPlaylist
  selection: Set<string>
  isExtended: boolean
  onToggle: () => void
  onSelectPlaylist: (selected: boolean) => void
  onSelectTrack: (trackId: string, selected: boolean) => void
  spotify: SpotifyApi
}) {
  const [taylorsTracks, setTaylorsTracks] = useState<Track[]>(null) // lazy-load as soon as playlist is extended

  const ref = useRef<HTMLDivElement>()

  useEffect(() => {
    if (isExtended) {
      ref.current.scrollIntoView({ behavior: "smooth" })
      if (taylorsTracks == null) {
        ;(async () => {
          setTaylorsTracks(
            await spotify.tracks.get(
              playlist.replacements.map(r => r.taylorsVersionIds[0]),
            ),
          )
        })()
      }
    }
  }, [isExtended])

  const isAllSelected = playlist.replacements.every(r =>
    selection.has(r.stolen.id),
  )
  const isIndeterminate = !isAllSelected && selection.size > 0

  return (
    <div
      class="mb-7 w-full select-none rounded-xl bg-neutral-900 shadow-md shadow-neutral-950"
      ref={ref}
    >
      <div
        class="sticky top-0 grid cursor-pointer grid-cols-[6rem_1fr_3rem] items-baseline gap-x-6 rounded-xl bg-[#212121] p-6 shadow-md shadow-neutral-950 hover:bg-neutral-800"
        onClick={() => onToggle()}
      >
        {playlist.images[0] ? (
          <img
            src={playlist.images[0].url}
            class="h-24 w-24 object-scale-down"
          />
        ) : (
          <PlaylistPlaceholderIcon class="h-24 w-24" />
        )}

        <div class="flex h-full flex-col justify-between self-center">
          <div></div>
          <div class="text-2xl font-semibold sm:text-4xl">{playlist.name}</div>
          <div class="text-sm text-neutral-400">
            <span class="mr-1">
              {playlist.replacements.length} tracks found
            </span>{" "}
            •{" "}
            <span class="ml-1">
              <ExternalLink href={playlist.external_urls.spotify}>
                Open in Spotify
              </ExternalLink>
            </span>
          </div>
        </div>
        <div class="flex items-center justify-start self-center">
          <Checkbox
            class="h-6 w-6 cursor-pointer"
            checked={isAllSelected}
            indeterminate={isIndeterminate}
            onChange={e => onSelectPlaylist(e.currentTarget.checked)}
            onClick={e => e.stopPropagation()}
          />
        </div>
      </div>
      {isExtended && (
        <div class="p-4 pt-6">
          {playlist.replacements.map((r, i) => {
            return (
              <ReplacementView
                replacement={r}
                taylorsTrack={taylorsTracks && taylorsTracks[i]}
                selected={selection.has(r.stolen.id)}
                onSelect={selected => onSelectTrack(r.stolen.id, selected)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
