import * as Sentry from "@sentry/react"
import {
  PlaylistedTrack,
  SimplifiedPlaylist,
  SpotifyApi,
  Track,
  User,
} from "@spotify/web-api-ts-sdk"
import { getAllUserPlaylists, getPlaylistWithTracks } from "../api"
import {
  Progress,
  ScanError,
  ScannedPlaylist,
  StolenTrack,
  StolenVariants,
} from "../types"
import _TAYLORS_VERSIONS_JSON from "./taylorsversions.json"

export const TAYLORS_VERSIONS: {
  [key: string]: StolenVariants
} = _TAYLORS_VERSIONS_JSON

const getTrackReplacements = (tracks: PlaylistedTrack[]): StolenTrack[] => {
  let replacements: StolenTrack[] = []
  tracks.forEach((t, i) => {
    if (t.track && t.track.type === "track") {
      const track = t.track as Track
      const stolenReplacements = TAYLORS_VERSIONS[track.external_ids.isrc]
      if (stolenReplacements) {
        replacements.push({
          position: i + 1,
          track: track,
          variants: stolenReplacements,
        })
      }
    }
  })
  return replacements
}

export async function scanUserPlaylists(
  spotify: SpotifyApi,
  onGotUser: (user: User) => void,
  onProgress: (progress: Progress) => void,
): Promise<{ playlists: ScannedPlaylist[]; errors: ScanError[] }> {
  let counter = 0

  const userPromise = (async () => {
    const user = await spotify.currentUser.profile()
    onGotUser(user)
    return user
  })()

  const scanPlaylist = async (
    playlist: SimplifiedPlaylist,
    total: number,
  ): Promise<ScannedPlaylist> => {
    try {
      const user = await userPromise
      if (playlist.owner.uri === user.uri) {
        const playlistWithTracks = await getPlaylistWithTracks(
          spotify,
          playlist,
          "track(album(external_urls.spotify,images,name),external_ids.isrc,external_urls.spotify,href,id,name,type)",
        )
        const replacements = getTrackReplacements(playlistWithTracks.tracks)
        if (replacements.length > 0) {
          return { ...playlistWithTracks, stolenTracks: replacements }
        }
      }
      return null
    } finally {
      onProgress({ current: ++counter, total, text: playlist.name })
    }
  }

  const playlists: SimplifiedPlaylist[] = []
  const promises: Promise<ScannedPlaylist>[] = []
  for await (let { total, item } of getAllUserPlaylists(spotify)) {
    playlists.push(item)
    promises.push(scanPlaylist(item, total))
  }
  const results = await Promise.allSettled(promises)

  const scannedPlaylists: ScannedPlaylist[] = []
  const errors: ScanError[] = []
  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      if (result.value != null) {
        scannedPlaylists.push(result.value)
      }
    } else {
      errors.push({ playlist: playlists[i], reason: result.reason })
      // @ts-ignore
      const error = new Error("Playlist scan failed", {
        cause: result.reason,
      })
      Sentry.captureException(error)
    }
  })
  return { playlists: scannedPlaylists, errors }
}
