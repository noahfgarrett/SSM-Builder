# SSM Builder

Standalone HTML tool for building electrical hierarchy outputs from spreadsheet tabs.

## Run

Open `SSM-Builder.html` directly, or serve the folder locally for testing:

```bash
python3 -m http.server 8787 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:8787/SSM-Builder.html`.

## Updates

The standalone HTML app is offline-first. On load it makes one request to:

```text
https://api.github.com/repos/noahfgarrett/SSM-Builder/releases/latest
```

If the latest GitHub release tag is newer than `APP_VERSION` and includes a `.html` release asset, the app shows an update modal. Clicking update fetches the release asset through the GitHub API with `Accept: application/octet-stream` and saves it as a local HTML file. The browser never navigates users to GitHub.

For a new release:

1. Bump `version` in `package.json`.
2. Bump `APP_VERSION` in `SSM-Builder.html` to the same value.
3. Commit and push.
4. Create a GitHub release tag like `v1.0.1`.
5. Attach the latest HTML file as `SSM-Builder.html`.

Keep a plain `.html` asset attached to every release so older copies can discover updates.

## GitHub Pages PWA

GitHub Pages publishing is manual-only. The workflow at `.github/workflows/deploy-pages.yml` only runs from `workflow_dispatch`, so app releases and pushes to `main` do not automatically update the PWA.

When you intentionally want to refresh the PWA, run **Deploy PWA to GitHub Pages** from the Actions tab. The workflow copies `SSM-Builder.html` to `index.html`, injects the PWA manifest and service worker, and deploys that static shell to Pages.
