# 手机视频适配

2026-10-31，覆盖首页三段 Demo 与 Iroha-TTS-V1 发布页两段视频。

- 1024px 及以下均为单列；横屏矮视口按 `svh` 限制播放器宽度，完整保留 16:9 画面，为顶部导航留出空间。保留 Safari 默认的安全区视口处理，并为横屏页面边距保留安全区变量。
- 首页在触屏或 1024px 及以下直接保留原生 `controls`，隐藏自定义播放覆盖层。播放、进度与全屏由浏览器原生播放器处理；发布页同样使用原生控件。
- `playsinline` 保留页内播放；不静音、不自动播放，`preload="none"` 与海报保留。无 JavaScript 时仍有原生控件。
- 使用 `<source media>` 在 1024px 及以下选择 720p，较宽视口使用原 1080p；旋转时不主动重建播放器或重置进度。直开链接保留原视频。
- 720p 使用 H.264 Main / Level 3.1、yuv420p、faststart；AAC 双声道直接复制，不重编码 ASMR 音轨。原始文件不变；生成命令在 `scripts/build-mobile-videos.py`，输出及来源哈希在 `assets/demos/mobile-sources.json`。

参考：[Apple Safari 视频说明](https://developer.apple.com/documentation/webkit/delivering-video-content-for-safari)、[WebKit 安全区说明](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)、[source 的 media 条件](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/source#using_the_media_attribute_with_video)。

验证输出保存在持久工作区 `iroha-iphone-video-20261031/`。此环境的 WebKit 缺少 GTK / GStreamer 等系统库，不能运行；不将 Chromium 触屏模拟称为 iPhone Safari 真机验证。

已通过：中日英首页与发布页 × 375×667、390×844、844×390、956×440、1440×900，共 30 组布局；无横向溢出、画面比例正确、播放前无 MP4 请求。五个播放器的原生触屏播放、拖动进度、互斥播放、横竖屏切换保留进度、Chromium 原生全屏以及无 JavaScript 控件通过。桌面点击仍选择 1080p。已查看手机竖屏和横屏播放截图。

三份 720p 分别为 13705955、14244783、12342577 字节，比各自原片减少 20.0%、22.3%、31.7%。三份 AAC 数据包哈希分别与原片完全一致；编码参数和 faststart 的 moov/mdat 顺序均已核对。
