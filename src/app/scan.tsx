import {
  PlaylistedTrack,
  SimplifiedPlaylist,
  SpotifyApi,
  Track,
  User,
} from "@spotify/web-api-ts-sdk"
import { getAllUserPlaylists, getPlaylistWithTracks } from "../api"
import { Progress, ScannedPlaylist, TrackReplacements } from "../types"
import _TAYLORS_VERSIONS_JSON from "./taylorsversions.json"

const TAYLORS_VERSIONS: {
  [key: string]: { replacements: Array<{ id: string }> }
} = _TAYLORS_VERSIONS_JSON

const getTrackReplacements = (
  tracks: PlaylistedTrack[],
): TrackReplacements[] => {
  let replacements: TrackReplacements[] = []
  tracks.forEach((t, i) => {
    if (t.track.type === "track") {
      const track = t.track as Track
      const taylorsVersion = TAYLORS_VERSIONS[track.external_ids.isrc]
      if (taylorsVersion) {
        replacements.push({
          position: i + 1,
          stolen: track,
          taylorsVersionIds: taylorsVersion.replacements.map(r => r.id),
        })
      }
    }
  })
  return replacements
}

export async function scanUserPlaylists(
  spotify: SpotifyApi,
  user: User,
  onProgress: (progress: Progress) => void,
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
          "track(album(external_urls.spotify,images,name),external_ids.isrc,external_urls.spotify,href,id,name,type)",
        )
        const replacements = getTrackReplacements(playlistWithTracks.tracks)
        if (replacements.length > 0) {
          return { ...playlistWithTracks, replacements }
        }
      }
      return null
    } finally {
      counter++
      onProgress({ current: counter, total, text: playlist.name })
    }
  }

  const promises = []

  for await (let { total, item } of getAllUserPlaylists(spotify)) {
    promises.push(scanPlaylist(item, total))
  }

  return (await Promise.allSettled(promises))
    .map(result => {
      if (result.status === "fulfilled") {
        return result.value
      } else {
        console.error("Playlist scan failed")
        return null
      }
    })
    .filter(p => p != null)
}
