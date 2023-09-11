import { Track } from "@spotify/web-api-ts-sdk"
import { ExternalLink } from "../../components"
import { TrackPlaceholderIcon } from "../../icons"

export default function TrackView({
  track,
  addLinks,
}: {
  track: Track | null
  addLinks?: boolean
}) {
  addLinks = addLinks ?? true
  return (
    <div class="grid h-12 min-w-0 select-none grid-cols-[3rem_1fr] gap-3 text-left">
      {track && track.album.images[0] ? (
        addLinks ? (
          <a href={track && track.external_urls.spotify} target="_blank">
            <img src={track.album.images[0].url} />
          </a>
        ) : (
          <img src={track.album.images[0].url} />
        )
      ) : (
        <TrackPlaceholderIcon />
      )}
      <div class="min-w-0">
        <div class="overflow-hidden text-ellipsis whitespace-nowrap">
          {addLinks ? (
            <ExternalLink
              href={track && track.external_urls.spotify}
              class="hover:underline"
            >
              {track && track.name}
            </ExternalLink>
          ) : (
            track && track.name
          )}
        </div>
        <div class="overflow-hidden text-ellipsis whitespace-nowrap text-neutral-400">
          {addLinks ? (
            <ExternalLink
              href={track && track.album.external_urls.spotify}
              class="hover:underline"
            >
              {track && track.album.name}
            </ExternalLink>
          ) : (
            track && track.album.name
          )}
        </div>
      </div>
    </div>
  )
}
