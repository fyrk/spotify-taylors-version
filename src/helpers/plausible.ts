import * as Sentry from "@sentry/react"
// use client from PR [0]
// until plausible-tracker supports navigator.sendBeacon [1]
// and doesn't break target="_blank" [2]
// when removing, also remove submodules: true from checkout in deploy workflow
// [0] https://github.com/plausible/plausible-tracker/pull/54
// [1] https://github.com/plausible/plausible-tracker/issues/12
// [2] https://github.com/plausible/plausible-tracker/issues/12
import Plausible, {
  EventOptions,
  PlausibleOptions,
} from "./plausible-tracker-sendbeacon/src"

export enum PlausibleEvent {
  LoginClick = "Login click", // User clicked Login button
  AuthFailed = "Authentication failed", // Authentication after clicking Login button failed
  AuthError = "Authentication error", // Authentication error reported by Spotify after redirection
  Authenticated = "Authenticated", // User entered page already authenticated (i.e. after redirect from Spotify or page reload)
  Logout = "Logout", // User clicked Logout button
  PlaylistsUpdated = "Playlists updated", // Playlists updated successfully
}

// not exported in plausible-tracker
type TrackEvent = (
  eventName: string,
  options?: EventOptions,
  eventData?: PlausibleOptions,
) => void
let _trackPlausibleEvent: TrackEvent | undefined

export default function setupPlausible() {
  if (import.meta.env.VITE_PLAUSIBLE_DOMAIN) {
    const plausible = Plausible({
      domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN,
      apiHost:
        import.meta.env.VITE_PLAUSIBLE_API_HOST || "https://plausible.io",
      trackLocalhost: true,
      useSendBeacon: true,
    })
    plausible.enableAutoPageviews()
    plausible.enableAutoOutboundTracking()
    _trackPlausibleEvent = plausible.trackEvent
  }
}

export const trackPlausibleEvent = (
  eventName: PlausibleEvent,
  eventData?: EventOptions,
  options?: PlausibleOptions,
) => {
  try {
    if (!_trackPlausibleEvent) setupPlausible()
    _trackPlausibleEvent && _trackPlausibleEvent(eventName, eventData, options)
  } catch (e) {
    Sentry.captureException(e)
  }
}

const floorToFirstDigit = (n: number) => {
  if (n === 0) return 0
  const x = 10 ** Math.floor(Math.log10(n))
  return Math.floor(n / x) * x
}

const formatRoundPercent = (n: number) => {
  if (n <= 0) return "0%"
  if (n >= 1) return "100%"
  return `<${Math.ceil(n / 0.1) * 10}%`
}

export const trackPlausibleEventPlaylistsUpdated = (
  replacedPlaylistsCount: number,
  replacedTrackCount: number,
  totalTrackCount: number,
  selectionCategories: { [name: string]: string },
) => {
  trackPlausibleEvent(PlausibleEvent.PlaylistsUpdated, {
    props: {
      "count-playlists": floorToFirstDigit(replacedPlaylistsCount),
      "count-tracks": floorToFirstDigit(replacedTrackCount),
      "percent-selected": formatRoundPercent(
        replacedTrackCount / totalTrackCount,
      ),
      ...selectionCategories,
    },
  })
}
