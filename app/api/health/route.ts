import { corpus } from '@/lib/corpus';
import { env } from 'cloudflare:workers';
export function GET(){const aiConfigured=Boolean((env as unknown as {OPENROUTER_API_KEY?:string}).OPENROUTER_API_KEY);return Response.json({status:'ok',mode:aiConfigured?'free_api_report':'awaiting_api_key',aiConfigured,articleCount:corpus.articles.length,topicModel:corpus.analysis.status,version:'0.2.0'},{headers:{'Cache-Control':'no-store'}})}
