import { Track } from "@spotify/web-api-ts-sdk"
import { ExternalLink } from "../../components"
import { TrackPlaceholderIcon } from "../../icons"
import { PreReleaseTrack } from "../../types"

function _TrackView({
  trackName,
  albumName,
  albumArt,
  trackUrl,
  albumUrl,
}: {
  trackName: string
  albumName: string
  albumArt: string
  trackUrl: string
  albumUrl: string
}) {
  return (
    <div class="grid h-12 min-w-0 select-none grid-cols-[3rem_1fr] gap-3 text-left">
      {albumArt ? (
        trackUrl ? (
          <a href={trackUrl} target="_blank">
            <img src={albumArt} />
          </a>
        ) : (
          <img src={albumArt} />
        )
      ) : (
        <TrackPlaceholderIcon />
      )}
      <div class="min-w-0">
        <div class="overflow-hidden text-ellipsis whitespace-nowrap">
          {trackUrl ? (
            <ExternalLink href={trackUrl} class="hover:underline">
              {trackName}
            </ExternalLink>
          ) : (
            trackName
          )}
        </div>
        <div class="overflow-hidden text-ellipsis whitespace-nowrap text-neutral-400">
          {albumUrl ? (
            <ExternalLink href={albumUrl} class="hover:underline">
              {albumName}
            </ExternalLink>
          ) : (
            albumName
          )}
        </div>
      </div>
    </div>
  )
}

export function TrackView({
  track,
  addLinks,
}: {
  track: Track | null
  addLinks?: boolean
}) {
  addLinks = addLinks ?? true
  return _TrackView({
    trackName: track && track.name,
    albumName: track && track.album.name,
    albumArt: track && track.album.images[0] && track.album.images[0].url,
    trackUrl: addLinks && track && track.external_urls.spotify,
    albumUrl: addLinks && track && track.album.external_urls.spotify,
  })
}

export function PreReleaseTrackView({
  track,
  addLinks,
}: {
  track: PreReleaseTrack | null
  addLinks?: boolean
}) {
  addLinks = addLinks ?? true
  return _TrackView({
    trackName: track && track.name,
    albumName: track && track.album.name,
    albumArt: track && track.album.image,
    trackUrl: addLinks && track && track.album.presaveLink,
    albumUrl: addLinks && track && track.album.presaveLink,
  })
}
