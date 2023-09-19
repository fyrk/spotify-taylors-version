import { ArrowRightIcon, PencilSquareIcon } from "@heroicons/react/20/solid"
import { Checkbox } from "../../components"
import { ReplaceViewData } from "./PlaylistEditor"
import TrackView from "./TrackView"

export default function ReplacementView({
  stolen: {
    position,
    track,
    tv: replacement,
    hasMultipleVariants: hasMultipleReplacements,
  },
  selected,
  onSelect,
  onOpenReplacementEditor: onOpenVariantEditor,
}: {
  stolen: ReplaceViewData
  selected: boolean
  onSelect: (selected: boolean) => void
  onOpenReplacementEditor: () => void
}) {
  return (
    // grid  <sm: position (1), stolen (2-3), arrow (4), tv (5-6), edit (7), checkbox (8)
    // grid >=sm: position (1), stolen (2-7), checkbox (8)\ arrow (2), tv (3-7), edit (8)
    <div class="my-8 grid grid-cols-[2rem_3rem_1fr_3rem_3rem_1fr_2.25rem_1.5rem] items-center gap-y-3 first:mt-0 last:mb-0">
      <div class="flex h-12 w-8 items-center place-self-start pr-3 text-right leading-[3rem] text-neutral-400">
        <div class="grow">{position}</div>
      </div>
      <div class="col-span-6 pr-3 sm:col-span-2 sm:pr-0">
        <TrackView track={track} />
      </div>
      <div class="col-start-2 h-5 w-5 place-self-center sm:col-start-auto">
        <ArrowRightIcon class="h-5 w-5" />
      </div>
      <div
        class={
          "col-span-5 px-3 sm:pl-0 " +
          (hasMultipleReplacements ? "sm:col-span-2" : "sm:col-span-3")
        }
      >
        <TrackView track={replacement} />
      </div>
      {hasMultipleReplacements && (
        <div class="col-start-8 row-start-2 self-start sm:col-start-7 sm:row-start-1 sm:self-center sm:pb-[.125rem]">
          {/* 1.4rem = line height, to align with song title */}
          <button
            class="flex h-[1.4rem] items-center"
            title="Select Variant"
            onClick={onOpenVariantEditor}
          >
            <PencilSquareIcon class="h-5 w-5" />
          </button>
        </div>
      )}
      <div class="col-start-8 row-start-1 h-6 w-6 self-center">
        <Checkbox
          inputClass="h-6 w-6"
          checked={selected}
          onChange={e => onSelect(e.currentTarget.checked)}
        />
      </div>
    </div>
  )
}
