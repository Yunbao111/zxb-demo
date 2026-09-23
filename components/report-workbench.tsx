'use client';
import { useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, ClipboardList, Download, FileText, Info, Network, Printer } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { articleMap, corpus } from '@/lib/corpus';
import { channels, countries, directions, emptyProfile, generateReport, industries, reportText, roles, sampleProfile, type Profile, type Report } from '@/lib/report';

export function ReportWorkbench({openArticle}:{openArticle:(id:string)=>void}){
 const [profile,setProfile]=useState<Profile>(emptyProfile),[report,setReport]=useState<Report|null>(null),[error,setError]=useState('');
 const heading=useRef<HTMLHeadingElement>(null);
 const dirty=report&&JSON.stringify(profile)!==JSON.stringify(report.profile);
 function update<K extends keyof Profile>(key:K,value:Profile[K]){setProfile(p=>({...p,[key]:value}));setError('')}
 function generate(){try{setReport(generateReport(profile));setError('');setTimeout(()=>heading.current?.focus(),0)}catch(e){setError((e as Error).message)}}
 function download(){if(!report)return;const url=URL.createObjectURL(new Blob([reportText(report)],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='欧律通-初步分析报告.txt';a.click();URL.revokeObjectURL(url)}
 const selects=[{key:'industry',label:'行业 / 产品类别',options:industries},{key:'role',label:'企业在供应链中的角色',options:roles},{key:'channel',label:'销售渠道',options:channels},{key:'direction',label:'贸易方向',options:directions}] as const;
 return <section className="report-workbench">
  <div className="report-page-heading"><div><div className="section-context">从业务情境，到行动依据</div><h1>这笔贸易，下一步该做什么？</h1><p>填写目的地和产品，获取有出处、可追溯的初步分析报告。</p></div><span className="report-mode"><FileText size={15}/>无需 AI API，即可分析</span></div>
  <div className="report-layout"><form className="scenario-form" onSubmit={e=>{e.preventDefault();generate()}}>
   <div className="scenario-heading"><h2>你的贸易情境</h2><button type="button" onClick={()=>{setProfile({...sampleProfile});setError('')}}>填入示例</button></div>
   <p className="form-help">不确定的信息可以留待确认。填写越完整，核查清单越贴近实际业务。</p>
   <label htmlFor="report-country">目标国家 <span>必填</span></label><select id="report-country" value={profile.country} required onChange={e=>update('country',e.target.value)}><option value="">请选择目的地</option><optgroup label="欧盟成员国">{countries.map(c=><option key={c}>{c}</option>)}</optgroup><optgroup label="当前范围之外">{['英国','瑞士','挪威','其他非欧盟市场'].map(c=><option key={c}>{c}</option>)}</optgroup></select>
   <label htmlFor="report-product">具体产品 <span>必填</span></label><Input id="report-product" value={profile.product} required maxLength={200} placeholder="如：家用收纳盒（不接触食品）" onChange={e=>update('product',e.target.value)}/>
   {selects.map(s=><div key={s.key}><label htmlFor={`report-${s.key}`}>{s.label}</label><select id={`report-${s.key}`} value={profile[s.key]} onChange={e=>update(s.key,e.target.value as never)}>{Object.entries(s.options).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></div>)}
   <label htmlFor="report-consumer">是否面向消费者使用？</label><select id="report-consumer" value={profile.consumer} onChange={e=>update('consumer',e.target.value as Profile['consumer'])}><option value="unknown">尚未确定</option><option value="yes">是（含可预见的消费者使用）</option><option value="no">否，仅专业用途</option></select>
   {error&&<p role="alert" className="form-error">{error}</p>}
   <Button type="submit" className="generate-button">{report?'重新生成分析报告':'生成分析报告'}<ArrowRight size={16}/></Button>
   <p className="form-footnote">本次输入仅在当前页面处理，不保存到服务器。产品名称用于描述情境，分类以你选择的信息为准。</p>
  </form>
  <div className="report-output">
   {!report?<div className="report-welcome"><div className="document-symbol"><ClipboardList size={42} strokeWidth={1.3}/></div><h2>一份可以用来推进工作的报告</h2><p>从法规条文中整理出与你的业务相关的核查事项。每一项都能回答三个问题：</p><ol><li><b>为什么需要关注？</b><span>结合产品、目的地和企业角色说明触发原因。</span></li><li><b>接下来准备什么？</b><span>列出行动建议、文件材料和待确认的信息。</span></li><li><b>依据在哪里？</b><span>打开官方条文，继续追溯关联法规。</span></li></ol><div className="report-coverage"><Info size={17}/><span>现有依据为 4 部欧盟法规、428 条原始公布条文。报告会标明超出语料覆盖的事项。</span></div></div>:<>
    {dirty&&<div className="stale-report" role="status">情境已修改，下方仍是上次报告。点击“重新生成分析报告”更新。</div>}
    <article className="report-document" aria-label="贸易合规初步分析报告">
     <header className="document-header"><div><span className="document-kicker">欧律通 · 业务核查</span><h2 ref={heading} tabIndex={-1}>贸易合规初步分析报告</h2><p>{report.profile.country} · {report.profile.product}</p></div><div className="report-tools"><Button type="button" variant="outline" size="sm" onClick={download} aria-label="下载分析报告"><Download size={15}/>下载</Button><Button type="button" variant="outline" size="sm" onClick={()=>window.print()} aria-label="打印分析报告"><Printer size={15}/>打印</Button></div></header>
     <div className="document-meta"><span>{new Date(report.createdAt).toLocaleDateString('zh-CN')}</span><span>本地规则分析 · 未接入大模型</span><span>{report.coverage==='outside'?'超出当前覆盖':'待核实适用条件'}</span></div>
     <section className="report-summary"><h3>先看结论与推进顺序</h3><p>{report.summary}</p></section>
     <dl className="profile-summary">{[['产品类别',industries[report.profile.industry]],['企业角色',roles[report.profile.role]],['销售渠道',channels[report.profile.channel]],['贸易方向',directions[report.profile.direction]]].map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
     <div className="report-section-title"><h3>核查事项与行动清单</h3><span>{report.findings.length} 项</span></div>
     {!report.findings.length&&<p className="report-no-findings">该目的地暂无可用的法规分析清单，请选择欧盟成员国或补充该市场语料。</p>}
     {report.findings.map((f,i)=><section key={f.id} className="finding" data-rule={f.id}><div className="finding-heading"><span className="finding-number">{String(i+1).padStart(2,'0')}</span><h4>{f.title}</h4><span className={`finding-status ${f.status==='资料缺口'?'gap':''}`}>{f.status}</span></div><p className="finding-why">{f.why}</p><p className="finding-analysis">{f.analysis}</p><div className="finding-action"><b>下一步</b><p>{f.action}</p></div><div className="finding-materials"><span>准备材料</span><ul>{f.documents.map(d=><li key={d}>{d}</li>)}</ul></div><div className="finding-citations">{f.citations.map(id=>{const a=articleMap.get(id)!,s=corpus.sources.find(s=>s.id===a.lawId)!;return <button key={id} onClick={()=>openArticle(id)} aria-label={`核查依据 ${s.number} 第 ${a.number} 条`}>[{report.sources.indexOf(id)+1}] {s.short} · 第 {a.number} 条<ArrowUpRight size={12}/></button>})}</div></section>)}
     <section className="report-questions"><h3>还需确认的信息</h3><ul>{(report.questions.length?report.questions:['请按上述清单核实文件、实际角色及产品适用范围。']).map(q=><li key={q}>{q}</li>)}</ul></section>
     <section className="report-evidence"><h3>法条依据与版本</h3><p>展开查看原文摘录；点击“继续追溯”可从本条走向关联条款。</p>{report.sources.map((id,i)=>{const a=articleMap.get(id)!,s=corpus.sources.find(s=>s.id===a.lawId)!;return <details key={id}><summary>[{i+1}] {s.name} · 第 {a.number} 条</summary><p className="evidence-version">{s.number} · {s.version} · 公布日期 {s.published}</p><blockquote lang="en">{a.text.slice(0,550)}{a.text.length>550?'…':''}</blockquote><div><button onClick={()=>openArticle(id)}><Network size={13}/>阅读全文并继续追溯</button><a href={a.sourceUrl} target="_blank" rel="noreferrer">官方原文<ArrowUpRight size={13}/></a></div></details>})}</section>
     {report.related.length>0&&<section className="report-related"><h3>补充阅读</h3><p>依据本次引用条文的主题聚类推荐，仅供拓展阅读，不作为上述要求的依据。</p>{report.related.map(id=>{const a=articleMap.get(id)!,s=corpus.sources.find(s=>s.id===a.lawId)!;return <button key={id} onClick={()=>openArticle(id)}>{s.short} · 第 {a.number} 条 <ArrowUpRight size={12}/></button>})}</section>}
     <footer className="report-limits"><h3>报告边界</h3>{report.limits.map(l=><p key={l}>{l}</p>)}<span>规则版本 {report.version} · 语料日期 {corpus.generatedAt.slice(0,10)}</span></footer>
    </article>
   </>}
  </div></div>
 </section>
}
