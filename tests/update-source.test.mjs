import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const html = readFileSync(resolve(rootDir, 'SSM-Builder.html'), 'utf8')
const pkg = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf8'))
const pagesWorkflow = readFileSync(resolve(rootDir, '.github/workflows/deploy-pages.yml'), 'utf8')
const manifest = readFileSync(resolve(rootDir, 'pwa/manifest.webmanifest'), 'utf8')
const serviceWorker = readFileSync(resolve(rootDir, 'pwa/sw.js'), 'utf8')
const customScript = html
  .slice(html.lastIndexOf('<script>') + '<script>'.length, html.lastIndexOf('</script>'))
  .replace(/\/\* ---- boot ---- \*\/[\s\S]*$/, '')

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
  assert.match(html, /rawDownloadUrl:rawUpdateUrl\(tagName,'SSM-Builder\.html'\)/)
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
  assert.match(html, /version:'1\.1\.5'/)
  assert.match(html, /version:'1\.1\.4'/)
  assert.match(html, /version:'1\.1\.3'/)
  assert.match(html, /version:'1\.1\.2'/)
  assert.match(html, /version:'1\.1\.1'/)
  assert.match(html, /version:'1\.1\.0'/)
  assert.match(html, /version:'1\.0\.9'/)
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
  assert.match(html, /Improved large-dataset tab performance with virtualized Review and Comparison tables/)
  assert.match(html, /Added Point Master Database instruments to hierarchy views, details, and SSM exports/)
  assert.match(html, /Added PMD matching for building-prefixed panels and instrument tags/)
  assert.match(html, /Improved PMD metadata and SSM exports with building-aware labels/)
  assert.match(html, /Added a hierarchy toggle for matched PMD panel labels/)
  assert.match(html, /Removed Files, Tabs, and Rows Read summary cards/)
  assert.match(html, /Improved hierarchy search so matched branches can be expanded to nested equipment/)
  assert.match(html, /Added full-screen views for Hierarchy, Review, and Comparison tabs/)
  assert.match(html, /Removed trailing -P suffixes from equipment tags/)
  assert.match(html, /Improved Comparison tab performance for large working-copy reviews/)
  assert.match(html, /Added session caching so Hierarchy, Review, and Comparison tabs reopen instantly/)
  assert.match(html, /Fixed changelog entries crowding together instead of scrolling/)
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
  assert.match(html, /\.changelog-intro\{[^}]*flex:0 0 auto/)
  assert.match(html, /\.changelog-list\{[^}]*flex:1;min-height:0;max-height:none;overflow-y:auto;overflow-x:hidden/)
  assert.match(html, /\.change-entry\{[^}]*flex:0 0 auto/)
})

test('equipment tags consistently drop trailing -P and -S suffixes', () => {
  assert.ok(html.includes("const cleanTag=v=>clean(v).replace(/(?:-(?:P|S))+$/i,'');"))
  assert.match(html, /function rowTag\(row,col,rec,rowIndex\)/)
  assert.match(html, /const tag=col>=0\?cleanTag\(row\[col\]\):''/)
  assert.match(html, /const source=rowTag\(row,cols\.source,rec,rowIndex\)/)
  assert.match(html, /const loadDesc=rowTag\(row,cols\.loadDesc,rec,rowIndex\)/)
  assert.match(html, /rows\.push\(\{equip:cleanTag\(aoa\[i\]\[cols\.equip\]\)/)
})

test('imported strike formatting is retained in the app and Excel exports', () => {
  assert.match(html, /function extractStrikeCells\(bytes\)/)
  assert.match(html, /fflate\.unzipSync\(bytes\)/)
  assert.match(html, /styles\.querySelectorAll\('fonts > font'\)/)
  assert.match(html, /sheetDoc\.querySelectorAll\('c'\)/)
  assert.match(html, /cell\.parentElement\?\.getAttribute\('s'\)/)
  assert.match(html, /rec\.strikes=extractStrikeCells\(bytes\)/)
  assert.match(html, /struckTags:new Set\(\)/)
  assert.match(html, /function styleStrikeTags\(ws,rowStart,columns\)/)
  assert.match(html, /font:\{\.\.\.\(\(cell\.s&&cell\.s\.font\)\|\|\{\}\),strike:true\}/)
  assert.match(html, /\.struck\{text-decoration:line-through/)
})

test('Load Description wins over duplicate hierarchy roles and no-ID loads use Final Source', () => {
  assert.match(html, /function collectLoadDescriptionTags\(keys,tick\)/)
  assert.match(html, /if\(!value\|\|\(loadTags&&loadTags\.has\(tagKey\(value\)\)\)\)return/)
  assert.match(html, /const finalSource=low\.findIndex/)
  assert.match(html, /let \{segs,hasId,hasRawId,loadDesc,finalSource\}=rowToPath/)
  assert.match(html, /const finalParent=!hasRawId&&finalSource\?finalSource:''/)
  assert.match(html, /const meta=finalParent\?\{keepDuplicateDep:true\}:null/)
})

test('PMD workbooks auto-select INSTALL PMD and add instrument hierarchy metadata', () => {
  assert.match(html, /pmdSel:new Set\(\)/)
  assert.match(html, /pmdRows:\[\],pmdPanels:\[\],pmdLinks:\[\],pmdPanelMap:new Map\(\),pmdSuffixMap:new Map\(\),pmdDetail:new Map\(\)/)
  assert.match(html, /const PMD_SHEET_NAME='installpmd'/)
  assert.match(html, /function isPmdFile\(file\)/)
  assert.match(html, /function pmdInfo\(key\)/)
  assert.match(html, /function isPmdSheet\(key\)/)
  assert.match(html, /if\(normH\(s\)===PMD_SHEET_NAME\)S\.pmdSel\.add\(key\)/)
  assert.match(html, /PANEL → INSTRUMENT TAG/)
  assert.match(html, /function buildPmd\(tick\)/)
  assert.match(html, /function pmdPanelMatchParts\(value\)/)
  assert.match(html, /function pmdPanelKey\(value\)/)
  assert.match(html, /replace\(\/\[-_\]\(\?:NPS\|CPS\)\$\/i,''\)/)
  assert.match(html, /function attachPmdInstruments\(root\)/)
  assert.match(html, /isInstrument:true,description:rec\.description,pmdKey:rec\.key/)
  assert.match(html, /pmdPanel:panel\.panel/)
  assert.match(html, /title="\$\{esc\(node\.description\)\}"/)
  assert.match(html, /const pmd=node\.pmdKey\?S\.pmdDetail\.get\(node\.pmdKey\):null/)
  assert.match(html, /fld\('Building',node\.pmdBuilding\)/)
  assert.match(html, /fld\('PMD Panel Match',node\.pmdPanel\)/)
  for (const label of ['CARD', 'POINT POSITION', 'POINT TYPE', 'P&ID', 'Location', 'RELEASE']) {
    assert.match(html, new RegExp(`\\['${label.replace('&', '\\&')}'`))
  }
})

test('PMD rows are appended to SSM data with panels before instruments', () => {
  assert.match(html, /function appendPmdSsmRows\(rows,includeUnmatched\)/)
  assert.match(html, /function pmdExportTag\(value,building\)/)
  assert.match(html, /const panelRows=links\.map\(link=>\[link\.loadName,'',existingDeps\.get\(link\.loadKey\)\|\|depOf\(link\.loadName\)\|\|depOf\(link\.panel\)\|\|''\]\)/)
  assert.match(html, /const instrumentRows=links\.flatMap\(link=>link\.instruments\.map\(rec=>\[pmdExportTag\(rec\.tag,link\.building\),link\.loadName,''\]\)\)/)
  assert.match(html, /return \[\.\.\.base,\.\.\.panelRows,\.\.\.instrumentRows\]/)
  assert.match(html, /S\.ssmCombined=appendPmdSsmRows\(ssmCombined,true\)/)
  assert.match(html, /sh\.ssmRows=appendPmdSsmRows\(sh\.ssmRows,false\)/)
})

test('PMD base panels link to both CPS and NPS load variants with duplicated instruments', () => {
  const value = runInNewContext(`${customScript}
    const fixturePanel={key:pmdPanelKey('RIO-1-09'),panel:'RIO-1-09',instruments:[
      {key:'fit',tag:cleanTag('FIT-100-P'),description:'Flow indicator'},
      {key:'lsh',tag:'LSH-200',description:'High level switch'}
    ]};
    S.pmdPanels=[fixturePanel];S.pmdPanelMap=new Map([[fixturePanel.key,fixturePanel]]);
    const cps={name:'RIO-1-09_CPS',kids:new Map(),isId:false,isLoad:true};
    const nps={name:'RIO-1-09-NPS',kids:new Map(),isId:false,isLoad:true};
    const root={name:'__root__',kids:new Map([['cps',cps],['nps',nps]])};
    const attached=attachPmdInstruments(root);
    const built=buildRoots(root);
    const exported=appendPmdSsmRows([
      ['RIO-1-09_CPS','', 'MTR-1'],
      ['RIO-1-09-NPS','', 'MTR-2']
    ],true);
    JSON.stringify({
      keys:[pmdPanelKey('RIO-1-09'),pmdPanelKey('RIO-1-09_CPS'),pmdPanelKey('RIO-1-09-NPS')],
      attached,links:S.pmdLinks.length,
      cpsPanel:cps.pmdPanel,npsPanel:nps.pmdPanel,
      cpsKids:[...cps.kids.keys()],npsKids:[...nps.kids.keys()],
      builtInstrument:built[0].children[0].isInstrument,
      exported
    });
  `, { console, setTimeout, clearTimeout })
  const result = JSON.parse(value)

  assert.deepEqual(result.keys, ['rio109', 'rio109', 'rio109'])
  assert.equal(result.attached, 4)
  assert.equal(result.links, 2)
  assert.equal(result.cpsPanel, 'RIO-1-09')
  assert.equal(result.npsPanel, 'RIO-1-09')
  assert.deepEqual(result.cpsKids, ['FIT-100', 'LSH-200'])
  assert.deepEqual(result.npsKids, ['FIT-100', 'LSH-200'])
  assert.equal(result.builtInstrument, true)
  assert.deepEqual(result.exported, [
    ['RIO-1-09_CPS', '', 'MTR-1'],
    ['RIO-1-09-NPS', '', 'MTR-2'],
    ['FIT-100', 'RIO-1-09_CPS', ''],
    ['LSH-200', 'RIO-1-09_CPS', ''],
    ['FIT-100', 'RIO-1-09-NPS', ''],
    ['LSH-200', 'RIO-1-09-NPS', ''],
  ])
})

test('building-prefixed PMD panels match trailing load descriptions and export without the prefix', () => {
  const value = runInNewContext(`${customScript}
    const parts=pmdPanelMatchParts('OO44-RIO650-02-1');
    const fixturePanel={key:parts.key,panel:'OO44-RIO650-02-1',building:parts.building,matchKey:parts.matchKey,instruments:[
      {key:'tet',tag:cleanTag('OO44-TET105-04-1-P'),description:'Temperature element'},
      {key:'fit',tag:'FIT-100',description:'Flow indicator'}
    ]};
    S.pmdPanels=[fixturePanel];
    S.pmdPanelMap=new Map([[fixturePanel.key,fixturePanel]]);
    S.pmdSuffixMap=new Map([[fixturePanel.matchKey,[fixturePanel]]]);
    const load={name:'RIO650-02-1',kids:new Map(),isId:false,isLoad:true};
    const root={name:'__root__',kids:new Map([['load',load]])};
    const attached=attachPmdInstruments(root);
    const built=buildRoots(root);
    const exported=appendPmdSsmRows([['RIO650-02-1','MCC-1','MTR-1']],true);
    JSON.stringify({
      parts,attached,links:S.pmdLinks.length,
      panel:load.pmdPanel,building:load.pmdBuilding,
      children:[...load.kids.values()].map(child=>({name:child.name,building:child.pmdBuilding,panel:child.pmdPanel})),
      builtBuilding:built[0].pmdBuilding,
      exported
    });
  `, { console, setTimeout, clearTimeout })
  const result = JSON.parse(value)

  assert.deepEqual(result.parts, {
    key: 'oo44rio650021',
    matchKey: 'rio650021',
    building: 'OO44',
  })
  assert.equal(result.attached, 2)
  assert.equal(result.links, 1)
  assert.equal(result.panel, 'OO44-RIO650-02-1')
  assert.equal(result.building, 'OO44')
  assert.deepEqual(result.children, [
    { name: 'OO44-TET105-04-1', building: 'OO44', panel: 'OO44-RIO650-02-1' },
    { name: 'FIT-100', building: 'OO44', panel: 'OO44-RIO650-02-1' },
  ])
  assert.equal(result.builtBuilding, 'OO44')
  assert.deepEqual(result.exported, [
    ['RIO650-02-1', '', 'MTR-1'],
    ['TET105-04-1', 'RIO650-02-1', ''],
    ['FIT-100', 'RIO650-02-1', ''],
  ])
})

test('matched PMD panel badges have an independent hierarchy toggle and stats stay focused', () => {
  assert.match(html, /showPmdMatches:true/)
  assert.match(html, /treePanelCacheKey\(\).*S\.showPmdMatches/)
  assert.match(html, /id="tgPmd"/)
  assert.match(html, /title="Show matched PMD panels"/)
  assert.match(html, /togChip\('tgPmd',\(\)=>S\.showPmdMatches,v=>S\.showPmdMatches=v/)
  assert.match(html, /tree\.classList\.toggle\('hide-pmd',!S\.showPmdMatches\)/)
  assert.match(html, /\.hide-deps \.dep:not\(\.pmd-link\)\{display:none\}/)
  assert.match(html, /\.hide-pmd \.pmd-link\{display:none\}/)
  assert.doesNotMatch(html, /statCard\('database','Files'/)
  assert.doesNotMatch(html, /statCard\('table-2','Tabs'/)
  assert.doesNotMatch(html, /statCard\('list-tree','Rows read'/)
})

test('hierarchy search automatically includes muted sibling context around direct matches', () => {
  assert.match(html, /const fullKids=kidsOf\(node\),shown=fullKids\.filter\(c=>c\._show&&!nodeHidden\(c\)\)/)
  assert.match(html, /const showContext=node\._self\|\|shown\.some\(c=>c\._self\)/)
  assert.match(html, /const visible=showContext\?fullKids:shown/)
  assert.match(html, /extra\.classList\.add\('search-extra'\)/)
  assert.match(html, /\.node\.search-extra > \.row\{opacity:/)
  assert.doesNotMatch(html, /branchRevealHtml|branch-reveal|Show matches only/)
})

test('every result tab supports an iPad-friendly full-screen view', () => {
  assert.match(html, /id="fullscreenToggle"/)
  assert.match(html, /function setResultFullscreen\(on\)/)
  assert.match(html, /resultShell\.classList\.toggle\('fullscreen',on\)/)
  assert.match(html, /document\.body\.classList\.toggle\('result-fullscreen',on\)/)
  assert.match(html, /#resultShell\.fullscreen\{position:fixed;inset:0/)
  assert.match(html, /#resultShell\.fullscreen \.panel:not\(\[hidden\]\)\{display:flex/)
  assert.match(html, /#resultShell\.fullscreen \.treecard,#resultShell\.fullscreen \.tablecard\{max-height:none;flex:1/)
  assert.match(html, /if\(e\.key==='Escape'&&S\.resultFullscreen\)setResultFullscreen\(false\)/)
})

test('release packaging uses a versioned HTML asset while raw updates use the canonical source file', () => {
  assert.match(html, /rawDownloadUrl:rawUpdateUrl\(tagName,'SSM-Builder\.html'\)/)
  assert.match(html, /function versionedUpdateFilename\(version\)/)
  assert.match(html, /return 'SSM-Builder-v'\+cleanVersion\+'\.html'/)
})

test('result tabs use session-only in-memory panel caches', () => {
  assert.match(html, /viewCache:\{tree:null,review:new Map\(\),reviewRows:new Map\(\),compare:new Map\(\),compareRows:new Map\(\)\}/)
  assert.match(html, /const RESULT_PANEL_CACHE_LIMIT=24/)
  assert.match(html, /function clearResultCache\(\)/)
  assert.match(html, /function rememberPanelCache\(name,key,el,scrollSel\)/)
  assert.match(html, /function restorePanelCache\(name,key,el,scrollSel\)/)
  assert.match(html, /function rememberTreePanel\(\)/)
  assert.match(html, /function restoreTreePanel\(\)/)
  assert.match(html, /function reviewPanelCacheKey\(\)/)
  assert.match(html, /function comparePanelCacheKey\(\)/)
  assert.match(html, /if\(isPanelCacheLive\(el,key\)\)\{wireReviewPanel\(\);renderReviewRowsVirtual\(getReviewRowsCache\(\),key,el\);return;\}/)
  assert.match(html, /if\(restorePanelCache\('review',key,el,'#revCard'\)\)\{wireReviewPanel\(\);renderReviewRowsVirtual\(getReviewRowsCache\(\),key,el\);return;\}/)
  assert.match(html, /if\(isPanelCacheLive\(el,key\)\)\{wireComparePanel\(\);renderCompareRowsVirtual\(getCompareRowsCache\(S\.cmpFilter,S\.cmpSearch,S\.cmpDiff,S\.cmpSort\),key,el\);scheduleComparePrewarm\(S\.cmpFilter,S\.cmpSearch,S\.cmpDiff,S\.cmpSort\);return;\}/)
  assert.match(html, /if\(restorePanelCache\('compare',key,el,'#cmpCard'\)\)\{wireComparePanel\(\);renderCompareRowsVirtual\(getCompareRowsCache\(S\.cmpFilter,S\.cmpSearch,S\.cmpDiff,S\.cmpSort\),key,el\);scheduleComparePrewarm\(S\.cmpFilter,S\.cmpSearch,S\.cmpDiff,S\.cmpSort\);return;\}/)
  assert.match(html, /clearResultCache\(\);/)
  assert.doesNotMatch(html, /localStorage|sessionStorage|indexedDB/)
})

test('large review and comparison tables virtualize rows and cache search work', () => {
  assert.match(html, /const VIRTUAL_ROW_HEIGHT=44/)
  assert.match(html, /const VIRTUAL_OVERSCAN=16/)
  assert.match(html, /const VIRTUAL_MAX_DOM_ROWS=180/)
  assert.match(html, /function virtualSpacerRow\(height,colspan\)/)
  assert.match(html, /function virtualRowsHtml\(rows,makeRow,start,end,cache\)/)
  assert.match(html, /function mountVirtualRows\(tbodySel,rows,makeRow,emptyHtml,opts\)/)
  assert.match(html, /tb\.dataset\.virtualStart/)
  assert.match(html, /tb\.dataset\.virtualRows/)
  assert.match(html, /Math\.floor\(card\.scrollTop\/VIRTUAL_ROW_HEIGHT\)-VIRTUAL_OVERSCAN/)
  assert.match(html, /Math\.min\(Math\.max\(0,rows\.length-visible\),Math\.max\(0,Math\.floor\(card\.scrollTop\/VIRTUAL_ROW_HEIGHT\)-VIRTUAL_OVERSCAN\)\)/)
  assert.match(html, /requestAnimationFrame\(\(\)=>\{if\(token===_virtualTok\)render\(\);\}\)/)
  assert.match(html, /function idleFrame\(\)/)
  assert.match(html, /requestIdleCallback/)
  assert.match(html, /function reviewSearchKey\(r\)/)
  assert.match(html, /function reviewRowsCacheKey\(\)/)
  assert.match(html, /function getReviewRowsCache\(\)/)
  assert.match(html, /function renderReviewRowsVirtual\(rec,key,el\)/)
  assert.match(html, /searchKey:reviewSearchKey\(rec\)/)
  assert.match(html, /r\.searchKey\.includes\(q\)/)
  assert.match(html, /const CMP_FILTERS=\['all','off','nohit','match'\]/)
  assert.match(html, /compareBuckets:\{all:\[\],off:\[\],nohit:\[\],match:\[\]\}/)
  assert.match(html, /function compareSearchKey\(r\)/)
  assert.match(html, /function comparePanelCacheKeyFor\(filter,search,diff,sort\)/)
  assert.match(html, /function compareRowsCacheKey\(filter,search,diff,sort\)/)
  assert.match(html, /function getCompareRowsCache\(filter,search,diff,sort\)/)
  assert.match(html, /function renderCompareRowsVirtual\(rec,key,el\)/)
  assert.match(html, /function prewarmCompareRows\(filter,search,diff,sort,token\)/)
  assert.match(html, /function scheduleComparePrewarm\(activeFilter,search,diff,sort\)/)
  assert.match(html, /S\.compareBuckets=\{all:S\.compare,off:S\.compare\.filter\(r=>r\.status==='off'\),nohit:S\.compare\.filter\(r=>r\.status==='nohit'\),match:S\.compare\.filter\(r=>r\.status==='match'\)\}/)
  assert.match(html, /searchKey:compareSearchKey\(rec\)/)
  assert.match(html, /const base=\(S\.compareBuckets&&S\.compareBuckets\[filter\]\)\|\|S\.compare/)
  assert.match(html, /const order=\[activeFilter,\.\.\.CMP_FILTERS\.filter\(f=>f!==activeFilter\)\]/)
  assert.match(html, /await prewarmCompareRows\(filter,search,diff,sort,token\)/)
  assert.match(html, /renderCompareRowsVirtual\(getCompareRowsCache\(S\.cmpFilter,S\.cmpSearch,S\.cmpDiff,S\.cmpSort\),key,el\)/)
  assert.match(html, /scheduleComparePrewarm\(S\.cmpFilter,S\.cmpSearch,S\.cmpDiff,S\.cmpSort\)/)
  assert.match(html, /card\.addEventListener\('scroll',onScroll,\{passive:true\}\)/)
  assert.match(html, /rememberPanelCache\('compare',key,el,'#cmpCard'\)/)
})

test('comparison rows support difference filters and sortable columns', () => {
  assert.match(html, /cmpDiff:'all',cmpSort:null/)
  assert.match(html, /function compareDiffMatch\(r,diff\)/)
  assert.match(html, /function sortCompareList\(rows,sort\)/)
  assert.match(html, /id="cmpDiff"/)
  assert.match(html, /dopt\('parent','Parent differs'\)/)
  assert.match(html, /dopt\('dep','Dependency differs'\)/)
  assert.match(html, /dopt\('both','Both differ'\)/)
  assert.match(html, /#panel-compare th\.sortable/)
  assert.match(html, /data-sort="equip"/)
  assert.match(html, /data-sort="curParent"/)
  assert.match(html, /data-sort="wcDep"/)
  assert.match(html, /S\.cmpSort=\(!s\|\|s\.col!==col\)\?\{col,dir:'asc'\}/)
})

test('review tab groups columns by their source system', () => {
  assert.match(html, /<table class="dtable review">/)
  assert.match(html, /<th colspan="3" class="source-head cable">/)
  assert.match(html, /<th colspan="3" class="source-head cable"><span>Cable Schedule<\/span><\/th>/)
  assert.match(html, /<th colspan="2" class="source-head ep">/)
  assert.match(html, /<th colspan="2" class="source-head ep"><span>Easy Power<\/span><\/th>/)
  assert.match(html, /\.dtable\.review thead th\.sub\{[^}]*top:44px/)
  assert.match(html, /\.source-head\{[^}]*text-align:center!important/)
  assert.match(html, /\.dtable\.review \.source-head\.ep,\s*\.dtable\.review thead tr:nth-child\(2\) th:nth-child\(4\),\s*\.dtable\.review tbody td:nth-child\(4\)\{box-shadow:inset 1px 0 0 rgba\(148,163,184,\.35\)\}/)
  assert.match(html, /\.source-head span\{[^}]*font-size:11px/)
  assert.match(html, /\.source-head span::before/)
  assert.match(html, /\.source-head span::after/)
  assert.doesNotMatch(html, /source-kicker/)
  assert.doesNotMatch(html, /source-title/)
  assert.doesNotMatch(html, /To \/ From/)
  assert.doesNotMatch(html, /Source \/ Downstream \/ ID Name/)
})

test('comparison and SSM exports replace duplicated dependency values with N/A', () => {
  assert.match(html, /function registerCompareKey\(value\)/)
  assert.match(html, /function sameRegisterValue\(a,b\)\{return registerCompareKey\(a\)===registerCompareKey\(b\);\}/)
  assert.match(html, /function registerDepValue\(parent,dep,keepDuplicate\)\{/)
  assert.match(html, /return d&&!keepDuplicate&&sameRegisterValue\(parent,d\)\?'N\/A':d;/)
  assert.match(html, /dep:registerDepValue\(o\.parent,o\.dep,o\.keepDuplicateDep\)/)
  assert.match(html, /const curParent=a\?a\.parent:''/)
  assert.match(html, /const curDep=a\?registerDepValue\(a\.parent,a\.dep,a\.keepDuplicateDep\):''/)
  assert.match(html, /const wcParent=b\?b\.parent:''/)
  assert.match(html, /const wcDep=b\?registerDepValue\(b\.parent,b\.dep,!!\(a&&a\.keepDuplicateDep\)\):''/)
  assert.match(html, /status=\(eq\(curParent,wcParent\)&&eq\(curDep,wcDep\)\)\?'match':'off'/)
  assert.equal((html.match(/const \{equip,parent,dep\}=ssmRegisterResolve\(r\)/g) || []).length, 2)
  assert.match(html, /function registerDisplayValue\(value\)/)
  assert.match(html, /compareMakeCell\(a,b\).*registerDisplayValue\(a\).*registerDisplayValue\(b\)/)
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
