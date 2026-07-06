# Electrical Hierarchies

Standalone HTML tool for building electrical hierarchy outputs from spreadsheet tabs.

## Run

Open `index.html` directly, or serve the folder locally for testing:

```bash
python3 -m http.server 8787 --bind 127.0.0.1
```

## Updates

The app is offline-first. On load it makes one request to:

```text
https://api.github.com/repos/noahfgarrett/electrical-hierarchies/releases/latest
```

If the latest GitHub release tag is newer than `APP_VERSION` and includes a `.html` release asset, the app shows an update modal. Clicking update fetches the release asset through the GitHub API with `Accept: application/octet-stream` and saves it as a local HTML file. On iPad, the app tries the native share sheet first so users can save the HTML into Files. The browser never navigates users to GitHub.

For a new release:

1. Bump `version` in `package.json`.
2. Bump `APP_VERSION` in `index.html` to the same value.
3. Commit and push.
4. Create a GitHub release tag like `v1.0.1`.
5. Attach the latest HTML file as `Electrical-Hierarchies.html`.

Keep a plain `.html` asset attached to every release so older copies can discover updates.
