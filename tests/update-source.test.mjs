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
  assert.match(html, /id="updateCloseX" type="button" aria-label="Close changelog or update modal"/)
  assert.match(html, /let updateModalDismissed=false/)
  assert.match(html, /updateModalDismissed=true;[^;]*m\.classList\.remove\('show'\);[^;]*m\.setAttribute\('aria-hidden','true'\);m\.hidden=true/)
  assert.match(html, /m\.hidden=false;m\.classList\.add\('show'\);m\.setAttribute\('aria-hidden','false'\)/)
  assert.match(html, /e\.target\.closest&&e\.target\.closest\('#updateCloseX'\)/)
  assert.match(html, /if\(info&&!updateModalDismissed\)showUpdateModal\(info\)/)
  assert.match(html, /\.modal-back\[hidden\]\{display:none!important\}/)
  assert.match(html, /\.change-entry\.major/)
  assert.match(html, /\.change-entry\.feature/)
  assert.match(html, /\.change-entry\.fix/)
  assert.match(html, /\.update-card\.wide\{[^}]*height:min\(500px,calc\(100vh - 40px\)\)/)
  assert.match(html, /#updatePanel:not\(\[hidden\]\),#changelogPanel:not\(\[hidden\]\)\{display:flex;flex:1;min-height:0;flex-direction:column\}/)
  assert.match(html, /\.changelog-intro\{[^}]*flex:0 0 auto/)
  assert.match(html, /\.changelog-list\{[^}]*flex:1;min-height:0;max-height:none;overflow-y:auto;overflow-x:hidden/)
  assert.match(html, /\.change-entry\{[^}]*flex:0 0 auto/)
})

test('icon-only controls share centered SVG button styling', () => {
  assert.match(html, /\.icon-btn\{padding:0;line-height:0\}/)
  assert.match(html, /\.icon-btn>\.ic\{display:block;margin:auto\}/)
  assert.match(html, /class="xbtn icon-btn update-x"/)
  assert.match(html, /class="xbtn icon-btn" id="drawerClose"/)
  assert.match(html, /class="btn icon-btn fullbtn"/)
  assert.match(html, /class="rowinfo icon-btn"/)
  assert.match(html, /class="placement-flag icon-btn"/)
  assert.match(html, /class="qx icon-btn"/)
  assert.match(html, /\.update-card \.update-x\{[^}]*z-index:2/)
})

test('hierarchy, review, and comparison tags support click-to-copy', () => {
  assert.match(html, /\.copy-tag\{[^}]*cursor:copy/)
  assert.match(html, /function wireCopyTags\(root\)/)
  assert.match(html, /function legacyCopyText\(t\)/)
  assert.match(html, /document\.execCommand\('copy'\)/)
  assert.match(html, /\.writeText\(t\)\.then\(done\)\.catch\(fallback\)/)
  assert.match(html, /root\.addEventListener\('click',[\s\S]*?\},true\)/)
  assert.match(html, /wireCopyTags\(tree\)/)
  assert.match(html, /wireCopyTags\(\$\('#panel-review'\)\)/)
  assert.match(html, /wireCopyTags\(\$\('#panel-compare'\)\)/)
  assert.match(html, /class="lbl copy-tag" data-copy-tag=/)
  assert.match(html, /class="dep copy-tag/)
  assert.match(html, /class="pm copy-tag/)
  assert.match(html, /copyTagHtml\(r\.load\)/)
  assert.match(html, /copyTagHtml\(r\.panel\|\|'—'\)/)
  assert.match(html, /copyTagHtml\(r\.equip\)/)
  assert.match(html, /copyTagListHtml\(av\)/)
  assert.match(html, /copyTagListHtml\(bv\)/)

  const value = runInNewContext(`${customScript}
    JSON.stringify({
      single: copyTagHtml('TAG-100'),
      placeholder: copyTagHtml('N/A'),
      list: copyTagListHtml('TAG-A; TAG-B')
    });
  `, { console, setTimeout, clearTimeout })
  const markup = JSON.parse(value)
  assert.match(markup.single, /data-copy-tag="TAG-100"/)
  assert.doesNotMatch(markup.placeholder, /data-copy-tag/)
  assert.match(markup.list, /data-copy-tag="TAG-A"/)
  assert.match(markup.list, /data-copy-tag="TAG-B"/)
})

test('equipment tags consistently drop trailing -P and -S suffixes', () => {
  assert.match(html, /const cleanTag=v=>clean\(v\)\.normalize\('NFKC'\)/)
  const value = runInNewContext(`${customScript}
    JSON.stringify([
      cleanTag('TAG-100-P'),
      cleanTag('TAG-100-S'),
      cleanTag('3F21\u2011LVSY373B'),
      cleanTag('3F21-\u200BXFMY373B'),
      cleanRegisterTag('PDU-MCC-CIM'),
      cleanRegisterTag('EF25 (G22.5) - CIM')
    ]);
  `, { console, setTimeout, clearTimeout })
  assert.deepEqual(JSON.parse(value), ['TAG-100', 'TAG-100', '3F21-LVSY373B', '3F21-XFMY373B', 'PDU-MCC-CIM', 'EF25 (G22.5) - CIM'])
  assert.match(html, /function rowTag\(row,col,rec,rowIndex\)/)
  assert.match(html, /return col>=0\?cleanTag\(row\[col\]\):''/)
  assert.match(html, /const source=rowTag\(row,cols\.source,rec,rowIndex\)/)
  assert.match(html, /const loadDesc=rowTag\(row,cols\.loadDesc,rec,rowIndex\)/)
  assert.match(html, /rows\.push\(\{equip:cleanRegisterTag\(aoa\[i\]\[cols\.equip\]\)/)
})

test('imported strike formatting is shown only as Cable Schedule sidebar metadata', () => {
  assert.match(html, /function extractStrikeCells\(bytes\)/)
  assert.match(html, /fflate\.unzipSync\(bytes\)/)
  assert.match(html, /styles\.querySelectorAll\('fonts > font'\)/)
  assert.match(html, /sheetDoc\.querySelectorAll\('c'\)/)
  assert.match(html, /cell\.parentElement\?\.getAttribute\('s'\)/)
  assert.match(html, /rec\.strikes=extractStrikeCells\(bytes\)/)
  assert.match(html, /cableStruckTags:new Set\(\)/)
  assert.match(html, /if\(cellIsStruck\(rec,i,loadC\)\)S\.cableStruckTags\.add\(tagKey\(load\)\)/)
  assert.match(html, /if\(panel&&cellIsStruck\(rec,i,panelC\)\)S\.cableStruckTags\.add\(tagKey\(panel\)\)/)
  assert.match(html, /S\.cableStruckTags\.has\(tagKey\(node\.name\)\).*rowinfo/)
  assert.match(html, /fld\('Cable Schedule status','Struck through in source'\)/)
  assert.doesNotMatch(html, /function styleStrikeCell|function styleStrikeTags|struckClass|text-decoration:line-through/)
})

test('Load Description relations use ID Name, Final Source, and self-match rules', () => {
  assert.match(html, /function collectLoadDescriptionTags\(keys,tick\)/)
  assert.match(html, /if\(a\.dsPattern\.length\)\{\s*downstream=a\.dsPattern\.filter/)
  assert.match(html, /for\(const col of cols\.downstream\)\{const value=rowTag\(row,col,rec,rowIndex\);if\(!value\)break;downstream\.push\(value\);\}/)
  assert.match(html, /const push=value=>\{\s*if\(!value\)return;/)
  assert.match(html, /push\(source\);downstream\.forEach\(push\);if\(!downstream\.length\)push\(finalSource\)/)
  assert.match(html, /const isLoadRole=loadTags\.has\(tagKey\(equip\)\)/)
  assert.match(html, /if\(!isLoadRole&&!seenC\.has\(acc\)\)/)
  assert.match(html, /if\(!isLoadRole&&!seenS\.has\(acc\)\)/)
  assert.match(html, /const finalSource=low\.findIndex/)
  assert.match(html, /return \{segs,hasId,idName:id,loadDesc,finalSource\}/)
  assert.match(html, /function loadSsmRelation\(idName,finalSource,loadDesc\)/)
  assert.match(html, /if\(id&&tagKey\(id\)===tagKey\(load\)\)return \{parent:final,dep:'',keepDuplicateDep:false\}/)
  assert.match(html, /return \{parent:relation,dep:relation,keepDuplicateDep:!!relation\}/)
  assert.match(html, /function nodeDep\(n\)\{return n\.dependencyOverride\|\|\(n\.isLoad\?n\.loadDependency:depOf\(n\.name\)\);\}/)
  assert.match(html, /function addLoadChild\(deepNode,loadName,dependency\)/)
  assert.match(html, /loadDependency:m\.loadDependency\|\|''/)
  assert.match(html, /let \{segs,hasId,idName,loadDesc,finalSource\}=rowToPath/)
  assert.match(html, /const rel=melCorrectLoadRelation\(loadDesc,loadSsmRelation\(idName,finalSource,loadDesc\)\),meta=rel\.keepDuplicateDep\?\{keepDuplicateDep:true\}:null/)
  assert.match(html, /addLoadChild\(lcDeep,loadDesc,rel\.dep\);addLoadChild\(lsDeep,loadDesc,rel\.dep\)/)
  const value = runInNewContext(`${customScript}
    JSON.stringify([
      loadSsmRelation('ID-100-S','FINAL-1','LOAD-1'),
      loadSsmRelation('','FINAL-2-P','LOAD-2'),
      loadSsmRelation('LOAD-3-S','FINAL-3','LOAD-3')
    ]);
  `, { console, setTimeout, clearTimeout })
  assert.deepEqual(JSON.parse(value), [
    { parent: 'ID-100', dep: 'ID-100', keepDuplicateDep: true },
    { parent: 'FINAL-2', dep: 'FINAL-2', keepDuplicateDep: true },
    { parent: 'FINAL-3', dep: '', keepDuplicateDep: false },
  ])
  const pathValue = runInNewContext(`${customScript}
    const cols={source:0,downstream:[1,2,3,4],finalSource:5,idName:6,loadDesc:7};
    const rec={rowNums:[0],strikes:new Set()};
    const result=rowToPath(['ROOT','DS-1','SHARED','','LATE-DOWNSTREAM','LATE-DOWNSTREAM','ID-1','LOAD-1'],cols,rec,0,new Set(['shared']));
    JSON.stringify(result);
  `, { console, setTimeout, clearTimeout })
  assert.deepEqual(JSON.parse(pathValue).segs, ['ROOT', 'DS-1', 'SHARED', 'ID-1'])
})

test('Cable Schedule chains replace duplicate parents and add missing hierarchy panels', () => {
  assert.match(html, /function buildCableParentPlan\(rows\)/)
  assert.match(html, /tagKey\(parent\)!==tagKey\(dependency\)/)
  assert.match(html, /function repairCableHierarchyParents\(root,plan\)/)
  assert.match(html, /function repairCableSsmRows\(rows,plan\)/)
  assert.match(html, /meta\.keepDuplicateDep=true/)
  assert.match(html, /repairCableHierarchyParents\(combined,combinedCablePlan\)/)
  assert.match(html, /repairCableHierarchyParents\(sh\._sMap,plan\)/)
  const value = runInNewContext(`${customScript}
    S.deps=new Map([
      ['load-a','CABLE-PANEL-1'],
      ['cable-panel-1','CABLE-PANEL-2'],
      ['cable-panel-2','EP-PARENT'],
      ['load-b','SAME-PANEL'],
      ['load-cycle','CYCLE-PANEL'],
      ['cycle-panel','LOAD-CYCLE']
    ]);
    const rows=[
      ['ROOT',''],
      ['EP-PARENT','ROOT'],
      ['LOAD-A','EP-PARENT','EP-PARENT',{keepDuplicateDep:true}],
      ['LOAD-B','SAME-PANEL','SAME-PANEL',{keepDuplicateDep:true}],
      ['LOAD-CYCLE','OLD-CYCLE','OLD-CYCLE',{keepDuplicateDep:true}]
    ];
    const plan=buildCableParentPlan(rows),repaired=repairCableSsmRows(rows,plan);
    const child={name:'INSTRUMENT-A',kids:new Map(),isId:false};
    const load={name:'LOAD-A',kids:new Map([[child.name,child]]),isId:false,isLoad:true,loadDependency:'EP-PARENT'};
    const ep={name:'EP-PARENT',kids:new Map([[load.name,load]]),isId:true};
    const source={name:'ROOT',kids:new Map([[ep.name,ep]]),isId:false};
    const tree={name:'__root__',kids:new Map([[source.name,source]])};
    repairCableHierarchyParents(tree,plan);
    const panel2=ep.kids.get('CABLE-PANEL-2'),panel1=panel2&&panel2.kids.get('CABLE-PANEL-1'),moved=panel1&&panel1.kids.get('LOAD-A');
    JSON.stringify({
      relations:[...plan.relations.values()],
      seeds:[...plan.seeds],
      generated:[...plan.generated],
      epKids:[...ep.kids.keys()],
      panel2Kids:panel2?[...panel2.kids.keys()]:[],
      panel1Kids:panel1?[...panel1.kids.keys()]:[],
      movedDependency:moved&&moved.loadDependency,
      movedKids:moved?[...moved.kids.keys()]:[],
      repaired:repaired.map(row=>ssmResolve(row))
    });
  `, { console, setTimeout, clearTimeout })
  assert.deepEqual(JSON.parse(value), {
    relations: [
      { equip: 'LOAD-A', parent: 'CABLE-PANEL-1' },
      { equip: 'CABLE-PANEL-1', parent: 'CABLE-PANEL-2' },
      { equip: 'CABLE-PANEL-2', parent: 'EP-PARENT' },
    ],
    seeds: ['load-a'],
    generated: ['cable-panel-1', 'cable-panel-2'],
    epKids: ['CABLE-PANEL-2'],
    panel2Kids: ['CABLE-PANEL-1'],
    panel1Kids: ['LOAD-A'],
    movedDependency: 'CABLE-PANEL-1',
    movedKids: ['INSTRUMENT-A'],
    repaired: [
      { equip: 'ROOT', parent: '', dep: '', keepDuplicateDep: false },
      { equip: 'EP-PARENT', parent: 'ROOT', dep: '', keepDuplicateDep: false },
      { equip: 'CABLE-PANEL-2', parent: 'EP-PARENT', dep: 'EP-PARENT', keepDuplicateDep: true },
      { equip: 'CABLE-PANEL-1', parent: 'CABLE-PANEL-2', dep: 'CABLE-PANEL-2', keepDuplicateDep: true },
      { equip: 'LOAD-A', parent: 'CABLE-PANEL-1', dep: 'CABLE-PANEL-1', keepDuplicateDep: true },
      { equip: 'LOAD-B', parent: 'SAME-PANEL', dep: 'SAME-PANEL', keepDuplicateDep: true },
      { equip: 'LOAD-CYCLE', parent: 'OLD-CYCLE', dep: 'OLD-CYCLE', keepDuplicateDep: true },
    ],
  })
})

test('Equipment_List tabs auto-select and index MEL Equipment Tag and UPN values', () => {
  assert.match(html, /melSel:new Set\(\)/)
  assert.match(html, /melRows:\[\],melByTag:new Map\(\),melByNorm:new Map\(\),melBySuffix:new Map\(\),melByGram:new Map\(\),melLookupCache:new Map\(\),melContainingCache:new Map\(\),melXfmBySuffix:new Map\(\)/)
  assert.match(html, /const MEL_SHEET_NAME='equipmentlist'/)
  assert.match(html, /function isMelSheet\(key\)/)
  assert.match(html, /function detectMel\(headers\)/)
  assert.match(html, /tag=norm\.findIndex\(h=>h==='equipmenttag'\|\|\(h\.endsWith\('equipmenttag'\)&&!h\.startsWith\('systemparent'\)\)\)/)
  assert.match(html, /return tag>=0\?\{tag,upn,building,systemParent\}:null/)
  assert.match(html, /function melInfo\(key\)/)
  assert.match(html, /if\(isMelSheet\(k\)\)S\.melSel\.add\(k\)/)
  assert.match(html, /!isMelSheet\(key\)&&!isPmdSheet\(key\)&&!isCableSheet\(key\)/)
  assert.match(html, /data-mel="\$\{esc\(key\)\}"/)
  assert.match(html, /Equipment Tag → UPN/)
  assert.match(html, /function buildMel\(tick\)/)
  assert.match(html, /const rec=\{tag,upn,building,systemParent\};S\.melRows\.push\(rec\);S\.melByTag\.set\(keyTag,rec\)/)
  const value = runInNewContext(`${customScript}
    JSON.stringify([
      detectMel(['Description','Equipment Tag','UPN','Bldg','System Parent Equipment Tag(s)']),
      detectMel(['Equipment Tag','UPN (Code)']),
      detectMel(['Equipment Tag','Description']),
      detectMel(['Equipment','Unit Number']),
      isMelSheet('file\\u0001Equipment_List'),
      isMelSheet('file\\u0001Other')
    ]);
  `, { console, setTimeout, clearTimeout })
  assert.deepEqual(JSON.parse(value), [
    { tag: 1, upn: 2, building: 3, systemParent: 4 },
    { tag: 0, upn: 1, building: -1, systemParent: -1 },
    { tag: 0, upn: -1, building: -1, systemParent: -1 },
    null,
    true,
    false,
  ])
})

test('MEL contained-tag lookups use indexed candidates instead of rescanning every row', () => {
  assert.match(html, /const MEL_LOOKUP_GRAM_SIZE=3/)
  assert.match(html, /function indexMelLookupRecord\(rec\)/)
  assert.match(html, /function melLookupSearchRows\(value\)/)
  assert.match(html, /if\(!matches\)return \[\]/)
  assert.match(html, /for\(const rec of melLookupSearchRows\(key\)\)/)
  const value = runInNewContext(`${customScript}
    S.melRows=[];S.melByTag=new Map();S.melByNorm=new Map();S.melBySuffix=new Map();S.melByGram=new Map();S.melLookupCache=new Map();
    for(let i=0;i<2000;i++){
      const rec={tag:'BLDG-EQUIPMENT-'+String(i).padStart(5,'0'),upn:'133',systemParent:''};
      S.melRows.push(rec);S.melByTag.set(tagKey(rec.tag),rec);S.melByNorm.set(normSep(rec.tag),rec);indexMelLookupRecord(rec);
    }
    S.melRows={*[Symbol.iterator](){throw new Error('indexed lookup fell back to a full MEL scan');}};
    const contained=melTagLookup('EQUIPMENT-01337'),missing=melTagLookup('NOT-PRESENT-99999');
    JSON.stringify({
      contained:contained.record&&contained.record.tag,
      containedCandidates:contained.candidates.length,
      missing:missing.record,
      missingCandidates:missing.candidates.length,
      grams:S.melByGram.size
    });
  `, { console, setTimeout, clearTimeout })
  const result = JSON.parse(value)
  assert.equal(result.contained, 'BLDG-EQUIPMENT-01337')
  assert.equal(result.containedCandidates, 1)
  assert.equal(result.missing, null)
  assert.equal(result.missingCandidates, 0)
  assert.ok(result.grams > 0)
})

test('MEL UPN checks evaluate every extracted Comparison Equipment ID', () => {
  assert.match(html, /function firstSystemParentTag\(value\)/)
  assert.match(html, /function melTagLookup\(value\)/)
  assert.match(html, /function buildMelSystemParentPlan\(rows\)/)
  assert.match(html, /function repairMelSystemParentHierarchy\(root,plan\)/)
  assert.match(html, /function repairMelSystemParentSsmRows\(rows,plan\)/)
  assert.match(html, /function recordMelSystemParentCheck\(plan,check\)/)
  assert.doesNotMatch(html, /epSourceTags/)
  assert.match(html, /status:'missing-data'/)
  assert.match(html, /Missing MEL data/)
  const value = runInNewContext(`${customScript}
    S.melByNorm=new Map();
    S.melByTag=new Map([
      ['gis-1',{tag:'GIS-1',upn:'372',systemParent:''}],
      ['old-parent',{tag:'OLD-PARENT',upn:'372',systemParent:''}],
      ['new-parent',{tag:'NEW-PARENT',upn:'373',systemParent:''}],
      ['equipment-a',{tag:'EQUIPMENT-A',upn:'373',systemParent:'NEW-PARENT; ALTERNATE-PARENT'}],
      ['matched-equipment',{tag:'MATCHED-EQUIPMENT',upn:'372',systemParent:'UNUSED-PARENT'}],
      ['missing-upn',{tag:'MISSING-UPN',upn:'',systemParent:'NEW-PARENT'}],
      ['missing-system-parent',{tag:'MISSING-SYSTEM-PARENT',upn:'374',systemParent:''}]
    ]);
    S.placements=[];S._placementId=0;
    const child={name:'CHILD-A',kids:new Map(),isId:true};
    const equipment={name:'EQUIPMENT-A',kids:new Map([[child.name,child]]),isId:true};
    const matched={name:'MATCHED-EQUIPMENT',kids:new Map(),isId:true};
    const missingUpn={name:'MISSING-UPN',kids:new Map(),isId:true};
    const missingSystem={name:'MISSING-SYSTEM-PARENT',kids:new Map(),isId:true};
    const oldParent={name:'OLD-PARENT',kids:new Map([
      [equipment.name,equipment],
      [matched.name,matched],
      [missingUpn.name,missingUpn],
      [missingSystem.name,missingSystem]
    ]),isId:false};
    const gis={name:'GIS-1',kids:new Map([[oldParent.name,oldParent]]),isId:false};
    const system={name:GIS_PARENT,kids:new Map([[gis.name,gis]]),isId:false};
    const root={name:'__root__',kids:new Map([[system.name,system]])};
    const rows=[
      [GIS_PARENT,''],
      ['GIS-1',GIS_PARENT],
      ['OLD-PARENT','GIS-1'],
      ['EQUIPMENT-A','OLD-PARENT','OLD-PARENT',{keepDuplicateDep:true}],
      ['CHILD-A','EQUIPMENT-A'],
      ['MATCHED-EQUIPMENT','OLD-PARENT'],
      ['MISSING-UPN','OLD-PARENT'],
      ['MISSING-SYSTEM-PARENT','OLD-PARENT']
    ];
    const plan=buildMelSystemParentPlan(rows);
    const moved=repairMelSystemParentHierarchy(root,plan);
    const repaired=repairMelSystemParentSsmRows(rows,plan).map(ssmResolve);
    registerMelSystemParentIssues(root,plan);
    const newParent=gis.kids.get('NEW-PARENT');
    const built=buildRoots(root),builtEquipment=built[0].children[0].children
      .find(node=>node.name==='NEW-PARENT').children.find(node=>node.name==='EQUIPMENT-A');
    JSON.stringify({
      first:firstSystemParentTag('NEW-PARENT; ALTERNATE-PARENT'),
      moved,
      correction:[...plan.corrections.values()][0],
      warnings:plan.warnings.map(item=>({equip:item.equip,missingField:item.missingField})),
      gisKids:[...gis.kids.keys()],
      oldKids:[...oldParent.kids.keys()],
      newKids:[...newParent.kids.keys()],
      descendants:[...newParent.kids.get('EQUIPMENT-A').kids.keys()],
      hierarchyDependency:nodeDep(builtEquipment),
      repaired,
      placements:S.placements.map(item=>({branch:item.branchName,status:item.status})),
      checks:Object.fromEntries([...plan.checks].map(([key,item])=>[key,item.status]))
    });
  `, { console, setTimeout, clearTimeout })
  assert.deepEqual(JSON.parse(value), {
    first: 'NEW-PARENT',
    moved: 1,
    correction: {
      equip: 'EQUIPMENT-A',
      currentParent: 'OLD-PARENT',
      newParent: 'NEW-PARENT',
      sourceParent: 'GIS-1',
      equipmentUpn: '373',
      parentUpn: '372',
      equipmentMelTag: 'EQUIPMENT-A',
      parentMelTag: 'OLD-PARENT',
    },
    warnings: [
      { equip: 'MISSING-UPN', missingField: 'Equipment UPN' },
      { equip: 'MISSING-SYSTEM-PARENT', missingField: 'System Parent Equipment Tag(s)' },
    ],
    gisKids: ['OLD-PARENT', 'NEW-PARENT'],
    oldKids: ['MATCHED-EQUIPMENT', 'MISSING-UPN', 'MISSING-SYSTEM-PARENT'],
    newKids: ['EQUIPMENT-A'],
    descendants: ['CHILD-A'],
    hierarchyDependency: 'OLD-PARENT',
    repaired: [
      { equip: '602 Medium Voltage', parent: '', dep: '', keepDuplicateDep: false },
      { equip: 'GIS-1', parent: '602 Medium Voltage', dep: '', keepDuplicateDep: false },
      { equip: 'OLD-PARENT', parent: 'GIS-1', dep: '', keepDuplicateDep: false },
      { equip: 'NEW-PARENT', parent: 'GIS-1', dep: '', keepDuplicateDep: false },
      { equip: 'EQUIPMENT-A', parent: 'NEW-PARENT', dep: 'OLD-PARENT', keepDuplicateDep: false },
      { equip: 'CHILD-A', parent: 'EQUIPMENT-A', dep: '', keepDuplicateDep: false },
      { equip: 'MATCHED-EQUIPMENT', parent: 'OLD-PARENT', dep: '', keepDuplicateDep: false },
      { equip: 'MISSING-UPN', parent: 'OLD-PARENT', dep: '', keepDuplicateDep: false },
      { equip: 'MISSING-SYSTEM-PARENT', parent: 'OLD-PARENT', dep: '', keepDuplicateDep: false },
    ],
    placements: [
      { branch: 'MISSING-UPN', status: 'missing-data' },
      { branch: 'MISSING-SYSTEM-PARENT', status: 'missing-data' },
    ],
    checks: {
      'old-parent': 'matched',
      'child-a': 'not-found',
      'matched-equipment': 'matched',
      'missing-upn': 'warning',
      'missing-system-parent': 'warning',
      'equipment-a': 'corrected',
    },
  })
})

test('MEL UPN hierarchy corrections use indexed branch locations at large scale', () => {
  assert.match(html, /function buildRawHierarchyIndex\(root\)/)
  assert.match(html, /function indexedRawOccurrences\(index,value,includePath\)/)
  assert.match(html, /function mergeRawHierarchyNodeIndexed\(index,target,source\)/)
  assert.match(html, /const index=buildRawHierarchyIndex\(root\);let moved=0/)
  assert.match(html, /const occurrences=indexedRawOccurrences\(index,correction\.equip,false\)/)
  assert.match(html, /const live=index\.location\.get\(occurrence\.node\)/)
  assert.match(html, /Applying MEL UPN parent rules/)
  assert.match(html, /Normalizing MAH parent tags/)
  const value = runInNewContext(`${customScript}
    const count=2000,oldParent={name:'OLD-PARENT',kids:new Map(),isId:false};
    const root={name:'__root__',kids:new Map([[oldParent.name,oldParent]])};
    const corrections=new Map(),plan={corrections,warnings:[],checks:new Map(),_warningKeys:new Set()};
    for(let i=0;i<count;i++){
      const suffix=String(i).padStart(5,'0'),equip='EQUIPMENT-'+suffix;
      oldParent.kids.set(equip,{name:equip,kids:new Map(),isId:true});
      corrections.set(tagKey(equip),{equip,currentParent:'OLD-PARENT',newParent:'NEW-PARENT-'+suffix,sourceParent:'',equipmentUpn:'100',parentUpn:'200'});
    }
    const started=Date.now(),moved=repairMelSystemParentHierarchy(root,plan),elapsed=Date.now()-started;
    const sample=root.kids.get('NEW-PARENT-01999').kids.get('EQUIPMENT-01999');
    JSON.stringify({moved,elapsed,oldChildren:oldParent.kids.size,rootChildren:root.kids.size,sampleDependency:sample.dependencyOverride});
  `, { console, setTimeout, clearTimeout })
  const result = JSON.parse(value)
  assert.equal(result.moved, 2000)
  assert.equal(result.oldChildren, 0)
  assert.equal(result.rootChildren, 2001)
  assert.equal(result.sampleDependency, 'OLD-PARENT')
  assert.ok(result.elapsed < 750, `indexed hierarchy moves took ${result.elapsed}ms`)
})

test('MEL UPN correction resolves Equipment IDs contained in row-2 MEL tags', () => {
  const value = runInNewContext(`${customScript}
    S.melRows=[
      {tag:'F15-EQUIPMENT-133',upn:'133',systemParent:'F15-SYSTEM-PARENT-133'},
      {tag:'F15-OLD-PARENT-603',upn:'603',systemParent:''}
    ];
    S.melByTag=new Map(S.melRows.map(rec=>[tagKey(rec.tag),rec]));
    S.melByNorm=new Map(S.melRows.map(rec=>[normSep(rec.tag),rec]));
    S.melBySuffix=new Map();
    S.melLookupCache=new Map();
    const equipment={name:'EQUIPMENT-133',kids:new Map(),isId:true};
    const oldParent={name:'OLD-PARENT-603',kids:new Map([[equipment.name,equipment]]),isId:false};
    const root={name:'__root__',kids:new Map([[oldParent.name,oldParent]])};
    const rows=[['OLD-PARENT-603',''],['EQUIPMENT-133','OLD-PARENT-603']];
    const plan=buildMelSystemParentPlan(rows);
    repairMelSystemParentHierarchy(root,plan);
    const repaired=repairMelSystemParentSsmRows(rows,plan).map(ssmResolve);
    JSON.stringify({
      row2:detectMel(['Equipment Tag','UPN','System Parent Equipment Tag(s)']),
      correction:[...plan.corrections.values()][0],
      rootKids:[...root.kids.keys()],
      newParentKids:[...root.kids.get('F15-SYSTEM-PARENT-133').kids.keys()],
      dependency:root.kids.get('F15-SYSTEM-PARENT-133').kids.get('EQUIPMENT-133').dependencyOverride,
      repaired
    });
  `, { console, setTimeout, clearTimeout })
  assert.deepEqual(JSON.parse(value), {
    row2: { tag: 0, upn: 1, building: -1, systemParent: 2 },
    correction: {
      equip: 'EQUIPMENT-133',
      currentParent: 'OLD-PARENT-603',
      newParent: 'F15-SYSTEM-PARENT-133',
      sourceParent: '',
      equipmentUpn: '133',
      parentUpn: '603',
      equipmentMelTag: 'F15-EQUIPMENT-133',
      parentMelTag: 'F15-OLD-PARENT-603',
    },
    rootKids: ['OLD-PARENT-603', 'F15-SYSTEM-PARENT-133'],
    newParentKids: ['EQUIPMENT-133'],
    dependency: 'OLD-PARENT-603',
    repaired: [
      { equip: 'OLD-PARENT-603', parent: '', dep: '', keepDuplicateDep: false },
      { equip: 'F15-SYSTEM-PARENT-133', parent: '', dep: '', keepDuplicateDep: false },
      { equip: 'EQUIPMENT-133', parent: 'F15-SYSTEM-PARENT-133', dep: 'OLD-PARENT-603', keepDuplicateDep: false },
    ],
  })
})

test('MEL contained-tag lookup flags ambiguous Equipment IDs instead of choosing a row', () => {
  const value = runInNewContext(`${customScript}
    S.melRows=[
      {tag:'F15-EQUIPMENT-133',upn:'133',systemParent:'F15-SYSTEM-PARENT-133'},
      {tag:'G22-EQUIPMENT-133',upn:'133',systemParent:'G22-SYSTEM-PARENT-133'},
      {tag:'F15-OLD-PARENT-603',upn:'603',systemParent:''}
    ];
    S.melByTag=new Map(S.melRows.map(rec=>[tagKey(rec.tag),rec]));
    S.melByNorm=new Map(S.melRows.map(rec=>[normSep(rec.tag),rec]));
    S.melBySuffix=new Map();
    S.melLookupCache=new Map();
    const plan=buildMelSystemParentPlan([['EQUIPMENT-133','OLD-PARENT-603']]);
    JSON.stringify({
      corrections:plan.corrections.size,
      warning:plan.warnings.map(item=>({missingField:item.missingField,reason:item.reason}))
    });
  `, { console, setTimeout, clearTimeout })
  assert.deepEqual(JSON.parse(value), {
    corrections: 0,
    warning: [{
      missingField: 'Unique Equipment Tag match',
      reason: 'MEL parent check skipped because EQUIPMENT-133 matched multiple MEL Equipment Tags',
    }],
  })
})

test('MEL corrects LV transformer parents only when a four-character transformer candidate exists', () => {
  assert.match(html, /function equipmentRole\(value\)/)
  assert.match(html, /function hasEquipmentRole\(value,role\)/)
  assert.match(html, /function melCorrectClosestParent\(equipment,parent\)/)
  assert.match(html, /function melMatchingTransformer\(equipment,current\)/)
  assert.match(html, /const expected=parent\.slice\(0,-4\)\+equip\.slice\(-4\),exact=melRecord\(expected\)/)
  assert.match(html, /const candidates=S\.melXfmBySuffix\.get\(suffix\)\|\|\[\]/)
  assert.match(html, /function melTransformerDecision\(equipment,parent\)/)
  assert.match(html, /function applyMelParentCorrections\(segs,loadDesc,track\)/)
  assert.match(html, /segs=applyMelParentCorrections\(gisBusCut\(segs\),loadDesc,true\)/)
  assert.match(html, /function melCorrectLoadRelation\(loadDesc,relation\)/)
  const value = runInNewContext(`${customScript}
    S.melByTag=new Map([
      ['plant-xfmx373b',{tag:'PLANT-XFMX373B',upn:'A07'}],
      ['plant-lvxx373b',{tag:'PLANT-LVXX373B',upn:'107'}]
    ]);
    const exact=melCorrectClosestParent('PLANT-LVXX373B','PLANT-XFMX372B');
    const noCandidate=melCorrectClosestParent('PLANT-LVXX374B','PLANT-XFMX372B');
    const notLv=melCorrectClosestParent('PLANT-MTRX373B','PLANT-XFMX372B');
    const notXfm=melCorrectClosestParent('PLANT-LVXX373B','PLANT-MTRX372B');
    const laterHyphen=melCorrectClosestParent('PLANT-AREA-LVXX373B','PLANT-XFMX372B');
    const path=applyMelParentCorrections(['ROOT','PLANT-XFMX372B','PLANT-LVXX373B'],'');
    const loadPath=applyMelParentCorrections(['ROOT','PLANT-XFMX372B'],'PLANT-LVXX373B');
    const relation=melCorrectLoadRelation('PLANT-LVXX373B',{parent:'PLANT-XFMX372B',dep:'PLANT-XFMX372B',keepDuplicateDep:true});
    JSON.stringify({exact,noCandidate,notLv,notXfm,laterHyphen,path,loadPath,relation,upn:melUpn('plant-lvxx373b')});
  `, { console, setTimeout, clearTimeout })
  assert.deepEqual(JSON.parse(value), {
    exact: 'PLANT-XFMX373B',
    noCandidate: 'PLANT-XFMX372B',
    notLv: 'PLANT-XFMX372B',
    notXfm: 'PLANT-MTRX372B',
    laterHyphen: 'PLANT-XFMX373B',
    path: ['ROOT', 'PLANT-XFMX373B', 'PLANT-LVXX373B'],
    loadPath: ['ROOT', 'PLANT-XFMX373B'],
    relation: { parent: 'PLANT-XFMX373B', dep: 'PLANT-XFMX373B', keepDuplicateDep: true },
    upn: '107',
  })
})

test('MEL inserts missing transformer levels and moves complete mismatched LVS branches', () => {
  assert.match(html, /function melLvsDescendants\(transformer\)/)
  assert.match(html, /if\(hasEquipmentRole\(node\.name,'XFM'\)\)continue/)
  assert.match(html, /if\(hasEquipmentRole\(node\.name,'LVS'\)\)\{found\.push\(\{holder,key,node\}\);continue;\}/)
  assert.match(html, /function repairMelTransformerBranches\(root\)/)
  assert.match(html, /filter\(node=>hasEquipmentRole\(node\.name,'XFM'\)\)/)
  assert.match(html, /holder\.kids\.delete\(childKey\)/)
  assert.match(html, /target\.kids\.set\(child\.name,child\)/)
  assert.match(html, /function ssmAncestorByRole\(row,byEquipment,role\)/)
  assert.match(html, /function repairMelSsmRows\(rows\)/)
  assert.match(html, /out\.push\(existing\?\[\.\.\.existing\]:\[corrected,sourceParent\?cleanTag\(sourceParent\[1\]\):''\]\)/)
  assert.match(html, /fixed\[1\]=corrected/)
  assert.match(html, /fixed\[2\]=corrected/)
  const value = runInNewContext(`${customScript}
    S.melByTag=new Map([
      ['3f21-xfmy373b',{tag:'3F21-XFMY373B',upn:'373'}]
    ]);
    const child={name:'3F21-MTRY900A',kids:new Map(),isId:true};
    const lvs372={name:'3F21-LVSY372B',kids:new Map(),isId:true};
    const lvs373={name:'3F21-LVSY373B',kids:new Map([[child.name,child]]),isId:true};
    const panel={name:'PANEL-A',kids:new Map([[lvs373.name,lvs373]]),isId:true};
    const bus={name:'BUS-A',kids:new Map([[panel.name,panel]]),isId:true};
    const xfm372={name:'3F21-XFMY372B',kids:new Map([[lvs372.name,lvs372],[bus.name,bus]]),isId:false};
    const root={name:'__root__',kids:new Map([[xfm372.name,xfm372]])};
    const moved=repairMelTransformerBranches(root);
    const xfm373=root.kids.get('3F21-XFMY373B');
    const repairedRows=repairMelSsmRows([
      ['ROOT',''],
      ['3F21-XFMY372B','ROOT'],
      ['3F21-LVSY372B','3F21-XFMY372B'],
      ['BUS-A','3F21-XFMY372B'],
      ['PANEL-A','BUS-A'],
      ['3F21-LVSY373B','PANEL-A','PANEL-A',{keepDuplicateDep:true}],
      ['3F21-MTRY900A','3F21-LVSY373B']
    ]);
    JSON.stringify({
      moved,
      rootKids:[...root.kids.keys()],
      oldKids:[...xfm372.kids.keys()],
      oldPanelKids:[...panel.kids.keys()],
      newKids:[...xfm373.kids.keys()],
      movedDescendants:[...xfm373.kids.get('3F21-LVSY373B').kids.keys()],
      repairedRows
    });
  `, { console, setTimeout, clearTimeout })
  assert.deepEqual(JSON.parse(value), {
    moved: 1,
    rootKids: ['3F21-XFMY372B', '3F21-XFMY373B'],
    oldKids: ['3F21-LVSY372B', 'BUS-A'],
    oldPanelKids: [],
    newKids: ['3F21-LVSY373B'],
    movedDescendants: ['3F21-MTRY900A'],
    repairedRows: [
      ['ROOT', ''],
      ['3F21-XFMY372B', 'ROOT'],
      ['3F21-LVSY372B', '3F21-XFMY372B'],
      ['BUS-A', '3F21-XFMY372B'],
      ['PANEL-A', 'BUS-A'],
      ['3F21-XFMY373B', 'ROOT'],
      ['3F21-LVSY373B', '3F21-XFMY373B', '3F21-XFMY373B', { keepDuplicateDep: true }],
      ['3F21-MTRY900A', '3F21-LVSY373B'],
    ],
  })
})

test('unanchored Cable Schedule chains are reviewed without becoming hierarchy roots', () => {
  assert.match(html, /const relations=new Map\(\),seeds=new Set\(\),generated=new Set\(\),unresolved=\[\]/)
  assert.match(html, /if\(cyclic\|\|!anchored\)\{unresolved\.push/)
  assert.match(html, /if\(!anchor\)continue;/)
  assert.doesNotMatch(html, /else\{target=ensureRawHierarchyChild\(root,chain\[chain\.length-1\]\)/)
  const value = runInNewContext(`${customScript}
    S.deps=new Map([['load-orphan','MISSING-PANEL']]);
    const rows=[['602 Medium Voltage',''],['GIS-1','602 Medium Voltage'],['LOAD-ORPHAN','GIS-1','GIS-1',{keepDuplicateDep:true}]];
    const plan=buildCableParentPlan(rows);
    const load={name:'LOAD-ORPHAN',kids:new Map(),isId:true};
    const gis={name:'GIS-1',kids:new Map([[load.name,load]]),isId:false};
    const system={name:'602 Medium Voltage',kids:new Map([[gis.name,gis]]),isId:false};
    const root={name:'__root__',kids:new Map([[system.name,system]])};
    const moved=repairCableHierarchyParents(root,plan);
    JSON.stringify({moved,seeds:[...plan.seeds],unresolved:plan.unresolved,roots:[...root.kids.keys()],gisKids:[...gis.kids.keys()]});
  `, { console, setTimeout, clearTimeout })
  assert.deepEqual(JSON.parse(value), {
    moved: 0,
    seeds: [],
    unresolved: [{
      branchName: 'LOAD-ORPHAN', currentParent: 'GIS-1', suggestedParent: 'MISSING-PANEL', status: 'unplaced', source: 'Cable Schedule',
      reason: 'Cable Schedule parent chain does not connect to the existing hierarchy', chain: ['LOAD-ORPHAN', 'MISSING-PANEL'],
    }],
    roots: ['602 Medium Voltage'],
    gisKids: ['LOAD-ORPHAN'],
  })
})

test('System roots and manual placement keep complete branches under valid role parents', () => {
  assert.match(html, /const SYSTEM_NAMES=new Set\(\[tagKey\(GIS_PARENT\)\]\)/)
  assert.match(html, /function enforceSystemRoots\(root,collect\)/)
  assert.match(html, /function validPlacementParent\(issue,node,blocked\)/)
  assert.match(html, /function moveRawNode\(root,node,target\)/)
  assert.match(html, /function undoRawMove\(move\)/)
  const value = runInNewContext(`${customScript}
    S.placements=[];S._placementId=0;
    const leaf={name:'MTR-CHILD',kids:new Map(),isId:true};
    const lvs={name:'F15-PDU-LVSY373B',kids:new Map([[leaf.name,leaf]]),isId:true};
    const xfm372={name:'F15-PDU-XFMY372B',kids:new Map([[lvs.name,lvs]]),isId:false};
    const xfm373={name:'F15-PDU-XFMY373B',kids:new Map(),isId:false};
    const gis={name:'F15-GIS-1',kids:new Map([[xfm372.name,xfm372],[xfm373.name,xfm373]]),isId:false};
    const system={name:GIS_PARENT,kids:new Map([[gis.name,gis]]),isId:false};
    const stray={name:'STRAY-TOP',kids:new Map(),isId:false};
    const root={name:'__root__',kids:new Map([[system.name,system],[stray.name,stray]])};
    enforceSystemRoots(root,true);
    const roots=finalize(root),lvsNode=[...S.nodeById.values()].find(n=>n.name===lvs.name),xfmNode=[...S.nodeById.values()].find(n=>n.name===xfm373.name),gisNode=[...S.nodeById.values()].find(n=>n.name===gis.name);
    const issue={node:lvs,branchName:lvs.name};
    const validXfm=validPlacementParent(issue,xfmNode),invalidGis=validPlacementParent(issue,gisNode);
    const move=moveRawNode(root,lvs,xfm373),rows=setBranchRegisterParent([[lvs.name,xfm372.name,xfm372.name]],lvs.name,xfm373.name);
    const movedChildren=[...xfm373.kids.get(lvs.name).kids.keys()];undoRawMove(move);
    JSON.stringify({roots:[...root.kids.keys()],placement:S.placements[0].branchName,validXfm,invalidGis,movedChildren,rows,restored:[...xfm372.kids.keys()]});
  `, { console, setTimeout, clearTimeout })
  assert.deepEqual(JSON.parse(value), {
    roots: ['602 Medium Voltage'], placement: 'STRAY-TOP', validXfm: true, invalidGis: false, movedChildren: ['MTR-CHILD'],
    rows: [['F15-PDU-LVSY373B', 'F15-PDU-XFMY373B', 'F15-PDU-XFMY373B', { keepDuplicateDep: true }]], restored: ['F15-PDU-LVSY373B'],
  })
})

test('Review separates cross-sheet tags from hierarchy placement work', () => {
  assert.match(html, /Cross-Sheet Tag Review/)
  assert.match(html, /Placement Review/)
  assert.match(html, /data-review-mode="cross"/)
  assert.match(html, /data-review-mode="placement"/)
  assert.match(html, /function openPlacementDrawer\(issueId\)/)
  assert.match(html, /data-placement="\$\{node\.placementId\}"/)
  assert.match(html, /function addPlacementReviewSheet\(wb,used\)/)
})

test('MEL UPN values appear in hierarchy details and requested SSM columns', () => {
  assert.match(html, /melResolvedRecord\(node\.name\).*rowinfo/)
  assert.match(html, /S\.melParentChecks\.has\(tagKey\(node\.name\)\).*rowinfo/)
  assert.match(html, /const pmd=node\.pmdKey\?S\.pmdDetail\.get\(node\.pmdKey\):null,mel=melResolvedRecord\(node\.name\)/)
  assert.match(html, /const melCheck=S\.melParentChecks\.get\(tagKey\(node\.name\)\)/)
  assert.match(html, /fld\('MEL parent check',result\)/)
  assert.match(html, /fld\('Matched MEL Equipment Tag',melCheck\.equipmentMelTag\)/)
  assert.match(html, /if\(S\.melRows\.length\)html\+=fld\('UPN',mel\?mel\.upn:''\)/)
  assert.match(html, /const G=6,K=10,P=15,AM=38,W=39/)
  assert.match(html, /head\[G\]='UPN';head\[K\]='Equipment ID'/)
  assert.match(html, /row\[G\]=melUpn\(equip\);row\[K\]=equip/)
  assert.match(html, /\['Equipment ID','Closest Parent','Dependencies','UPN'\]/)
  assert.match(html, /registerDisplayValue\(dep\),melUpn\(equip\)/)
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
  assert.match(html, /const out=\[\.\.\.base\]/)
  assert.match(html, /for\(const link of links\)\{const row=existingRows\.get\(link\.loadKey\);out\.push\(row\?\[link\.loadName,\.\.\.row\.slice\(1\)\]:\[link\.loadName,'',depOf\(link\.loadName\)\|\|depOf\(link\.panel\)\|\|''\]\);\}/)
  assert.match(html, /for\(const link of links\)for\(const rec of link\.instruments\)out\.push\(\[pmdExportTag\(rec\.tag,link\.building\),link\.loadName,''\]\)/)
  assert.match(html, /function sheetSsmRows\(sh\)/)
  assert.match(html, /sh\._pmdSsmRows=uniqueSsmRows\(appendPmdSsmRows\(sh\.ssmRows,false\)\)/)
  assert.match(html, /S\.ssmCombined=uniqueSsmRows\(appendPmdSsmRows\(finalCombinedRows,true\)\)/)
  assert.doesNotMatch(html, /for\(const sh of S\.sheets\)sh\.ssmRows=uniqueSsmRows\(appendPmdSsmRows/)
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
    ['RIO650-02-1', 'MCC-1', 'MTR-1'],
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
  assert.match(html, /requestAnimationFrame\(\(\)=>\{if\(token===_virtualTok\)render\(false\);\}\)/)
  assert.match(html, /card\._virtualScrollHandler=onScroll/)
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

test('comparison accepts a missing working dependency when extracted parent and dependency match', () => {
  assert.match(html, /function registerCompareKey\(value\)/)
  assert.match(html, /function sameRegisterValue\(a,b\)\{return registerCompareKey\(a\)===registerCompareKey\(b\);\}/)
  assert.match(html, /function registerDepValue\(parent,dep,keepDuplicate\)\{/)
  assert.match(html, /return d&&!keepDuplicate&&sameRegisterValue\(parent,d\)\?'N\/A':d;/)
  assert.match(html, /dep:registerDepValue\(o\.parent,o\.dep,o\.keepDuplicateDep\)/)
  assert.match(html, /const curParent=a\?a\.parent:''/)
  assert.match(html, /const curDep=a\?registerDepValue\(a\.parent,a\.dep,a\.keepDuplicateDep\):''/)
  assert.match(html, /const wcParent=b\?b\.parent:''/)
  assert.match(html, /const wcDep=b\?registerDepValue\(b\.parent,b\.dep,!!\(a&&a\.keepDuplicateDep\)\):''/)
  assert.match(html, /function isAcceptedMissingWorkingDependency\(curParent,curDep,wcParent,wcDep\)/)
  assert.match(html, /sameRegisterValue\(curDep,curParent\)&&sameWorkingRegisterValue\(curDep,wcParent\)&&workingRegisterCompareKey\(wcDep\)===''/)
  assert.match(html, /function comparisonValuesMatch\(curParent,curDep,wcParent,wcDep\)/)
  assert.match(html, /status=comparisonValuesMatch\(curParent,curDep,wcParent,wcDep\)\?'match':'off'/)
  assert.match(html, /acceptedDepMismatch=!!\(a&&b&&isAcceptedMissingWorkingDependency/)
  assert.match(html, /dep=!r\.acceptedDepMismatch&&!sameWorkingDependencyValue\(r\.curDep,r\.wcDep\)/)
  assert.equal((html.match(/const \{equip,parent,dep\}=ssmRegisterResolve\(r\)/g) || []).length, 2)
  assert.match(html, /function registerDisplayValue\(value\)/)
  assert.match(html, /compareMakeCell\(a,b,accepted\).*registerDisplayValue\(a\).*registerDisplayValue\(b\)/)
  assert.match(html, /compareMakeCell\(r\.curDep,r\.wcDep,r\.acceptedDepMismatch\|\|sameWorkingDependencyValue\(r\.curDep,r\.wcDep\)\)/)
  const value = runInNewContext(`${customScript}
    JSON.stringify([
      comparisonValuesMatch('ID-100','ID-100','ID-100','N/A'),
      comparisonValuesMatch('ID-100','ID-100','OTHER','N/A'),
      comparisonValuesMatch('ID-100','OTHER','ID-100','N/A'),
      comparisonValuesMatch('ID-100','ID-100','ID-100','OTHER'),
      comparisonValuesMatch('ID-100','ID-100','ID-100','ID-100')
    ]);
  `, { console, setTimeout, clearTimeout })
  assert.deepEqual(JSON.parse(value), [true, false, false, false, true])
})

test('comparison accepts a matching tag within semicolon-separated working dependencies', () => {
  assert.match(html, /function sameWorkingDependencyValue\(extracted,working\)/)
  assert.match(html, /clean\(working\)\.split\(';'\)\.map\(clean\)\.filter\(Boolean\)/)
  assert.match(html, /sameWorkingDependencyValue\(curDep,wcDep\)\|\|isAcceptedMissingWorkingDependency/)
  assert.match(html, /compareMakeCell\(r\.curDep,r\.wcDep,r\.acceptedDepMismatch\|\|sameWorkingDependencyValue\(r\.curDep,r\.wcDep\)\)/)
  assert.match(html, /if\(!sameWorkingDependencyValue\(r\.curDep,r\.wcDep\)\)/)
  const value = runInNewContext(`${customScript}
    JSON.stringify([
      sameWorkingDependencyValue('TAG-A','TAG-A; TAG-B'),
      sameWorkingDependencyValue('TAG-B','TAG-A ; TAG-B [Existing]'),
      sameWorkingDependencyValue('TAG-C','TAG-A; TAG-B'),
      sameWorkingDependencyValue('TAG-A','TAG-A'),
      comparisonValuesMatch('PARENT','TAG-A','PARENT','TAG-B; TAG-A'),
      comparisonValuesMatch('PARENT','TAG-A','PARENT','TAG-B; TAG-C'),
      comparisonValuesMatch('PARENT','TAG-A','OTHER','TAG-B; TAG-A')
    ]);
  `, { console, setTimeout, clearTimeout })
  assert.deepEqual(JSON.parse(value), [true, true, false, true, true, false, false])
})

test('comparison accepts trailing bracketed qualifiers only on working-copy tags', () => {
  assert.match(html, /function workingRegisterCompareKey\(value\)/)
  assert.match(html, /function sameWorkingRegisterValue\(extracted,working\)/)
  assert.match(html, /cur\.set\(registerCompareKey\(o\.equip\),o\)/)
  assert.match(html, /wc\.set\(workingRegisterCompareKey\(o\.equip\),o\)/)
  assert.match(html, /parent=!sameWorkingRegisterValue\(r\.curParent,r\.wcParent\)/)
  assert.match(html, /compareMakeCell\(a,b,accepted\).*sameWorkingRegisterValue\(a,b\)/)
  const value = runInNewContext(`${customScript}
    JSON.stringify([
      sameWorkingRegisterValue('TAG-100','TAG-100 [Existing]'),
      sameWorkingRegisterValue('TAG-100','TAG-100[Existing]'),
      sameWorkingRegisterValue('TAG-100','TAG-100 [Existing] [Legacy]'),
      sameWorkingRegisterValue('TAG-100','TAG-100-P [Existing]'),
      sameWorkingRegisterValue('TAG-100','TAG-101 [TAG-100]'),
      sameWorkingRegisterValue('TAG-100 [Extracted]','TAG-100'),
      workingRegisterCompareKey('N/A [Legacy]')
    ]);
  `, { console, setTimeout, clearTimeout })
  assert.deepEqual(JSON.parse(value), [true, true, true, true, false, false, ''])
})

test('SCR, SCC, CIM, and GIS parent overrides preserve extracted dependencies', () => {
  assert.match(html, /function melScrSccParent\(equipment\)/)
  assert.match(html, /for\(const role of \['SCR','SCC'\]\)/)
  assert.match(html, /const unit=clean\(fragment\.split\('_'\)\[0\]\)/)
  assert.match(html, /function melCimParent\(equipment\)/)
  assert.match(html, /return building\?building\+' - CIM':''/)
  assert.match(html, /function cleanRegisterTag\(value\)/)
  assert.match(html, /const GIS_PARENT='602 Medium Voltage'/)
  assert.match(html, /function repairEasyPowerHierarchyParents\(root\)/)
  assert.match(html, /function repairEasyPowerSsmRows\(rows\)/)
  assert.match(html, /const fixed=\[\.\.\.row\];fixed\[1\]=parentName;out\.push\(fixed\)/)
  const value = runInNewContext(`${customScript}
    S.melRows=[
      {tag:'F15-PDU-SCR-239JEF_D-7',upn:'101',building:'F15'},
      {tag:'G20-PDU-SCC-88A_X-1',upn:'102',building:'G20'},
      {tag:'MEL-PREFIX-PDU-MCC-CIM-101',upn:'103',building:'EF25 (G22.5)'}
    ];
    const leaf={name:'LOAD-A',kids:new Map(),isId:true};
    const scr={name:'PDU-SCR-239JEF_D-7_CPS',kids:new Map([[leaf.name,leaf]]),isId:true};
    const scc={name:'PDU-SCC-88A_X-1_NPS',kids:new Map(),isId:true};
    const cim={name:'PDU-MCC-CIM-101',kids:new Map(),isId:true};
    const old={name:'OLD-PARENT',kids:new Map([[scr.name,scr],[scc.name,scc],[cim.name,cim]]),isId:true};
    const gis={name:'GIS-SOURCE-1',kids:new Map(),isId:false};
    const root={name:'__root__',kids:new Map([[old.name,old],[gis.name,gis]])};
    repairEasyPowerHierarchyParents(root);
    const repairedRows=repairEasyPowerSsmRows([
      ['ROOT',''],
      ['OLD-PARENT','ROOT'],
      ['PDU-SCR-239JEF_D-7_CPS','OLD-PARENT','SCR-DEPENDENCY'],
      ['PDU-SCC-88A_X-1_NPS','OLD-PARENT','SCC-DEPENDENCY'],
      ['PDU-MCC-CIM-101','OLD-PARENT','CIM-DEPENDENCY'],
      ['GIS-SOURCE-1','','GIS-DEPENDENCY']
    ]);
    const childNames=name=>[...(root.kids.get('OLD-PARENT').kids.get(name)?.kids.keys()||[])];
    JSON.stringify({
      oldKids:[...old.kids.keys()],
      scrKids:childNames('F15-SCR-239JEF'),
      gisKids:[...root.kids.get(GIS_PARENT).kids.keys()],
      repairedRows,
      resolvedCim:ssmResolve(repairedRows.find(row=>row[0]==='PDU-MCC-CIM-101'))
    });
  `, { console, setTimeout, clearTimeout })
  assert.deepEqual(JSON.parse(value), {
    oldKids: ['F15-SCR-239JEF', 'G20-SCC-88A', 'EF25 (G22.5) - CIM'],
    scrKids: ['PDU-SCR-239JEF_D-7_CPS'],
    gisKids: ['GIS-SOURCE-1'],
    repairedRows: [
      ['ROOT', ''],
      ['OLD-PARENT', 'ROOT'],
      ['F15-SCR-239JEF', 'OLD-PARENT'],
      ['PDU-SCR-239JEF_D-7_CPS', 'F15-SCR-239JEF', 'SCR-DEPENDENCY'],
      ['G20-SCC-88A', 'OLD-PARENT'],
      ['PDU-SCC-88A_X-1_NPS', 'G20-SCC-88A', 'SCC-DEPENDENCY'],
      ['EF25 (G22.5) - CIM', 'OLD-PARENT'],
      ['PDU-MCC-CIM-101', 'EF25 (G22.5) - CIM', 'CIM-DEPENDENCY'],
      ['602 Medium Voltage', ''],
      ['GIS-SOURCE-1', '602 Medium Voltage', 'GIS-DEPENDENCY'],
    ],
    resolvedCim: {
      equip: 'PDU-MCC-CIM-101',
      parent: 'EF25 (G22.5) - CIM',
      dep: 'CIM-DEPENDENCY',
      keepDuplicateDep: false,
    },
  })
})

test('MAH suffix variants become dependencies beneath the base MAH parent', () => {
  assert.match(html, /function mahClosestParent\(value\)/)
  assert.match(html, /const parent=cleanTag\(full\.slice\(0,underscore\)\)/)
  assert.match(html, /return \/-MAH\/i\.test\(parent\)\?parent:''/)
  assert.match(html, /function repairMahHierarchyParents\(root\)/)
  assert.match(html, /child\.dependencyOverride=full/)
  assert.match(html, /function repairMahSsmRows\(rows\)/)
  assert.match(html, /if\(parent\)\{fixed\[1\]=parent;fixed\[2\]=full;\}/)
  assert.match(html, /repairMahHierarchyParents\(combined\);finalCombinedRows=repairMahSsmRows\(finalCombinedRows\)/)
  assert.match(html, /repairMahHierarchyParents\(sh\._sMap\);sh\.ssmRows=repairMahSsmRows\(sh\.ssmRows\)/)
  assert.match(html, /function countTreeDependencies\(roots\)/)
  assert.match(html, /S\.stats\.deps=countTreeDependencies\(S\.roots\)/)
  assert.match(html, /S\.showDeps=!!\(S\.stats&&S\.stats\.deps\)/)
  assert.match(html, /\$\{st\.deps\?`<button class="chip \$\{S\.showDeps\?'on':''\}" id="tgDeps"/)

  const value = runInNewContext(`${customScript}
    const fullMah='R22-MAH777-99-00_MED-B';
    const xyz={name:'XYZ',kids:new Map(),isId:true};
    const full={name:fullMah,kids:new Map([[xyz.name,xyz]]),isId:false};
    const existingXyz={name:'XYZ',kids:new Map(),isId:true,dependencyOverride:'OLD-DEPENDENCY'};
    const existingBase={name:'R22-MAH777-99-00',kids:new Map([[existingXyz.name,existingXyz]]),isId:false};
    const upstream={name:'UPSTREAM',kids:new Map([[existingBase.name,existingBase],[full.name,full]]),isId:false};
    const root={name:'__root__',kids:new Map([[upstream.name,upstream]])};
    repairMahHierarchyParents(root);
    const base=upstream.kids.get('R22-MAH777-99-00');
    const repairedRows=repairMahSsmRows([
      ['UPSTREAM',''],
      [fullMah,'UPSTREAM'],
      ['XYZ',fullMah],
      ['UNCHANGED','OTHER-PARENT','OTHER-DEPENDENCY']
    ]);
    JSON.stringify({
      examples:[
        mahClosestParent(fullMah),
        mahClosestParent('R22-MAH777-99-00_EXTRA_MORE'),
        mahClosestParent('R22-MAH777-99-00'),
        mahClosestParent('R22-PANEL-1_SUFFIX')
      ],
      hierarchy:{
        hasBase:!!base,
        hasFull:upstream.kids.has(fullMah),
        childDependency:base&&base.kids.get('XYZ').dependencyOverride
      },
      rows:repairedRows.map(ssmResolve)
    });
  `, { console, setTimeout, clearTimeout })
  assert.deepEqual(JSON.parse(value), {
    examples: ['R22-MAH777-99-00', 'R22-MAH777-99-00', '', ''],
    hierarchy: {
      hasBase: true,
      hasFull: false,
      childDependency: 'R22-MAH777-99-00_MED-B',
    },
    rows: [
      { equip: 'UPSTREAM', parent: '', dep: '', keepDuplicateDep: false },
      { equip: 'R22-MAH777-99-00', parent: 'UPSTREAM', dep: '', keepDuplicateDep: false },
      { equip: 'XYZ', parent: 'R22-MAH777-99-00', dep: 'R22-MAH777-99-00_MED-B', keepDuplicateDep: false },
      { equip: 'UNCHANGED', parent: 'OTHER-PARENT', dep: 'OTHER-DEPENDENCY', keepDuplicateDep: false },
    ],
  })
})

test('MAH normalization merges large variant groups without repeated child scans', () => {
  assert.match(html, /let repaired=0;const kidIndexes=new WeakMap\(\)/)
  assert.match(html, /const kidsByName=node=>/)
  assert.match(html, /const merge=\(target,source\)=>/)
  assert.match(html, /for\(const node of holder\.kids\.values\(\)\)walk\(node\)/)
  const value = runInNewContext(`${customScript}
    const count=2000,base={name:'R22-MAH777-99-00',kids:new Map(),isId:false};
    const root={name:'__root__',kids:new Map([[base.name,base]])};
    for(let i=0;i<count;i++){
      const suffix=String(i).padStart(5,'0'),full='R22-MAH777-99-00_VARIANT-'+suffix;
      const child={name:'CHILD-'+suffix,kids:new Map(),isId:true};
      root.kids.set(full,{name:full,kids:new Map([[child.name,child]]),isId:false});
    }
    const started=Date.now(),repaired=repairMahHierarchyParents(root),elapsed=Date.now()-started;
    JSON.stringify({
      repaired,elapsed,rootChildren:root.kids.size,baseChildren:base.kids.size,
      sampleDependency:base.kids.get('CHILD-01999').dependencyOverride
    });
  `, { console, setTimeout, clearTimeout })
  const result = JSON.parse(value)
  assert.equal(result.repaired, 2000)
  assert.equal(result.rootChildren, 1)
  assert.equal(result.baseChildren, 2000)
  assert.equal(result.sampleDependency, 'R22-MAH777-99-00_VARIANT-01999')
  assert.ok(result.elapsed < 750, `indexed MAH normalization took ${result.elapsed}ms`)
})

test('missing optional PMD, MEL, and Cable sources take constant-time fast paths', () => {
  assert.match(html, /function hasMelData\(\)/)
  assert.match(html, /if\(!S\.pmdPanels\.length\)\{S\.pmdLinks=links;return 0;\}/)
  assert.match(html, /if\(!S\.hasCable&&!S\.deps\.size\)return \{relations:new Map\(\),seeds:new Set\(\),generated:new Set\(\),unresolved:\[\]\}/)
  const value = runInNewContext(`${customScript}
    S.melRows=[];S.melByTag=new Map();S.melByNorm=new Map();S.melXfmBySuffix=new Map();
    S.pmdPanels=[];S.pmdLinks=[{loadName:'stale'}];S.deps=new Map();S.hasCable=false;
    S._melPlacementSeeds=new Map();S.placements=[];S._placementByKey=new Map();S._placementId=0;
    const corrected=applyMelParentCorrections(['ROOT-XFMX372B','LOAD-LVSY373B'],'',true);
    const melPlan=buildMelSystemParentPlan([['LOAD-LVSY373B','ROOT-XFMX372B']]);
    const cablePlan=buildCableParentPlan([['LOAD-LVSY373B','ROOT-XFMX372B','ROOT-XFMX372B']]);
    const guardedRoot={get kids(){throw new Error('empty PMD path traversed the hierarchy')}};
    const attached=attachPmdInstruments(guardedRoot);
    bindMelPlacementSeeds(guardedRoot);
    JSON.stringify({
      corrected,seeds:S._melPlacementSeeds.size,placements:S.placements.length,
      melCorrections:melPlan.corrections.size,melWarnings:melPlan.warnings.length,
      cableRelations:cablePlan.relations.size,cableSeeds:cablePlan.seeds.size,
      attached,pmdLinks:S.pmdLinks.length
    });
  `, { console, setTimeout, clearTimeout })
  assert.deepEqual(JSON.parse(value), {
    corrected: ['ROOT-XFMX372B', 'LOAD-LVSY373B'],
    seeds: 0,
    placements: 0,
    melCorrections: 0,
    melWarnings: 0,
    cableRelations: 0,
    cableSeeds: 0,
    attached: 0,
    pmdLinks: 0,
  })
})

test('placement registration and natural sorting stay indexed at large scale', () => {
  assert.match(html, /const NAT_COLLATOR=new Intl\.Collator/)
  assert.match(html, /existing=byKey\.get\(key\)/)
  assert.match(html, /byKey\.set\(key,item\)/)
  const value = runInNewContext(`${customScript}
    S.placements=[];S._placementByKey=new Map();S._placementId=0;
    const started=Date.now(),count=30000;
    for(let i=0;i<count;i++)registerPlacement({branchName:'TAG-'+i,currentParent:'PARENT-'+i,suggestedParent:'',status:'missing-data',source:'MEL'});
    for(let i=0;i<count;i+=1000)registerPlacement({branchName:'TAG-'+i,currentParent:'PARENT-'+i,suggestedParent:'',status:'missing-data',source:'MEL'});
    const elapsed=Date.now()-started;
    const sorted=['TAG-10','TAG-2','tag-1'].sort(natCmp);
    JSON.stringify({elapsed,placements:S.placements.length,indexed:S._placementByKey.size,sorted});
  `, { console, setTimeout, clearTimeout })
  const result = JSON.parse(value)
  assert.equal(result.placements, 30000)
  assert.equal(result.indexed, 30000)
  assert.deepEqual(result.sorted, ['tag-1', 'TAG-2', 'TAG-10'])
  assert.ok(result.elapsed < 1000, `indexed placement registration took ${result.elapsed}ms`)
})

test('per-tab PMD hierarchy and register rows materialize only when exported', () => {
  assert.match(html, /function sheetRoots\(sh\)/)
  assert.match(html, /function sheetSsmRows\(sh\)/)
  assert.match(html, /if\(!sh\._pmdAttached&&S\.pmdPanels\.length\)/)
  const value = runInNewContext(`${customScript}
    const panel={key:pmdPanelKey('PANEL-1'),panel:'PANEL-1',instruments:[{key:'inst-1',tag:'INST-1',description:'Instrument'}]};
    S.pmdPanels=[panel];S.pmdPanelMap=new Map([[panel.key,panel]]);S.pmdSuffixMap=new Map();
    const combinedLoad={name:'PANEL-1',kids:new Map(),isLoad:true},combined={name:'__root__',kids:new Map([['PANEL-1',combinedLoad]])};
    attachPmdInstruments(combined);
    const sheetLoad={name:'PANEL-1',kids:new Map(),isLoad:true};
    const sh={_sMap:{name:'__root__',kids:new Map([['PANEL-1',sheetLoad]])},ssmRows:[['PANEL-1','PARENT','DEP']]};
    const before=sheetLoad.kids.size,rows=sheetSsmRows(sh),roots=sheetRoots(sh);
    JSON.stringify({before,after:sheetLoad.kids.size,rowCount:rows.length,lastRow:rows[rows.length-1],instrument:roots[0].children[0].name,pmdAttached:sh._pmdAttached});
  `, { console, setTimeout, clearTimeout })
  assert.deepEqual(JSON.parse(value), {
    before: 0,
    after: 1,
    rowCount: 2,
    lastRow: ['INST-1', 'PANEL-1', ''],
    instrument: 'INST-1',
    pmdAttached: true,
  })
})

test('SSM registers keep one normalized Equipment ID across hierarchy and PMD rows', () => {
  assert.match(html, /function uniqueSsmRows\(rows\)\{/)
  assert.match(html, /const seen=new Set\(\),out=\[\];/)
  assert.match(html, /const key=tagKey\(row&&row\[0\]\);if\(!key\|\|seen\.has\(key\)\)continue;seen\.add\(key\);out\.push\(row\)/)
  assert.match(html, /S\.ssmCombined=uniqueSsmRows\(appendPmdSsmRows\(finalCombinedRows,true\)\)/)
  assert.match(html, /sh\._pmdSsmRows=uniqueSsmRows\(appendPmdSsmRows\(sh\.ssmRows,false\)\)/)
  assert.match(html, /function filterSsm\(rows\)\{return uniqueSsmRows\(rows\)\.filter/)
  const value = runInNewContext(`${customScript}
    JSON.stringify(uniqueSsmRows([
      ['TAG-P','FIRST-PARENT','FIRST-DEP'],
      ['tag','SECOND-PARENT','SECOND-DEP'],
      ['OTHER-S','OTHER-PARENT',''],
      ['other-p','DUPLICATE-PARENT','']
    ]));
  `, { console, setTimeout, clearTimeout })
  assert.deepEqual(JSON.parse(value), [
    ['TAG-P', 'FIRST-PARENT', 'FIRST-DEP'],
    ['OTHER-S', 'OTHER-PARENT', ''],
  ])
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
