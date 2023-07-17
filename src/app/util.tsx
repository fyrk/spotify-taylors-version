import { SpotifyApi } from "@spotify/web-api-ts-sdk"
import {
  SimplifiedPlaylist,
  Track,
  User,
} from "../../node_modules/@spotify/web-api-ts-sdk/src/types"
import {
  PlaylistWithTracks,
  getAllUsersPlaylists,
  getPlaylistWithTracks,
} from "../api"
import _TAYLORS_VERSIONS_JSON from "./taylorsversions.json"

export interface TrackReplacement {
  position: number
  stolen: Track
  taylorsVersionId: string
}

export interface ScannedPlaylist extends PlaylistWithTracks {
  replacements: TrackReplacement[]
}

export interface PlaylistScanProgress {
  progress: number
  currentPlaylistName: string
}

const TAYLORS_VERSIONS: {
  [key: string]: { replacements: Array<{ id: string }> }
} = _TAYLORS_VERSIONS_JSON

const getTrackReplacements = (
  playlist: PlaylistWithTracks,
): TrackReplacement[] => {
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
  return replacements
}

export async function scanUserPlaylists(
  spotify: SpotifyApi,
  user: User,
  onProgress: (progress: PlaylistScanProgress) => void,
): Promise<ScannedPlaylist[]> {
  let counter = 0

  const scanPlaylist = async (
    playlist: SimplifiedPlaylist,
    total: number,
  ): Promise<ScannedPlaylist> => {
    try {
      if (playlist.owner.uri === user.uri) {
        const playlistWithTracks = await getPlaylistWithTracks(
          spotify,
          playlist,
        )
        const replacements = getTrackReplacements(playlistWithTracks)
        if (replacements.length > 0) {
          return { ...playlistWithTracks, replacements }
        }
      }
      return null
    } finally {
      counter++
      onProgress({
        progress: counter / total,
        currentPlaylistName: playlist.name,
      })
    }
  }

  const promises = []

  for await (let { total, item } of getAllUsersPlaylists(spotify)) {
    promises.push(scanPlaylist(item, total))
  }

  return (await Promise.allSettled(promises))
    .map(result => {
      if (result.status === "fulfilled") return result.value
      throw Error(result.reason)
    })
    .filter(p => p != null)
}
