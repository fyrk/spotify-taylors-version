import { SpotifyApi, Track } from "@spotify/web-api-ts-sdk"
import { useEffect, useMemo, useState } from "preact/hooks"
import { TrackCache } from "../../api"
import { Button, Checkbox } from "../../components"
import { PreReleaseTrack, ScanResult, StolenVariants } from "../../types"
import PlaylistView from "./PlaylistView"
import VariantSelector from "./VariantSelector"
import spotifyLogoGreen from "/img/spotify_logo_green.svg?url"

export interface ReplaceViewData {
  position: number
  track: Track
  isPreReleaseOnly: boolean
  tv: Track | null
  preReleaseTv: PreReleaseTrack | null
  hasMultipleVariants: boolean
}

const SELECTION_CATEGORIES = [
  {
    label: "Replace original live releases",
    predicate: (s: StolenVariants) => s.isLive,
  },
  {
    label: "Replace original remixes",
    predicate: (s: StolenVariants) => s.isRemix,
  },
  {
    label: (
      <>
        Replace original special releases that don’t have a Taylor’s Version
        variant <small>(SN&nbsp;Acoustics, Pop&nbsp;Mixes, Demos)</small>
      </>
    ),
    predicate: (s: StolenVariants) =>
      s.isAcousticWithoutTV || s.isDemoWithoutTV || s.isMixWithoutTV,
  },
]

export default function PlaylistEditor({
  scanResult,
  onDoReplace,
  spotify,
}: {
  scanResult: ScanResult
  onDoReplace: (
    selectedTracks: Set<string>[],
    selectedVariants: string[][],
  ) => void
  spotify: SpotifyApi
}) {
  const { playlists, errors } = scanResult

  const [expanded, setExpanded] = useState<string>(null)

  // ========================
  // TRACK SELECTION
  // for every playlist, set of all selected tracks
  // Spotify's API only supports removing all occurrences of the same track in a playlist
  const [selectedTracks, setSelectedTracks] = useState<Set<string>[]>(
    playlists.map(
      p =>
        new Set(
          p.stolenTracks
            .filter(s => s.variants.ids.length > 0)
            .map(s => s.track.id),
        ),
    ),
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

  // special selection categories
  const _createCategory = (p: (s: StolenVariants) => boolean) => {
    const [exists, isAllSelected, isIndeterminate] = useMemo(() => {
      let exists = false // whether tracks in this category exist
      let isAllSelected = true // whether all tracks in this category are selected
      let isSomeSelected = false // whether some tracks in this category are selected
      playlists.forEach((playlist, i) => {
        for (const stolen of playlist.stolenTracks) {
          // variants is empty if track only has pre-release replacements
          if (p(stolen.variants) && stolen.variants.ids.length > 0) {
            exists = true
            if (!selectedTracks[i].has(stolen.track.id)) {
              isAllSelected = false
            }
            if (selectedTracks[i].has(stolen.track.id)) {
              isSomeSelected = true
            }
          }
        }
      })
      return [exists, isAllSelected, !isAllSelected && isSomeSelected]
    }, [playlists, selectedTracks])

    const toggle = (selected: boolean) => {
      if (selected) {
        setSelectedTracks(old =>
          old.map((s, i) => {
            const newS = new Set(s)
            playlists[i].stolenTracks.forEach(
              s =>
                p(s.variants) &&
                s.variants.ids.length > 0 &&
                newS.add(s.track.id),
            )
            return newS
          }),
        )
      } else {
        setSelectedTracks(old =>
          old.map((s, i) => {
            const newS = new Set(s)
            playlists[i].stolenTracks.forEach(
              s =>
                p(s.variants) &&
                s.variants.ids.length > 0 &&
                newS.delete(s.track.id),
            )
            return newS
          }),
        )
      }
    }
    return { exists, isAllSelected, isIndeterminate, toggle }
  }

  const selectionCategories = SELECTION_CATEGORIES.map(c => ({
    ...c,
    ..._createCategory(c.predicate),
  })).filter(c => c.exists)

  // ========================
  // VARIANT EDITING
  const [variantEdit, setVariantEdit] = useState<{
    playlistIdx: number
    stolenIdx: number
  } | null>(null)

  // for every playlist, for every stolen track, track id of selected variant
  // might be undefined if track only has pre-release replacements
  const [selectedVariants, setSelectedVariants] = useState<string[][]>(
    playlists.map(p => p.stolenTracks.map(s => s.variants.ids[0])),
  )

  useEffect(() => {
    if (variantEdit) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
  }, [variantEdit])

  // ========================
  // CACHING
  const trackCache = useState(new TrackCache(spotify))[0]
  // for every playlist, whether TV tracks are in cache
  const [hasLoadedTvTracks, setHasLoadedTvTracks] = useState<boolean[]>(
    Array(playlists.length).fill(false),
  )

  const stolenTrackViewData: ReplaceViewData[][] = useMemo(
    () =>
      playlists.map((p, pi) =>
        p.stolenTracks.map((s, si) => {
          if (s.variants.ids.length > 0) {
            return {
              position: s.position,
              track: s.track,
              isPreReleaseOnly: false,
              tv: trackCache.tryGet(selectedVariants[pi][si]),
              preReleaseTv: null,
              hasMultipleVariants: s.variants.ids.length > 1,
            }
          } else {
            return {
              position: s.position,
              track: s.track,
              isPreReleaseOnly: true,
              tv: null,
              preReleaseTv: s.variants.preReleaseTracks[0],
              hasMultipleVariants: false,
            }
          }
        }),
      ),
    [playlists, trackCache, selectedVariants, hasLoadedTvTracks],
  )

  return (
    <div class="w-full grow p-3 pt-12">
      <div class="mx-auto w-full max-w-4xl">
        <div class="mb-12 text-center">
          <Button
            class="bg-accent disabled:bg-neutral-600"
            onClick={() => onDoReplace(selectedTracks, selectedVariants)}
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
        <div class="mx-auto mb-10 max-w-lg text-center text-lg sm:text-xl">
          <p class="mb-3">
            Select which songs you would like to replace below.
            <br />
            Tap on a playlist to select individual tracks.
          </p>
          <p>
            If there are multiple Taylor’s Version releases, you can also
            flexibly choose a variant.
          </p>
        </div>

        {selectionCategories.length > 0 && (
          <div class="mb-10 flex flex-col gap-2 px-6 text-lg">
            {selectionCategories.map(c => (
              <Checkbox
                inputClass="mt-[.125rem] h-6 w-6"
                checked={c.isAllSelected}
                indeterminate={c.isIndeterminate}
                onChange={e => c.toggle(e.currentTarget.checked)}
              >
                {c.label}
              </Checkbox>
            ))}
          </div>
        )}

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
                    .getMany(p.stolenTracks.map(s => s.variants.ids).flat())
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
                            playlists[i].stolenTracks
                              .filter(s => s.variants.ids.length > 0)
                              .map(s => s.track.id),
                          )
                        : new Set()
                      : s,
                  ),
                )
              }}
              onSelectTrack={(trackId: string, selected: boolean) => {
                // assert track has released replacements
                if (
                  !playlists.some(p =>
                    p.stolenTracks.some(
                      s => s.track.id === trackId && s.variants.ids.length > 0,
                    ),
                  )
                ) {
                  throw new Error(
                    `Track ${trackId} has no released replacements and should not be selected`,
                  )
                }
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
              openVariantSelector={(stolenIdx: number) =>
                setVariantEdit({ playlistIdx: pi, stolenIdx })
              }
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

      {variantEdit && (
        <VariantSelector
          playlists={playlists}
          variantEdit={variantEdit}
          currentVariant={
            selectedVariants[variantEdit.playlistIdx][variantEdit.stolenIdx]
          }
          taylorsTracks={trackCache.tryGetMany(
            playlists[variantEdit.playlistIdx].stolenTracks[
              variantEdit.stolenIdx
            ].variants.ids,
          )}
          onSelect={(newVariant, mode) => {
            setSelectedVariants(svs => {
              let newSvs: string[][]
              switch (mode) {
                case "single":
                  newSvs = [...svs]
                  newSvs[variantEdit.playlistIdx] = [
                    ...svs[variantEdit.playlistIdx],
                  ]
                  newSvs[variantEdit.playlistIdx][variantEdit.stolenIdx] =
                    newVariant
                  break

                case "samestolen":
                  const stolen =
                    playlists[variantEdit.playlistIdx].stolenTracks[
                      variantEdit.stolenIdx
                    ]
                  newSvs = svs.map((p, playlistIndex) => {
                    const playlist = playlists[playlistIndex]
                    return p.map((variant, stolenIdx) =>
                      playlist.stolenTracks[stolenIdx].track.id ===
                      stolen.track.id
                        ? newVariant
                        : variant,
                    )
                  })
                  break

                case "everywhere":
                  newSvs = svs.map((p, playlistIndex) => {
                    const playlist = playlists[playlistIndex]
                    return p.map((variant, stolenIdx) =>
                      playlist.stolenTracks[stolenIdx].variants.ids.includes(
                        newVariant,
                      )
                        ? newVariant
                        : variant,
                    )
                  })
                  break
              }
              return newSvs
            })
            setVariantEdit(null)
          }}
          onClose={() => setVariantEdit(null)}
        />
      )}
    </div>
  )
}
