# Iroha Studios 主页

线上地址：https://irohastudios.github.io/

Iroha Studios 的二次元风格团队主页，包含原创天空插画、Iroha-TTS 四种情感试听、研究博客栏目与团队入口。

## 本地预览与发布

静态 HTML、CSS 和 JavaScript，无构建步骤或远程运行时依赖。启动任意静态 HTTP 服务器即可预览；检查音频拖动时，服务器需要支持 HTTP Range 请求。

GitHub Pages 使用仓库 `IrohaStudios/irohastudios.github.io` 的 `main` 分支根目录。推送后由 Pages 自动发布。`.nojekyll` 保证资源按静态文件处理。

## 维护入口

- `index.html`：栏目、项目简介、博客与 Hugging Face 链接。
- `style.css`：桌面、平板和手机布局。
- `app.js`：导航、试听、动效偏好与错误提示。
- `assets/samples.json`：四种真实试听的音频路径、时长、波形与原始来源。
- `assets/vendor/`：本地托管的 GSAP 3.15.0 和 ScrollTrigger，保留原始许可声明。
- [设计说明](doc/design.md)：参考、Claude 咨询、设计选择与验证记录。
- [素材来源](assets/README.md)：原创插画及既有博客资产。

原研究博客继续位于 https://iroha-research.liuyun5620472.chatgpt.site/ 。本站提供独立研究栏目和章节链接，不同步或改写博客内容。

## 交互与可访问性

中日英采用 Apple 系统字体优先的字体栈：英文 SF Pro、中文苹方、日文 Hiragino；其他系统使用对应无衬线字体回退。按语言设置字体，正文 500、导航和按钮 600、标题 700。根据未来科幻二次元主视觉，使用冷白、冰蓝和深海军蓝，小圆角按钮与细线分隔。首屏操作与下滑提示在正常文档流中排列，矮窗口或放大文字时允许首屏随内容增长。

桌面支持少量 Canvas 光点、滚动揭示与轻量视差；手机不运行粒子与视差。右下角可关闭动效，偏好保存在本地；系统的「减少动态效果」设置优先生效。隐藏标签页或首屏离开视口时停止粒子动画，音频由用户主动播放。

无 JavaScript 时主要内容与外链仍可阅读。试听加载或播放失败会提供原博客入口。导航支持键盘与手机菜单，关闭菜单可按 Escape。

2026-10-31 浏览器验证覆盖 320、390、768、1024、1440px，四种音频播放／暂停／拖动、菜单、博客链接、动效持久化、系统减少动态效果与无 JavaScript 阅读。
