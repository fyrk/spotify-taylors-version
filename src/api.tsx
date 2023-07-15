import { Scopes, SpotifyApi } from "@spotify/web-api-ts-sdk"
import { IRedirectionStrategy } from "../node_modules/@spotify/web-api-ts-sdk/src/types"
export const createApiClient = (
  redirectionStrategy: IRedirectionStrategy = null,
) => {
  let config = {}
  if (redirectionStrategy) {
    config = { redirectionStrategy }
  }
  return SpotifyApi.withUserAuthorization(
    import.meta.env.VITE_SPOTIFY_CLIENT_ID,
    "http://localhost:3000/app",
    Scopes.all,
    config,
  )
}
