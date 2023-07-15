import { render } from "preact"
import Router from "preact-router"
import App from "./app/app"
import Home from "./home"
import "./index.css"

const Main = () => (
  <Router>
    <Home path="/" />
    <App path="/app" />
  </Router>
)

render(<Main />, document.getElementById("app"))
