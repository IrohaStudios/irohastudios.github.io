# 素材来源

| 文件                                                                          | 来源与用途                                                                                                                 |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `sky-observatory.png`                                                         | 使用 image_gen 为本站生成的原创二次元插画；提示摘要见 `doc/design.md`。角色不代表真实团队成员。                            |
| `iroha-wordmark-brush-v1.png`                                                 | 用户指定的公开 Iroha 研究博客既有手写品牌标识。                                                                            |
| `iroha-logo.svg`                                                              | 用户提供表情图中第四排第一列的头像。SVG 视口直接显示原 PNG 对应区域，原始像素未重绘；首页、页脚、关于区域与 favicon 共用。 |
| `iroha-mascot-white-v3.png`                                                   | 同一博客历史品牌头像，当前首页已改用用户选定的 `iroha-logo.svg`。                                                          |
| `research-preview.png`                                                        | 2026-10-31 对本站日文发布文章的浏览器截图，用作链接预览。                                                                    |
| `voice-joy.mp3`、`voice-anger.mp3`、`voice-sadness.mp3`、`voice-surprise.mp3` | 同一博客的 Iroha V1 情感试听，分别为开心、生气、悲伤、惊讶。                                                               |
| `samples.json`                                                                | 从博客公开 manifest 保留对应四段音频的真实波形与时长；每项的 `source` 字段记录音频原始 URL。                               |
| `vendor/gsap.min.js`、`vendor/ScrollTrigger.min.js`                           | GSAP 3.15.0 官方 npm 分发文件；许可入口见 `vendor/NOTICE.txt`。                                                            |

迁移后的研究博客：https://irohastudios.github.io/blog/research/
原站来源：https://iroha-research.liuyun5620472.chatgpt.site/

## 技术笔记目录角色

2026-10-31 使用内置 `image_gen`，以本站 `sky-observatory.png` 的银白发角色为参考，生成三个 Q 版全身动作，替换技术笔记目录的抽象插图。控制与失败动作继续参考首张学习版，保持同一角色的外观与画风。

- `guide-training-chibi-v1.webp`：拿着本子和笔学习，对应训练方法。
- `guide-controls-chibi-v1.webp`：调节音频控制板，对应控制功能。
- `guide-lessons-chibi-v1.webp`：电脑冒出小烟团后挠头，对应失败经验。
- `guide-characters-prompts.json`：本次三张插画的完整生成提示词。

网页素材为 512 × 512 透明 WebP，由生成的 PNG 缩放编码，保留 alpha；没有裁切角色或重新绘制。三张共 231 KiB。生成原图另存于持久工作区的 `iroha-guide-characters-20261031/originals/`，保留最初生成文件。

验证：中日英在 320、390、768、1024、1440px 共 15 组 Chromium 布局中，角色完整显示、文字不重叠、页面不横向溢出；三个章节跳转、语言切换和无 JavaScript 显示通过。已核对透明通道，并查看桌面、手机实际页面截图。

## 情感试听表情

2026-10-31 使用内置 `image_gen`，以上述学习版角色为统一参考，生成四个头肩表情，替换情感试听按钮中的星号、闪电、伞和星形符号。

- `emotion-joy-chibi-v1.webp`：开心，眯眼大笑。
- `emotion-anger-chibi-v1.webp`：生气，皱眉鼓腮。
- `emotion-sadness-chibi-v1.webp`：难过，垂眉含泪。
- `emotion-surprise-chibi-v1.webp`：惊讶，睁大眼睛、张开嘴。
- `emotion-characters-prompts.json`：四个表情的完整生成提示词。

网页使用 256 × 256 透明 WebP，四张共 124600 字节，保留生成图的 alpha；原始 PNG 另存于持久工作区的 `iroha-emotion-characters-20261031/originals/`。按钮文字独立翻译，图片不随语言切换重建。桌面四列，手机两列；图像作为装饰，不重复朗读按钮名称。

验证：三语 × 320、390、768、1024、1440px，共 15 组 Chromium 布局通过。点击头像切换四类音频、四种试听播放暂停、键盘方向键与 End、切换语言后保留选中情感、无 JavaScript 图片显示均通过。已查看桌面与手机截图，未进行真机测试。

主视觉和 UI 未复制参考游戏官网的原始美术。素材的本站使用不等同于向第三方授予独立素材许可。

## 当前使用的表情包贴纸版（v2）

2026-10-31 按用户提供的 Q 版表情包参考，使用内置 `image_gen` 重新生成上述七张角色图。保留首页角色的银白发、蓝眼、耳机与蓝白服装，采用更圆的脸、更短的身体、粗深蓝描边和夸张表情。参考截图只用于确定画风，没有作为网页素材发布。

当前研究页使用 `guide-{training,controls,lessons}-chibi-v2.webp` 与 `emotion-{joy,anger,sadness,surprise}-chibi-v2.webp`；上面的 v1 文件保留为历史版本。三个章节角色为 512 × 512，四个表情为 256 × 256，均保留透明 alpha。

完整提示词、各张对应关系和生成模式见 `sticker-characters-v2-prompts.json`。先生成学习动作，其余六张使用该图保持角色与画风一致；原始 PNG 保存在持久工作区 `iroha-sticker-style-20261031/originals/`，网页 WebP 只做缩放编码。

验证：三语 × 320、390、768、1024、1440px 共 15 组 Chromium 布局通过；七张图片加载、文字位置、章节目标、情感切换、键盘操作与语言切换通过。已查看手机和桌面实际页面截图。未做真机测试。HTML 差异核对确认本轮仅替换七处图片路径。

## 用户指定的 Demo 视频

2026-10-31 按用户截图，将归档目录 `/data/ly/codebase/data/tts/html/` 中三段既有网页 MP4 和原封面复制到 `demos/`。未重新压制或修改音轨。每项的相对归档路径、字节数及 SHA-256 见 `demos/sources.json`；仅发布选定视频和封面，不发布生成工程、参考音频或内部角色对应记录。

| 展示 | 本站文件 | 归档版本 | 时长 |
| --- | --- | --- | --- |
| ASMR 双耳 3D | `demos/asmr-3d.mp4` | `iroha-demo-video-20261027/web/nee-mimi-kashite-binaural-web.mp4` | 3:17 |
| 功能介绍 | `demos/feature-tour.mp4` | `iroha-intro-video-20261028/web/iroha-tts-v1-intro-draft2-web.mp4` | 4:06 |
| 放课后旋律 | `demos/after-school.mp4` | `iroha-demo-video-20261027/web/houkago-melody-web.mp4` | 2:57 |

视频均为 1920×1080 H.264 / 双声道 AAC，保留原片日语配音和中日字幕。ASMR 使用用户标出的双耳 3D 版本，位置和距离来自后期处理，不是 TTS 模型直接输出的空间音频。归档说明记载，ASMR 及功能介绍的空间处理使用 TH Köln KU100 近场 HRIR 数据（CC BY-SA 3.0）；页面中保留数据来源及许可链接。

按用户后续要求，已从本站移除春物短篇、封面和相关署名；保留原归档。当前展示作品的素材来源见各自归档 README。

### 发布页入口素材

- `huggingface-logo.svg`：Hugging Face [官方品牌素材](https://huggingface.co/brand)，原始文件来自 https://huggingface.co/datasets/huggingface/brand-assets/resolve/main/hf-logo.svg ，未修改图形。
- `listening-chibi-v1.png`：使用内置 image_gen，以本站 `emotion-joy-chibi-v2.webp` 为角色参考，生成戴耳机聆听的透明 Q 版贴纸。完整提示词及修订记录见 `listening-chibi-v1.prompt.json`。用于发布页完整试听入口。
