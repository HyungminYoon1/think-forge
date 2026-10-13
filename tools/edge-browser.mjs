// Manual isolated Chrome harness; npm test/CI does not execute tools/edge-browser.mjs.
// Start tools/serve.mjs first. EDGE_URL must be an owned loopback server.
// Uses the approved reusable Playwright installation; no personal browser profile.
import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const qaRequire=createRequire(resolve(process.env.PLAYWRIGHT_PACKAGE ?? '../output/playwright/implement-20261012/package.json'));
const {chromium}=qaRequire('playwright');
const url=process.env.EDGE_URL;
if(!url || new URL(url).hostname!=='127.0.0.1')throw Error('Set EDGE_URL to the owned loopback URL');
const out=resolve('.qa/edge-20261013');
let browser;
before(async()=>{await mkdir(out,{recursive:true});browser=await chromium.launch({executablePath:process.env.CHROME_PATH??'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:false,args:['--mute-audio']});});
after(async()=>{await browser?.close();});
async function fresh(t,init){
  const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
  t.after(()=>context.close());if(init)await context.addInitScript(init);
  const page=await context.newPage();page.setDefaultTimeout(5000);await page.goto(url);return page;
}
async function views(page,name,locator){
  for(const [width,height]of [[1440,1000],[390,844],[320,780]]){
    await page.setViewportSize({width,height});if(locator)await locator.scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'page overflow '+width);
    await page.screenshot({path:resolve(out,name+'-'+width+'.png'),scale:'css'});
  }
}

const key='think-forge-v1';
async function calculus(p){await p.locator('#topic').selectOption('calculus');await p.locator('#seed').fill('smoke');await p.locator('#apply-seed').click();}
test('edge-browser: independent poster oracle, blank/correct/repeat, review removal export and reload',async t=>{
  const p=await fresh(t);const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await views(p,'initial');await calculus(p);
  await p.locator('#submit').click();assert.equal(await p.locator('#submit').isEnabled(),true);
  // Disclosed smoke witness: 900 print area, margins 6+6. (30+6)^2 = 1296.
  await p.locator('#answer').fill('1296');await p.locator('#answer').press('Enter');
  assert.match(await p.locator('#feedback').textContent(),/정답입니다/);assert.equal(await p.locator('#xp-count').textContent(),'22 XP');
  const before=await p.evaluate(k=>localStorage.getItem(k),key);
  await p.locator('#answer').press('Enter');assert.equal(await p.evaluate(k=>localStorage.getItem(k),key),before);
  await views(p,'answer',p.locator('#feedback'));
  await p.locator('#next').click();await p.locator('#answer').fill('999');await p.locator('#submit').click();
  await p.locator('[data-mode="review"]').click();
  // Numeric replay answer is read from this same condition's already-disclosed learning solution.
  await p.locator('#skip').click();const text=await p.locator('#feedback').textContent();const m=text.match(/정답은 (.+)입니다/);assert.ok(m);
  await p.locator('[data-mode="review"]').click();await p.locator('#answer').fill(m[1]);await p.locator('#submit').click();await p.locator('#next').click();
  assert.match(await p.locator('#session-result').textContent(),/복습을 마쳤/);
  const d=p.waitForEvent('download');await p.locator('#export').click();const file=await d;await file.saveAs(resolve(out,'record.json'));
  const exported=JSON.parse(await readFile(resolve(out,'record.json'),'utf8'));assert.equal(exported.record.mistakes.length,0);
  await p.reload();assert.equal(await p.locator('#xp-count').textContent(),exported.record.xp+' XP');assert.equal(errors.length,0);
});
test('edge-browser: IME event fixture ignored, normal Enter submits; cancelled clear preserves both keys',async t=>{
  const p=await fresh(t);await calculus(p);await p.locator('#answer').fill('1296');
  // Synthetic composition event exercises the browser handler; not a real OS IME claim.
  await p.locator('#answer').dispatchEvent('keydown',{key:'Enter',isComposing:true});
  assert.equal(await p.locator('#submit').isEnabled(),true);
  await p.locator('#answer').press('Enter');const before=await p.evaluate(k=>localStorage.getItem(k),key);
  const shared=await p.evaluate(()=>localStorage.getItem('web-lab-progress-v1'));
  p.once('dialog',d=>d.dismiss());await p.locator('#clear').click();
  assert.equal(await p.evaluate(k=>localStorage.getItem(k),key),before);assert.equal(await p.evaluate(()=>localStorage.getItem('web-lab-progress-v1')),shared);
});
test('edge-browser: invalid code preserves challenge, ten skips finish once with hidden feedback',async t=>{
  const p=await fresh(t);await p.locator('[data-mode="challenge"]').click();
  const before=await p.locator('#question-text').textContent();
  await p.locator('#seed').fill('bad code!');await p.locator('#apply-seed').click();assert.equal(await p.locator('#question-text').textContent(),before);
  for(let i=0;i<10;i++){await p.locator('#skip').click();if(i<9){assert.equal(await p.locator('#explanation').isHidden(),true);await p.locator('#next').click();}}
  assert.equal(await p.locator('#session-result > details').count(),10);assert.match(await p.locator('#session-result').textContent(),/건너뜀 10/);
  const own=await p.evaluate(k=>localStorage.getItem(k),key);
  await p.evaluate(()=>document.querySelector('#submit').onclick());assert.equal(await p.evaluate(k=>localStorage.getItem(k),key),own);
  await views(p,'exam',p.locator('#session-result'));
});
test('edge-browser: private quota failure cannot publish completion or replace sibling summary',async t=>{
  const p=await fresh(t,()=>{localStorage.setItem('web-lab-progress-v1',JSON.stringify({version:1,apps:{'data-mirage':{completed:1,total:6,updatedAt:'2026-10-09T00:00:00.000Z'}}}));const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='think-forge-v1')throw new DOMException('QA quota','QuotaExceededError');return set.call(this,k,v);};});
  const before=await p.evaluate(()=>localStorage.getItem('web-lab-progress-v1'));
  await calculus(p);await p.locator('#answer').fill('1296');await p.locator('#submit').click();
  assert.match(await p.locator('#notice').textContent(),/저장할 수 없습니다/);assert.equal(await p.evaluate(k=>localStorage.getItem(k),key),null);
  assert.equal(await p.evaluate(()=>localStorage.getItem('web-lab-progress-v1')),before);assert.equal(await p.locator('#next').isVisible(),true);
});

