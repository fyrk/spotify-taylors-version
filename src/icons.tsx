export const HeartIcon = (props: { class: string }) => (
  <svg
    class={"h-5 w-5 " + props.class}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
  </svg>
)

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
