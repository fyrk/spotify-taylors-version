import { Track } from "../../node_modules/@spotify/web-api-ts-sdk/src/types"
import { PlaylistWithTracks } from "../api"
import _TAYLORS_VERSIONS_JSON from "./taylorsversions.json"

const TAYLORS_VERSIONS: {
  [key: string]: { replacements: Array<{ id: string }> }
} = _TAYLORS_VERSIONS_JSON

export interface TrackReplacement {
  position: number
  stolen: Track
  taylorsVersionId: string
}

export interface PlaylistReplacements {
  playlist: PlaylistWithTracks
  replacements: TrackReplacement[]
}

export const getTrackReplacements = (
  playlist: PlaylistWithTracks,
): PlaylistReplacements => {
  let replacements: TrackReplacement[] = []
  playlist.tracks.forEach((t, i) => {
    if (t.track.type === "track") {
      const track = t.track as Track
      const taylorsVersion = TAYLORS_VERSIONS[track.external_ids.isrc]
      if (taylorsVersion) {
        replacements.push({
          position: i + 1,
          stolen: track,
          taylorsVersionId: taylorsVersion.replacements[0].id,
        })
      }
    }
  })
  return { playlist, replacements }
}
