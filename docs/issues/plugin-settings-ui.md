# 插件专属配置界面方案

## 背景

当前 `PluginsSettings.tsx` 对所有内置插件使用统一的通用配置界面（Plugin Name 文本框 + Config JSON textarea）。用户需要手动编写 JSON，不友好且容易出错。

本方案基于 `dmr/docs/plugins/` 的文档，为每个有配置项的插件设计结构化的表单界面。

## 现状分析

### 现有架构

```
src/components/settings/
├── SettingsPage.tsx          # 设置主页，左侧导航 + 右侧内容
├── PluginsSettings.tsx       # 内置插件（通用 JSON textarea）
├── ExtPluginsSettings.tsx    # 外部插件（通用 JSON textarea）
├── CollapsibleSection.tsx    # 可折叠面板组件（已有，可复用）
├── BasicSettings.tsx
├── ModelsSettings.tsx
├── TapeSettings.tsx
├── AgentSettings.tsx
└── RestartDialog.tsx
```

- 数据流: `SettingsPage` 管理 `localConfig: DmrConfig`，通过 props 传给子组件
- 配置类型: `PluginConfig = { name, enabled, path?, config?: Record<string, any> }`
- 每个插件的 `config` 字段是一个 `Record<string, any>`，当前用 JSON textarea 编辑

### 改造思路

在 `PluginsSettings.tsx` 中，根据 `plugin.name` 匹配到对应的**专属配置组件**，替换通用的 JSON textarea。对于无配置项的插件，保持仅显示开关。

## 插件分类

### A 类：仅开关，无配置项（6 个）

| 插件 | 说明 |
|------|------|
| `command` | 命令系统，无配置 |
| `cli` | CLI 通道，无配置 |
| `tape` | Tape 工具（存储由全局 [tape] 控制），无插件级配置 |
| `fs` | 文件系统读写，无配置 |
| `subagent` | 子代理，无配置 |
| `credentials` | 凭据管理，系统自动配置 |

**UI**: 仅显示插件名 + 描述 + enabled 开关，展开后显示简短说明文字。

### B 类：需要专属配置表单（8 个）

---

#### 1. OSInfo 插件 — 复杂度：低

| 配置项 | 类型 | 默认值 | UI 控件 |
|--------|------|--------|---------|
| `include_shell` | bool | `true` | Checkbox |
| `include_env` | bool | `false` | Checkbox + 警告提示 |

**UI 设计**:
```
[x] Include Shell Info    (检测并注入当前 shell 信息)
[ ] Include Environment   (⚠ 会注入 HOME/USER/PATH 等变量，注意安全)
```

---

#### 2. Shell 插件 — 复杂度：中

| 配置项 | 类型 | 默认值 | UI 控件 |
|--------|------|--------|---------|
| `interactive` | bool | `true` | Checkbox |
| `timeout` | int | `30` | Number input |
| `credential_env_allowlist` | string[] | `[]` | Tag input / 逗号分隔文本框 |

**UI 设计**:
```
[x] Interactive Mode      (使用 shell -i -c 执行命令)
Timeout (seconds): [30    ]
Credential Env Allowlist: [MY_SECRET] [API_TOKEN] [+ Add]
```

---

#### 3. PowerShell 插件 — 复杂度：中

| 配置项 | 类型 | 默认值 | UI 控件 |
|--------|------|--------|---------|
| `use_pwsh` | bool | `false` | Checkbox |
| `timeout` | int | `30` | Number input |
| `credential_env_allowlist` | string[] | `[]` | Tag input |

**UI 设计**: 与 Shell 类似，增加 `use_pwsh` 选项。

```
[ ] Use PowerShell Core (pwsh.exe)   (默认使用 powershell.exe)
Timeout (seconds): [30    ]
Credential Env Allowlist: [MY_SECRET] [+ Add]
```

---

#### 4. OPA Policy 插件 — 复杂度：高

| 配置项 | 类型 | 默认值 | UI 控件 |
|--------|------|--------|---------|
| `policies` | string[] | `[]` | 多行文本或 Tag input（路径/URL） |
| `allow_rules` | string[] | `[]` | 多行 textarea（每行一条规则） |
| `approvals_file` | string | `""` | 文本框 |
| `inject_env_allowlist` | string[] | `[]` | Tag input |
| `auto_reload` | bool | `false` | Checkbox |

**UI 设计**:
```
Policy Sources:           [~/.dmr/policies/                ] [+ Add Path]
                          [https://example.com/policy.rego  ] [x]

Allow Rules (one per line, format: tool:pattern):
┌─────────────────────────────────────────────┐
│ shell:git status                            │
│ shell:git diff *                            │
│ fsRead:*                                    │
└─────────────────────────────────────────────┘

Approvals File:           [~/.dmr/approvals.json           ]
Inject Env Allowlist:     [DEPLOY_TOKEN] [+ Add]
[x] Auto Reload           (监控策略文件变化并自动重载)
```

---

#### 5. Webtool 插件 — 复杂度：高

**基础配置**:

| 配置项 | 类型 | 默认值 | UI 控件 |
|--------|------|--------|---------|
| `proxy` | string | `""` | 文本框 |
| `max_chars` | int | `50000` | Number input |
| `max_body_bytes` | int | `10485760` | Number input |
| `timeout_seconds` | int | `60` | Number input |
| `https_only` | bool | `false` | Checkbox |
| `allow_private` | bool | `false` | Checkbox + 警告 |
| `search_max_results` | int | `5` | Number input (1-10) |
| `search_timeout_seconds` | int | `30` | Number input |

**无头浏览器子配置** (`fetch.*`):

| 配置项 | 类型 | 默认值 | UI 控件 |
|--------|------|--------|---------|
| `enableHeadlessRender` | bool | `false` | Checkbox（展开子面板） |
| `chromePath` | string | 自动检测 | 文本框 |
| `headlessNoSandbox` | bool | `false` | Checkbox |
| `headlessTimeoutSeconds` | int | `90` | Number input |
| `headlessPostLoadWaitMs` | int | `3000` | Number input |

**UI 设计**: 分两个区域 — 基础配置 + 可折叠的"Headless Browser"子面板。

```
── HTTP Settings ──────────────────────────────
Proxy:                    [http://127.0.0.1:1087          ]
Request Timeout (s):      [60   ]
Max Content Chars:        [50000]
Max Body Bytes:           [10485760]
[ ] HTTPS Only
[ ] Allow Private IPs     (⚠ 禁用 SSRF 防护，仅内网使用)

── Search Settings ────────────────────────────
Max Results (1-10):       [5 ]
Search Timeout (s):       [30]

▸ Headless Browser (点击展开)
  [ ] Enable Headless Render
  Chrome Path:            [/usr/bin/chromium              ]
  [ ] No Sandbox          (Docker/root 环境需要)
  Timeout (s):            [90  ]
  Post-load Wait (ms):    [3000]
```

---

#### 6. Webserver 插件 — 复杂度：高

| 配置项 | 类型 | 默认值 | UI 控件 |
|--------|------|--------|---------|
| `listen` | string | `":8080"` | 文本框 |
| `ui_path` | string | `""` | 文本框 |
| `ui_url` | string | `""` | 文本框（与 ui_path 互斥） |
| `password_file` | string | `""` | 文本框 |
| `session_timeout` | int | `86400` | Number input |
| `approval_timeout` | int | `300` | Number input |
| `cors_origins` | string[] | `[]` | Tag input |

**UI 设计**:
```
Listen Address:           [:8080                          ]

── UI Source (二选一) ─────────────────────────
( ) Local Static Files    [~/.dmr/web/dist               ]
( ) Remote URL (dev)      [http://localhost:5173          ]

── Authentication ─────────────────────────────
Password File (htpasswd): [~/.dmr/web/htpasswd            ]
Session Timeout (s):      [86400 ] (24 hours)
Approval Timeout (s):     [300   ] (5 minutes)

── CORS ───────────────────────────────────────
Allowed Origins:          [http://localhost:5173] [+ Add]
```

---

#### 7. Skill 插件 — 复杂度：中

| 配置项 | 类型 | 默认值 | UI 控件 |
|--------|------|--------|---------|
| `paths` | string[] | `["~/.dmr/skills"]` | Tag input / 可增删的路径列表 |
| `clawhub.enabled` | bool | `false` | Checkbox（展开子面板） |
| `clawhub.install_path` | string | `"~/.dmr/clawhub-skills"` | 文本框 |
| `clawhub.base_url` | string | `"https://clawhub.ai"` | 文本框 |

**UI 设计**:
```
Skill Paths:              [~/.dmr/skills         ] [x]
                          [./skills              ] [x]
                          [+ Add Path]

▸ ClawHub Integration (点击展开)
  [ ] Enable ClawHub
  Install Path:           [~/.dmr/clawhub-skills          ]
  API URL:                [https://clawhub.ai             ]
```

---

#### 8. Cron 插件 — 复杂度：中

| 配置项 | 类型 | 默认值 | UI 控件 |
|--------|------|--------|---------|
| `timezone` | string | 系统本地 | 文本框或下拉选择 |
| `storage.driver` | string | `"file"` | 只读标签（目前仅支持 file） |
| `storage.path` | string | `""` | 文本框 |
| `reload_interval` | string | `""` | 文本框 (Go duration) |
| `log_level` | string | `"info"` | 下拉选择 |

**UI 设计**:
```
Timezone:                 [Asia/Shanghai                   ]
Log Level:                [info ▾]  (error / info / debug)

── Storage ────────────────────────────────────
Driver:                   file (只读)
Storage Path:             [~/.dmr/cron/jobs                ]
Reload Interval:          [30s                             ] (e.g. 30s, 5m)
```

---

## 实现方案

### 文件结构

```
src/components/settings/
├── PluginsSettings.tsx           # 改造：根据 plugin.name 分发到专属组件
├── plugins/                      # 新增目录
│   ├── ShellPluginConfig.tsx     # Shell 配置表单
│   ├── PowerShellPluginConfig.tsx
│   ├── OsInfoPluginConfig.tsx
│   ├── OpaPolicyPluginConfig.tsx
│   ├── WebtoolPluginConfig.tsx
│   ├── WebserverPluginConfig.tsx
│   ├── SkillPluginConfig.tsx
│   ├── CronPluginConfig.tsx
│   └── GenericPluginConfig.tsx   # 通用 JSON textarea（fallback）
```

### 组件接口

每个插件配置组件统一接口：

```tsx
interface PluginConfigProps {
  config: Record<string, any>;               // plugin.config 对象
  onChange: (config: Record<string, any>) => void;  // 更新回调
}
```

### 通用子组件（可复用）

| 组件 | 用途 |
|------|------|
| `StringListInput` | 可增删的字符串列表（用于 paths, allowlist, cors_origins 等） |
| `TagInput` | 标签式输入（更紧凑的列表输入） |

### PluginsSettings.tsx 改造

```tsx
// 根据 plugin.name 选择配置组件
function getPluginConfigComponent(name: string) {
  switch (name) {
    case "shell": return ShellPluginConfig;
    case "powershell": return PowerShellPluginConfig;
    case "osinfo": return OsInfoPluginConfig;
    case "opa_policy": return OpaPolicyPluginConfig;
    case "webtool": return WebtoolPluginConfig;
    case "webserver": return WebserverPluginConfig;
    case "skill": return SkillPluginConfig;
    case "cron": return CronPluginConfig;
    default: return GenericPluginConfig;  // fallback: JSON textarea
  }
}
```

在 `CollapsibleSection` 展开区域内，用专属组件替换当前的 name 文本框 + JSON textarea。

### 开发步骤

1. **Phase 1**: 创建 `plugins/` 目录和通用子组件 (`StringListInput`)
2. **Phase 2**: 实现 A 类插件的简化展示（去掉不必要的 name/JSON 编辑区域）
3. **Phase 3**: 逐个实现 B 类插件的专属配置组件（按复杂度从低到高）
   - OsInfoPluginConfig（2 个 checkbox，最简单，验证模式）
   - ShellPluginConfig / PowerShellPluginConfig
   - CronPluginConfig
   - SkillPluginConfig
   - WebserverPluginConfig
   - WebtoolPluginConfig（最复杂，有嵌套子配置）
   - OpaPolicyPluginConfig
   - MCP 插件（动态 servers 列表，最复杂，可后续单独处理）
4. **Phase 4**: 改造 `PluginsSettings.tsx` 做分发 + 去掉 "Add Plugin" 按钮（内置插件应固定列表）

### 需要注意的问题

1. **MCP 插件的 servers 配置非常复杂**（动态列表，每个 server 有不同字段取决于 transport 类型），建议作为独立 issue 单独处理
2. **config 字段的键名映射**: 文档中有些用 camelCase（如 `enableHeadlessRender`）有些用 snake_case（如 `credential_env_allowlist`），需确认 Go 后端实际 JSON 反序列化的字段名
3. **内置插件列表应固定**: 当前 "Add Plugin" 按钮允许手动添加内置插件，但实际上内置插件列表是固定的，应改为显示所有已知内置插件（包括未配置的），用开关控制
4. **默认值处理**: 表单控件应显示文档中的默认值作为 placeholder，未配置时不往 config 里写值（让后端用默认值）

### 工作量估算

- 通用子组件: 1 个文件
- 8 个插件配置组件: 8 个文件
- PluginsSettings.tsx 改造: 1 个文件
- 总计约 10 个文件，每个 50-150 行
