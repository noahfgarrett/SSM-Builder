import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const html = readFileSync(resolve(rootDir, 'SSM-Builder.html'), 'utf8')
const pkg = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf8'))
const pagesWorkflow = readFileSync(resolve(rootDir, '.github/workflows/deploy-pages.yml'), 'utf8')
const manifest = readFileSync(resolve(rootDir, 'pwa/manifest.webmanifest'), 'utf8')
const serviceWorker = readFileSync(resolve(rootDir, 'pwa/sw.js'), 'utf8')

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
  assert.match(html, /function isPwaHostedApp\(\)/)
  assert.match(html, /meta\[name="ssm-builder-pwa"\]\[content="true"\]/)
  assert.match(html, /if\(!isPwaHostedApp\(\)\)checkForAppUpdate\(\)\.then\(info=>\{/)
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
  assert.match(html, /function versionedUpdateFilename\(version\)/)
  assert.match(html, /return 'SSM-Builder-v'\+cleanVersion\+'\.html'/)
  assert.match(html, /const filename=versionedUpdateFilename\(info\.version\)/)
  assert.match(html, /saveUpdateHtml\(htmlBlob,filename\)/)
  assert.match(html, /function saveUpdateFromUrl\(url,filename\)/)
  assert.match(html, /id="updateModal"/)
  assert.match(html, /id="updateDownload"/)
  assert.doesNotMatch(html, /window\.open\([^)]*github/i)
  assert.doesNotMatch(html, /Please try again from a fresh connection/)
})

test('standalone update downloads save directly without a share sheet fallback', () => {
  assert.match(html, /@media \(max-width:820px\)/)
  assert.match(html, /@media \(pointer:coarse\)/)
  assert.match(html, /function saveUpdateHtml\(htmlBlob,filename\)/)
  assert.match(html, /saveBlob\(htmlBlob,filename,'text\/html'\)/)
  assert.doesNotMatch(html, /navigator\.canShare/)
  assert.doesNotMatch(html, /navigator\.share/)
  assert.doesNotMatch(html, /shouldUseShareSheetForUpdate/)
  assert.doesNotMatch(html, /isIOSUpdateDevice/)
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
  assert.match(html, /version:'1\.0\.8'/)
  assert.match(html, /version:'1\.0\.7'/)
  assert.match(html, /version:'1\.0\.6'/)
  assert.match(html, /version:'1\.0\.5'/)
  assert.match(html, /version:'1\.0\.4'/)
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
  assert.match(html, /\.update-card\.wide\{[^}]*height:min\(500px,calc\(100vh - 40px\)\)/)
  assert.match(html, /#updatePanel:not\(\[hidden\]\),#changelogPanel:not\(\[hidden\]\)\{display:flex;flex:1;min-height:0;flex-direction:column\}/)
  assert.match(html, /\.changelog-list\{[^}]*flex:1;min-height:0;max-height:none;overflow:auto/)
})

test('review tab groups columns by their source system', () => {
  assert.match(html, /<table class="dtable review">/)
  assert.match(html, /<th colspan="3" class="source-head cable">/)
  assert.match(html, /<span class="source-kicker">Cable Schedule<\/span>/)
  assert.match(html, /<span class="source-title">To \/ From<\/span>/)
  assert.match(html, /<th colspan="2" class="source-head ep">/)
  assert.match(html, /<span class="source-kicker">Easy Power<\/span>/)
  assert.match(html, /<span class="source-title">Source \/ Downstream \/ ID Name<\/span>/)
  assert.match(html, /\.dtable\.review thead th\.sub\{[^}]*top:44px/)
  assert.match(html, /\.source-head\.cable \.source-kicker/)
  assert.match(html, /\.source-head\.ep \.source-kicker/)
})

test('comparison and SSM exports replace duplicated dependency values with N/A', () => {
  assert.match(html, /function sameRegisterValue\(a,b\)\{return clean\(a\)\.toLowerCase\(\)===clean\(b\)\.toLowerCase\(\);\}/)
  assert.match(html, /function registerDepValue\(parent,dep\)\{/)
  assert.match(html, /return d&&sameRegisterValue\(parent,d\)\?'N\/A':d;/)
  assert.match(html, /function ssmRegisterResolve\(r\)\{const o=ssmResolve\(r\);return \{\.\.\.o,dep:registerDepValue\(o\.parent,o\.dep\)\};\}/)
  assert.match(html, /const curParent=a\?a\.parent:''/)
  assert.match(html, /const curDep=a\?registerDepValue\(a\.parent,a\.dep\):''/)
  assert.match(html, /const wcParent=b\?b\.parent:''/)
  assert.match(html, /const wcDep=b\?registerDepValue\(b\.parent,b\.dep\):''/)
  assert.match(html, /status=\(eq\(curParent,wcParent\)&&eq\(curDep,wcDep\)\)\?'match':'off'/)
  assert.equal((html.match(/const \{equip,parent,dep\}=ssmRegisterResolve\(r\)/g) || []).length, 2)
})

test('LotusWorks logo is embedded in the single HTML header', () => {
  assert.match(html, /<img class="lotus-logo" alt="LotusWorks" src="data:image\/png;base64,/)
  assert.match(html, /\.lotus-logo\{order:0;height:66px/)
  assert.match(html, /--brand-main-left:max\(var\(--content-left\),var\(--brand-safe-left\)\)/)
  assert.match(html, /\.brand \.mark\{position:absolute;left:var\(--brand-main-local\)/)
  assert.match(html, /\.lotus-logo\{position:absolute;left:calc\(22px - \(\(100vw - 1080px\)\/2\)\)/)
  assert.match(html, /\.lotus-logo\{height:60px;max-width:195px/)
  assert.doesNotMatch(html, /LotusWorks_Logo_TP\.png/)
  assert.doesNotMatch(html, /__LOTUS_LOGO_DATA_URI__/)
})

test('GitHub Pages PWA publishing follows main app updates', () => {
  assert.match(pagesWorkflow, /on:\n  workflow_dispatch:/)
  assert.match(pagesWorkflow, /\n  push:\n    branches: \[main\]\n    paths:/)
  assert.match(pagesWorkflow, /- SSM-Builder\.html/)
  assert.match(pagesWorkflow, /- pwa\/\*\*/)
  assert.match(pagesWorkflow, /- \.github\/workflows\/deploy-pages\.yml/)
  assert.doesNotMatch(pagesWorkflow, /^\s+release:/m)
  assert.doesNotMatch(pagesWorkflow, /^\s+schedule:/m)
  assert.match(pagesWorkflow, /uses: actions\/configure-pages@v5/)
  assert.match(pagesWorkflow, /uses: actions\/upload-pages-artifact@v4/)
  assert.match(pagesWorkflow, /uses: actions\/deploy-pages@v4/)
  assert.match(pagesWorkflow, /cp SSM-Builder\.html dist\/index\.html/)
  assert.match(pagesWorkflow, /meta name="ssm-builder-pwa" content="true"/)
  assert.match(pagesWorkflow, /replace\("<\/head>", pwa_head \+ "<\/head>", 1\)/)
  assert.match(pagesWorkflow, /rpartition\("<\/body>"\)/)
  assert.match(manifest, /"display": "standalone"/)
  assert.match(manifest, /"start_url": "\.\/"/)
  assert.match(serviceWorker, /const CACHE_NAME = 'ssm-builder-pwa-v1'/)
  assert.match(serviceWorker, /fetch\(request\)/)
  assert.match(serviceWorker, /caches\.match\('\.\/index\.html'\)/)
})
