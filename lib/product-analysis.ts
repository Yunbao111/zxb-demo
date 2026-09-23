import type { Finding, Profile } from './report';

type ProductRule = {id:string;name:string;industry:Profile['industry'];terms:RegExp;focus:string;action:string;documents:string[];question:string};
// These are research checklists, not a classification model or a certification decision.
const rules:ProductRule[] = [
 {id:'storage',name:'收纳用品',industry:'general',terms:/收纳盒|储物盒|整理箱|收纳箱|storage box|storage bin/gi,focus:'需要核查箱体、盖板、边缘及堆叠使用情境，而非只检查通用标签。',action:'确认承载用途、堆叠方式、盖板夹伤及边缘情况；核实是否接触食品、是否会被儿童使用。',documents:['结构和尺寸图','材质及承载说明','堆叠与开合评估记录'],question:'收纳用品的材质、承载上限、盖板结构和预期存放物是什么？'},
 {id:'furniture',name:'家具',industry:'general',terms:/桌子|餐桌|书桌|椅子|座椅|书柜|衣柜|家具|furniture|chair|desk|cabinet/gi,focus:'家具应优先核查稳定性、承载、连接件和安装情境。',action:'整理尺寸、承载、组装和固定方式；评估倾倒、夹伤及可接触边缘，不预设某项测试一定适用。',documents:['承载及稳定性评估','组装与固定说明','连接件和结构图'],question:'家具是否需要固定、自行组装或折叠？预期使用者和承载是多少？'},
 {id:'clothing',name:'服装纺织品',industry:'general',terms:/服装|童装|衣服|[tT]恤|衬衫|外套|裤子|连衣裙|围巾|clothing|t-shirt|shirt|trousers|garment/gi,focus:'服装需要结合纤维材料、辅料、接触皮肤及使用年龄核查；现有语料未覆盖完整纺织品专项要求。',action:'收集纤维及辅料构成、染整资料和标签样稿；涉及儿童时补查绳带、小附件等设计情境。另行核对纺织品和化学物质专项要求。',documents:['纤维及辅料清单','染整和材料资料','成衣标签样稿'],question:'服装的纤维成分、辅料、目标年龄及是否具有防护功能是什么？'},
 {id:'electrical',name:'电器设备',industry:'electronics',terms:/电热水壶|电水壶|电吹风|吹风机|台灯|充电器|插线板|电风扇|电饭煲|电暖器|耳机|手机|路由器|electric kettle|charger|hair dryer|headphones|router/gi,focus:'应优先辨别供电方式、额定参数、发热部件和连接功能，以确定应补查的专项法规；一般消费品清单不能代替电器合规路径。',action:'收集型号、电压、功率和电路资料；梳理触电、过热等使用情境，再核查适用专项法规与符合性评估路径。',documents:['额定电压与功率','电路及关键部件清单','已有测试和符合性资料'],question:'设备的供电电压、功率、是否发热及是否具有无线功能分别是什么？'},
 {id:'toys',name:'玩具',industry:'toys',terms:/玩具|积木|毛绒公仔|拼图|遥控车|toy|building blocks|jigsaw/gi,focus:'玩具需先确认预期年龄和玩法，专项规则尚未完整收录，不能套用普通家居用品报告。',action:'确认年龄分组、可拆部件、材料及玩法；收集小部件、机械及材料评估资料，补查玩具专项要求。',documents:['目标年龄与玩法说明','可拆部件及材料清单','包装警示样稿'],question:'玩具面向什么年龄？是否含小部件、磁铁、电池或可入口部件？'},
 {id:'food',name:'食品或饲料',industry:'food',terms:/饼干|巧克力|茶叶|咖啡豆|奶粉|宠物粮|饲料|(?<!接触)食品(?!接触|级|容器|包装)|biscuits?|chocolate|food(?! contact)|animal feed/gi,focus:'食品和饲料属于 GPSR 第 2 条所列排除类别；当前产品安全条例不能给出其上市要求。',action:'整理配料、来源、加工和保存条件，明确是否包含动物源性成分；补查食品或饲料对应的准入与标签规则。',documents:['配料及过敏原信息','加工和保存条件','生产及来源追溯资料'],question:'具体配料、动物源性成分、加工方式与保质条件是什么？'},
 {id:'medicine',name:'药品',industry:'medicine',terms:/药品|药片|胶囊药|处方药|布洛芬|阿莫西林|medicinal product|ibuprofen/gi,focus:'药品属于 GPSR 第 2 条所列排除类别，需要独立的药品监管路径。',action:'先核实产品用途、活性成分和药品身份，再收集许可与生产资料；本库不能确认药品市场准入。',documents:['活性成分和剂量','用途及适用人群','已有许可和生产资料'],question:'产品是人用还是兽用，活性成分和拟宣传用途是什么？'},
 {id:'cosmetics',name:'化妆品候选',industry:'other',terms:/化妆品|口红|面霜|洗发水|护肤品|香水|cosmetics?|lipstick|shampoo/gi,focus:'需先按实际用途、成分和宣传内容核实化妆品身份，相关专项法规尚未收录。',action:'整理完整配方、预期接触部位及标签宣称，补查化妆品专项评估与责任主体要求；不从产品名称确认准入。',documents:['完整配方','使用部位及使用方式','包装与宣传文案'],question:'产品配方、使用部位和宣称功效是什么？是否涉及治疗或消毒宣称？'},
 {id:'chemicals',name:'化学制品候选',industry:'other',terms:/清洁剂|洗涤剂|消毒液|油漆|涂料|胶水|detergent|disinfectant|paint|adhesive/gi,focus:'化学制品需要按成分、浓度及用途确定进一步核查路径，当前四部法规不足以覆盖相关专项要求。',action:'获取成分、浓度、用途及现有安全数据资料，区分清洁与消毒等宣称；补查分类、标签及专项要求。',documents:['成分与浓度清单','现有安全数据表（如有）','使用方法和标签'],question:'成分、浓度、专业或消费者用途以及消毒等宣称是什么？'},
 {id:'tableware',name:'餐具及饮食容器候选',industry:'other',terms:/餐具|饭盒|保鲜盒|水杯|茶杯|奶瓶|保温杯|盘子|碗|food container|lunch box|tableware|drinking cup/gi,focus:'饮食容器应先确认食品接触用途及接触条件；食品接触材料并不等同于食品，不能直接按 GPSR 食品排除条款处理。',action:'确认直接接触部位、材料、温度和重复使用方式；补查食品接触材料专项规则，并整理已有迁移等测试资料。',documents:['接触食品部位及材料','接触时间与温度','已有材料和迁移资料'],question:'是否直接接触食品？接触何种食品、温度多高、是否重复使用？'},
];
function hits(text:string,pattern:RegExp){
 const matches=[...text.matchAll(new RegExp(pattern.source,pattern.flags))];
 return matches.filter(m=>!/(?:不含|不带|不接触|不用于|不是|不|非|无|without\s|not\s|no\s)[\s\w\u4e00-\u9fff]{0,4}$/i.test(text.slice(Math.max(0,m.index!-12),m.index))).map(m=>m[0]);
}
const facets=[
 {id:'children',name:'儿童使用',terms:/儿童|婴儿|婴幼儿|婴童|童装|children|infant|baby/gi,action:'补充年龄范围和可预见使用方式，重点核查小部件、入口、绳带及误用情境；不把所有儿童用品自动归为玩具。',docs:['预期年龄','儿童接触部件及使用说明'],question:'具体年龄范围是多少？儿童是否会独立使用、入口或接触可拆部件？'},
 {id:'battery',name:'电池供电',terms:/锂电池|电池|battery|batteries/gi,action:'确认电池类型、容量、可拆卸性和运输安排，补查电池及运输专项要求；当前库不能给出对应认证结论。',docs:['电池类型与容量','电池部件及运输资料'],question:'电池类型、容量、是否随产品运输以及可拆卸性是什么？'},
 {id:'wireless',name:'无线连接',terms:/蓝牙|Wi-Fi|wifi|无线|bluetooth/gi,action:'确认无线功能、频段和模块，并补查无线设备专项规则；不得仅凭“智能”名称假定无线功能。',docs:['无线频段和模块资料','连接功能及使用说明'],question:'无线模块、工作频段和连接功能是什么？'},
 {id:'food-contact',name:'食品接触',terms:/食品接触|接触食品|接触食物|食品级|food contact/gi,action:'确认实际食品接触部位、材料、接触时间和温度，补查食品接触材料专项规则；“食品级”宣称本身不证明符合要求。',docs:['食品接触用途及材料','接触条件和已有测试资料'],question:'食品接触的材料、温度、时间及重复使用条件是什么？'},
];
export function analyzeProduct(p:Profile){
 const text=p.product+'。'+(p.details||'');
 const matched=rules.map(rule=>({rule,terms:hits(text,rule.terms)})).filter(x=>x.terms.length);
 const attributes=facets.map(f=>({...f,matched:hits(text,f.terms)})).filter(f=>f.matched.length);
 const inferred=[...new Set(matched.map(m=>m.rule.industry))];
 const conflict=inferred.length>1||(p.industry!=='unknown'&&p.industry!=='other'&&inferred.some(i=>i!==p.industry));
 const industry:Profile['industry']=inferred.length===1?inferred[0]:p.industry;
 const recognized=matched.length>0;
 const notes=matched.map(m=>`${m.rule.name}：${m.terms.join('、')}`);
 const findings:Finding[]=matched.map(({rule:r,terms})=>({id:'product-'+r.id,title:r.name+'：优先核查事项',status:r.industry==='general'?'先核实':'资料缺口',why:`从产品描述识别到“${terms.join('、')}”，暂按${r.name}提出核查方向，分类需确认。`,analysis:r.focus,action:r.action,documents:r.documents,citations:r.industry==='general'?['gpsr:6']:['gpsr:2']}));
 for(const f of attributes)findings.push({id:'feature-'+f.id,title:f.name+'：补充核查',status:f.id==='children'?'先核实':'资料缺口',why:`描述中出现“${f.matched.join('、')}”；需要确认这一特征。`,analysis:'以下是由产品描述触发的资料收集建议，不是已经确认的法定义务或风险结论。',action:f.action,documents:f.docs,citations:f.id==='children'?['gpsr:6']:[]});
 const questions=[...matched.map(m=>m.rule.question),...attributes.map(f=>f.question)];
 if(conflict)questions.unshift('产品描述与所选行业不一致，或识别到多种类别。请确认实际产品、用途及正确分类后再分配具体义务。');
 if(!recognized)questions.unshift('目前无法从该名称识别具体产品。请补充通用商品名称、用途、材料和技术参数，避免只填写品牌、型号或泛称。');
 return {recognized,conflict,industry,notes,findings,questions,names:matched.map(m=>m.rule.name)};
}
