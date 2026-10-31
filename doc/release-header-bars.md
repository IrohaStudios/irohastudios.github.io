# 发布页顶部入口样式

用户要求将 HF 链接改为官网品牌风格横条，并为完整试听配戴耳机的 Q 版形象。

参考锁定：
- 主参考：Hugging Face 官网与 https://huggingface.co/brand 。采用官方彩色标志、白底、灰色细边框、深色字、8px 圆角和紧凑横排。官方黄色只用于标志及其浅色底。
- 辅参考：Refero 的 PostHog 样式仅借鉴独立品牌角色与清晰按钮并置，不引入其字体、整页沙色或其他配色。
- 延续本站浅蓝背景与银发青色发梢角色。试听角色戴耳机、双手扶耳罩、闭眼微笑；透明贴纸，避免文案进入图片。
- 两条完整区域均可点击；手机改为纵向，原视频、试听与技术笔记链接保留在下方。

Refero 参考：Hugging Face `9e063437-9455-4027-9aa4-63a236dc4560`；PostHog `13bc10c0-3cf9-4feb-8bf8-bfdd123931fc`。
HF 官方标志来源：https://huggingface.co/datasets/huggingface/brand-assets/resolve/main/hf-logo.svg ，保存原始 SVG。

验证：中文 1440px、英文 390px、日文 320px 的两个入口均可点击，目标链接保持正确；图像加载、键盘焦点和三条次级链接正常，页面无横向溢出或脚本异常。已根据手机截图修正入口高度，避免角色越过上一条链接。记录与截图位于 `/data/ly/outputs/iroha-header-bars-20261031/`。最终角色素材由内置 image_gen 生成，提示词保存在 `assets/listening-chibi-v1.prompt.json`。
