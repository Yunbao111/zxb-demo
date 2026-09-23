import { corpus } from '../corpus';
import { searchArticles } from '../search';
import type { AnswerProvider, Evidence } from './provider';
export async function answerQuestion(query:string,lawId='all',provider?:AnswerProvider){
  const hits=searchArticles(query,lawId).slice(0,6);
  const evidence:Evidence[]=hits.map(h=>({id:h.article.id,title:`${corpus.sources.find(s=>s.id===h.article.lawId)!.number}, Article ${h.article.number}: ${h.article.title}`,sourceUrl:h.article.sourceUrl,text:h.article.text.slice(0,8000),version:'Original Official Journal text; not consolidated/current law'}));
  if(!provider)return {mode:'retrieval_only',message:'AI 建议模块尚未接入。当前显示的是真实法规检索结果，您可以阅读英文原文、查看引用上下文，并沿关联法条继续查询。',evidence};
  if(!evidence.length)return {mode:'insufficient_evidence',message:'当前已收录语料未找到可用依据，无法生成有依据的回答。',evidence:[]};
  const answer=await provider.generate(query,evidence);
  return {mode:'generated',...answer,evidence,notice:'基于原始公布文本的辅助解读，不构成现行法律适用判断。引用格式检查不等于法律事实核验。'};
}
