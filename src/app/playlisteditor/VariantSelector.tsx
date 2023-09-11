import { XMarkIcon } from "@heroicons/react/24/outline"
import { Track } from "@spotify/web-api-ts-sdk"
import { useState } from "preact/hooks"
import { Button, ExternalLink, RadioGroup } from "../../components"
import { ScannedPlaylist } from "../../types"
import TrackView from "./TrackView"

export type VariantSelectMode =
  | "single" // select only replacement for current track
  | "samestolen" // select the replacement for all occurrences of this stolen track
  | "everywhere" // select replacement everywhere it occurs

export default function VariantSelector({
  playlists,
  variantEdit: { playlistIdx, stolenIdx },
  currentVariant,
  taylorsTracks,
  onSelect,
  onClose,
}: {
  playlists: ScannedPlaylist[]
  variantEdit: {
    playlistIdx: number
    stolenIdx: number
  }
  currentVariant: string
  taylorsTracks: Track[]
  onSelect: (newVariant: string, mode: VariantSelectMode) => void
  onClose: () => void
}) {
  const playlist = playlists[playlistIdx]
  const stolen = playlists[playlistIdx].stolenTracks[stolenIdx]

  const [selectedVariant, setSelectedVariant] = useState<string>(currentVariant)

  const [mode, setMode] = useState<VariantSelectMode>("samestolen")

  return (
    <div
      class="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black bg-opacity-80 p-6"
      onClick={onClose}
    >
      <div
        class="max-h-full max-w-xl overflow-y-scroll rounded-3xl bg-neutral-900 p-5 shadow-lg shadow-neutral-950 sm:p-8"
        onClick={e => e.stopPropagation()}
      >
        <div class="mb-8 flex flex-col pl-3">
          <div class="mb-4 text-xl font-semibold">
            <div class="float-right ml-2">
              <button class="h-6 w-6 align-middle" onClick={onClose}>
                <XMarkIcon class="h-6 w-6" />
              </button>
            </div>
            <div>Choose variant for</div>
          </div>
          <div class="grid grid-cols-[2rem_1fr] items-center gap-y-3">
            <div class="flex h-12 w-8 items-center place-self-start pr-3 text-right leading-[3rem] text-neutral-400">
              <div class="grow">{stolen.position}</div>
            </div>
            <div>
              <TrackView track={stolen.track} addLinks={false} />
            </div>
          </div>
          <div class="mt-3 min-w-0">
            <div class="overflow-hidden text-ellipsis whitespace-nowrap">
              from{" "}
              <ExternalLink
                href={playlist.external_urls.spotify}
                class="text-accent hover:underline"
              >
                {playlist.name}
              </ExternalLink>
            </div>
          </div>
        </div>

        <div class="mb-8 flex flex-col gap-4">
          {stolen.variants.ids.map((variant, i) => {
            const track = taylorsTracks[i] || null
            return (
              <button
                class={
                  "flex items-center gap-3 rounded-xl border-[3px] bg-neutral-800 p-3 shadow-sm shadow-neutral-950 hover:bg-neutral-750 " +
                  (variant === selectedVariant
                    ? "border-accent"
                    : "border-neutral-800 hover:border-neutral-750")
                }
                onClick={() => setSelectedVariant(variant)}
              >
                <TrackView track={track} addLinks={false} />
              </button>
            )
          })}
        </div>

        <RadioGroup
          class="mb-8 pl-3"
          name="replacement-mode"
          selected={mode}
          options={[
            {
              value: "single",
              label: <>Use variant only here</>,
            },
            {
              value: "samestolen",
              label: (
                <>
                  Use variant for every occurrence of{" "}
                  <span class="italic">
                    {stolen.track.name}&nbsp;• {stolen.track.album.name}
                  </span>
                </>
              ),
            },
            {
              value: "everywhere",
              label: <>Use variant as standard replacement</>,
            },
          ]}
          onChange={mode => setMode(mode as VariantSelectMode)}
        />

        <Button
          class="text-x mb-2 w-full py-2"
          onClick={() => onSelect(selectedVariant, mode)}
        >
          Set variant
        </Button>
      </div>
    </div>
  )
}
