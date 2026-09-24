import { articleMap, corpus } from './corpus';
import { similarArticles } from './search';
import { analyzeProduct } from './product-analysis';

export const countries = ['德国','法国','意大利','西班牙','荷兰','比利时','奥地利','波兰','瑞典','丹麦','芬兰','爱尔兰','葡萄牙','希腊','捷克','匈牙利','罗马尼亚','保加利亚','克罗地亚','斯洛伐克','斯洛文尼亚','立陶宛','拉脱维亚','爱沙尼亚','卢森堡','马耳他','塞浦路斯'];
export const industries = {unknown:'尚未确定',general:'一般消费品 / 家居日用',electronics:'电子电器',toys:'玩具',food:'食品 / 饲料',medicine:'药品',other:'其他 / 专业设备'};
export const roles = {unknown:'尚未确定',manufacturer:'制造商 / 自有品牌方',importer:'欧盟进口商',distributor:'经销商'};
export const channels = {unknown:'尚未确定',online:'线上 / 远程销售',offline:'线下销售',both:'线上与线下'};
export const directions = {unknown:'尚未确定',import:'从欧盟以外进入欧盟',internal:'欧盟内部流通'};
export type Profile = {country:string;product:string;details?:string;industry:keyof typeof industries;role:keyof typeof roles;channel:keyof typeof channels;direction:keyof typeof directions;consumer:'yes'|'no'|'unknown'};
export const emptyProfile:Profile = {country:'',product:'',industry:'unknown',role:'unknown',channel:'unknown',direction:'unknown',consumer:'unknown'};
export const sampleProfile:Profile = {country:'德国',product:'家用收纳盒（不接触食品）',industry:'general',role:'manufacturer',channel:'online',direction:'import',consumer:'yes'};
export type Finding = {id:string;title:string;status:'先核实'|'条件性要求'|'资料缺口';why:string;analysis:string;action:string;documents:string[];citations:string[]};
export type Report = {profile:Profile;createdAt:string;version:string;summary:string;coverage:'limited'|'outside';findings:Finding[];questions:string[];sources:string[];related:string[];limits:string[];model?:string;evidence?:{id:string;text:string;paragraphStart:number;paragraphEnd:number}[]};
const limits = ['本报告根据已收录的原始公布文本生成，未合并后续修订，不能据此确认当前合规或准入。','仅覆盖四部欧盟层级法规正文；成员国法律、完整附件、产品专项法规、税率及认证程序尚未完整收录。','自动报告采用条件规则与预写解读，不调用大模型。BERTopic 仅用于相关条文推荐，主题相似不等于法律适用。'];

/** Deterministic pre-assessment: explicit facts select reviewed rule templates.
 * No topic similarity score is interpreted as applicability or legal risk.
 */
export function generateReport(input:Profile,now=new Date()):Report {
 const p={...input,product:input.product.trim().slice(0,200)}, findings:Finding[]=[],questions:string[]=[];
 if(!p.country||!p.product)throw new Error('请填写目标国家和具体产品。');
 const add=(f:Finding)=>findings.push(f);
 const isEU=countries.includes(p.country);
 if(!isEU){
  questions.push('目标市场是否包含欧盟成员国？请分别分析不同目的地。');
  return {profile:p,createdAt:now.toISOString(),version:'rules-0.3',summary:`“${p.product}”的目标市场为${p.country}，超出本版欧盟共同规则的分析范围。当前不能生成该市场的合规义务清单。`,coverage:'outside',findings:[],questions,sources:[],related:[],limits:[...limits,'英国、瑞士、挪威等市场不能直接套用本版欧盟分析。']};
 }
 const product=analyzeProduct(p);
 questions.push(...product.questions);
 const excluded=product.industry==='food'||product.industry==='medicine';
 const sector=product.industry==='electronics'||product.industry==='toys';
 const confirmedGeneral=product.recognized&&!product.conflict&&product.industry==='general'&&p.consumer==='yes';
 if(product.conflict)add({id:'classification-conflict',title:'先解决产品分类冲突',status:'先核实',why:`描述候选为${product.names.join('、')}，所选行业为${industries[p.industry]}。`,analysis:'当前信息不能支持直接分配角色专属产品义务。下面仅保留产品核查方向和已明确贸易事实对应的事项。',action:'核对实际商品、用途及行业选择；如果描述包含多个产品，请分别生成报告。',documents:['准确商品名称','用途及分类说明'],citations:[]});
 if(!product.recognized)add({id:'product-unknown',title:'产品信息不足，暂不能完成产品专项分析',status:'资料缺口',why:'描述没有匹配到当前已支持的产品知识项。',analysis:'本次只提供已知贸易条件对应的公共核查项，不生成通用产品义务来充当个性化报告。',action:'补充通用商品名称、材质、用途和技术参数，例如“棉质儿童T恤”或“220V电热水壶”。',documents:['商品通用名称','材料、用途和技术参数'],citations:[]});
 product.findings.forEach(add);

 add({id:'scope',title:'先确认产品适用的法规体系',status:'先核实',why:`目的地为${p.country}；产品为“${p.product}”，分类选择为${industries[p.industry]}。`,analysis:excluded?'GPSR 第 2 条列明食品、饲料和药品等排除类别。本次不生成 GPSR 产品义务清单；对应专项法规尚未收录。':sector?'该产品类别可能受欧盟专项协调立法约束。GPSR 对已被专项规则覆盖的风险及部分章节设有限制，不能直接叠加整套一般消费品义务。':confirmedGeneral?'按你填写的一般消费品用途，先列出 GPSR 相关核查事项。仍需核实具体用途、材料、结构及是否存在优先适用的专项规则。':'产品用途或分类尚不足以确认 GPSR 适用。先补齐产品事实，本次不把一般消费品义务作为已适用结论。',action:excluded?'补充食品、饲料或药品专项法规，核对主管机关与市场准入路径。':'制作产品规格说明，核实消费者用途、专项规则和 GPSR 的适用边界。',documents:['产品用途、材质与规格说明','目标用户及销售方式','拟采用的产品分类'],citations:['gpsr:2','gpsr:3']});
 if(p.industry==='unknown'||p.industry==='other')questions.push('产品具体用途、材质和结构是什么？是否属于食品接触材料、医疗器械、化学品等专项类别？');
 if(p.consumer==='unknown')questions.push('产品是否供消费者使用，或在合理可预见的情况下可能被消费者使用？');
 if(p.role==='unknown')questions.push('合同及供应链中，谁是制造商、欧盟进口商、经销商和欧盟责任人？');
 if(p.channel==='unknown')questions.push('是否通过网站、平台或其他远程方式向消费者销售？');
 if(p.direction==='unknown')questions.push('货物是否从欧盟关境以外进入欧盟？进口申报由谁负责？');
 if(confirmedGeneral){
  add({id:'safety',title:'确认产品安全与风险资料',status:'条件性要求',why:'你选择了一般消费品，并确认面向消费者。',analysis:'在 GPSR 适用的前提下，第 5 条规定仅可将安全产品投放或提供于市场。安全结论需要产品资料与评估，不能从产品名称推断。',action:'识别正常及可预见使用场景下的风险，整理已有测试和风险控制证据。',documents:['产品风险清单','测试报告或评估资料'],citations:['gpsr:5','gpsr:6']});
  const roleRules:Partial<Record<Profile['role'],Finding>>={
   manufacturer:{id:'manufacturer',title:'建立制造商技术文件与追溯信息',status:'条件性要求',why:`你将企业角色选为${roles[p.role]}；实际法律身份仍应核实。`,analysis:'在相应条款适用时，第 9 条涉及内部风险分析、技术文件、产品识别、制造商联系信息及说明和安全信息。该条规定技术文件应保持更新并保存 10 年。',action:'对照第 9 条检查产品文件、标签和说明书；确认目标市场可理解的安全信息语言。',documents:['技术文件及保存安排','型号 / 批次标识','制造商邮政与电子地址','说明书及安全信息'],citations:['gpsr:9']},
   importer:{id:'importer',title:'逐项核对进口商责任',status:'条件性要求',why:'你选择企业在供应链中担任欧盟进口商。',analysis:'在 GPSR 第 11 条适用时，进口商应核查产品安全及制造商相关文件和标识，提供进口商联系信息，并履行文件保存、运输储存等责任。出口商身份本身不自动等于欧盟进口商。',action:'与制造商逐项核对第 11 条及其引用的第 9 条，明确资料交付和安全问题处理安排。',documents:['制造商资料核验记录','进口商信息与标签','技术文件副本','仓储运输及投诉处理安排'],citations:['gpsr:11','gpsr:9']},
   distributor:{id:'distributor',title:'建立经销环节的核验与处置记录',status:'条件性要求',why:'你选择企业担任经销商。',analysis:'在 GPSR 第 12 条适用时，经销商需核查相应标识与安全信息，并关注储存运输条件。出现条文所述不合规或危险情形时，涉及暂停提供、通知及纠正措施。',action:'建立入库核查清单和问题产品处置流程，明确向制造商或进口商反馈的渠道。',documents:['入库检查记录','仓储运输要求','问题产品处置流程'],citations:['gpsr:12','gpsr:11']}
  };
  const roleRule=roleRules[p.role];if(roleRule)add(roleRule);
  add({id:'responsible',title:'核实欧盟境内责任经营者',status:'条件性要求',why:'拟在欧盟市场提供一般消费品，需要核查当地责任主体安排。',analysis:'GPSR 第 16 条要求其覆盖产品具有设立于欧盟的责任经营者，并引用市场监管条例第 4 条的相关任务。角色应结合实际供应链确定。',action:'确认拟担任责任经营者的主体及任务，核对联系方式和标示位置。',documents:['责任主体及联系方式','职责安排及适用的授权文件'],citations:['gpsr:16','surveillance:4']});
 }
 if(product.recognized&&!product.conflict&&!excluded&&p.consumer==='yes'&&(p.channel==='online'||p.channel==='both'))add({id:'distance',title:'检查线上商品页面的安全信息',status:'条件性要求',why:`你选择${channels[p.channel]}，且产品面向消费者。`,analysis:'需先核实 GPSR 第 19 条是否适用。该条涉及制造商信息、适用时的欧盟责任人信息、产品识别及警告或安全信息。专业产品仍需先核查专项规则。',action:'逐项检查商品详情页展示的信息，并与实物标签、说明书保持一致。',documents:['商品详情页样稿','产品图片和型号','责任主体及警告信息'],citations:['gpsr:19','gpsr:2']});
 if(sector)add({id:'sector',title:'补充专项产品法规与 CE 路径',status:'资料缺口',why:`产品描述或行业选择指向${industries[product.industry]}；本库没有完整收录其专项法规。`,analysis:'仅凭类别不能确认具体认证或测试要求。765/2008 第 30 条限定 CE 标志用于专项协调立法规定加贴的产品，不能将 CE 当作所有商品的通用准入证。',action:'补充产品型号、用途、额定参数等信息后，核查适用专项法规、符合性评估及标准；本报告不作 CE 认证结论。',documents:['型号与技术参数','已有符合性声明及测试资料（如有）'],citations:['accreditation:30','gpsr:2']});
 if(p.direction==='import'){
  add({id:'customs',title:'核实报关主体与资料责任',status:'条件性要求',why:'你选择从欧盟以外进入欧盟。',analysis:'海关法典第 9、15、170 条分别涉及经营者登记、向海关提交信息的责任以及申报主体条件与例外。实际责任应结合代理方式和海关程序确认。',action:'与进口方及报关代理确认登记与申报安排，核对货物、交易和支持文件。',documents:['拟申报主体及登记信息','合同、发票与货物明细','代理安排及支持文件'],citations:['customs:9','customs:15','customs:170']});
  add({id:'origin',title:'补齐商品归类与原产地事实',status:'先核实',why:'跨境进口涉及关税制度与原产地核查，但尚无足够信息计算税费。',analysis:'第 56 条说明共同关税组成；第 60 条为非优惠原产地的一般取得规则。实际归类、优惠待遇和税率还需查询专项细则及实时税则。',action:'收集材料构成、用途和加工地点，核实商品编码及非优惠或优惠原产地规则；不要把发货国直接当作原产国。',documents:['商品编码（如已确认）','材料及生产加工说明','原产地支持材料'],citations:['customs:56','customs:60']});
  questions.push('货物的商品编码、生产加工地点和进口申报主体是否已确认？');
 }
 add({id:'national',title:`补查${p.country}本国要求与最新版本`,status:'资料缺口',why:`本次目标市场是${p.country}，现有库仅覆盖欧盟层级原始公布文本。`,analysis:'本库不能确认该国的语言执行要求、包装与生产者责任、税务登记、主管机关程序或最新法规修订。未列出某项要求不代表该项不适用。',action:'按产品及交易模式补查成员国官方资料，并在官方法规页面核对当前版本、适用日期与过渡安排。',documents:['目标国本地要求核查记录','拟投放日期','现行版本核对记录'],citations:[]});
 const sources=[...new Set(findings.flatMap(f=>f.citations))];
 for(const id of sources)if(!articleMap.has(id))throw new Error(`缺失依据：${id}`);
 const related=[...new Set(sources.flatMap(id=>similarArticles(id).map(a=>a.id)))].filter(id=>!sources.includes(id)).slice(0,4);
 const summary=`${product.conflict?'产品分类存在冲突，先完成分类核实。':!product.recognized?'产品尚未识别：本次只生成有限的贸易核查清单。':`描述识别到${product.names.join('、')}，以下围绕其用途与材料展开核查。`}针对“${p.product}”进入${p.country}的情境，已整理 ${findings.length} 项核查事项。${excluded?'产品描述或行业选择指向 GPSR 排除类别，需确认分类并优先补充专项法规。':sector?'专项产品法规是当前最主要的资料缺口。':confirmedGeneral?'先核实产品安全、供应链角色与责任主体，再按销售渠道及贸易方向检查具体事项。':'产品适用范围尚未确认，先补齐分类和用途信息。'}${p.role==='unknown'?'企业角色未确定，暂不分配角色专属义务。':''}本报告未判定产品合规。`;
 return {profile:p,createdAt:now.toISOString(),version:'rules-0.3',summary,coverage:'limited',findings,questions,sources,related,limits:[...limits]};
}
export function reportText(r:Report){
 const p=r.profile;
 return [`欧律通 · 贸易合规初步分析报告`,`生成时间：${r.createdAt}｜规则版本：${r.version}`,`生成方式：本地规则分析，无大模型 API`, `业务情境：${p.country}｜${p.product}｜${industries[p.industry]}｜${roles[p.role]}｜${channels[p.channel]}｜${directions[p.direction]}`,`产品补充说明：${p.details||'未填写'}`,`\n分析摘要\n${r.summary}`,...r.findings.map((f,i)=>`\n${i+1}. ${f.title}【${f.status}】\n触发原因：${f.why}\n分析：${f.analysis}\n下一步：${f.action}\n准备材料：${f.documents.join('；')}\n依据：${f.citations.map(id=>`[${r.sources.indexOf(id)+1}]`).join(' ')||'资料缺口提示，未形成法律结论'}`),`\n待补信息\n${r.questions.map(q=>'- '+q).join('\n')||'仍需对照上述材料核实实际情况。'}`,`\n法条依据\n${r.sources.map((id,i)=>{const a=articleMap.get(id)!,s=corpus.sources.find(s=>s.id===a.lawId)!;return `[${i+1}] ${s.name} (${s.number}) 第 ${a.number} 条\n版本：${s.version}\n${a.sourceUrl}`}).join('\n\n')}`,`\n报告边界\n${r.limits.join('\n')}`].join('\n');
}
