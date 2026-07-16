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
7. Attach the latest HTML as a versioned release asset such as `SSM-Builder-v1.1.3.html`.
8. Verify `/releases/latest` returns the new tag and includes the versioned HTML asset.
9. Verify the **Deploy PWA to GitHub Pages** workflow completed for the `main` push.

Use the release notes style above for the GitHub release body.

Docs-only changes do not need an app version bump or release unless the user specifically asks for one.

## GitHub Pages PWA

GitHub Pages is for the mobile PWA and publishes automatically when app/PWA files are pushed to `main`.

- Keep the `push` trigger scoped to `main` and app/PWA paths in `.github/workflows/deploy-pages.yml`.
- Do not add scheduled triggers.
- After pushing app changes to `main`, confirm the Pages deploy finished successfully.
- Use manual `workflow_dispatch` only to backfill or when Noah explicitly asks to redeploy the PWA.
- The Pages workflow copies `SSM-Builder.html` into a PWA shell and injects the `ssm-builder-pwa` marker so the standalone HTML update modal stays out of the PWA.
