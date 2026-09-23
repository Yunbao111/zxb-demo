import { corpus } from './corpus';
import neighborIndex from './data/neighbors.json';
import type { SearchHit } from './types';

// Transparent bilingual query expansion, not an LLM translation service.
const glossary: Record<string, string[]> = {
  '制造商': ['manufacturer', 'manufacturers'], '生产商': ['manufacturer', 'manufacturers'],
  '进口商': ['importer', 'importers'], '进口': ['import', 'importation'], '出口': ['export', 'exportation'],
  '经销商': ['distributor', 'distributors'], '分销商': ['distributor', 'distributors'],
  '责任人': ['responsible', 'economic', 'operator'], '经营者': ['economic', 'operators'],
  '海关': ['customs'], '报关': ['declaration', 'declarant'], '申报': ['declaration'],
  '原产地': ['origin'], '关税': ['duty', 'tariff'], '估价': ['valuation', 'value'],
  '召回': ['recall'], '安全': ['safety', 'safe'], '风险': ['risk'], '产品': ['product', 'products'],
  '标签': ['labelling', 'label'], '标识': ['marking', 'identification'], '标志': ['marking'],
  '认证': ['accreditation', 'conformity'], '合格评定': ['conformity', 'assessment'], '合规': ['compliance'],
  '市场监管': ['market', 'surveillance'], '消费者': ['consumer', 'consumers'],
  '在线': ['online'], '电商': ['online', 'marketplaces'], '远程销售': ['distance', 'sales'],
  '义务': ['obligations'], '要求': ['requirements'], '文件': ['documentation'],
  '技术文档': ['technical', 'documentation'], '标准': ['standards'], '追溯': ['traceability'],
  '通用产品安全条例': ['gpsr'], '海关法典': ['customs'], '市场监管条例': ['surveillance'],
};
const stop = new Set(['the', 'a', 'an', 'of', 'and', 'for', 'in', 'to', 'is', 'are', 'what', 'which', 'how', 'do', 'does', 'article', 'articles', 'regulation']);
const tokenize = (s: string) => s.toLowerCase().match(/[a-z][a-z0-9-]*/g) || [];
const prepared = corpus.articles.map(article => {
  const words = tokenize(article.title + ' ' + article.text);
  const counts = new Map<string, number>();
  for (const word of words) counts.set(word, (counts.get(word) || 0) + 1);
  return { article, counts, length: words.length, title: new Set(tokenize(article.title)) };
});
const avg = prepared.reduce((n, a) => n+a.length, 0) / Math.max(prepared.length, 1);
const df = new Map<string, number>();
for (const doc of prepared) for (const word of doc.counts.keys()) df.set(word, (df.get(word) || 0)+1);

export function queryTerms(query: string) {
  const english = tokenize(query).filter(w => !stop.has(w));
  for (const [zh, en] of Object.entries(glossary)) if (query.includes(zh)) english.push(...en);
  return [...new Set(english)];
}

export function searchArticles(query: string, lawId = 'all', withTopics = true): SearchHit[] {
  const q = query.trim();
  const terms = queryTerms(q);
  const articleNumber = q.match(/(?:第\s*(\d+)\s*条|articles?\s*(\d+))/i);
  const n = articleNumber ? Number(articleNumber[1] || articleNumber[2]) : null;
  const namedLaw = corpus.sources.find(s => q.toLowerCase().includes(s.number) || q.includes(s.name) || q.toLowerCase().includes(s.id));
  const pool = lawId !== 'all' ? lawId : namedLaw?.id;
  const result = prepared.filter(d => !pool || d.article.lawId === pool).map(d => {
    let score = 0;
    const matchedTerms: string[] = [];
    for (const word of terms) {
      const tf = d.counts.get(word) || 0;
      if (!tf) continue;
      const idf = Math.log(1+(prepared.length-(df.get(word)||0)+0.5)/((df.get(word)||0)+0.5));
      score += idf * tf*2.2 / (tf + 1.2*(0.25+0.75*d.length/avg));
      if (d.title.has(word)) score += idf*2;
      matchedTerms.push(word);
    }
    if (n !== null) score = d.article.number === n ? score+100 : 0;
    if (!q || (namedLaw && terms.length===0 && n===null)) score = 1;
    return { article: d.article, score, matchedTerms, topicBoost: false };
  }).filter(d => d.score > 0).sort((a,b) => b.score-a.score);
  if (withTopics && q && n === null && corpus.analysis.status === 'ready') {
    const seedTopics = new Set(result.slice(0,5).map(d=>d.article.topic).filter(t=>t>=0));
    for (const hit of result) if (seedTopics.has(hit.article.topic)) {hit.score *= 1.08; hit.topicBoost = true;}
    result.sort((a,b)=>b.score-a.score);
  }
  return result;
}

export function similarArticles(id: string) {
  const doc = corpus.articles.find(a=>a.id===id);
  if (!doc || doc.topic < 0) return [];
  if(neighborIndex.corpusSha256!==corpus.analysis.corpusSha256)return [];
  const neighbors=(neighborIndex.neighbors as Record<string,{id:string;score:number}[]>)[id]||[];
  return neighbors.map(n=>corpus.articles.find(a=>a.id===n.id)).filter((a):a is NonNullable<typeof a>=>Boolean(a&&a.id!==id&&a.topic===doc.topic)).slice(0,4);
}
