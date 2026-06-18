# 学科思想地图网站 / Disciplinary Thought Maps Web

Designed by Yilimi

## 中文

这个仓库存放网站源码、静态构建脚本和 GitHub Pages 发布流程。正文内容来自独立内容仓库，也可以扩展 Notion 来源。

公网地址：

```text
https://amealf.github.io/disciplinary-thought-maps-web/
```

相关仓库：

```text
https://github.com/amealf/disciplinary-thought-maps-web
https://github.com/amealf/disciplinary-thought-maps-content
```

本地构建：

```powershell
cd D:\学科地图项目\web
$env:CONTENT_ROOT='D:\学科地图项目\content'
$env:SITE_OUTPUT_ROOT='D:\学科地图项目\web\dist'
node .\scripts\build-site.mjs
```

查看本地成品：

```powershell
cd D:\学科地图项目\web
$env:SERVE_ROOT='D:\学科地图项目\web\dist'
node .\scripts\server.mjs
```

GitHub Pages 发布时，Actions 会检出内容仓库，运行 `node scripts/build-site.mjs`，然后发布 `dist`。

网站仓库需要设置：

```text
CONTENT_REPOSITORY=amealf/disciplinary-thought-maps-content
CONTENT_REPO_TOKEN
```

内容仓库需要设置：

```text
WEB_REPOSITORY=amealf/disciplinary-thought-maps-web
WEB_REPO_DISPATCH_TOKEN
```

可选 Notion 来源需要设置：

```text
NOTION_TOKEN
NOTION_DATA_SOURCE_ID
```

也可以使用：

```text
NOTION_DATABASE_ID
NOTION_PAGE_IDS
```

迁移到其他服务器时，保留 `scripts/build-site.mjs` 生成 `dist` 的流程即可。静态托管服务只需要发布 `D:\学科地图项目\web\dist`，后续如果需要账号功能，可以让前端继续读取同一份静态数据，同时新增后端 API。

## English

This repository contains the website source code, static build scripts, and the GitHub Pages deployment workflow. Content comes from a separate content repository, with optional Notion support.

Public site:

```text
https://amealf.github.io/disciplinary-thought-maps-web/
```

Repositories:

```text
https://github.com/amealf/disciplinary-thought-maps-web
https://github.com/amealf/disciplinary-thought-maps-content
```

Local build:

```powershell
cd D:\学科地图项目\web
$env:CONTENT_ROOT='D:\学科地图项目\content'
$env:SITE_OUTPUT_ROOT='D:\学科地图项目\web\dist'
node .\scripts\build-site.mjs
```

Serve the built site locally:

```powershell
cd D:\学科地图项目\web
$env:SERVE_ROOT='D:\学科地图项目\web\dist'
node .\scripts\server.mjs
```

During GitHub Pages deployment, GitHub Actions checks out the content repository, runs `node scripts/build-site.mjs`, and publishes `dist`.

Required website repository settings:

```text
CONTENT_REPOSITORY=amealf/disciplinary-thought-maps-content
CONTENT_REPO_TOKEN
```

Required content repository settings:

```text
WEB_REPOSITORY=amealf/disciplinary-thought-maps-web
WEB_REPO_DISPATCH_TOKEN
```

Optional Notion source settings:

```text
NOTION_TOKEN
NOTION_DATA_SOURCE_ID
```

Alternative Notion settings:

```text
NOTION_DATABASE_ID
NOTION_PAGE_IDS
```

For future migration to another hosting provider, keep the `scripts/build-site.mjs` workflow that generates `dist`. Any static hosting service can publish `D:\学科地图项目\web\dist`. If account features are added later, the frontend can keep reading the same static data while a backend API is introduced.
