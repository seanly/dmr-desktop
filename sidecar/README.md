# DMR Desktop Sidecar

DMR Desktop 的后端 HTTP 服务器，提供 API 给 Tauri 前端调用。

## 架构

```
┌─────────────────┐
│  Tauri 前端     │
│  (React)        │
└────────┬────────┘
         │ HTTP/SSE
         ↓
┌─────────────────┐
│  Sidecar        │
│  (Go HTTP)      │
│  - /api/health  │
│  - /api/chat    │
│  - /api/history │
│  - /api/events  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  DMR Core       │
│  - Agent        │
│  - Tape         │
│  - Plugins      │
└─────────────────┘
```

## API 端点

### GET /api/health
健康检查

**响应:**
```json
{"status": "ok"}
```

### POST /api/chat
发送聊天消息

**请求:**
```json
{
  "messages": [
    {"role": "user", "content": "Hello"}
  ],
  "tape": "desktop"
}
```

**响应:** Server-Sent Events (SSE)
```
data: {"type":"message","content":"..."}
data: {"type":"tool_call","name":"...","args":{}}
data: {"type":"done"}
```

### GET /api/history
获取历史消息

**响应:**
```json
[
  {"role": "user", "content": "..."},
  {"role": "assistant", "content": "..."}
]
```

### GET /api/events
SSE 事件流（用于审批等实时事件）

## 命令行参数

```bash
./dmr-sidecar --listen :8080 --tape desktop
```

- `--listen`: HTTP 服务器监听地址（默认 `:8080`）
- `--tape`: 默认 tape 名称（默认 `desktop`）

## 开发

```bash
# 构建
cd sidecar
go build -o dmr-sidecar .

# 运行
./dmr-sidecar --listen :8080
```

## TODO

- [ ] 实现完整的 chat 逻辑（调用 DMR agent）
- [ ] 实现 history API
- [ ] 实现审批流程
- [ ] 添加错误处理
- [ ] 添加日志
- [ ] 添加测试
