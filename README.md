# DMR Desktop

基于 Tauri 构建的 DMR 桌面应用，提供原生桌面体验的 AI Agent 交互界面。

## 技术栈

- **前端**: React 19 + TypeScript + Vite + Tailwind CSS 4
- **桌面框架**: Tauri 2.x
- **后端**: Rust (Tauri) + Go (DMR sidecar)
- **通信**: Tauri IPC + HTTP/SSE

## 快速开始

### 前置要求

- Node.js 18+
- Rust 1.70+
- Go 1.21+
- 系统依赖（根据平台）:
  - macOS: Xcode Command Line Tools
  - Linux: `build-essential`, `libwebkit2gtk-4.0-dev`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`
  - Windows: Microsoft Visual Studio C++ Build Tools

### 安装依赖

```bash
make install
```

### 开发模式

```bash
make dev
```

### 构建生产版本

```bash
make build
```

构建产物位于 `src-tauri/target/release/bundle/`

## 可用命令

运行 `make help` 查看所有可用命令：

```bash
make help
```

## 项目结构

```
dmr-desktop/
├── src/                    # React 前端
│   ├── components/         # React 组件
│   ├── hooks/              # React Hooks
│   ├── lib/                # 工具函数
│   ├── App.tsx             # 主应用
│   └── main.tsx            # 入口文件
├── src-tauri/              # Tauri Rust 后端
│   ├── src/
│   │   ├── main.rs         # 主入口
│   │   ├── sidecar.rs      # Sidecar 进程管理
│   │   └── commands.rs     # Tauri 命令
│   ├── binaries/           # DMR sidecar 二进制
│   ├── Cargo.toml
│   └── tauri.conf.json
├── Makefile
└── package.json
```

## 核心功能

- ✅ 启动画面和进度显示
- ✅ DMR Sidecar 进程管理
- ✅ AI 对话界面
- ✅ 本地文件链接处理
- ✅ 审批弹窗
- ⏳ SSE 消息流集成
- ⏳ 优雅关闭流程

## 开发说明

### 构建 Sidecar

开发时只需构建当前平台：

```bash
make sidecar-local
```

发布时构建所有平台：

```bash
make sidecar
```

### 调试

开发模式下会自动打开 DevTools。查看 Rust 日志：

```bash
RUST_LOG=debug make dev
```

## 与 dmr-plugin-web 的差异

| 特性 | dmr-plugin-web | dmr-desktop |
|------|----------------|-------------|
| 运行环境 | 浏览器 | 原生桌面 |
| 认证 | 支持（可选） | 不需要 |
| Tape 管理 | 多 Tape 切换 | 固定 desktop |
| 文件访问 | 受限 | 原生支持 |
| 进程管理 | 外部管理 | 内置管理 |

## 参考文档

- [设计方案](../dmr/docs/issues/dmr-desktop-design.md)
- [Tauri 官方文档](https://tauri.app/)
- [DMR 项目](../dmr/)

## License

MIT
