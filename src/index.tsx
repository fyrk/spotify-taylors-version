import { render } from "preact"
import Main from "./Main"
import setupPlausible from "./helpers/plausible"
import setupSentry from "./helpers/sentry"
import { UnleashWrapper } from "./helpers/unleash"
import "./index.css"

setupPlausible()
setupSentry()

render(
  <UnleashWrapper>
    <Main />
  </UnleashWrapper>,
  document.getElementById("app"),
)
