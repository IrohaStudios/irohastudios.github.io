# 完整技术笔记

从 Iroha Research Blog 的公开版本 9 迁移而来。页面源模板及三语内容位于 `../../src/blog/`，通过 `../../scripts/build-blog.py` 生成四个入口；不要直接修改生成的 HTML。

- `assets/audio/`：原始 20 段 MP3，未重新编码。
- `assets/samples.json`：同源绝对路径、原始时长和波形。
- `assets/lipsync.json`、`assets/live2d/`：原有口型时间轴与角色模型。
- `vendor/NOTICE.txt`、`assets/fonts/OFL.txt`：随原工程迁移的许可声明。
- `sources.json`：原站与源码提交，以及未修改资源的 SHA-256。
- `../../src/blog/evaluation-table.json`：用户指定 Artifact 的总表数据，保留原表的数值精度与行序；模型名称、表头和说明由三语文本提供。
- `assets/models/`：从公开归档复制的 Fish、IndexTTS、Chatterbox 小图标；Ours 使用本站现有头像，Irodori 用文字图标。

2026-10-31 总表来源：用户指定的 `https://claude.ai/artifact/EnAFVuqrC4E6QA7BSVY7dg` 当时返回 403，采用与用户截图一致的本地公开报告归档 `emotion-tts-report-1014/index.html` 中的 `#table`。原文件 SHA-256 为 `a5026cffd3803c99b2fa3fc5e1a85037d9f77f174a9def872496accbd51c3dcd`。总表包含 7 行、带情感 6 项和不带情感 3 项指标；本次只迁入总表及截图中的 MOS 部分，不复制归档的其他资源或私有目录。

技术笔记保留原有方法与失败经验，MOS 小节按用户提供的两张表及说明更新，与发布文章共用 `../content/iroha-tts-v1-{lang}.md` 中的内容，由构建脚本同步三语标题、表格与语言切换数据。公开音频不依赖原 Site；模型下载权限说明见发布文章。项目角色素材的本站使用不等同于向第三方授予独立素材许可。
