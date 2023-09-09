import { SpotifyApi } from "@spotify/web-api-ts-sdk"
import { useMemo, useState } from "preact/hooks"
import { Button } from "../../components"
import { ScanResult } from "../../types"
import PlaylistView from "./PlaylistView"
import spotifyLogoGreen from "/img/spotify_logo_green.svg?url"

export default function PlaylistEditor({
  scanResult,
  onDoReplace, // TODO
  spotify,
}: {
  scanResult: ScanResult
  onDoReplace: (selectedTracks: Set<string>[]) => void
  spotify: SpotifyApi
}) {
  const { playlists, errors } = scanResult

  const [extended, setExtended] = useState<string>(null)
  // for every playlist, set of all selected tracks
  // Spotify's API only supports removing all occurrences of the same track in a playlist
  const [selectedTracks, setSelectedTracks] = useState<Set<string>[]>(
    playlists.map(p => new Set(p.replacements.map(r => r.stolen.id))),
  )

  const countItems = <T,>(a: Array<T>, f: (x: T) => boolean): number =>
    a.reduce((sum, x) => (f(x) ? sum + 1 : sum), 0)

  const songsToReplace = useMemo(
    () =>
      playlists.reduce(
        (sum, p, i) =>
          sum +
          countItems(p.replacements, r => selectedTracks[i].has(r.stolen.id)),
        0,
      ),
    [playlists, selectedTracks],
  )

  return (
    <div class="w-full grow p-5 pt-12">
      <div class="mx-auto w-full max-w-4xl">
        <div class="mb-12 text-center">
          <Button
            class="bg-accent disabled:bg-neutral-600"
            onClick={() => onDoReplace(selectedTracks)}
            disabled={songsToReplace === 0}
          >
            {songsToReplace === 0 ? (
              "No songs selected"
            ) : (
              <>Replace {songsToReplace || ""} songs</>
            )}
          </Button>
        </div>
        <div class="mb-10 text-center text-lg sm:text-xl">
          Choose which songs you would like to replace below.
          <br />
          Tap on a playlist to select individual tracks.
        </div>
        <div>
          {playlists.map((playlist, playlistIndex) => (
            <PlaylistView
              playlist={playlist}
              selection={selectedTracks[playlistIndex]}
              isExtended={extended === playlist.id}
              onToggle={() =>
                extended === playlist.id
                  ? setExtended(null)
                  : setExtended(playlist.id)
              }
              onSelectPlaylist={(selected: boolean) => {
                setSelectedTracks(
                  selectedTracks.map((s, i) =>
                    i === playlistIndex
                      ? selected
                        ? new Set(
                            playlists[i].replacements.map(r => r.stolen.id),
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
                    i === playlistIndex
                      ? selected
                        ? new Set(s).add(trackId)
                        : setRemove(s, trackId)
                      : s,
                  ),
                )
              }}
              spotify={spotify}
            />
          ))}
        </div>
        {errors.length > 0 && (
          <div class="mt-10 text-center text-red-300">
            {errors.length} {errors.length === 1 ? "playlist" : "playlists"}{" "}
            could not be scanned:{" "}
            {errors.map(e => e.reason.toString()).join(", ")}
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
    </div>
  )
}
