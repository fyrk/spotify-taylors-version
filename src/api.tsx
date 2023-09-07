import { Scopes, SpotifyApi } from "@spotify/web-api-ts-sdk"
import {
  ExternalUrls,
  Followers,
  IRedirectionStrategy,
  Image,
  Page,
  PlaylistedTrack,
  SimplifiedPlaylist,
  UserReference,
} from "../node_modules/@spotify/web-api-ts-sdk/src/types"

const SPOTIFY_ROOT_URL = "https://api.spotify.com/v1/"

export const createApiClient = (
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

export const getAllUsersPlaylists = (spotify: SpotifyApi) =>
  getPaginatedItems(
    spotify,
    // @ts-ignore (SpotifyApi somehow has limit of 49 instead of 50)
    spotify.currentUser.playlists.playlists(50),
  )

export interface PlaylistWithTracks {
  collaborative: boolean
  description: string
  external_urls: ExternalUrls
  followers: Followers
  href: string
  id: string
  images: Image[]
  name: string
  owner: UserReference
  primary_color: string
  public: boolean
  snapshot_id: string
  type: string
  uri: string

  tracks: PlaylistedTrack[]
}

export const getPlaylistWithTracks = async (
  spotify: SpotifyApi,
  playlist: SimplifiedPlaylist,
): Promise<PlaylistWithTracks> => {
  if (!playlist.tracks.href.startsWith(SPOTIFY_ROOT_URL)) {
    throw Error(`Unexpected href: ${playlist.tracks.href}`)
  }
  const tracks: PlaylistedTrack[] = []
  for await (let { item } of getPaginatedItems(
    spotify,
    spotify.makeRequest<Page<PlaylistedTrack>>(
      "GET",
      playlist.tracks.href.substring(SPOTIFY_ROOT_URL.length),
    ),
  )) {
    tracks.push(item)
  }
  return { ...playlist, tracks }
}
