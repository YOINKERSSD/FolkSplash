# FolkSplash

Visual tool for OPPO/Realme/OnePlus device `splash.img` boot logo images

**[🇺🇸 English](README.en.md)** | **[🇨🇳 简体中文](README.md)**

## Technology Stack

- **Framework**: React 19.2 + TypeScript 5.9
- **Build Tool**: Vite 7.3
- **UI Library**: Material-UI (MUI) 7.3
- **State Management**: Zustand 5.0
- **Internationalization**: i18next + react-i18next
- **Image Processing**: 
  - Pako 2.1 (Gzip compression/decompression)
  - Custom BMP encoding/decoding
- **Code Quality**: ESLint 9 + TypeScript ESLint

## Features

- Unpack `splash.img` boot image files
- View and replace boot animation images (supports PNG/JPG/BMP formats)
- Multiple resolution adaptation modes:
  - **Direct Upload**: Upload original image without any conversion
  - **Follow Original Resolution**: Maintain original image dimensions with auto-fit
  - **Auto Adapt**: Automatically adjust based on device maximum resolution
  - **Custom Resolution**: Manually specify width and height
- Pack and download new `splash.img` image
- Support for OPPO/Realme/OnePlus devices
- Bilingual interface (Chinese and English)

## Device Compatibility

> **Important**: This tool only supports devices with **Qualcomm Snapdragon** processors. Devices with MediaTek or other platforms are not supported.

## Project Structure

```
opsplash-web/
├── src/
│   ├── components/       # React components
│   │   ├── FileUpload.tsx    # File upload component
│   │   ├── ImageGallery.tsx  # Image list component
│   │   ├── ImageCard.tsx     # Image card component
│   │   ├── PackButton.tsx    # Pack button component
│   │   ├── InfoBar.tsx       # Info bar component
│   │   ├── Layout.tsx        # Layout component
│   │   └── AboutPage.tsx     # About page
│   ├── lib/              # Utility libraries
│   │   ├── types.ts          # TypeScript type definitions
│   │   ├── splash-parser.ts  # splash.img parser
│   │   ├── splash-packer.ts  # splash.img packer
│   │   ├── bmp.ts            # BMP encoding/decoding
│   │   ├── gzip.ts           # Gzip compression/decompression
│   │   ├── utils.ts          # Common utility functions
│   │   └── debug-compress.ts # Debug utilities
│   ├── store/            # Zustand state management
│   │   └── useSplashStore.ts
│   ├── i18n/             # i18n configuration
│   │   ├── index.ts
│   │   └── locales/          # Language files
│   │       ├── zh.json
│   │       └── en.json
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── public/               # Static assets
├── index.html            # HTML template
├── package.json          # Project configuration
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
└── eslint.config.js      # ESLint configuration
```

## Development Requirements

- Node.js >= 18
- pnpm >= 8 (recommended)

## Installation and Deployment

### 1. Clone the repository

```bash
git clone <repository-url>
cd opsplash-web
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Development mode

```bash
pnpm dev
```

Access http://localhost:5173 after startup

### 4. Build production version

```bash
pnpm build
```

Build output goes to `dist/` directory

### 5. Preview production build

```bash
pnpm preview
```

### 6. Code quality checks

```bash
# ESLint check
pnpm lint

# TypeScript type check
pnpm exec tsc --noEmit
```

## Production Deployment

### Static Hosting

The built `dist/` directory can be deployed to any static file hosting service:

- **Vercel**: Connect GitHub repository for automatic deployment
- **Netlify**: Drag and drop `dist/` directory or connect Git
- **GitHub Pages**: Use GitHub Actions for automatic deployment
- **Nginx**: Configure static file serving

### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

### Docker Deployment

Create `Dockerfile`:

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

Build and run:

```bash
docker build -t folksplash .
docker run -p 80:80 folksplash
```

## Usage

1. **Upload splash.img**: Click or drag and drop the `splash.img` file from your OPPO/Realme/OnePlus device
2. **Preview images**: View all unpacked boot animation images
3. **Replace images**: Click any image card to select a new image file for replacement
4. **Set resolution**: Choose the resolution adaptation mode as needed
5. **Pack and download**: Click "Pack & Download" button to get the new `splash.img` file

## Notes

- Ensure you use the correct `splash.img` file; incorrect images may prevent device from booting properly
- Backup the original file before making modifications
- Some devices may require unlocked bootloader to flash custom splash images

## License

AGPL-3.0
