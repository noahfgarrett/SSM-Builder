import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const html = readFileSync(resolve(rootDir, 'SSM-Builder.html'), 'utf8')
const pkg = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf8'))

test('offline updater checks the SSM-Builder GitHub release once on boot', () => {
  assert.match(html, /<title>SSM Builder<\/title>/)
  assert.match(html, /<h1>SSM Builder<\/h1>/)
  assert.match(html, new RegExp(`const APP_VERSION = '${pkg.version.replaceAll('.', '\\.')}'`))
  assert.match(
    html,
    /const UPDATE_RELEASE_API = 'https:\/\/api\.github\.com\/repos\/noahfgarrett\/SSM-Builder\/releases\/latest'/,
  )
  assert.match(
    html,
    /const UPDATE_RAW_BASE = 'https:\/\/raw\.githubusercontent\.com\/noahfgarrett\/SSM-Builder'/,
  )
  assert.match(html, /function checkForAppUpdate\(/)
  assert.match(html, /checkForAppUpdate\(\)\.then\(info=>\{/)
  assert.doesNotMatch(html, /serviceWorker|manifest\.json|register\(/)
})

test('update selection requires a plain HTML asset and can prefer a compressed asset', () => {
  assert.match(html, /function selectUpdateAsset\(assets\)/)
  assert.match(html, /\.endsWith\('\.html'\)/)
  assert.match(html, /\.endsWith\('\.html\.gz'\)/)
  assert.match(html, /downloadKind:'gzip-html'/)
  assert.match(html, /fallbackAssetApiUrl:htmlAsset\.url/)
})

test('clicking update downloads the tagged raw HTML file as a local HTML file', () => {
  assert.match(html, /function downloadUpdateFile\(info\)/)
  assert.match(html, /function rawUpdateUrl\(tagName,assetName\)/)
  assert.match(html, /rawDownloadUrl:rawUpdateUrl\(tagName,rawName\)/)
  assert.match(html, /function fetchRawUpdateHtml\(rawUrl,version\)/)
  assert.match(html, /headers:\{Accept:'text\/html,text\/plain,\*\/\*'\}/)
  assert.match(html, /html\.includes\("const APP_VERSION = '"\+version\+"'"\)/)
  assert.match(html, /source:'raw'/)
  assert.match(html, /headers:\{Accept:'application\/octet-stream'\}/)
  assert.match(html, /saveUpdateHtml\(htmlBlob,filename\)/)
  assert.match(html, /function saveUpdateFromUrl\(url,filename\)/)
  assert.match(html, /id="updateModal"/)
  assert.match(html, /id="updateDownload"/)
  assert.doesNotMatch(html, /window\.open\([^)]*github/i)
  assert.doesNotMatch(html, /Please try again from a fresh connection/)
})

test('iPad users get touch-friendly layout and a share-sheet update fallback', () => {
  assert.match(html, /@media \(max-width:820px\)/)
  assert.match(html, /@media \(pointer:coarse\)/)
  assert.match(html, /function saveUpdateHtml\(htmlBlob,filename\)/)
  assert.match(html, /navigator\.canShare/)
  assert.match(html, /navigator\.share/)
  assert.match(html, /new File\(\[htmlBlob\],filename,\{type:'text\/html'\}\)/)
})

test('loader progress keeps a composited spinner and growing percent ring on iPad', () => {
  assert.match(html, /<div class="ring-spin">\s*<svg viewBox="0 0 96 96" aria-hidden="true">/)
  assert.match(html, /\.ring-spin\{[^}]*animation:ringspin 2\.4s linear infinite/)
  assert.match(html, /\.ring-prog\{[^}]*transition:stroke-dashoffset \.3s cubic-bezier\(\.22,1,\.36,1\)/)
  assert.match(html, /#overlay\.show \.ring-spin\{animation:ringspin 2\.4s linear infinite!important\}/)
  assert.match(html, /#overlay\.show \.ring-prog\{transition:stroke-dashoffset \.3s cubic-bezier\(\.22,1,\.36,1\)!important\}/)
})

test('changelog modal is available from update tabs and the version link', () => {
  assert.match(html, /const CHANGELOG=\[/)
  assert.match(html, /version:'1\.0\.3'/)
  assert.match(html, /version:'1\.0\.2'/)
  assert.match(html, /type:'feature'/)
  assert.match(html, /type:'fix'/)
  assert.match(html, /type:'major'/)
  assert.match(html, /class="update-tab" id="changelogTab"/)
  assert.match(html, /id="changelogPanel"/)
  assert.match(html, /function renderChangelog\(info\)/)
  assert.match(html, /function showAppChangelog\(\)/)
  assert.match(html, /id="versionLink"/)
  assert.match(html, /\$\('#versionLink'\)\.onclick=showAppChangelog/)
  assert.match(html, /\.change-entry\.major/)
  assert.match(html, /\.change-entry\.feature/)
  assert.match(html, /\.change-entry\.fix/)
})

test('LotusWorks logo is embedded in the single HTML header', () => {
  assert.match(html, /<img class="lotus-logo" alt="LotusWorks" src="data:image\/png;base64,/)
  assert.match(html, /\.lotus-logo\{order:-1;height:40px/)
  assert.match(html, /@media \(min-width:1081px\)\{\s*\.brand\{margin-left:calc\(\(100vw - 1080px\)\/-2\)\}/)
  assert.match(html, /\.lotus-logo\{height:36px;max-width:118px/)
  assert.doesNotMatch(html, /LotusWorks_Logo_TP\.png/)
  assert.doesNotMatch(html, /__LOTUS_LOGO_DATA_URI__/)
})
