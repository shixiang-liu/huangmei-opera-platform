# 学戏模块素材来源清单

本清单记录学戏模块实际使用的主视觉素材，路径以本仓库为准。原则：

1. 页面运行时优先引用仓库内本地文件；字体等少数素材仍从外部 CDN 加载（**不随本仓库分发**）。
2. 缺失素材优先复用仓库已有图，再用本地视频截帧，最后才补联网下载。
3. 示例内容只做展示 fallback，不写入真实业务数据。

## 一、仓库内现存素材

**名家照片与舞台图** — `client/src/learn/assets/masters/`

| 文件 | 说明 |
|---|---|
| `han_zaifen.jpg`、`hanzaifen_stage.jpg` | 韩再芬 宣传照 / 舞台照 |
| `wu_qiong.jpg`、`wuqiong_stage.webp`、`wuqiong_stage_hero.webp` | 吴琼 宣传照 / 舞台照 |
| `yanfengying_stage.jpg` | 严凤英 舞台照 |
| `yan_fengying_illustration.svg` | 严凤英 插画（矢量，非照片） |

**场景背景** — `client/src/learn/assets/backdrops/`
`mist_backdrop.png`、`mountain_backdrop.png`、`river_backdrop.png`、`stage_backdrop.png`

**界面背景与图标** — `client/src/shared/assets/`
`backgrounds/home-back.webp`、`backgrounds/wood.webp`、`icon/flower.png`、`icon/icon1.png`

**外部纹理与图案** — `client/src/shared/assets/learn-external/`（来源见 `manifest.json`）
`curtain_939464.jpg`、`paper_fibers.png`、`fabric_1.png`、`fabric_squares_gray.png`、`diagmonds.png`、`stardust.png`

**动效** — `client/src/learn/assets/lottie-sparkle.json`（Lottie，项目内未记录作者与许可）

## 二、原项目存在、但未纳入本公开副本的素材

以下内容存在于原课程项目的完整工程中，为控制仓库体积未随本副本分发；引用它们的页面在公开副本中回退为占位视觉。

- 曲目封面：`public/assets/covers/*.jpg`（天仙配、女驸马、梁祝、楼台会、孟姜女、踏青、棒打薄情郎）
- 名师头像：`public/assets/masters/*_avatar.jpg`
- 演示视频：`public/video/*.mp4`（含《天仙配》《女驸马》《梁祝》选段等）
- 视频截帧结果：`public/assets/learn-real/stills/*`

## 三、素材映射入口

统一视觉映射集中在学戏模块的 `utils/` 下（`learnVisuals.js`、`learnCatalog.js`、`learnDemoFixtures.js`，位于 `client/src/learn/utils/`）。后续若替换素材，优先改映射，不在页面内散写路径。

## 四、版权与使用范围

- **名家照片与舞台图**：公开宣传照与演出现场照，仅用于本课程项目的教学演示（非商业用途），版权归原权利人所有；如需商用须另行取得授权。
- **外部纹理与图案（`learn-external/`）**：来源记录在同目录 `manifest.json`，其中部分来自 Subtle Patterns（toptal.com，CC BY-SA 3.0，署名要求见该站点）与 Wikimedia Commons 的 `Curtain-939464.jpg`。使用或再分发前请按各自许可处理署名与条件。
- **运行时外链素材**：页面引用的字体（含微软雅黑等专有字体）与部分动效库指向第三方 CDN，不随本仓库分发；如需离线或商用，请自行替换为可用授权素材。
- **华为 AGC 模板文件**：云端对象与云函数脚手架保留原始版权头（© Huawei Technologies），请以其模板许可为准。
- 本项目为三人团队课程作品，本清单由学习模块负责人整理，供维护者复核使用。
