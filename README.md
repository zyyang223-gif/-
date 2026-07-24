# -
随便vibecoding了一下>&lt;
# 3D 粒子手势交互系统

基于 Three.js + MediaPipe Hands 的 3D 粒子交互系统，通过摄像头单手张合控制粒子扩散与聚拢。

## 效果

- 25000 个粒子实时渲染，Bloom 发光后处理
- 5 种形状可切换：爱心、花朵、土星、DNA、烟花
- 每种形状独立配色
- 单手手势控制：🖐 张开扩散 / ✊ 握拳聚拢
- 摄像头画面实时预览 + 手部骨架标注
- 鼠标滚轮缩放，拖拽旋转

## 技术栈

- **Three.js** — 3D 渲染 + Bloom 后处理
- **MediaPipe Hands** — 摄像头手势识别（本地模型）
- **Vite** — 开发服务器 + 构建工具

## 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

浏览器自动打开 `http://localhost:3000`，允许摄像头权限后即可体验。

## 操作方式

| 手势 | 效果 |
|------|------|
| 🖐 张开手掌 | 粒子向外扩散 |
| ✊ 握拳 | 粒子向中心聚拢 |
| 张合幅度 | 控制扩散/收缩程度 |
| 鼠标拖拽 | 旋转视角 |
| 鼠标滚轮 | 缩放 |

## 项目结构

```
particle-gesture/
├── index.html              # 入口页面
├── package.json            # 依赖配置
├── vite.config.js          # Vite 配置
├── models/                 # MediaPipe 手势模型（本地）
│   ├── hands.binarypb
│   ├── hands_solution_packed_assets.data
│   ├── hands_solution_packed_assets_loader.js
│   ├── hands_solution_simd_wasm_bin.js
│   ├── hands_solution_simd_wasm_bin.wasm
│   └── hand_landmark_lite.tflite
└── src/
    ├── main.js             # 场景初始化 + 渲染循环
    ├── particles.js        # 粒子系统 + 形状生成算法
    ├── hand-tracking.js    # 手势识别 + 手部骨架绘制
    └── styles.css          # UI 样式
```

## 免责声明

手势识别模型来自 [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands.html)，遵循 Apache 2.0 许可证。
