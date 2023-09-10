import { render } from "preact"
import Main from "./Main"
import setupPlausible from "./helpers/plausible"
import setupSentry from "./helpers/sentry"
import "./index.css"

setupPlausible()
setupSentry()

render(<Main />, document.getElementById("app"))
