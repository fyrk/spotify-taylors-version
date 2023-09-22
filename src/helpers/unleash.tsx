import { FlagProvider, useVariant } from "@unleash/proxy-client-react"
import { VariantSelectMode } from "../app/playlisteditor/VariantSelector"

export const UnleashWrapper = ({ children }) => {
  if (
    !import.meta.env.VITE_UNLEASH_URL ||
    !import.meta.env.VITE_UNLEASH_CLIENT_KEY
  ) {
    return children
  }
  return (
    <FlagProvider
      config={{
        url: import.meta.env.VITE_UNLEASH_URL,
        clientKey: import.meta.env.VITE_UNLEASH_CLIENT_KEY,
        disableRefresh: true,
        environment: import.meta.env.PROD ? "production" : "development",
        appName: "taylorsversion",
      }}
    >
      {children}
    </FlagProvider>
  )
}

export type UnleashVariantSelectModes = {
  name: string
  defaultMode: VariantSelectMode
}

const UNLEASH_VARIANT_SELECT_MODES: {
  [key: string]: UnleashVariantSelectModes
} = {
  "single-samestolen-everywhere": {
    name: "single-samestolen-everywhere",
    defaultMode: "samestolen",
  },
  "single-everywhere": {
    name: "single-everywhere",
    defaultMode: "everywhere",
  },
  "single-samestolen": {
    name: "single-samestolen",
    defaultMode: "samestolen",
  },
} as const

export function useUnleashVariantSelectModes(): UnleashVariantSelectModes {
  try {
    const variantName = useVariant("taylorsversion.variant-select-modes").name
    return (
      UNLEASH_VARIANT_SELECT_MODES[variantName] ||
      UNLEASH_VARIANT_SELECT_MODES["single-samestolen-everywhere"]
    )
  } catch (e) {
    return UNLEASH_VARIANT_SELECT_MODES["single-samestolen-everywhere"]
  }
}
