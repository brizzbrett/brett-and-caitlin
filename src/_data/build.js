// An id for this build: the commit being deployed on GitHub Actions, or a timestamp locally.
// The page carries it, and build.json publishes the latest one, so site.js can tell when a newer version is live.
export default {
  id: (process.env.GITHUB_SHA || String(Date.now())).slice(0, 12),
};
