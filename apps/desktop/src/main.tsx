import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import "./styles/index.css"

const storedTheme = typeof window !== "undefined" ? localStorage.getItem("theme") : null
document.documentElement.className = storedTheme === "light" || storedTheme === "dark" ? storedTheme : "dark"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
