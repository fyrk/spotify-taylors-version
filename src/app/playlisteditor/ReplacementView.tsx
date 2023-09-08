import { Track } from "@spotify/web-api-ts-sdk"
import { Checkbox, ExternalLink } from "../../components"
import { TrackPlaceholderIcon } from "../../icons"
import { TrackReplacements } from "../../types"

const TrackView = ({ track }: { track: Track | null }) => (
  <div class="grid min-w-0 grid-cols-[3rem_1fr] gap-3">
    {track && track.album.images[0] ? (
      <a href={track && track.external_urls.spotify} target="_blank">
        <img src={track.album.images[0].url} />
      </a>
    ) : (
      <TrackPlaceholderIcon />
    )}
    <div class="min-w-0">
      <div class="overflow-hidden text-ellipsis whitespace-nowrap">
        <ExternalLink
          href={track && track.external_urls.spotify}
          class="hover:underline"
        >
          {track && track.name}
        </ExternalLink>
      </div>
      <div class="overflow-hidden text-ellipsis whitespace-nowrap text-neutral-400">
        <ExternalLink
          href={track && track.album.external_urls.spotify}
          class="hover:underline"
        >
          {track && track.album.name}
        </ExternalLink>
      </div>
    </div>
  </div>
)

export default function ReplacementView({
  replacement,
  taylorsTrack,
  selected,
  onSelect,
}: {
  replacement: TrackReplacements
  taylorsTrack: Track | null
  selected: boolean
  onSelect: (selected: boolean) => void
}) {
  return (
    // grid  <sm: position (1), stolen (2-3), arrow (4), tv (5-6), checkbox (7)
    // grid >=sm: position (1), stolen (2-7)\ arrow (2), tv (3-6), checkbox (7-7)
    <div class="my-6 grid grid-cols-[2rem_3rem_1fr_3rem_3rem_1fr_3rem] gap-y-3 first:mt-0 last:mb-0">
      <div class="flex h-12 w-6 items-center pr-1 text-right leading-[3rem] text-neutral-400">
        <div class="grow">{replacement.position}</div>
      </div>
      <div class="col-span-5 sm:col-span-2">
        <TrackView track={replacement.stolen} />
      </div>
      <div class="col-start-2 flex h-12 w-12 flex-none items-center justify-center sm:col-start-auto">
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
      <div class="col-span-4 pl-3 sm:col-span-2 sm:pl-0">
        <TrackView track={taylorsTrack} />
      </div>
      <div class="col-start-7 row-span-2 row-start-1 flex h-12 w-12 basis-12 items-center justify-center self-center">
        <Checkbox
          class="h-6 w-6 cursor-pointer"
          checked={selected}
          onChange={e => onSelect(e.currentTarget.checked)}
        />
      </div>
    </div>
  )
}
