
---

# 小智 MCP 云接入平台 - 系统需求说明书 (SRS)

## 1. 项目定位
本项目是一个 MCP (Model Context Protocol) 服务托管平台，旨在为“小智 AI”用户提供开箱即用的 MCP 能力。用户无需自行搭建服务器，只需在平台选择服务并绑定小智官网生成的 WSS 接入点，即可实现功能的扩展。

## 2. 技术栈要求
*   **前端**: React.js (推荐 Vite + Tailwind CSS + Shadcn UI 或 Ant Design)
*   **后端**: Node.js (TypeScript) 或 Go (参考 mcp-calculator 实现)
*   **数据库**: MySQL 8.0+
*   **协议实现**: 必须参考 `https://github.com/78/mcp-calculator`。
    *   *核心逻辑*：本平台作为 **MCP Server**，通过 **WebSocket (WSS)** 反向连接到小智提供的接入点 URL，建立 JSON-RPC 通信隧道。

## 3. 数据库配置 (开发环境)
请在配置文件中使用以下连接信息：
*   **类型**: MySQL
*   **地址**: `8.140.51.220`
*   **端口**: `3306`
*   **数据库**: `mcplist`
*   **账号**: `mcpadmin`
*   **密码**: `Mcp@20260109`

## 4. 核心功能模块

### 4.1 用户与认证模块
*   **注册/登录**: 仅支持邮箱注册。
*   **有效期管理**: 用户账号有“服务有效期”。过期后，所有已运行的 MCP 实例应自动停止。
*   **邀请系统**:
    *   每个用户拥有专属邀请码。
    *   新用户注册时填写邀请码，**邀请人**与**被邀请人**的有效期均自动延长 7 天。

### 4.2 MCP 服务目录 (Service Marketplace)
*   平台预设多种 MCP 服务（如：联网搜索、谷歌搜索、文件处理、计算器等）。
*   用户可以浏览服务列表，点击“接入”进入配置页面。

### 4.3 MCP 实例管理 (核心)
*   **绑定接入点**: 用户输入从小智控制台（xiaozhi.me/console/agents）获取的接入点地址（如 `wss://api.xiaozhi.me/mcp/?token=...`）。
*   **生命周期管理**:
    *   **启动**: 后端根据 `mcp-calculator` 的实现，初始化一个 WebSocket 客户端连接至该 URL。
    *   **停止**: 断开 WebSocket 连接，释放后端资源。
    *   **状态监控**: 实时显示“已连接”、“未连接”、“连接中”或“异常”。
*   **多实例支持**: 单个用户可以同时启动多个不同的 MCP 服务。

## 5. 数据库表结构设计 (推荐)

### 5.1 `users` 表
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| id | INT (PK) | 用户唯一标识 |
| email | VARCHAR | 注册邮箱 |
| password | VARCHAR | 加密后的密码 |
| invite_code | VARCHAR | 用户专属邀请码 |
| expiry_date | DATETIME | 服务到期时间 |
| created_at | DATETIME | 注册时间 |

### 5.2 `mcp_services` 表 (预设服务)
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| id | INT (PK) | 服务 ID |
| name | VARCHAR | 服务名称 (如：联网搜索) |
| type | VARCHAR | MCP 类型标识 |
| description| TEXT | 功能描述 |

### 5.3 `user_mcp_instances` 表 (运行中的实例)
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| id | INT (PK) | 实例 ID |
| user_id | INT | 所属用户 |
| service_id | INT | 对应的预设服务 ID |
| wss_url | TEXT | 用户填写的接入点 URL |
| status | ENUM | running, stopped, error |
| last_started | DATETIME | 最近启动时间 |

## 6. 关键逻辑实现参考 (基于 mcp-calculator)

小智的 MCP 接入是基于 WebSocket 的 JSON-RPC。
1.  **Handshake**: 建立连接后，需处理小智发起的 `initialize` 请求。
2.  **Tools Listing**: 返回该服务支持的工具列表。
3.  **Call Tool**: 当用户在小智端发起调用时，本平台后端拦截该 JSON-RPC 调用并执行相应的业务逻辑（如调用搜索 API），然后返回结果。

## 7. 前端页面原型建议

1.  **登录页**: 简约的邮箱/密码登录及注册入口。
2.  **仪表盘 (Dashboard)**:
    *   顶部：显示服务有效期、邀请码及“复制邀请链接”按钮。
    *   中部：**我的 MCP 服务列表**。以卡片或表格形式展示，包含：服务名、WSS 地址（部分隐藏）、状态标签（绿/红）、【启动/停止】按钮、【删除】按钮。
3.  **服务市场**: 展示所有可用的 MCP 插件卡片，点击弹出配置框要求输入 WSS URL。

---
