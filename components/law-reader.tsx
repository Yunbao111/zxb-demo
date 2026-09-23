'use client';
import { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowUpRight, ChevronLeft, ChevronRight, Network } from 'lucide-react';
import { Button } from './ui/button';
import { articleMap, corpus } from '@/lib/corpus';

export function LawReader({articleId,onArticle,onBack,fontSize,onFont}:{articleId:string;onArticle:(id:string)=>void;onBack:()=>void;fontSize:number;onFont:(n:number)=>void}){
 const article=articleMap.get(articleId)!;
 const source=corpus.sources.find(s=>s.id===article.lawId)!;
 const articles=corpus.articles.filter(a=>a.lawId===article.lawId);
 const index=articles.findIndex(a=>a.id===articleId);
 const heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{heading.current?.focus({preventScroll:true});window.scrollTo(0,0)},[articleId]);
 return <section className="law-reader">
  <Button variant="ghost" onClick={onBack}><ArrowLeft size={16}/>返回收录范围</Button>
  <header><span>Regulation {source.number}</span><h1 ref={heading} tabIndex={-1}>{source.name}</h1><p>{source.version} · 公布日期 {source.published}</p><a href={article.sourceUrl} target="_blank" rel="noreferrer">核对官方原文<ArrowUpRight size={14}/></a></header>
  <div className="law-reader-controls"><label htmlFor="law-directory">条文目录<select aria-label="条文目录" id="law-directory" value={articleId} onChange={e=>onArticle(e.target.value)}>{articles.map(a=><option key={a.id} value={a.id}>第 {a.number} 条 — {a.title}</option>)}</select></label><label htmlFor="law-reader-size">字号 <input aria-label="法规原文字号" id="law-reader-size" type="range" min="14" max="24" value={fontSize} onChange={e=>onFont(Number(e.target.value))}/><output htmlFor="law-reader-size">{fontSize}</output></label></div>
  <article className="full-law-text"><div className="law-pagination"><Button variant="outline" size="sm" disabled={index===0} onClick={()=>onArticle(articles[index-1].id)}><ChevronLeft size={14}/>上一条</Button><span>第 {index+1} / {articles.length} 条</span><Button variant="outline" size="sm" disabled={index===articles.length-1} onClick={()=>onArticle(articles[index+1].id)}>下一条<ChevronRight size={14}/></Button></div><h2>第 {article.number} 条</h2><h3 lang="en">{article.title}</h3><div className="full-law-paragraphs" lang="en">{article.paragraphs.map((p,i)=><p key={i}>{p}</p>)}</div></article>
  <section className="full-law-references"><h2><Network size={18}/>关联条文</h2><p>从原文提取的引用候选；跨法规引用会打开对应法规，浏览器后退可回到上一条。</p>{article.references.length?article.references.map((r,i)=><details key={i}><summary>{r.targetId?<button onClick={e=>{e.preventDefault();onArticle(r.targetId!)}}>{corpus.sources.find(s=>s.id===r.lawId)?.short||source.short} · 第 {r.number} 条<ArrowUpRight size={13}/></button>:<span>{r.label}（尚未定位或收录）</span>}</summary><blockquote lang="en">{r.evidence}</blockquote></details>):<p>本条未提取到明确的条款引用。</p>}</section>
 </section>
}
