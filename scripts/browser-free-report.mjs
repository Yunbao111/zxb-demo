import {createRequire} from 'node:module';
import {mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'C:/Users/28104/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:5173/',{waitUntil:'networkidle'});
 await page.getByLabel('目标国家',{exact:false}).selectOption('德国');
 await page.getByLabel('具体产品',{exact:false}).fill('弯头管件');
 await page.getByRole('button',{name:'生成分析报告',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'尚未配置密钥'}).waitFor();
 assert.equal(await page.locator('.report-document').count(),0);
 await page.route('**/api/report',async route=>{
  const profile=route.request().postDataJSON();
  await new Promise(r=>setTimeout(r,350));
  await route.fulfill({json:{report:{profile,createdAt:new Date().toISOString(),version:'ui-test-only',summary:'界面测试桩：需要核实弯头管件材质、用途与承压参数。',coverage:'limited',findings:[{id:'mock',title:'确认用途',status:'资料缺口',why:'用途未填写',analysis:'此内容为界面测试桩。',action:'补充用途。',documents:['规格书'],citations:[]}],questions:['是否承压？'],sources:[],related:[],limits:['仅测试页面，不代表真实模型结果。']}}});
 });
 await page.getByRole('button',{name:'生成分析报告',exact:true}).click();
 assert(await page.getByRole('button',{name:'正在检索依据并生成报告…'}).isDisabled());
 await page.getByRole('heading',{name:'贸易合规初步分析报告',exact:true}).waitFor();
 assert(page.url().endsWith('#analysis-report'));
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'下载分析报告',exact:true}).click();await download;
 await page.getByRole('button',{name:'修改贸易情境',exact:true}).click();
 assert.equal(await page.getByLabel('具体产品',{exact:false}).inputValue(),'弯头管件');
 await page.setViewportSize({width:390,height:844});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
 mkdirSync('.sites-runtime/qa',{recursive:true});
 await page.screenshot({path:'.sites-runtime/qa/free-api-scenario-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('PASS: real missing-key response; mock loading/success/export/back; mobile overflow; no page errors. No external inference called.');
}finally{await browser.close()}
