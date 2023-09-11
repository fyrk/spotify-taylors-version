import { SpotifyApi } from "@spotify/web-api-ts-sdk"
import { useEffect, useRef } from "preact/hooks"
import { Checkbox, ExternalLink } from "../../components"
import { PlaylistPlaceholderIcon } from "../../icons"
import { PlaylistWithTracks } from "../../types"
import { StolenTrackViewData } from "./PlaylistEditor"
import StolenTrackView from "./StolenTrackView"

export default function PlaylistView({
  playlist,
  stolenTracks,
  selection,
  isExpanded: isExtended,
  onToggle,
  onSelectPlaylist,
  onSelectTrack,
  onOpenReplacementEditor,
  spotify,
}: {
  playlist: PlaylistWithTracks
  stolenTracks: StolenTrackViewData[]
  selection: Set<string>
  isExpanded: boolean
  onToggle: () => void
  onSelectPlaylist: (selected: boolean) => void
  onSelectTrack: (trackId: string, selected: boolean) => void
  onOpenReplacementEditor: (stolenIdx: number) => void
  spotify: SpotifyApi
}) {
  const ref = useRef<HTMLDivElement>()

  useEffect(() => {
    if (isExtended) ref.current.scrollIntoView({ behavior: "smooth" })
  }, [isExtended])

  const isAllSelected = stolenTracks.every(r => selection.has(r.stolen.id))
  const isIndeterminate = !isAllSelected && selection.size > 0

  return (
    <div
      class="mb-7 w-full select-none rounded-xl bg-neutral-900 shadow-md shadow-neutral-950"
      ref={ref}
    >
      <div
        class="sticky top-0 grid cursor-pointer grid-cols-[6rem_1fr_1.5rem] items-center rounded-xl bg-[#212121] p-4 pr-5 shadow-md shadow-neutral-950 hover:bg-neutral-800 sm:p-6 sm:pr-12"
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
        <div class="mx-4 flex h-full min-w-0 flex-col justify-between sm:mx-6">
          <div></div>
          <div class="overflow-clip text-ellipsis text-2xl font-semibold sm:text-4xl">
            {playlist.name}
          </div>
          <div class="text-sm text-neutral-400">
            <span class="block sm:inline">
              <span>
                {stolenTracks.length}{" "}
                {stolenTracks.length === 1 ? "track" : "tracks"} found out of{" "}
                {playlist.tracks.length}
              </span>
              &nbsp;
              <span class="mx-1 hidden sm:inline">•</span>
            </span>{" "}
            <span class="block sm:inline">
              <ExternalLink href={playlist.external_urls.spotify}>
                Open in Spotify
              </ExternalLink>
            </span>
          </div>
        </div>
        <div class="flex items-center justify-end">
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
        <div class="p-4 pr-5 pt-6">
          {stolenTracks.map((s, i) => {
            return (
              <StolenTrackView
                stolen={s}
                selected={selection.has(s.stolen.id)}
                onSelect={selected => onSelectTrack(s.stolen.id, selected)}
                onOpenReplacementEditor={() => onOpenReplacementEditor(i)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
