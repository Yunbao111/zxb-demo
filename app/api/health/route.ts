import { corpus } from '@/lib/corpus';
export function GET(){return Response.json({status:'ok',mode:'retrieval_only',aiConfigured:false,articleCount:corpus.articles.length,topicModel:corpus.analysis.status,version:'0.1.0'})}
