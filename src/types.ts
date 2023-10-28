import {
  ExternalUrls,
  Followers,
  Image,
  PlaylistedTrack,
  SimplifiedPlaylist,
  Track,
  UserReference,
} from "@spotify/web-api-ts-sdk"

export interface PreReleaseTrack {
  name: string
  album: {
    name: string
    image: string
    releaseTime: Date
    presaveLink: string
  }
}

/**
 * Information on a stolen track and possible replacements
 */
export interface StolenVariants {
  ids: string[]
  preReleaseTracks?: PreReleaseTrack[]
  // info on stolen track
  isLive?: boolean
  isRemixWithoutTV?: boolean
  isAcousticWithoutTV?: boolean
  isDemoWithoutTV?: boolean
  isMixWithoutTV?: boolean
}

export interface ScanResult {
  playlists: ScannedPlaylist[]
  errors: ScanError[]
}

export interface ScanError {
  playlist: SimplifiedPlaylist
  reason: any
}

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

/**
 * Playlist with complete track information
 */
export interface PlaylistWithTracks extends PlaylistBase {
  tracks: PlaylistedTrack[]
}

/**
 * Playlist with stolen tracks and their possible replacements
 */
export interface ScannedPlaylist extends PlaylistWithTracks {
  stolenTracks: StolenTrack[]
}

export interface StolenTrack {
  position: number
  track: Track
  variants: StolenVariants
}

/**
 * Playlist with stolen tracks to remove and replacements to insert
 * @property newTracks - replacement tracks to insert, ascending by position
 */
export interface PlaylistSelection {
  id: string
  name: string
  snapshot_id: string
  stolenIdsToRemove: string[]
  newTracks: TrackInsert[]
}

export interface TrackInsert {
  position: number
  taylorsVersionId: string
}

export interface ReplaceError {
  playlist: PlaylistSelection
  reason: any
}

/**
 * Progress of a task. `total=0` means the task has just started and progress is unknown.
 */
export interface Progress {
  current: number
  total: number
  text: string
}

export const NO_PROGRESS: Progress = {
  current: 0,
  total: 0,
  text: "",
}
