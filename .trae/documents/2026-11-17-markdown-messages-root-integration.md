# markdown-messages 根目录整合计划

## Context

`markdown-messages` 当前是 `examples/markdown-messages` 下的独立 pnpm workspace，而仓库根目录已有 LangChain 学习代码、脚本和依赖。目标是把示例提升到根目录，同时保留现有学习代码，统一安装入口，并确保 Windows PowerShell 下可以启动和验证。

## 目标结构

- 保留根目录现有 `agents/`、`middlewares/`、`models/`、`outputs/`、`prompts/`、`tools/`、`index.ts`、`test*.ts` 和 `.env`。
- 将示例的 `packages/agent`、`packages/frontend` 原样移动到根目录 `packages/` 下。
- 根目录作为 pnpm workspace 根，同时继续承载原学习项目依赖；子包依赖仍由各子包自行声明。
- 源码中的相对路径、`@` 别名、LangGraph 图入口和 Vite 代理均相对于子包，无需修改。

## 实施步骤

1. **迁移示例文件**
   - 移动 `examples/markdown-messages/packages/` 到根目录。
   - 移动 `pnpm-workspace.yaml`、`.env.example`、`README.md` 到根目录；这些路径当前不存在同名文件。
   - 不迁移或复制任何 `node_modules`，不读取、覆盖根目录现有 `.env`。
   - 检查旧目录无遗漏文件后，仅清理空目录。

2. **合并 workspace 与脚本**
   - 修改根 `package.json`，保留全部现有脚本和依赖，增加 `name: langchain-study`、`private: true`。
   - 保留 `start` 与 `test:model/tool/memory/sse`，新增 `dev:agent`、`dev:frontend`。
   - 将原 Bash 后台符号 `&` 改为 pnpm 的 `--parallel`，用一个 `dev` 命令并行启动两个子包，兼容 PowerShell，且不新增 `concurrently` 依赖。
   - 合并示例顶层 `pnpm.onlyBuiltDependencies: [esbuild]`。
   - 根 `pnpm-workspace.yaml` 仅声明 `packages/*`，不改变现有学习目录结构。

3. **整理环境与文档**
   - 更新迁移后的根 `README.md`，说明统一安装、`pnpm dev`、前端构建/类型检查及原学习脚本仍可使用。
   - agent 继续使用 `packages/agent/.env`（由 `langgraph.json` 的 `env: .env` 解析）；文档使用不会覆盖现有文件的 PowerShell 复制命令，根 `.env` 继续供原学习代码使用。
   - 扩充 `.gitignore`，忽略各包 `node_modules`、构建产物和本地 `.env*`，但保留 `.env.example`。

4. **安装并校准依赖**
   - 在根目录执行 `pnpm install --no-frozen-lockfile`，基于现有 `pnpm-lock.yaml` 增量加入 `.`、`packages/agent`、`packages/frontend` 三个 importer，不删除锁文件、不手工编辑依赖解析。
   - 保留各包当前依赖边界，不把 Vue、LangGraph CLI 等提升到根，也不批量升级共同依赖。
   - 检查 `@langchain/core`、`@langchain/langgraph-sdk` 等 peer 解析；仅对本次新增且确证的不兼容做最小版本调整，不用全局 override 掩盖问题。

## 验证

1. `pnpm install --frozen-lockfile` 成功，workspace 能识别 agent/frontend，锁文件无旧示例 importer。
2. `pnpm --filter @langchain-example/frontend exec vue-tsc --noEmit -p tsconfig.json` 类型检查通过。
3. `pnpm --filter @langchain-example/frontend build` 构建成功。
4. `pnpm start` 成功加载原根学习入口，无模块解析错误。
5. 在具备有效 `ANTHROPIC_API_KEY` 时运行 `pnpm dev`，确认 agent `2024`、frontend `4100` 均可访问；若本机没有密钥，明确记录运行时验证限制，不伪造通过结果。
6. 不主动运行会调用真实模型的 `test:model/tool/memory/sse`，避免额外 API 费用。
