# FolkSplash

OPPO/Realme/OnePlus 设备 `splash.img` 开机启动镜像可视化工具

**[🇺🇸 English](README.en.md)** | **[🇨🇳 简体中文](README.md)**

## 技术栈

- **框架**: React 19.2 + TypeScript 5.9
- **构建工具**: Vite 7.3
- **UI 组件库**: Material-UI (MUI) 7.3
- **状态管理**: Zustand 5.0
- **国际化**: i18next + react-i18next
- **图片处理**: 
  - Pako 2.1 (Gzip 压缩/解压缩)
  - 自定义 BMP 编解码
- **代码规范**: ESLint 9 + TypeScript ESLint

## 功能特性

- 解包 `splash.img` 镜像文件
- 查看和替换开机动画图片（支持 PNG/JPG/BMP 格式）
- 多种分辨率适配模式：
  - **直接上传**: 直接上传原图，不进行任何转换
  - **跟随原图分辨率**: 保持原图尺寸自动适配
  - **自动适配**: 根据设备最大分辨率自动调整
  - **自定义分辨率**: 手动指定宽度和高度
- 打包并下载新的 `splash.img` 镜像
- 支持 OPPO/Realme/OnePlus 设备
- 中英双语界面

## 设备兼容性

> **重要**: 本工具仅支持搭载 **高通骁龙 (Qualcomm Snapdragon)** 处理器的设备。联发科 (MediaTek) 及其他平台设备不适用。

## 项目结构

```
FolkSplash/
├── src/
│   ├── components/       # React 组件
│   │   ├── FileUpload.tsx    # 文件上传组件
│   │   ├── ImageGallery.tsx  # 图片列表组件
│   │   ├── ImageCard.tsx     # 图片卡片组件
│   │   ├── PackButton.tsx    # 打包按钮组件
│   │   ├── InfoBar.tsx       # 信息栏组件
│   │   ├── Layout.tsx        # 布局组件
│   │   └── AboutPage.tsx     # 关于页面
│   ├── lib/              # 工具库
│   │   ├── types.ts          # TypeScript 类型定义
│   │   ├── splash-parser.ts  # splash.img 解析器
│   │   ├── splash-packer.ts  # splash.img 打包器
│   │   ├── bmp.ts            # BMP 编解码
│   │   ├── gzip.ts           # Gzip 压缩/解压缩
│   │   ├── utils.ts          # 通用工具函数
│   │   └── debug-compress.ts # 调试工具
│   ├── store/            # Zustand 状态管理
│   │   └── useSplashStore.ts
│   ├── i18n/             # 国际化配置
│   │   ├── index.ts
│   │   └── locales/          # 语言文件
│   │       ├── zh.json
│   │       └── en.json
│   ├── App.tsx           # 主应用组件
│   └── main.tsx          # 入口文件
├── public/               # 静态资源
├── index.html            # HTML 模板
├── package.json          # 项目配置
├── tsconfig.json         # TypeScript 配置
├── vite.config.ts        # Vite 配置
└── eslint.config.js      # ESLint 配置
```

## 开发环境要求

- Node.js >= 18
- pnpm >= 8 (推荐使用 pnpm)

## 安装和部署

### 1. 克隆项目

```bash
git clone <repository-url>
cd opsplash-web
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 开发模式

```bash
pnpm dev
```

启动后访问 http://localhost:5173

### 4. 构建生产版本

```bash
pnpm build
```

构建产物输出到 `dist/` 目录

### 5. 预览生产构建

```bash
pnpm preview
```

### 6. 代码检查

```bash
# ESLint 检查
pnpm lint

# TypeScript 类型检查
pnpm exec tsc --noEmit
```

## 部署到生产环境

### 静态托管部署

构建后的 `dist/` 目录可以部署到任意静态文件托管服务：

- **Vercel**: 直接连接 GitHub 仓库自动部署
- **Netlify**: 拖拽 `dist/` 目录或连接 Git
- **GitHub Pages**: 使用 GitHub Actions 自动部署
- **Nginx**: 配置静态文件服务

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 启用 Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

### Docker 部署

创建 `Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

构建并运行:

```bash
docker build -t folksplash .
docker run -p 80:80 folksplash
```

## 使用方法

1. **上传 splash.img**: 点击或拖拽上传 OPPO/Realme/OnePlus 设备的 `splash.img` 文件
2. **预览图片**: 查看解包后的所有开机动画图片
3. **替换图片**: 点击任意图片卡片，选择新的图片文件进行替换
4. **设置分辨率**: 根据需要选择分辨率适配模式
5. **打包下载**: 点击"打包并下载"按钮获取新的 `splash.img` 文件

## 注意事项

- 请确保使用正确的 `splash.img` 文件，错误的镜像可能导致设备无法正常启动
- 建议在修改前备份原始文件
- 部分设备可能需要解锁 bootloader 才能刷入自定义 splash 镜像

## License

AGPL-3.0
