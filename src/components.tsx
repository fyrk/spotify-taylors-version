import { HeartIcon } from "@heroicons/react/24/solid"
import { JSX } from "preact/jsx-runtime"

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

export const Fallback = ({
  title,
  text,
  error,
}: {
  title?: string
  text?: string
  error?: string
}) => (
  <div class="flex h-screen flex-col items-center justify-center p-10 text-center">
    <h1 class="mb-3 text-4xl">{title || "Something went wrong"}</h1>
    <div class="text-lg text-gray-400">
      {text || "Please try refreshing the page"}
    </div>
    {error && <small class="mt-6 text-red-300">{error}</small>}
  </div>
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

export const Checkbox = (props: JSX.IntrinsicElements["input"]) => {
  if (props.children) {
    return (
      <label class="grid grid-cols-[1rem_1fr] gap-2">
        <input
          {...props}
          type="checkbox"
          class={"cursor-pointer accent-accent " + (props.class || "")}
        />
        <div class="ml-2">{props.children}</div>
      </label>
    )
  } else {
    return (
      <input
        {...props}
        type="checkbox"
        class={"cursor-pointer accent-accent " + (props.class || "")}
      />
    )
  }
}

export const RadioGroup = ({
  name,
  selected,
  options,
  onChange,
  ...props
}: {
  class?: string
  name: string
  selected: string
  options: { value: string; label: string | JSX.Element }[]
  onChange: (value: string) => void
}) => (
  <div class={"flex flex-col gap-2 " + (props.class || "")}>
    {options.map(({ value, label }) => (
      <label class="grid grid-cols-[1rem_1fr] gap-2" key={value}>
        <input
          type="radio"
          name={name}
          checked={value === selected}
          onChange={e => onChange(value)}
          class="mt-[.125rem] h-4 w-4 accent-accent"
        />
        <div>{label}</div>
      </label>
    ))}
  </div>
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
