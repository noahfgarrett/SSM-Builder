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

test('clicking update downloads the GitHub release asset as a local HTML file', () => {
  assert.match(html, /function downloadUpdateFile\(info\)/)
  assert.match(html, /headers:\{Accept:'application\/octet-stream'\}/)
  assert.match(html, /saveUpdateHtml\(htmlBlob,filename\)/)
  assert.match(html, /id="updateModal"/)
  assert.match(html, /id="updateDownload"/)
  assert.doesNotMatch(html, /window\.open\([^)]*github/i)
})

test('iPad users get touch-friendly layout and a share-sheet update fallback', () => {
  assert.match(html, /@media \(max-width:820px\)/)
  assert.match(html, /@media \(pointer:coarse\)/)
  assert.match(html, /function saveUpdateHtml\(htmlBlob,filename\)/)
  assert.match(html, /navigator\.canShare/)
  assert.match(html, /navigator\.share/)
  assert.match(html, /new File\(\[htmlBlob\],filename,\{type:'text\/html'\}\)/)
})
