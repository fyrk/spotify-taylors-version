export const PlaylistPlaceholderIcon = (props: { class?: string }) => (
  <div class={props.class + " flex items-center justify-center bg-[#282828]"}>
    <svg
      class="h-[40%] w-[40%]"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="#b3b3b3"
    >
      <path d="M6 3h15v15.167a3.5 3.5 0 11-3.5-3.5H19V5H8v13.167a3.5 3.5 0 11-3.5-3.5H6V3zm0 13.667H4.5a1.5 1.5 0 101.5 1.5v-1.5zm13 0h-1.5a1.5 1.5 0 101.5 1.5v-1.5z"></path>
    </svg>
  </div>
)

export const TrackPlaceholderIcon = (props: { class?: string }) => (
  <div class={props.class + " flex items-center justify-center bg-[#282828]"}>
    <svg
      class="h-[40%] w-[40%]"
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="#b3b3b3"
    >
      <path d="M10 2v9.5a2.75 2.75 0 1 1-2.75-2.75H8.5V2H10zm-1.5 8.25H7.25A1.25 1.25 0 1 0 8.5 11.5v-1.25z"></path>
    </svg>
  </div>
)
