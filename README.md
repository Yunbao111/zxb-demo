# 欧律通 · 欧洲贸易法规工作台

比赛 Demo v0.2。业务情境输入、执行导向初步分析报告、英文法规原文、引用追溯及后台 BERTopic 主题辅助。

## 当前实现

- 默认入口为分析报告：目的地、产品、分类、角色、销售渠道、贸易方向和消费者用途 → 条件规则 → 核查事项、行动、材料、证据与待补问题。没有 API 也可运行。
- 确定性报告引擎位于 `lib/report.ts`，不把主题相似度当作法律适用或风险分数；食品/药品排除一般 GPSR 义务，专项行业提示覆盖缺口，非欧盟市场不套用欧盟报告。
- 产品名称与补充说明参与分析：识别收纳、家具、服装、电器、玩具、食品、药品、化妆品、化学制品、餐具等有限产品知识项，以及儿童、电池、无线、食品接触等特征；按识别结果选择不同核查方向、材料与问题。处理简单否定，提示行业冲突，未识别时不套用完整产品义务。当前仍非任意自由文本法律推理。报告下载为 TXT，也可通过浏览器打印保存 PDF。
- 业务情境只保留在当前页面内存，切换查证后仍保留；刷新后清空。修改字段后提示旧报告，重新生成才更新结果。
- 填写贸易情境与全宽报告为两个独立页面状态（`#trade-scenario` / `#analysis-report`），支持浏览器前进后退与返回修改。AI 模块说明集中在底部“关于”。
- 法规检索采用大搜索框、范围下拉与简洁结果列表，点击条文才展开原文；字号 14–24px 可调，并仅在本机保存字号偏好。
- 收录范围的“浏览条文”进入独立法规整页阅读（`#law/法规ID/条号`），包含条文目录、上一条/下一条、字号及跨法规引用导航，支持浏览器后退和直接链接。

- 四部法规原始公布文本，共 428 条：2023/988、2019/1020、952/2013、765/2008。
- 中文贸易术语词典扩展、BM25 风格词项评分、条款号匹配、法规筛选、分页。
- 沿原文提取的内部/跨法规引用追溯，保留引用上下文与浏览路径。
- 使用 Sentence Transformers、UMAP、HDBSCAN 和 c-TF-IDF 实际运行 BERTopic；发布主题编号与关键词，模型训练不在网页请求中运行。
- API 模块提供检索证据；生成式回答当前明确未启用。服务端兼容 Chat Completions 的适配器已实现并使用模拟传输测试，不调用付费 API。
- 来源清单、公布日期、SHA-256 文件指纹、条文文本导出和移动端布局。

## 数据边界

只收录原始公布文本正文，不是现行整合版，未合并修订，不含完整附件、成员国或英国法律。自动提取的引用关系是候选，不是经过逐条法务审查的知识图谱。中文标题是辅助索引，非官方译文。主题相似不代表引用、修订、冲突或法律适用关系。

数据源：欧盟出版局公开 XHTML（每个文件的精确来源见 `data/sources.json`）。严禁使用生成文本填充法律原文。

## 本地运行

要求 Node.js 22.13+。首次使用 `npm ci` 安装前端依赖，然后：

```powershell
node scripts/run-framework.mjs dev
```

默认预览地址为 http://localhost:5173/ 。如果 Windows 系统 npm 命令包装器不可用，可用已安装 Node 附带的 npm-cli.js 执行安装，或修复系统 PATH；不要修改锁文件绕开依赖。

技术栈：React、TypeScript、Vinext/Vite，服务器路由兼容 Cloudflare Workers。离线 Python 分析与在线网页分离。

## 重建语料与主题

Python 3.12。项目工作区已在上级目录创建 `.venv`，使用者也可以在自己的环境中安装：

```powershell
python -m pip install -r requirements-lock.txt
python scripts/fetch-corpus.py
python scripts/prepare-corpus.py
python scripts/train-topics.py
python scripts/build-neighbors.py
```

`fetch-corpus.py` 保留下载文件，不覆盖已有快照。需要新快照时应另建版本并审查差异；不要用新文本静默替换旧分析。

`prepare-corpus.py` 仅在文本摘要一致时保留已有主题结果，否则将主题状态重置为待训练。

模型：`sentence-transformers/all-MiniLM-L6-v2`，英文语料，长文按重叠窗口编码并聚合为条文向量。训练记录在 `data/analysis/training-report.json`。模型缓存位于工作区 `.model-cache/`，不发布；网页读取 `lib/data/corpus.json`。

`build-neighbors.py` 在同一 BERTopic 主题内按条文向量余弦相似度离线计算邻近条文，发布小型邻近索引。重建前核对语料摘要；不调用 API。报告引用依据由规则明确绑定，邻近推荐单独展示。

## API 模块

- `GET /api/health`：运行与分析状态。
- `POST /api/answer`：JSON `{ "query": "进口商义务", "lawId": "all" }`。
- 当前返回 `mode: retrieval_only` 以及真实证据，不产生模型生成回答。
- `lib/ai/provider.ts`：生成适配器与引用 ID 校验。
- `lib/ai/answer.ts`：检索、证据组装和可注入的生成提供者。
- `app/api/answer/route.ts`：输入校验及服务端入口，当前不注入提供者。

后续接入：先确定 API 服务与预算，再设置服务端密钥、请求限额与总费用保护，注入适配器并增加端到端验证。客户端不得保存密钥；不允许用户从网页传入提供者地址。当前服务端没有读取付费模型密钥，不能仅通过设置一个环境变量意外触发计费。

引用 ID 校验仅检查格式与来源集合，不能证明回答内容真实；上线真实建议前还需内容依据核对和适用条件评估。

## 验证

```powershell
node node_modules/typescript/bin/tsc --noEmit
node scripts/test-core.mjs
node scripts/browser-check.mjs
```

浏览器检查需要安装 Playwright 与 Edge，支持通过 `PLAYWRIGHT_PATH` 指定模块路径。当前开发环境使用宿主提供的 Playwright。截图和报告写入不提交的 `.sites-runtime/qa/`。

10 条人工编写的演示查询用于验证已知相关条文能否进入前五，并比较是否启用主题加权。它只是小样本冒烟检查，不代表现实查询准确率，也不能证明主题模型提升。

浏览器原生 WebMCP 在当前测试环境不可用；工具注册使用能力检测，普通网页不依赖该功能。

## 发布

本项目通过 Sites 发布。项目身份保存在 `.openai/hosting.json`；复用该身份，不重新注册。发布时使用 Sites 的 site-workflow 脚本完成检查、构建、源码推送和打包，再保存版本并部署。API 当前未启用，网站不需要付费模型凭据。
