# ONES Batch Create Issues Plugin

一个用于 ONES 的批量创建任务插件示例。

## 目录

- `plugin.yaml`: ONES 插件清单（需替换真实 URL）。
- `web/index.html`: 插件页面。
- `web/styles.css`: 页面样式。
- `web/app.js`: 批量创建逻辑。
- `docs/发布与部署说明.md`: 发布/部署操作说明。

## 本地预览

在 `ones-batch-task-plugin` 目录运行：

```bash
cd ones-batch-task-plugin
python3 -m http.server 8080
```

打开：`http://localhost:8080/web/index.html`

## 重要配置

1. `plugin.yaml` 里两个 `url` 改成你部署后的 `index.html` 地址。
2. 页面中填写以下必填信息：
- ONES 域名
- OpenAPI Token
- 项目 UUID
- 任务类型 UUID

## 接口适配

默认 API 路径模板是：

```text
/project/v1/projects/{project_uuid}/issues
```

如果你的环境路径不同，可在页面里修改“API 路径模板”，或直接改 `web/app.js`。

默认任务载荷构造在 `buildPayload()`，如字段名不一致，请按实际 OpenAPI 文档调整。
