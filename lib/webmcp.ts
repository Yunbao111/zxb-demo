type Registry={registerTool:(tool:{name:string;title:string;description:string;inputSchema:object;annotations:object;execute:(input:unknown)=>Promise<unknown>},options:{signal:AbortSignal})=>unknown};
export function registerSearchTool(search:(query:string)=>unknown){
  const registry=(document as Document & {modelContext?:Registry}).modelContext;
  if(!registry?.registerTool)return;
  const lifecycle=new AbortController();
  try{Promise.resolve(registry.registerTool({name:'search_trade_law',title:'检索欧盟法规',description:'在当前已收录原始文本中检索并显示结果，不生成合规结论。',inputSchema:{type:'object',properties:{query:{type:'string',minLength:2,maxLength:1000}},required:['query'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},async execute(input){
    const value=input as {query?:unknown};
    if(!value||typeof value.query!=='string'||value.query.trim().length<2||value.query.length>1000||Object.keys(value).some(k=>k!=='query'))throw new Error('需要 2–1000 字符的 query。');
    const result=search(value.query.trim());await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));return result;
  }},{signal:lifecycle.signal})).catch(()=>{})}catch{/* Unsupported experimental API must not break the UI. */}
  return()=>lifecycle.abort();
}
