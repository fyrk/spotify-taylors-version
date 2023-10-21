import {
  Page,
  SimplifiedAlbum,
  SimplifiedTrack,
  SpotifyApi,
  Track,
} from "@spotify/web-api-ts-sdk"
import "dotenv/config"
import * as fs from "fs"

const MARKET = "US"

interface FullAlbum extends SimplifiedAlbum {
  tracks: Track[]
}

const SPOTIFY_ROOT_URL = "https://api.spotify.com/v1/"

export async function* getPaginatedItems<T>(
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

const getTracks = async (spotify: SpotifyApi, ids: string[]) => {
  const tracks: Track[] = []
  for (let offset = 0; offset < ids.length; offset += 50) {
    tracks.push(...(await spotify.tracks.get(ids.slice(offset, offset + 50))))
  }
  return tracks
}

const spotify = SpotifyApi.withClientCredentials(
  process.env.SPOTIFY_CLIENT_ID as string,
  process.env.SPOTIFY_CLIENT_SECRET as string,
)

const TAYLOR_SWIFT_ID = "06HL4z0CvFAxyc27GXpf02"

const simplifiedAlbums: SimplifiedAlbum[] = []
for await (const { item } of getPaginatedItems(
  spotify,
  spotify.artists.albums(
    TAYLOR_SWIFT_ID,
    "album,single,compilation",
    MARKET,
    50,
  ),
)) {
  simplifiedAlbums.push(item)
}

// a few albums are missing, maybe not available with market = US ?
for (const id of [
  // Love Story (Taylor’s Version)
  "4j2syEjl3h1To8KbRgvmJn",
  // Love Story (Taylor’s Version) [Elvira Remix]
  "3x4gaf5IPyFQNrxZY07CXA",
  // You All Over Me (feat. Maren Morris) (Taylor’s Version) (From The Vault)
  "5xd9LleY1wqsgKVTwLoXYI",
  // Fearless (Taylor's Version): The Halfway Out The Door Chapter
  "4Vs9aG0KwsHUCVhQ5kGgxv",
  // Fearless (Taylor's Version): The Kissing In The Rain Chapter
  "1iZR600UW2HCS3L7p5kNB8",
  // Fearless (Taylor’s Version): The I Remember What You Said Last Night Chapter
  "0XCoR1j5Sa2su9uDS9AScR",
  // Red (Taylor’s Version): Could You Be The One Chapter
  "1ZkjQ4WBB99Rq5eFGqENNX",
  // Red (Taylor’s Version): She Wrote A Song About Me Chapter
  "0VI6ZyP6Bw2XrEnzbHKdrt",
  // Red (Taylor’s Version): From The Vault Chapter
  "04Ki4xEu2JWsMVBWtx97TX",
  // Red (Taylor’s Version): The Slow Motion Chapter
  "4o0wVh13FT8batNO2tEar1",
  // You're Not Sorry (CSI Remix)
  "5sZIjREu3s225wwqJkgsYV",
  // Love Story (Digital Dog Remix)
  "2Z2KdJE0nGGu0qdWA45mza",
  // Love Story (Pop Mix)
  "1iab5rfjNpGhoPlFzPyp4k",
]) {
  const album = await spotify.albums.get(id)
  simplifiedAlbums.push({ ...album, album_group: null })
}

const albums: FullAlbum[] = []

for (const album of simplifiedAlbums) {
  console.log(album.name)
  const simplifiedTracks: SimplifiedTrack[] = []
  for await (const { item } of getPaginatedItems(
    spotify,
    spotify.albums.tracks(album.id, MARKET, 50),
  )) {
    simplifiedTracks.push(item)
  }

  const tracks = await getTracks(
    spotify,
    simplifiedTracks.map(track => track.id),
  )
  albums.push({ ...album, tracks })
}

fs.writeFile("run/albums.json", JSON.stringify(albums, null, 2), err => {
  if (err) {
    console.error(err)
    return
  }
  console.log("File has been created")
})
