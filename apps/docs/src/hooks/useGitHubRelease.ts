import { useState, useEffect } from "react"

const FALLBACK_VERSION = "1.3.0"
const API = "https://api.github.com/repos/sousadiego11/easyqueue/releases/latest"

export function useGitHubRelease() {
  const [version, setVersion] = useState(FALLBACK_VERSION)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(API, { headers: { Accept: "application/vnd.github.v3+json" } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return
        if (data?.tag_name) {
          setVersion(data.tag_name.replace(/^v/, ""))
        }
      })
      .catch(() => {
        /* fallback silencioso */
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { version, loading }
}
