# Iroha Studios 主页

线上地址：https://irohastudios.github.io/

Iroha Studios 出于个人爱好制作二次元相关的 AI 和 AI Agent，不以盈利为目的。主页分享项目、演示视频、制作过程和研究记录，Iroha-TTS 是其中一个项目。

## 本地预览与发布

静态 HTML、CSS 和 JavaScript，无远程运行时依赖。中、日、英页面已预生成，可由任意支持目录首页的静态 HTTP 服务器直接预览；检查音频拖动时，服务器需要支持 HTTP Range 请求。

修改模板、翻译、CSS 或 JavaScript 后，运行 `python scripts/build-locales.py`，同步生成默认中文 `/`、中文 `/zh/`、日文 `/ja/`、英文 `/en/` 页面及资源缓存哈希。生成脚本只使用 Python 标准库。请修改 `src/` 中的源文件，不直接编辑四个生成的 `index.html`。

GitHub Pages 使用仓库 `IrohaStudios/irohastudios.github.io` 的 `main` 分支根目录。推送后由 Pages 自动发布。`.nojekyll` 保证资源按静态文件处理。

## 维护入口

- `src/index.template.html`：三种语言共用的栏目模板、项目和博客链接。
- `src/locales.json`：中日英文案、图片说明、可访问性名称与运行时提示。
- `index.html`、`zh/index.html`、`ja/index.html`、`en/index.html`：生成的静态页面。
- `style.css`：桌面、平板和手机布局。
- `app.js`：语言选择与偏好、导航、试听、动效偏好与错误提示。
- `assets/demos/`：三段网页版本的演示视频、原封面和来源校验清单。
- `assets/samples.json`：四种真实试听的音频路径、时长、波形与原始来源。
- `assets/vendor/`：本地托管的 GSAP 3.15.0 和 ScrollTrigger，保留原始许可声明。
- [设计说明](doc/design.md)：参考、Claude 咨询、设计选择与验证记录。
- [三套规则检查](doc/quality-review.md)：Humanizer-zh、Impeccable、Taste Skill 的修改、测试及保留项。
- [素材来源](assets/README.md)：原创插画及既有博客资产。

博客已完整迁入本站：`/blog/` 为新版发布文章，`/blog/research/` 为完整技术笔记。两页默认日文，各有 `/ja/`、`/en/`、`/zh/` 静态版本；主页也提供中日英，中文版本的首屏标语保留日英原文。主页中的文章、试听、方法、控制和失败经验入口均使用站内链接。原站仅作为来源记录，不再承担本文资源加载。

发布文章的 Markdown 位于 `blog/content/iroha-tts-v1-{ja,en,zh}.md`。修改文章后，使用 Python 3.12+，先安装 `scripts/requirements-blog.txt` 中的构建依赖，再运行 `python scripts/build-blog.py`。页面运行时无需这些依赖。技术笔记的模板和三语文本位于 `src/blog/`；样式、交互、全部 20 段 MP3、Live2D 模型和口型轨迹位于 `blog/research/`。不要直接修改生成的 HTML。

## 交互与可访问性

三语采用 Apple 系统字体优先的字体栈：英文 SF Pro、中文 PingFang、日文 Hiragino；其他系统使用对应无衬线字体回退。按语言设置字体，正文 500、导航和按钮 600、标题 700。根据未来科幻二次元主视觉，使用冷白、冰蓝和深海军蓝，小圆角按钮与细线分隔。首屏操作与下滑提示在正常文档流中排列，矮窗口或放大文字时允许首屏随内容增长。

桌面支持蓝白 Canvas 光点、滚动揭示与轻量视差；手机在插画区域运行较少粒子，不启用视差。右下角可关闭动效，偏好保存在本地；系统的「减少动态效果」设置优先生效。隐藏标签页或首屏离开视口时停止粒子动画，音频由用户主动播放。

右上角语言选择器提供中文、日本語、English，默认首页恢复中文。中文导航、介绍、按钮、作品和博客说明均为中文；只有首屏日文大标题与英文 “Made with curiosity.” 保留原文。访问明确语言地址或 `?lang=` 时以地址为准；返回默认首页时恢复上次选择。切换保留章节锚点和其他查询参数，三种语言各有 canonical 与 hreflang，默认首页指向中文 canonical。无 JavaScript 时仍能阅读各语言页面并通过备用链接切换。音频样例保持原始日语，界面标明语言；博客保留中日英三语，发布稿和技术笔记的样式均与主页统一。

作品区的 Demo 展示包含 ASMR 双耳 3D、功能介绍（草稿 2）和《放课后旋律》。采用原生播放器，支持暂停、拖动和全屏；默认仅展示封面，用户点击后加载 MP4。开启一个视频或试听会暂停其他媒体。中日英文案说明耳机建议、空间音频后期处理及原视频的中日字幕，展开区域保留作品和 HRIR 来源说明。

无 JavaScript 时主要内容、视频播放器与外链仍可使用。试听加载或播放失败会提供站内技术笔记入口。导航支持键盘与手机菜单，关闭菜单可按 Escape。

2026-10-31 浏览器验证覆盖 320、390、768、1024、1440px，四种音频播放／暂停／拖动、菜单、博客链接、动效持久化、系统减少动态效果与无 JavaScript 阅读。
