import {
  ExternalUrls,
  Followers,
  Image,
  PlaylistedTrack,
  Track,
  UserReference,
} from "@spotify/web-api-ts-sdk"

interface PlaylistBase {
  // not exported in @spotify/web-api-ts-sdk/dist/mjs/types
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
}

export interface PlaylistWithTracks extends PlaylistBase {
  tracks: PlaylistedTrack[]
}

export interface ScannedPlaylist extends PlaylistBase {
  replacements: TrackReplacements[]
}

export interface TrackReplacements {
  position: number
  stolen: Track
  taylorsVersionIds: string[]
}

export interface Progress {
  current: number
  total: number
  text: string
}
