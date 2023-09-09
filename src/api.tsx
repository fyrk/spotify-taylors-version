import { SpotifyApi, Track } from "@spotify/web-api-ts-sdk"
import {
  IRedirectionStrategy,
  Page,
  PlaylistedTrack,
  SimplifiedPlaylist,
} from "../node_modules/@spotify/web-api-ts-sdk/src/types"
import { PlaylistWithTracks } from "./types"

const SPOTIFY_ROOT_URL = "https://api.spotify.com/v1/"

export const createSpotifyApi = (
  redirectionStrategy: IRedirectionStrategy = null,
) => {
  let config = {}
  if (redirectionStrategy) {
    config = { redirectionStrategy }
  }
  return SpotifyApi.withUserAuthorization(
    import.meta.env.VITE_SPOTIFY_CLIENT_ID,
    import.meta.env.PROD
      ? import.meta.env.VITE_SPOTIFY_REDIRECT_URI
      : "http://localhost:3000",
    [
      "playlist-read-private",
      "playlist-modify-public",
      "playlist-modify-private",
    ],
    config,
  )
}

async function* getPaginatedItems<T>(
  spotify: SpotifyApi,
  firstResponse: Promise<Page<T>>,
): AsyncGenerator<{ total: number; item: T }> {
  let resp = await firstResponse
  const items = resp.items
  for (let item of items) {
    yield Promise.resolve({ total: resp.total, item })
  }
  while (resp.next != null) {
    if (!resp.next.startsWith(SPOTIFY_ROOT_URL)) {
      throw Error(`Unexpected next URL: ${resp.next}`)
    }
    resp = await spotify.makeRequest(
      "GET",
      resp.next.substring(SPOTIFY_ROOT_URL.length),
    )
    for (let item of resp.items) {
      yield Promise.resolve({ total: resp.total, item })
    }
  }
}

export const getAllUserPlaylists = (spotify: SpotifyApi) =>
  getPaginatedItems(spotify, spotify.currentUser.playlists.playlists(50))

export const getPlaylistWithTracks = async (
  spotify: SpotifyApi,
  playlist: SimplifiedPlaylist,
  itemFields: string,
): Promise<PlaylistWithTracks> => {
  const tracks: PlaylistedTrack[] = []
  for await (let { item } of getPaginatedItems(
    spotify,
    spotify.playlists.getPlaylistItems(
      playlist.id,
      undefined,
      `total,next,items(${itemFields ?? ""})`,
    ),
  )) {
    tracks.push(item)
  }
  return { ...playlist, tracks }
}

export const getTracks = async (spotify: SpotifyApi, ids: string[]) => {
  const tracks: Track[] = []
  for (let offset = 0; offset < ids.length; offset += 50) {
    tracks.push(...(await spotify.tracks.get(ids.slice(offset, offset + 50))))
  }
  return tracks
}

export const removeItemsFromPlaylist = async (
  spotify: SpotifyApi,
  playlist: { id: string; snapshot_id?: string },
  trackIds: string[],
) => {
  const promises: Promise<void>[] = []
  for (let offset = 0; offset < trackIds.length; offset += 100) {
    promises.push(
      spotify.playlists.removeItemsFromPlaylist(playlist.id, {
        tracks: trackIds
          .slice(offset, offset + 100)
          .map(id => ({ uri: `spotify:track:${id}` })),
        // passing snapshot_id for large playlists causes 500 Internal Server Error
        //snapshot_id: playlist.snapshot_id,
      }),
    )
  }
  return await Promise.all(promises)
}
