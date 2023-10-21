import * as Sentry from "@sentry/react"
import {
  PlaylistedTrack,
  SimplifiedPlaylist,
  SpotifyApi,
  Track,
  User,
} from "@spotify/web-api-ts-sdk"
import { getAllUserPlaylists, getPlaylistWithTracks, getTracks } from "../api"
import {
  PreReleaseTrack,
  Progress,
  ScanError,
  ScannedPlaylist,
  StolenTrack,
  StolenVariants,
} from "../types"
import _TAYLORS_VERSIONS_JSON from "./taylorsversions.json"
import _PRERELEASE_JSON from "./taylorsversions_prerelease.json"

const TAYLORS_VERSIONS: {
  [key: string]: StolenVariants
} = _TAYLORS_VERSIONS_JSON

// tracks from pre-release pages that might be available by now
const PRERELEASE_TRACKS: {
  [id: string]: PreReleaseTrack
} = Object.fromEntries(
  Object.entries(_PRERELEASE_JSON["tracks"]).map(([id, t]) => [
    id,
    {
      name: t.name,
      album: _PRERELEASE_JSON["albums"][t.albumId],
    },
  ]),
)

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

  const checkPreReleaseTracksPromise = (async () => {
    // check availability of pre-release tracks
    // move unavailable tracks to StolenVariants.preReleaseTracks
    const ids = Object.keys(PRERELEASE_TRACKS)
    const tracks = await getTracks(spotify, ids)
    const unavailableIds = ids.filter((id, i) => tracks[i] == null)
    if (unavailableIds.length > 0) {
      for (const stolenVariants of Object.values(TAYLORS_VERSIONS)) {
        stolenVariants.preReleaseTracks = []
        for (let i = stolenVariants.ids.length - 1; i >= 0; i--) {
          const id = stolenVariants.ids[i]
          if (unavailableIds.includes(id)) {
            stolenVariants.ids.splice(i, 1)
            stolenVariants.preReleaseTracks.splice(0, 0, PRERELEASE_TRACKS[id])
          }
        }
      }
    }
  })()

  const scanPlaylist = async (
    playlist: SimplifiedPlaylist,
    total: number,
  ): Promise<ScannedPlaylist> => {
    try {
      const user = await userPromise
      await checkPreReleaseTracksPromise
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
