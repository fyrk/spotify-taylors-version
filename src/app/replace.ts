import * as Sentry from "@sentry/react"
import { SpotifyApi } from "@spotify/web-api-ts-sdk"
import { removeItemsFromPlaylist } from "../api"
import { PlaylistSelection, Progress, ReplaceError } from "../types"

export async function replaceTracks(
  spotify: SpotifyApi,
  playlists: PlaylistSelection[],
  onProgress: (progress: Progress) => void,
): Promise<ReplaceError[]> {
  const total = playlists.reduce((sum, p) => sum + p.newTracks.length, 0)
  let counter = 0

  const replacePlaylist = async (
    playlist: PlaylistSelection,
  ): Promise<void> => {
    let trackCounter = 0
    try {
      for (const r of playlist.newTracks.reverse()) {
        await spotify.playlists.addItemsToPlaylist(
          playlist.id,
          [`spotify:track:${r.taylorsVersionId}`],
          r.position - 1,
        )
        trackCounter++
        onProgress({
          current: ++counter,
          total,
          text: playlist.name,
        })
      }
      await removeItemsFromPlaylist(
        spotify,
        playlist,
        playlist.stolenIdsToRemove,
      )
    } finally {
      onProgress({
        current: counter - trackCounter + playlist.newTracks.length,
        total,
        text: playlist.name,
      })
    }
  }

  return (await Promise.allSettled(playlists.map(p => replacePlaylist(p))))
    .map((result, i) => ({ result, playlist: playlists[i] }))
    .filter(({ result }) => result.status === "rejected")
    .map(({ result, playlist }) => {
      // @ts-ignore
      const error = new Error("Playlist replace failed", {
        cause: (result as PromiseRejectedResult).reason,
      })
      Sentry.captureException(error)
      return { playlist, reason: error }
    })
}
