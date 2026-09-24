'use client';
import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Download, Network, Printer } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { articleMap, corpus } from '@/lib/corpus';
import { channels, countries, directions, emptyProfile, industries, reportText, roles, sampleProfile, type Profile, type Report } from '@/lib/report';

export function ReportWorkbench({openArticle,stage,onStage}:{openArticle:(id:string)=>void;stage:'scenario'|'document';onStage:(stage:'scenario'|'document')=>void}){
 const [profile,setProfile]=useState<Profile>(emptyProfile),[report,setReport]=useState<Report|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const heading=useRef<HTMLHeadingElement>(null);
 const dirty=report&&JSON.stringify({...profile,product:profile.product.trim()})!==JSON.stringify(report.profile);
 const showReport=stage==='document'&&report!==null;
 function update<K extends keyof Profile>(key:K,value:Profile[K]){setProfile(p=>({...p,[key]:value}));setError('')}
 async function generate(){
  if(busy)return;
  setBusy(true);setError('');
  const snapshot={...profile};
  try{const response=await fetch('/api/report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(snapshot),signal:AbortSignal.timeout(160000)});const data=await response.json() as {report?:Report;message?:string};if(!response.ok||!data.report)throw new Error(data.message||'报告未能生成，请重试。');setReport(data.report);onStage('document');window.scrollTo(0,0);setTimeout(()=>heading.current?.focus(),0)}catch(e){setError(e instanceof Error&&e.name==='TimeoutError'?'生成等待超时，请稍后再试。':(e as Error).message)}finally{setBusy(false)}
 }
 function download(){if(!report)return;const url=URL.createObjectURL(new Blob([reportText(report)],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='欧律通-初步分析报告.txt';a.click();URL.revokeObjectURL(url)}
 const selects=[{key:'industry',label:'行业 / 产品类别',options:industries},{key:'role',label:'企业在供应链中的角色',options:roles},{key:'channel',label:'销售渠道',options:channels},{key:'direction',label:'贸易方向',options:directions}] as const;
 return <section className="report-workbench">
  {!showReport&&<><div className="report-page-heading"><div><p className="step-label">填写贸易情境</p><h1>从这笔贸易开始。</h1><p>告诉我们目的地、产品和经营方式，下一页查看分析报告。</p></div></div>
  <form className="scenario-form" aria-busy={busy} onSubmit={e=>{e.preventDefault();generate()}}>
   <fieldset disabled={busy} style={{border:0,padding:0,margin:0,minWidth:0}}><div className="scenario-heading"><h2>你的贸易情境</h2><button type="button" onClick={()=>{setProfile({...sampleProfile});setError('')}}>填入示例</button></div>
   <p className="form-help">不确定的信息可以留待确认。填写越完整，核查清单越贴近实际业务。</p>
   <label htmlFor="report-country">目标国家 <span>必填</span></label><select id="report-country" value={profile.country} required onChange={e=>update('country',e.target.value)}><option value="">请选择目的地</option><optgroup label="欧盟成员国">{countries.map(c=><option key={c}>{c}</option>)}</optgroup><optgroup label="当前范围之外">{['英国','瑞士','挪威','其他非欧盟市场'].map(c=><option key={c}>{c}</option>)}</optgroup></select>
   <label htmlFor="report-product">具体产品 <span>必填</span></label><Input id="report-product" value={profile.product} required maxLength={200} placeholder="如：家用收纳盒（不接触食品）" onChange={e=>update('product',e.target.value)}/>
   <label htmlFor="report-details">产品补充说明 <span>建议填写</span></label><textarea id="report-details" value={profile.details||''} maxLength={1000} rows={4} placeholder="例如：棉质儿童T恤，面向3–6岁，无绳带；或电热水壶，220V、1500W，不含电池。" onChange={e=>update('details',e.target.value)}/><p className="form-footnote">请说明用途、材质、技术参数，以及最希望报告解答的问题；未知信息可以留空。</p>
   {selects.map(s=><div key={s.key}><label htmlFor={`report-${s.key}`}>{s.label}</label><select id={`report-${s.key}`} value={profile[s.key]} onChange={e=>update(s.key,e.target.value as never)}>{Object.entries(s.options).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></div>)}
   <label htmlFor="report-consumer">是否面向消费者使用？</label><select id="report-consumer" value={profile.consumer} onChange={e=>update('consumer',e.target.value as Profile['consumer'])}><option value="unknown">尚未确定</option><option value="yes">是（含可预见的消费者使用）</option><option value="no">否，仅专业用途</option></select>
   {error&&<p role="alert" className="form-error">{error}</p>}
   <Button type="submit" disabled={busy} className="generate-button">{busy?'正在检索依据并生成报告…':report?'重新生成分析报告':'生成分析报告'}<ArrowRight size={16}/></Button>
   <p className="form-footnote">生成时会将贸易情境及相关法规片段发送至 OpenRouter 和其模型服务商。请勿填写客户姓名、联系方式或商业秘密。</p></fieldset>
  </form></>}
  {showReport&&report&&<div className="report-output">
    <div className="report-return"><Button variant="ghost" onClick={()=>{onStage('scenario');window.scrollTo(0,0)}}><ArrowLeft size={16}/>修改贸易情境</Button><span>分析报告</span></div>
    {error&&<p role="alert" className="form-error">{error}</p>}{dirty&&<div className="stale-report" role="status">贸易情境已修改，这份报告仍基于上次填写的信息。<Button variant="outline" size="sm" disabled={busy} onClick={generate}>{busy?'正在生成…':'更新报告'}</Button></div>}
    <article className="report-document" aria-label="贸易合规初步分析报告">
     <header className="document-header"><div><span className="document-kicker">欧律通 · 业务核查</span><h2 ref={heading} tabIndex={-1}>贸易合规初步分析报告</h2><p>{report.profile.country} · {report.profile.product}</p></div><div className="report-tools"><Button type="button" variant="outline" size="sm" onClick={download} aria-label="下载分析报告"><Download size={15}/>下载</Button><Button type="button" variant="outline" size="sm" onClick={()=>window.print()} aria-label="打印分析报告"><Printer size={15}/>打印</Button></div></header>
     <div className="document-meta"><span>{new Date(report.createdAt).toLocaleDateString('zh-CN')}</span><span>{report.coverage==='outside'?'超出当前覆盖':'待核实适用条件'}</span></div>
     <section className="report-summary"><h3>先看结论与推进顺序</h3><p>{report.summary}</p></section>
     <dl className="profile-summary">{[['产品类别',industries[report.profile.industry]],['企业角色',roles[report.profile.role]],['销售渠道',channels[report.profile.channel]],['贸易方向',directions[report.profile.direction]]].map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
     <div className="report-section-title"><h3>核查事项与行动清单</h3><span>{report.findings.length} 项</span></div>
     {!report.findings.length&&<p className="report-no-findings">该目的地暂无可用的法规分析清单，请选择欧盟成员国或补充该市场语料。</p>}
     {report.findings.map((f,i)=><section key={f.id} className="finding" data-rule={f.id}><div className="finding-heading"><span className="finding-number">{String(i+1).padStart(2,'0')}</span><h4>{f.title}</h4><span className={`finding-status ${f.status==='资料缺口'?'gap':''}`}>{f.status}</span></div><p className="finding-why">{f.why}</p><p className="finding-analysis">{f.analysis}</p><div className="finding-action"><b>下一步</b><p>{f.action}</p></div><div className="finding-materials"><span>准备材料</span><ul>{f.documents.map(d=><li key={d}>{d}</li>)}</ul></div><div className="finding-citations">{f.citations.map(id=>{const a=articleMap.get(id)!,s=corpus.sources.find(s=>s.id===a.lawId)!;return <button key={id} onClick={()=>openArticle(id)} aria-label={`核查依据 ${s.number} 第 ${a.number} 条`}>[{report.sources.indexOf(id)+1}] {s.short} · 第 {a.number} 条<ArrowUpRight size={12}/></button>})}</div></section>)}
     <section className="report-questions"><h3>还需确认的信息</h3><ul>{(report.questions.length?report.questions:['请按上述清单核实文件、实际角色及产品适用范围。']).map(q=><li key={q}>{q}</li>)}</ul></section>
     <section className="report-evidence"><h3>法条依据与版本</h3><p>展开查看原文摘录；点击“继续追溯”可从本条走向关联条款。</p>{report.sources.map((id,i)=>{const a=articleMap.get(id)!,s=corpus.sources.find(s=>s.id===a.lawId)!;return <details key={id}><summary>[{i+1}] {s.name} · 第 {a.number} 条</summary><p className="evidence-version">{s.number} · {s.version} · 公布日期 {s.published}</p><blockquote lang="en">{report.evidence?.find(e=>e.id===id)?.text||a.text.slice(0,550)}</blockquote><div><button onClick={()=>openArticle(id)}><Network size={13}/>阅读全文并继续追溯</button><a href={a.sourceUrl} target="_blank" rel="noreferrer">官方原文<ArrowUpRight size={13}/></a></div></details>})}</section>
     {report.related.length>0&&<section className="report-related"><h3>补充阅读</h3><p>依据本次引用条文的主题聚类推荐，仅供拓展阅读，不作为上述要求的依据。</p>{report.related.map(id=>{const a=articleMap.get(id)!,s=corpus.sources.find(s=>s.id===a.lawId)!;return <button key={id} onClick={()=>openArticle(id)}>{s.short} · 第 {a.number} 条 <ArrowUpRight size={12}/></button>})}</section>}
     <footer className="report-limits"><h3>报告边界</h3>{report.limits.map(l=><p key={l}>{l}</p>)}<span>生成版本 {report.version} · 语料日期 {corpus.generatedAt.slice(0,10)}</span></footer>
    </article>
  </div>}
  <footer className="about-platform"><details><summary>关于欧律通</summary><div className="about-content"><h3>让建议回到可核查的依据</h3><p>平台提供贸易情境分析、官方法规阅读与关联条文追溯。报告使用免费模型分析业务情境、规划检索并组织有引用的行动清单；证据不足时列明缺口。BERTopic 在后台辅助发现相关条文，主题相似不代表法律适用。</p><h3>AI 解读与接入进度</h3><p>报告接口采用 OpenRouter 免费模型，需管理员配置服务端密钥。免费服务可能限流或暂不可用；调用失败会明确提示，且不会自动转入付费模型。</p><p>模型凭据仅保存在服务端，不在浏览器填写或展示。当前收录原始公布文本，现行版本与专项要求仍需核实。</p></div></details></footer>
 </section>
}
