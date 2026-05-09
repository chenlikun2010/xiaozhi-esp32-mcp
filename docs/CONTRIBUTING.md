# 贡献指南（Contributing）

感谢你愿意参与 **小智 ESP32 的 MCP 平台** 🎉

本项目欢迎 Issue、文档改进、Bug 修复、新 MCP 服务接入等贡献。

---

## 1. 提交前准备

- 确保本地可以正常启动前后端
- 新增/修改代码后请至少通过：
  - `backend`: `npm run build`
  - `frontend`: `npm run build`
- 若修改了接口行为，请同步更新文档

---

## 2. 分支与提交规范

建议使用以下分支命名：

- `feat/<short-description>`
- `fix/<short-description>`
- `docs/<short-description>`

建议提交信息格式：

- `feat: add xxx`
- `fix: resolve xxx`
- `docs: update xxx`

---

## 3. Pull Request 要求

请在 PR 描述中包含：

1. 变更背景
2. 主要改动点
3. 验证方式（构建/测试结果）
4. 风险说明（如有）

如果涉及 UI，请附截图；涉及接口，请附请求/响应示例。

---

## 4. MCP 服务接入建议

新增 MCP 服务时建议遵循：

- 命名清晰（与实际能力一致）
- 错误信息可读（面向终端用户）
- 超时/重试机制明确
- 不在仓库提交真实密钥

---

## 5. 安全与隐私

- 严禁提交 `.env`、访问密钥、数据库密码
- 请勿在日志中打印敏感信息
- 第三方 API 调用需遵守其服务条款

---

## 6. 沟通方式

- 优先通过 Issue 讨论需求和设计
- 大改动建议先提交一个 RFC/Discussion 再实现

再次感谢你的贡献 ❤️
