import { SpotifyApi, Track } from "@spotify/web-api-ts-sdk"
import { useMemo, useState } from "preact/hooks"
import { TrackCache } from "../../api"
import { Button } from "../../components"
import { ScanResult } from "../../types"
import PlaylistView from "./PlaylistView"
import spotifyLogoGreen from "/img/spotify_logo_green.svg?url"

export interface StolenTrackViewData {
  position: number
  stolen: Track
  tv: Track | null
  hasMultipleReplacements: boolean
}

export default function PlaylistEditor({
  scanResult,
  onDoReplace,
  spotify,
}: {
  scanResult: ScanResult
  onDoReplace: (selectedTracks: Set<string>[]) => void
  spotify: SpotifyApi
}) {
  const { playlists, errors } = scanResult

  const [expanded, setExpanded] = useState<string>(null)

  // for every playlist, set of all selected tracks
  // Spotify's API only supports removing all occurrences of the same track in a playlist
  const [selectedTracks, setSelectedTracks] = useState<Set<string>[]>(
    playlists.map(p => new Set(p.stolenTracks.map(r => r.track.id))),
  )

  const songsToReplaceCount = useMemo(() => {
    const countItems = <T,>(a: Array<T>, p: (x: T) => boolean): number =>
      a.reduce((sum, x) => (p(x) ? sum + 1 : sum), 0)
    return playlists.reduce(
      (sum, p, i) =>
        sum +
        countItems(p.stolenTracks, s => selectedTracks[i].has(s.track.id)),
      0,
    )
  }, [playlists, selectedTracks])

  const [replacementEdit, setReplacementEdit] = useState<{
    playlistIdx: number
    stolenIdx: number
  } | null>(null)

  const [selectedReplacements, setSelectedReplacements] = useState<string[][]>(
    playlists.map(p => p.stolenTracks.map(s => s.replacements.ids[0])),
  )

  const trackCache = useState(new TrackCache(spotify))[0]
  // for every playlist, whether TV tracks are in cache
  const [hasLoadedTvTracks, setHasLoadedTvTracks] = useState<boolean[]>(
    Array(playlists.length).fill(false),
  )

  const stolenTrackViewData = useMemo(
    () =>
      playlists.map((p, pi) =>
        p.stolenTracks.map((s, si) => ({
          position: s.position,
          stolen: s.track,
          tv: trackCache.tryGet(selectedReplacements[pi][si]),
          hasMultipleReplacements: s.replacements.ids.length > 1,
        })),
      ),
    [playlists, trackCache, selectedReplacements, hasLoadedTvTracks],
  )

  return (
    <div class="w-full grow p-3 pt-12">
      <div class="mx-auto w-full max-w-4xl">
        <div class="mb-12 text-center">
          <Button
            class="bg-accent disabled:bg-neutral-600"
            onClick={() => onDoReplace(selectedTracks)}
            disabled={songsToReplaceCount === 0}
          >
            {songsToReplaceCount === 0 ? (
              "No songs selected"
            ) : (
              <>
                Replace {songsToReplaceCount || ""}{" "}
                {songsToReplaceCount === 1 ? "song" : "songs"}
              </>
            )}
          </Button>
        </div>
        <div class="mb-10 text-center text-lg sm:text-xl">
          Choose which songs you would like to replace below.
          <br />
          Tap on a playlist to select individual tracks.
        </div>
        <div>
          {playlists.map((p, pi) => (
            <PlaylistView
              playlist={p}
              stolenTracks={stolenTrackViewData[pi]}
              selection={selectedTracks[pi]}
              isExpanded={expanded === p.id}
              onToggle={() => {
                if (expanded === p.id) {
                  setExpanded(null)
                } else {
                  setExpanded(p.id)
                  trackCache
                    .getMany(p.stolenTracks.map(s => s.replacements.ids).flat())
                    .then(() => {
                      setHasLoadedTvTracks(hlt => {
                        const newHlt = [...hlt]
                        newHlt[pi] = true
                        return newHlt
                      })
                    })
                }
              }}
              onSelectPlaylist={(selected: boolean) => {
                setSelectedTracks(
                  selectedTracks.map((s, i) =>
                    i === pi
                      ? selected
                        ? new Set(
                            playlists[i].stolenTracks.map(r => r.track.id),
                          )
                        : new Set()
                      : s,
                  ),
                )
              }}
              onSelectTrack={(trackId: string, selected: boolean) => {
                const setRemove = <T,>(s: Set<T>, v: T): Set<T> => {
                  const newSet = new Set(s)
                  newSet.delete(v)
                  return newSet
                }
                setSelectedTracks(
                  selectedTracks.map((s, i) =>
                    i === pi
                      ? selected
                        ? new Set(s).add(trackId)
                        : setRemove(s, trackId)
                      : s,
                  ),
                )
              }}
              onOpenReplacementEditor={(stolenIdx: number) =>
                setReplacementEdit({ playlistIdx: pi, stolenIdx })
              }
              spotify={spotify}
            />
          ))}
        </div>
        {errors.length > 0 && (
          <div class="mt-10 text-center text-red-300">
            {errors.length} {errors.length === 1 ? "playlist" : "playlists"}{" "}
            could not be scanned:{" "}
            {errors.map(e => e.playlist.name.toString()).join(", ")}
          </div>
        )}
        <div class="mb-8 mt-16 text-center">
          {/* see https://developer.spotify.com/documentation/design#using-our-content */}
          <div>Music data from the official API of</div>
          <img
            src={spotifyLogoGreen}
            class="mt-[35px] inline h-[70px]"
            alt="Spotify Green Logo"
          />
        </div>
      </div>

      {/* dialog for track replacement editor */}
    </div>
  )
}
