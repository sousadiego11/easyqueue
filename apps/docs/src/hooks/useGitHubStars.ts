import { useState, useEffect } from "react"

const API = "https://api.github.com/repos/sousadiego11/easyqueue"

export function useGitHubStars() {
  const [stars, setStars] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(API, { headers: { Accept: "application/vnd.github.v3+json" } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return
        if (typeof data?.stargazers_count === "number") {
          setStars(data.stargazers_count)
        }
      })
      .catch(() => {
        /* fallback silencioso */
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { stars }
}
