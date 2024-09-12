import * as Sentry from "@sentry/react"
import { SdkOptions, SpotifyApi, Track } from "@spotify/web-api-ts-sdk"
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
  let config: SdkOptions = {}
  if (redirectionStrategy) {
    config = {
      redirectionStrategy,
      fetch: async (fullUrl, opts) => {
        let response = await fetch(fullUrl, opts)
        try {
          // retry up to 3 times with increasing backoff
          if (response.status === 429) {
            for (let i = 1; i++; i <= 3) {
              let wait = i ** 2 + parseInt(response.headers.get("Retry-After"))
              wait += (Math.random() * wait) / 2
              await new Promise(resolve => setTimeout(resolve, wait * 1000))

              response = await fetch(fullUrl, opts)
              if (response.status !== 429) {
                break
              }
            }
          }
        } catch (e) {
          console.error("Error during rate limit backoff", e)
        }
        return response
      },
    }
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

export const getTracks = async (spotify: SpotifyApi, ids: string[]) => {
  const tracks: Track[] = []
  for (let offset = 0; offset < ids.length; offset += 50) {
    tracks.push(...(await spotify.tracks.get(ids.slice(offset, offset + 50))))
  }
  return tracks
}

export class TrackCache {
  private cache: Map<string, Track> = new Map()

  constructor(private spotify: SpotifyApi) {}

  private addTracks(track: Track, id: string) {
    if (track == null) {
      const error = new Error(`Track info `)
      return
    }
    this.cache.set(track.id, track)
  }

  async getMany(ids: string[]): Promise<Track[]> {
    const missingIds = ids.filter(id => !this.cache.has(id))
    if (missingIds.length === 0) {
      return ids.map(id => this.cache.get(id))
    }

    const tracks = await getTracks(this.spotify, missingIds)

    const errorIds = []
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i]
      if (track == null) {
        errorIds.push(missingIds[i])
      } else {
        this.addTracks(track, track.id)
      }
    }
    if (errorIds.length > 0) {
      const error = new Error(`Track info not found`)
      console.error(error, errorIds)
      Sentry.captureException(error, { extra: { ids: errorIds } })
    }

    return ids.map(id => this.cache.get(id))
  }

  tryGet(id: string): Track | null {
    return this.cache.get(id) ?? null
  }

  tryGetMany(ids: string[]): Track[] {
    return ids.map(id => this.tryGet(id))
  }
}
