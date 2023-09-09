import { SpotifyApi } from "@spotify/web-api-ts-sdk"
import { Progress, SelectedPlaylist } from "../types"

export async function replaceTracks(
  spotify: SpotifyApi,
  playlists: SelectedPlaylist[],
  onProgress: (progress: Progress) => void,
): Promise<void> {
  let counter = 0

  const replacePlaylist = async (playlist: SelectedPlaylist): Promise<void> => {
    for (const r of playlist.newTracks.reverse()) {
      await spotify.playlists.addItemsToPlaylist(
        playlist.id,
        [`spotify:track:${r.taylorsVersionId}`],
        r.position - 1,
      )
    }
    const promises: Promise<void>[] = []
    for (
      let offset = 0;
      offset < playlist.stolenIdsToRemove.length;
      offset += 100
    ) {
      promises.push(
        spotify.playlists.removeItemsFromPlaylist(playlist.id, {
          tracks: playlist.stolenIdsToRemove
            .slice(offset, offset + 100)
            .map(id => ({ uri: `spotify:track:${id}` })),
          snapshot_id: playlist.snapshot_id,
        }),
      )
    }
    ;(await Promise.allSettled(promises)).map(result => {
      if (result.status === "rejected") {
        console.error("Playlist remove stolen tracks failed:", result.reason)
      }
    })
    onProgress({
      current: ++counter,
      total: playlists.length,
      text: playlist.name,
    })
  }

  ;(await Promise.allSettled(playlists.map(p => replacePlaylist(p)))).map(
    result => {
      if (result.status === "rejected") {
        console.error("Playlist replace failed", result.reason)
      }
    },
  )
}
