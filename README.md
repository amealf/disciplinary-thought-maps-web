# 学科思想地图网站

这个仓库存放网站源码和静态构建脚本。内容来自两个来源：

- GitHub Markdown 仓库：`D:\学科地图-content`
- Notion API：可选，需要配置 Notion token 和数据源 ID

GitHub 仓库：

```text
https://github.com/amealf/disciplinary-thought-maps-web
```

公网地址：

```text
https://amealf.github.io/disciplinary-thought-maps-web/
```

本地构建：

```powershell
cd D:\学科地图-web
$env:CONTENT_ROOT='D:\学科地图-content'
node .\scripts\build-site.mjs
node .\scripts\server.mjs
```

本地开发服务默认读取仓库根目录里的 `data`。如果要查看 `dist` 成品，可以在任意静态服务器里打开：

```text
D:\学科地图-web\dist
```

GitHub Pages 发布时，Actions 会检出内容仓库，运行 `node scripts/build-site.mjs`，再发布 `dist`。

需要在网站仓库设置变量：

```text
CONTENT_REPOSITORY=amealf/disciplinary-thought-maps-content
```

需要在内容仓库设置变量：

```text
WEB_REPOSITORY=amealf/disciplinary-thought-maps-web
```

Notion 来源需要在网站仓库设置：

```text
NOTION_TOKEN
NOTION_DATA_SOURCE_ID
```

也可以用：

```text
NOTION_DATABASE_ID
NOTION_PAGE_IDS
```
