import { env } from 'cloudflare:workers';
import { FreeReportClient, generateFreeReport, profileSchema } from '@/lib/ai/free-report';

const messages:Record<string,string>={API_NOT_CONFIGURED:'免费模型尚未配置密钥。请由项目管理员设置 OPENROUTER_API_KEY 后再生成报告。',FREE_QUOTA_LIMIT:'免费模型额度或并发达到限制，请稍后再试。系统不会切换收费模型。',API_KEY_INVALID:'模型密钥无效，请由项目管理员检查配置。',OUTSIDE_COVERAGE:'当前语料仅支持欧盟市场。',INSUFFICIENT_EVIDENCE:'当前语料没有检索到足够依据，尚不能生成这份报告。',UNSUPPORTED_CITATION:'生成内容包含未提供的引用，已停止展示，请重试。'};
export async function POST(request:Request){
 const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
 const origin=request.headers.get('origin');
 if(origin&&origin!==new URL(request.url).origin)return reply({message:'不接受跨站请求。'},403);
 if(Number(request.headers.get('content-length')||0)>12000)return reply({message:'请求过长。'},413);
 let profile;
 try{const raw=await request.text();if(raw.length>12000)return reply({message:'请求过长。'},413);profile=profileSchema.parse(JSON.parse(raw));}catch{return reply({message:'请填写有效的贸易情境。'},400)}
 const key=(env as unknown as {OPENROUTER_API_KEY?:string}).OPENROUTER_API_KEY;
 if(!key)return reply({code:'API_NOT_CONFIGURED',message:messages.API_NOT_CONFIGURED},503);
 try{return reply({report:await generateFreeReport(profile,new FreeReportClient(key))});}
 catch(error){const code=error instanceof Error?error.message:'PROVIDER_UNAVAILABLE';return reply({code:messages[code]?code:'GENERATION_FAILED',message:messages[code]||'免费模型暂未返回完整且可验证的报告，请稍后重试。未生成替代模板。'},code==='FREE_QUOTA_LIMIT'?429:code==='OUTSIDE_COVERAGE'?422:502)}
}
