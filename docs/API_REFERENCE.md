# API 参考（开源版）

后端默认地址：`http://localhost:3005`

## 认证相关

- `POST /register` 注册
- `POST /send-verification-code` 发送验证码
- `POST /login` 登录
- `POST /forgot-password` 申请重置密码
- `POST /reset-password` 重置密码
- `POST /change-password` 修改密码（需登录）
- `POST /activate` 激活（需登录）
- `GET /user/invited` 获取邀请用户列表（需登录）

## 服务市场

- `GET /services` 获取可用 MCP 服务列表

## 实例管理

- `GET /instances` 获取我的实例（需登录）
- `POST /instances` 创建实例（需登录）
- `POST /instances/:id/start` 启动实例（需登录）
- `POST /instances/:id/stop` 停止实例（需登录）
- `DELETE /instances/:id` 删除实例（需登录）

## 管理员接口

- `GET /admin/users` 获取用户列表（管理员）
- `POST /admin/users` 创建用户（管理员）
- `PUT /admin/users/:id` 更新用户（管理员）
- `GET /admin/codes` 获取激活码列表（管理员）
- `POST /admin/codes/generate` 生成激活码（管理员）

> 说明：具体请求体字段建议以 `frontend/src/pages` 对应页面的 axios 调用为准。
