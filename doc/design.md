# Iroha Studios 官网改版

## 目标与内容

2026-10-31，用户要求参考二次元游戏／动画官网，使用 Mobbin 找参考、请 Claude 参与完整设计，将既有研究博客放成网站栏目，并加入网页特效。

研究博客：https://iroha-research.liuyun5620472.chatgpt.site/ ，已确认公开。首页实际内容为 Iroha 的七种语音控制，包含试听、训练方法、结果与失败经验。保留原博客和原试听体验，以独立 Research 栏目和真实深链接入。页面不编造成员、团队规模、未发布作品或实验指标。

## 参考与决策

| 决策                   | 依据                                                                                           | 保留与取舍                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 明亮天空与全幅角色插画 | 用户二次元要求；实看 https://bluearchive.jp/ 的蓝天主视觉、轻导航与纵排文字                    | 天青、白、深蓝；使用原创插画，不使用游戏素材                       |
| 大幅视觉与紧凑功能入口 | 实看 https://zenless.hoyoverse.com/en-us/                                                      | 主视觉占据首屏，功能入口清晰；不采用密集商业下载角标               |
| 研究栏目独立成区       | 用户指定博客；https://frieren-anime.jp/ 的 NEWS / MOVIE 栏目结构                               | 网站有清楚的内容分区；芙莉莲只读到页面结构，浏览器视觉被验证页阻挡 |
| 小字导航叠加大场景     | Mobbin basement.studio https://mobbin.com/sites/sections/28a88d90-f813-478b-bb89-336dbe1e48a0  | 仅作布局参考，非二次元参考                                         |
| 全屏视觉优先           | Mobbin Shopify Editions https://mobbin.com/sites/sections/47c5f830-b25e-4912-8484-47377cd8a238 | 只借视觉／操作的比例，不采用其汽车或暗色调                         |
| 云层与空间感           | Refero Anything；https://www.createanything.com                                                | 只借背景空气感；不引入装饰性花体或 SaaS 卡片布局                   |

Mobbin 的两轮搜索没有找到贴切的二次元游戏原站，未把 Deel 或 ExpressVPN 冒充二次元参考。Refero 的 MekaVerse 暗色方向被弃用。

## Claude 咨询

通过本机 Claude Code 的 ask-claude 插件，以无工具、无会话持久化方式咨询。调用成功；不是 Claude Design 画布操作。

采用其全幅 KV、轻导航、独立研究栏目、GSAP + ScrollTrigger、移动端降级和减少动态效果建议。未采用未经证实的「小型」团队描述。咨询时博客尚未确认，因此其对声学方向的保留意见已由实际博客内容补充。动画库能力以官方文档为准，不沿用咨询中关于 Anime.js 没有滚动能力的判断。

## 视觉约束

- 主色：天空蓝；正文深海军蓝；白与极浅蓝为内容底色。主视觉是原创插画。
- 导航与元信息使用小号无衬线／等宽字；中文标题有明确比例，不混搭装饰性字体。
- 原博客的手写 Iroha 标识继续使用。按钮采用细框与小圆角；分区不堆砌通用卡片。
- 桌面主视觉右侧人物、左侧文字；手机调整图片裁切与文字位置，确保人物和标题不重叠。
- 入口：首页、项目、研究日志、关于；外链清楚标记。

## 动效选型

- GSAP 3.15.0 + ScrollTrigger：文字进场、分区揭示、桌面轻量视差。
- Canvas 2D：少量光点，暂停时停止动画帧，标签页不可见或首屏离开视口时暂停。
- 不同时引入 Motion、Anime.js、Three.js、Lenis；不劫持滚动，不自动播放音频。
- 尊重 prefers-reduced-motion；提供持久化动效开关，JS 不可用时正文仍然可读。
- 官方资料：https://gsap.com/docs/v3/Plugins/ScrollTrigger/ 、https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/ 、https://motion.dev/docs/quick-start 、https://animejs.com/documentation/ 。

## 插画来源

assets/sky-observatory.png 使用内置 image_gen 生成。英文提示核心：Original anime key visual; adult silver-haired sound researcher on the right with headphones and recorder; luminous coastal Japanese city, turquoise sky and cumulus clouds; left side pale and open for title; navy/white clothing; no typography, logos, watermarks, weapons or existing game characters.

角色用于原创站点视觉，不代表真人成员。博客标识、预览和试听素材来自用户指定的公开博客；引用保持在来源清单中。

## 验证记录（2026-10-31）

- Chromium 实际浏览器验证：1440px 桌面，1024／768px 平板，390／320px 手机；无横向溢出，控制台无脚本错误，本地资源无缺失。
- 四种情感均能播放、暂停并显示真实波形；支持音频进度拖动。预览服务必须支持 Range 请求，最终检查已使用支持该功能的服务器。
- 手机菜单可展开、按 Escape 关闭、点击导航后关闭；站内锚点完整，博客训练方法／控制／失败经验指向真实章节。
- 动效开关可关闭、重开，并在刷新后保持偏好；系统减少动态效果生效；滚动进入分区时内容正确显示。
- 无 JavaScript 时正文可读；模拟 manifest 加载失败会禁用试听并提示博客入口；模拟音频请求失败后重试可恢复播放。
- 桌面、手机及平板截图已目视检查；修正了博客预览裁切与手机底部动效按钮遮挡装饰文字的问题。

发布前获取远端 main 并确认仍为原首版提交 `38bb9ca`，采用普通快进推送，不改写远端历史。Pages 构建和线上回归在发布后核对。
