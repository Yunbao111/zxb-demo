import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { corpus, articleMap } from '../lib/corpus';
import { searchArticles } from '../lib/search';
import { answerQuestion } from '../lib/ai/answer';
import { CompatibleChatProvider } from '../lib/ai/provider';
import { generateReport, reportText, sampleProfile, emptyProfile, countries } from '../lib/report';

async function main(){
assert.equal(corpus.sources.length,4);assert.equal(corpus.articles.length,428);
assert.equal(articleMap.size,corpus.articles.length);
assert.equal(corpus.analysis.status,'ready');
for(const a of corpus.articles){assert.ok(a.text.length>10);assert.ok(a.sourceUrl.startsWith('https://publications.europa.eu/'));for(const r of a.references)if(r.targetId)assert.ok(articleMap.has(r.targetId),`unresolved target ${r.targetId}`)}
assert.ok(articleMap.get('gpsr:11')!.references.some(r=>r.targetId==='gpsr:9'));
assert.ok(articleMap.get('gpsr:11')!.references.some(r=>r.targetId==='gpsr:5'));
assert.ok(articleMap.get('gpsr:16')!.references.some(r=>r.targetId==='surveillance:4'));
assert.equal(searchArticles('2023/988').length,52);
assert.equal(searchArticles('2023/988 第 11 条')[0].article.id,'gpsr:11');
assert.equal(searchArticles('article 170','customs')[0].article.id,'customs:170');
assert.equal(searchArticles('zzzxxyynonexistent').length,0);
assert.ok(searchArticles('importer','gpsr').every(h=>h.article.lawId==='gpsr'));

const queries=[
 {q:'制造商 义务',expected:'gpsr:9'},
 {q:'进口商 义务',expected:'gpsr:11'},
 {q:'经销商 义务',expected:'gpsr:12'},
 {q:'远程销售',expected:'gpsr:19'},
 {q:'CE 标志',expected:'accreditation:30'},
 {q:'proof of origin',expected:'customs:61'},
 {q:'acquisition of origin',expected:'customs:60'},
 {q:'2023/988 第 11 条',expected:'gpsr:11'},
 {q:'2019/1020 第 4 条',expected:'surveillance:4'},
 {q:'952/2013 第 170 条',expected:'customs:170'},
];
const rows=queries.map(x=>({...x,baseline:searchArticles(x.q,'all',false).slice(0,5).map(h=>h.article.id),withTopics:searchArticles(x.q,'all',true).slice(0,5).map(h=>h.article.id)}));
for(const row of rows)assert.ok(row.withTopics.includes(row.expected),`expected ${row.expected} for ${row.q}: ${row.withTopics}`);
const response=await answerQuestion('进口商义务');
assert.equal(response.mode,'retrieval_only');assert.ok(response.evidence.length>0);
let providerCalled=false;
const empty=await answerQuestion('zzzxxyynonexistent','all',{async generate(){providerCalled=true;return {answer:'not expected',citations:[]}}});
assert.equal(empty.mode,'insufficient_evidence');assert.equal(providerCalled,false);
const evidence=[{id:'gpsr:11',title:'Article 11',text:'Importers shall...',sourceUrl:'https://example.invalid',version:'original'}];
const fakeFetch=(content:string)=>(async()=>Response.json({choices:[{message:{content}}]})) as typeof fetch;
const cfg={baseUrl:'https://example.invalid/v1',apiKey:'test-placeholder',model:'fixture'};
await assert.rejects(()=>new CompatibleChatProvider(cfg,fakeFetch(JSON.stringify({answer:'Claim [gpsr:999]',citations:['gpsr:999']}))).generate('q',evidence),/UNSUPPORTED_CITATION/);
await assert.rejects(()=>new CompatibleChatProvider(cfg,fakeFetch(JSON.stringify({answer:'Claim without sources',citations:[]}))).generate('q',evidence),/INVALID_ANSWER/);
const valid=await new CompatibleChatProvider(cfg,fakeFetch(JSON.stringify({answer:'基于原始文本的摘要 [gpsr:11]',citations:['gpsr:11']}))).generate('q',evidence);
assert.deepEqual(valid.citations,['gpsr:11']);
const report=generateReport(sampleProfile);
assert.ok(report.findings.some(f=>f.id==='manufacturer'));
assert.ok(report.findings.some(f=>f.id==='distance'));
assert.ok(report.findings.some(f=>f.id==='customs'));
assert.ok(report.sources.includes('gpsr:16')&&report.sources.includes('surveillance:4'));
assert.ok(report.findings.every(f=>f.action.length>10&&f.documents.length>0));
assert.ok(report.sources.every(id=>articleMap.has(id)));
assert.match(reportText(report),/https:\/\/publications.europa.eu/);
assert.match(reportText(report),/未合并后续修订/);
const food=generateReport({...sampleProfile,product:'饼干',industry:'food'});
assert.ok(!food.findings.some(f=>['manufacturer','safety','distance','responsible'].includes(f.id)));
assert.match(food.summary,/排除类别/);
const toy=generateReport({...sampleProfile,product:'儿童积木',industry:'toys'});
assert.ok(toy.findings.some(f=>f.id==='sector'));
assert.ok(!toy.findings.some(f=>f.id==='manufacturer'));
const offline=generateReport({...sampleProfile,channel:'offline',direction:'internal',role:'distributor'});
assert.ok(!offline.findings.some(f=>['distance','customs','origin','manufacturer'].includes(f.id)));
assert.ok(offline.findings.some(f=>f.id==='distributor'));
const unknown=generateReport({...emptyProfile,country:'法国',product:'尚未归类商品'});
assert.ok(unknown.questions.length>=4);
assert.ok(!unknown.findings.some(f=>['safety','manufacturer','distance'].includes(f.id)));
const uk=generateReport({...sampleProfile,country:'英国'});
assert.equal(uk.coverage,'outside');assert.equal(uk.findings.length,0);assert.equal(uk.sources.length,0);
assert.equal(countries.length,27);
assert.throws(()=>generateReport(emptyProfile),/填写/);
for(const country of countries)assert.equal(generateReport({...sampleProfile,country}).coverage,'limited');
// Regression: changing only free-text product input must affect actionable content.
const products=['家用收纳盒','棉质儿童T恤','220V电热水壶','巧克力饼干','洗发水','木质椅子','不锈钢饭盒'];
const variants=products.map(product=>generateReport({...sampleProfile,product}));
const signatures=variants.map(r=>JSON.stringify(r.findings.filter(f=>f.id.startsWith('product-')).map(f=>[f.id,f.action,f.documents])));
assert.equal(new Set(signatures).size,products.length,'product changes must change actions and materials');
['storage','clothing','electrical','food','cosmetics','furniture','tableware'].forEach((id,i)=>assert.ok(variants[i].findings.some(f=>f.id==='product-'+id),products[i]+' should match '+id));
assert.ok(variants[1].findings.some(f=>f.id==='product-clothing'));
assert.ok(variants[1].findings.some(f=>f.id==='feature-children'));
assert.ok(variants[2].findings.some(f=>f.id==='classification-conflict'));
assert.ok(!variants[2].findings.some(f=>f.id==='manufacturer'));
assert.ok(!variants[3].findings.some(f=>['manufacturer','distance','safety'].includes(f.id)));
assert.ok(variants.every(r=>r.sources.every(id=>articleMap.has(id))));
const nonsense=generateReport({...sampleProfile,product:'asdfxyz123'});
assert.ok(nonsense.findings.some(f=>f.id==='product-unknown'));
assert.ok(!nonsense.findings.some(f=>['manufacturer','safety','distance'].includes(f.id)));
const withBattery=generateReport({...sampleProfile,product:'台灯',industry:'electronics',details:'含锂电池，支持蓝牙'});
const withoutBattery=generateReport({...sampleProfile,product:'台灯',industry:'electronics',details:'不含电池，无蓝牙'});
assert.ok(withBattery.findings.some(f=>f.id==='feature-battery'));
assert.ok(withBattery.findings.some(f=>f.id==='feature-wireless'));
assert.ok(!withoutBattery.findings.some(f=>['feature-battery','feature-wireless'].includes(f.id)));
const contact=generateReport({...sampleProfile,details:'用于接触食品'});
assert.ok(contact.findings.some(f=>f.id==='feature-food-contact'));
assert.ok(!report.findings.some(f=>f.id==='feature-food-contact'));
const mixed=generateReport({...sampleProfile,product:'台灯和饼干'});
assert.ok(mixed.findings.some(f=>f.id==='classification-conflict'));
assert.ok(!mixed.findings.some(f=>f.id==='manufacturer'));
assert.match(reportText(withBattery),/含锂电池/);
writeFileSync('data/analysis/product-report-check.json',JSON.stringify({date:new Date().toISOString(),passed:true,products:variants.map(r=>({product:r.profile.product,findings:r.findings.map(f=>f.id)})),checks:['same fields / different products','unknown product abstention','classification conflict','negated features','different detail text','citation integrity'],limitations:'Small rule-based regression set; does not measure general language understanding or legal accuracy.'},null,2));
mkdirSync('data/analysis',{recursive:true});
writeFileSync('data/analysis/retrieval-check.json',JSON.stringify({date:new Date().toISOString(),sampleSize:rows.length,metric:'Known relevant article hit@5 on ten hand-authored demo queries',baselineHitAt5:rows.filter(r=>r.baseline.includes(r.expected)).length/rows.length,withTopicsHitAt5:rows.filter(r=>r.withTopics.includes(r.expected)).length/rows.length,limitations:'Small smoke set, not a representative benchmark or legal accuracy estimate. Do not claim a topic-model improvement from this alone.',rows},null,2));
console.log('PASS: corpus integrity, references, 10 retrieval cases, disabled AI, citations; report scenarios: general goods, food exclusions, toys, roles, channels, directions, missing facts and 27 EU countries / out-of-scope');
}
main().catch(e=>{console.error(e);process.exitCode=1});
