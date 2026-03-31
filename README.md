# DMR Desktop

基于 Tauri 构建的 DMR 桌面应用，提供原生桌面体验的 AI Agent 交互界面。

## 架构

```
┌─────────────────┐
│  Tauri 窗口     │
│  (React 前端)   │
└────────┬────────┘
         │ HTTP (localhost:8080)
         ↓
┌─────────────────┐
│  dmr serve      │
│  + web plugin   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  DMR Core       │
│  Agent + Tape   │
└─────────────────┘
```

**说明：** DMR Desktop 是一个桌面客户端，连接到本地运行的 `dmr serve`。

## 使用方法

### 1. 启动 DMR 服务

在终端运行：
```bash
dmr serve
```

### 2. 启动 DMR Desktop

```bash
cd dmr-desktop
make dev      # 开发模式
# 或
make build    # 构建生产版本
```

应用会自动连接到 `http://localhost:8080`。

## 前置要求

1. **安装 DMR**
   ```bash
   cd ../dmr
   go install ./cmd/dmr
   ```

2. **安装 dmr-plugin-web**
   ```bash
   cd ../dmr-plugin-web
   make install
   ```

3. **配置 DMR**

   创建 `~/.dmr/config.toml`:
   ```toml
   [[models]]
   name = "default"
   model = "claude-opus-4"
   api_key = "your-api-key"
   default = true

   [[plugins]]
   name = "web"
   path = "dmr-plugin-web"
   config = { listen = ":8080" }
   ```

## 开发

```bash
make install  # 安装前端依赖
make dev      # 启动开发模式
```

**注意：** 开发前需要先在另一个终端运行 `dmr serve`。

## 构建

```bash
make build
```

构建产物在 `src-tauri/target/release/bundle/`。

## 核心功能

- ✅ 连接到本地 DMR 服务
- ✅ AI 对话界面
- ✅ 消息历史
- ✅ 上下文使用情况显示
- ✅ 自动重连
- ✅ 关闭时清理 DMR 进程

## 与 dmr-plugin-web 的差异

| 特性 | dmr-plugin-web | dmr-desktop |
|------|----------------|-------------|
| 运行环境 | 浏览器 | 原生桌面窗口 |
| 启动方式 | 访问 localhost:8080 | 独立应用 |
| 认证 | 支持（可选） | 不需要 |
| Tape 管理 | 多 Tape 切换 | 固定 desktop |
| 窗口管理 | 浏览器标签 | 原生窗口 |

## 故障排除

### 无法连接到 DMR 服务

确保 `dmr serve` 正在运行：
```bash
# 检查服务是否运行
curl http://localhost:8080/api/health

# 如果没有运行，启动它
dmr serve
```

### 端口被占用

如果 8080 端口被占用，修改 DMR 配置：
```toml
[[plugins]]
name = "web"
path = "dmr-plugin-web"
config = { listen = ":8081" }  # 使用其他端口
```

然后修改 `src/hooks/useTapeChatSession.ts` 中的 `apiBase`。

## License

MIT
