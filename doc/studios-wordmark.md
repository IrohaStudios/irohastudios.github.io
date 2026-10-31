# Studios 毛笔字标

2026-10-31：用户要求左上角 Studios 与 iroha 使用一致的毛笔字风格。使用 image_gen 参照原有 iroha 字标生成深蓝色、透明背景的 Studios 字标；保留原有 iroha 和头像素材。

首页、博客目录、发布页、技术页及原有页脚 Studios 同步替换，三种语言共用；保留原有手机端显隐规则和图片替代文本。

验证：Chromium 检查三语言、四类页面、1440/390/320px，共 36 组。图片加载、桌面可见性、横向溢出及脚本异常检查通过；已查看实际品牌区域截图确认笔触与颜色协调。构建及 git diff --check 通过。截图和检查脚本位于 `/data/ly/outputs/iroha-studios-wordmark-20261031/`。

同日按用户反馈收紧两段字标间距：Studios 向 iroha 靠近 20px，补偿图片留白；首页、博客和技术页共用此调整。已查看四类页头截图，桌面与手机共 8 组布局无横向溢出。截图：`/data/ly/outputs/iroha-wordmark-spacing-20261031/`。

2026-11-01：按用户再次反馈，桌面端 Studios 再向左靠近 10px（负外边距由 -20px 改为 -30px）；保留小屏原布局。已查看首页、发布页和技术页字标截图，字形没有相撞，页面无横向溢出。截图：`/data/ly/outputs/iroha-wordmark-tight-20261101/`。
