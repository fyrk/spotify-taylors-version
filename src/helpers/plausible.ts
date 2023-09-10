import * as Sentry from "@sentry/react"
import Plausible, { EventOptions, PlausibleOptions } from "plausible-tracker"

// not exported in plausible-tracker
type TrackEvent = (
  eventName: string,
  options?: EventOptions,
  eventData?: PlausibleOptions,
) => void

let _trackPlausibleEvent: TrackEvent | undefined

export const trackPlausibleEvent: TrackEvent = (
  eventName: string,
  options?: EventOptions,
  eventData?: PlausibleOptions,
) => {
  try {
    if (!_trackPlausibleEvent) setupPlausible()
    _trackPlausibleEvent && _trackPlausibleEvent(eventName, options, eventData)
  } catch (e) {
    Sentry.captureException(e)
  }
}

export default function setupPlausible() {
  if (import.meta.env.VITE_PLAUSIBLE_DOMAIN) {
    const plausible = Plausible({
      domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN,
      apiHost:
        import.meta.env.VITE_PLAUSIBLE_API_HOST || "https://plausible.io",
      trackLocalhost: true,
    })
    plausible.enableAutoPageviews()
    // breaks target="_blank" https://github.com/plausible/plausible-tracker/issues/12
    //plausible.enableAutoOutboundTracking()
    _trackPlausibleEvent = plausible.trackEvent
  }
}
