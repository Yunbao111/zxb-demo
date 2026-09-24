# 免费报告 API 接入（2026-09-24）

选择 OpenRouter `openrouter/free`，服务端固定 URL 和模型，未配置任何收费模型、付费插件或收费回退。官方免费账户当前通常为每天 50 次请求；完整报告通常需要两次请求（问题规划、报告生成），额度共享且失败请求也可能消耗额度。免费容量与输出质量不保证。

## 配置

1. 在 https://openrouter.ai/keys 注册/登录并创建 API Key，无需为了本 Demo 充值。
2. 在项目 PowerShell 运行 `./scripts/configure-openrouter.ps1`，在隐藏输入中粘贴密钥。它只写入已被 Git 忽略的 `.env.local`，不运行生成模型。
3. 告诉 Codex“密钥已配置”。由 Codex 将该键配置为现有 Sites 项目的 `OPENROUTER_API_KEY` Secret，重新部署以生效。不要将密钥放在聊天、前端代码、Git 或 hosting.json 中。
4. 以“德国 / 弯头管件 / 希望了解当地外贸法规注意事项”进行真实联网验收；再比较工业承压用途与普通非承压用途。确认不臆测材质、用途、税率或认证义务，且能指出依据与资料缺口。

## 已实现与未验证

报告按钮调用 `/api/report`，不再调用客户端规则报告。无密钥、限流或不合格模型响应时显示错误，不退回模板。服务器让免费模型生成英文检索计划，检索原文款项并附 BERTopic 相近条文，再请求带法条引用的中文报告。输出类型和引用白名单检查不能证明法律判断准确。

当前检索为模型规划 + 词法检索 + BERTopic 补充，尚非多语种向量检索；BERTopic 仍使用既有整条法条训练结果。本轮没有重训模型或扩充语料。模型只看到所选款项，法条全文供用户继续核查。德国国内法与产品专项法规仍未收录。

尚无账户密钥，因此未进行真实生成效果验收。测试桩只验证程序流程、错误处理和引用限制，不代表真实模型的质量。

业务输入及证据会发给 OpenRouter 和下游服务商，数据处理取决于账户设置及服务商政策。页面已有提示。

来源：https://openrouter.ai/docs/cookbook/get-started/free-models-router-playground 、https://openrouter.ai/docs/api_reference/limits 、https://openrouter.ai/docs/guides/privacy/data-collection
