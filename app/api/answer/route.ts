import { answerQuestion } from '@/lib/ai/answer';
import { corpus } from '@/lib/corpus';
// Deliberately unconfigured for the first demo. Future provider injection belongs
// here, server-side, after credentials, budget, rate limits and deployment approval.
export async function POST(request:Request){
  if(Number(request.headers.get('content-length')||0)>12000)return Response.json({message:'请求过长。'},{status:413});
  const origin=request.headers.get('origin');
  if(origin&&origin!==new URL(request.url).origin)return Response.json({message:'不接受跨站请求。'},{status:403});
  let data:unknown;
  try{const text=await request.text();if(text.length>12000)return Response.json({message:'请求过长。'},{status:413});data=JSON.parse(text)}catch{return Response.json({message:'请输入有效的查询内容。'},{status:400})}
  const body=data as {query?:unknown;lawId?:unknown};
  if(!body||typeof body.query!=='string'||body.query.trim().length<2||body.query.length>1000)return Response.json({message:'问题长度需要为 2–1000 个字符。'},{status:400});
  const lawId=body.lawId??'all';
  if(typeof lawId!=='string'||(lawId!=='all'&&!corpus.sources.some(s=>s.id===lawId)))return Response.json({message:'该法规不在收录清单中。'},{status:400});
  return Response.json(await answerQuestion(body.query.trim(),lawId),{headers:{'Cache-Control':'no-store'}});
}
