import { SpotifyApi } from "@spotify/web-api-ts-sdk"
import { useState } from "preact/hooks"
import { ScannedPlaylist } from "../../types"
import PlaylistView from "./PlaylistView"

export default function PlaylistEditor({
  playlists,
  onDoReplace, // TODO
  spotify,
}: {
  playlists: ScannedPlaylist[]
  onDoReplace: (playlists: ScannedPlaylist[]) => void
  spotify: SpotifyApi
}) {
  const [extended, setExtended] = useState<string>(null)
  // for every playlist, set of all selected tracks
  // Spotify's API only supports removing all occurrences of the same track in a playlist
  const [selectedTracks, setSelectedTracks] = useState<Set<string>[]>(
    playlists.map(p => new Set(p.replacements.map(r => r.stolen.id))),
  )

  return (
    <div class="w-full grow p-5">
      <div class="mx-auto w-full max-w-4xl">
        {/* TODO: add button */}
        <div class="mb-10 text-center text-xl">
          You can also choose which songs you would like to replace.
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
      </div>
    </div>
  )
}
