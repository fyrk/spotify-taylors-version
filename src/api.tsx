import { Scopes, SpotifyApi } from "@spotify/web-api-ts-sdk"
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
    Scopes.playlistRead,
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
