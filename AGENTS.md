# SSM Builder

Standalone single-file HTML app. Keep runtime changes in `SSM-Builder.html`; there is no build step.

## Commands

```bash
npm test
python3 -m http.server 8787 --bind 127.0.0.1
```

Open `http://127.0.0.1:8787/SSM-Builder.html` for browser checks.

## Release Notes Style

When publishing a new GitHub release, write the release body as brief user-facing bullets.

- Use one bullet per meaningful user-facing fix or feature.
- For bug fixes, use this style: `- Fixed an issue where loading spinners could get stuck occasionally`
- For features, use this style: `- Added a new feature to include working-copy comparisons`
- For polish or performance, use this style: `- Improved iPad update downloads`
- Keep bullets short and plain. No implementation details, no test notes, no QA notes, no long explanations.
- Only mention changes included in that version.

Good examples:

```md
- Fixed an issue where loading spinners could get stuck occasionally
- Added support for saving updated HTML files through the iPad share sheet
- Improved hierarchy build progress for large spreadsheets
```

## Release Checklist

For app changes that should reach users through the offline updater:

1. Bump `version` in `package.json`.
2. Bump `APP_VERSION` in `SSM-Builder.html` to the same value.
3. Run `npm test`.
4. Browser-check `SSM-Builder.html`, including an iPad-sized viewport when the change affects layout, loading, downloads, or touch behavior.
5. Commit and push to `main`.
6. Create a GitHub release tag like `v1.0.2` against the current commit.
7. Attach the latest `SSM-Builder.html` as the release asset.
8. Verify `/releases/latest` returns the new tag and includes `SSM-Builder.html`.

Use the release notes style above for the GitHub release body.

Docs-only changes do not need an app version bump or release unless the user specifically asks for one.
