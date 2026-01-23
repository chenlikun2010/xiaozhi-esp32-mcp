## 目标与思路
- 在服务市场增加“企业公司信息查询”服务项，前端自动展示并可创建实例。
- 实例启动后，自动挂接远端企业信息 MCP 工具（通过 SSE 远程工具代理），并以 access_key 认证。
- 保持密钥不入库不硬编码，统一使用环境变量注入；支持可配置的远端服务 URL。

## 现有架构与接入点
- 服务市场前后端：
  - 前端页面展示与创建实例：[Marketplace.tsx](file:///Users/kanechen/dev/mcpmanage/frontend/src/pages/Marketplace.tsx)
  - 服务列表与实例路由入口：[index.ts](file:///Users/kanechen/dev/mcpmanage/backend/src/index.ts)
  - 服务实体与列表控制器：[MCPService.ts](file:///Users/kanechen/dev/mcpmanage/backend/src/entities/MCPService.ts)、[ServiceController.ts](file:///Users/kanechen/dev/mcpmanage/backend/src/controllers/ServiceController.ts)
  - 实例控制与运行管理：[InstanceController.ts](file:///Users/kanechen/dev/mcpmanage/backend/src/controllers/InstanceController.ts)、[InstanceManager.ts](file:///Users/kanechen/dev/mcpmanage/backend/src/mcp/InstanceManager.ts)
- 远端工具代理逻辑：
  - 条件注册命中“企业/Company/工商”时，调用远端 MCP 并动态挂接工具：[XiaozhiMCPServer.ts:L76-L108](file:///Users/kanechen/dev/mcpmanage/backend/src/mcp/XiaozhiMCPServer.ts#L76-L108)、[registerRemoteTools](file:///Users/kanechen/dev/mcpmanage/backend/src/mcp/XiaozhiMCPServer.ts#L240-L281)
  - 远端认证头为 access_key：[XiaozhiMCPServer.ts:L251-L255](file:///Users/kanechen/dev/mcpmanage/backend/src/mcp/XiaozhiMCPServer.ts#L251-L255)
- 环境变量与密钥：已存在 QIBOOK_ACCESS_KEY 与可选代理：[backend/.env](file:///Users/kanechen/dev/mcpmanage/backend/.env#L22-L25)

## 实施步骤
1. 新增服务元数据
- 编写种子脚本 add_company_service.ts（仿照现有脚本）向数据库新增服务：
  - name: “企业公司信息查询”或“工商企业信息查询”（确保包含“企业/工商/Company”关键字以命中条件注册）
  - description: 简介为“支持企业基础信息检索、股权结构等基于 MCP 的企业数据工具”。
  - imageUrl: 选用通用商务/公司图标 URL。
- 运行脚本后，前端服务市场将自动展示该服务项。

2. 远端服务 URL 可配置化
- 将当前硬编码的 URL（默认指向 https://mcp.bidata.com/mcp/basic）改为读取环境变量：
  - 新增环境变量 QIBOOK_SERVER_URL，默认值保留为 https://mcp.bidata.com/mcp/basic。
  - 在 [XiaozhiMCPServer.setupTools](file:///Users/kanechen/dev/mcpmanage/backend/src/mcp/XiaozhiMCPServer.ts#L76-L108) 命中“企业/Company/工商”分支时，调用 registerRemoteTools(process.env.QIBOOK_SERVER_URL || 默认值, process.env.QIBOOK_ACCESS_KEY)。
- 备注：用户提供的 ModelScope 页面为 “qibook/basic_ent_tools”，若其暴露 SSE 接入点，则可直接填入 QIBOOK_SERVER_URL；否则沿用默认。

3. 认证与代理
- 使用 access_key 作为远端认证头，值来源于 QIBOOK_ACCESS_KEY（用户提供：sk_oxz0llt1i8s4um59j7fba8iz2zk9l1xq）。
- 如需大陆网络访问代理，支持 QIBOOK_PROXY/HTTPS_PROXY（已在 [XiaozhiMCPServer.ts:L243](file:///Users/kanechen/dev/mcpmanage/backend/src/mcp/XiaozhiMCPServer.ts#L243) 读取）。

4. 测试与验证
- 后端脚本级联调：
  - 使用一个最小启动器创建并启动“企业公司信息查询”实例（InstanceController.create → start），确认 InstanceManager 调用 XiaozhiMCPServer 并成功连接。
  - 连接后调用 remoteClient.listTools，验证远端返回的工具数量 > 0，且包含企业信息相关工具（工具名通常以 ent 或 company 语义命名）。
  - 选取一个基础企业信息查询工具，传入示例企业名称（如“阿里巴巴（中国）网络技术有限公司”），验证返回结构化 content 与无 isError。
- 前端功能验证：
  - 在服务市场选择“企业公司信息查询”，填写接入点 WebSocket 地址（沿用现有实例启动方式），创建并启动实例。
  - 在对话或工具调用入口执行一次企业查询，确认 UI 正常显示结果。

5. 安全与上线注意
- 不在代码中硬编码密钥；统一通过 .env 或部署环境注入 QIBOOK_ACCESS_KEY、QIBOOK_SERVER_URL。
- 如仓库包含示例 .env，确保生产不提交真实密钥；部署时通过 CI/CD 或主机环境变量注入。

## 交付物
- 新的服务种子脚本（add_company_service.ts）。
- XiaozhiMCPServer 读取 QIBOOK_SERVER_URL 的小改动（保持向后兼容）。
- 后端联调与前端手动验证记录，包含成功返回示例（工具列表与一次企业信息查询）。

## 通过标准
- 服务市场显示“企业公司信息查询”。
- 实例启动后远端工具成功挂接（listTools 数量 > 0）。
- 企业信息查询返回正常数据，无错误且结果可在前端展示。
- 不引入明文密钥提交，均由环境变量注入。