import { JSX } from "preact/jsx-runtime"
import { HeartIcon } from "./icons"

export const Scaffold = ({ children }) => (
  <main class="flex h-full flex-col items-center justify-between">
    {children}
    <div class="mt-16 pb-8 text-center">
      <p class="mb-2">
        Made with <HeartIcon class="inline h-6 w-6 text-accent" /> by{" "}
        <ExternalLink href="https://github.com/FlorianRaediker">
          flo (Taylor’s Version)
        </ExternalLink>
      </p>

      <p class="mx-auto max-w-xs">
        <small class="">
          This is a Swiftie-made project neither affiliated with nor endorsed by
          Spotify or Taylor Swift.
        </small>
      </p>
    </div>
  </main>
)

export const ExternalLink = ({
  href,
  ...props
}: {
  href: string
} & JSX.IntrinsicElements["a"]) => (
  <a
    class="text-accent hover:underline"
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    {...props}
  />
)

export const Checkbox = (props: JSX.IntrinsicElements["input"]) => (
  <input type="checkbox" {...props} class={"accent-accent " + props.class} />
)

export const BaseButton = (props: JSX.IntrinsicElements["button"]) => (
  <button
    {...props}
    class={
      "whitespace-nowrap rounded-full " +
      props.class +
      " hover:enabled:brightness-[1.065]"
    }
  />
)

export const Button = (props: JSX.IntrinsicElements["button"]) => (
  <button
    {...props}
    class={
      "whitespace-nowrap rounded-full bg-accent p-5 text-2xl shadow-md shadow-neutral-950 " +
      props.class +
      " hover:enabled:brightness-[1.065]"
    }
  />
)
