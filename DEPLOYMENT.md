# Deployment Guide

This guide covers deployment options for Judy's Cafe application.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Build Process](#build-process)
- [Deployment Platforms](#deployment-platforms)
  - [Vercel (Recommended)](#vercel-recommended)
  - [Netlify](#netlify)
  - [GitHub Pages](#github-pages)
  - [AWS S3 + CloudFront](#aws-s3--cloudfront)
  - [Docker](#docker)
- [Environment Variables](#environment-variables)
- [Custom Domain Setup](#custom-domain-setup)
- [Monitoring and Analytics](#monitoring-and-analytics)

## Prerequisites

- Node.js 18+ installed
- Git repository on GitHub
- Account on chosen deployment platform

## Build Process

Before deploying, ensure your application builds successfully:

```bash
# Install dependencies
npm install

# Run tests
npm run test:unit

# Type checking
npm run type-check

# Lint code
npm run lint

# Build for production
npm run build

# Preview build locally
npm run preview
```

## Deployment Platforms

### Vercel (Recommended)

Vercel offers excellent Vue.js support with zero configuration.

#### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/judys-cafe)

#### Manual Deployment

1. **Install Vercel CLI**

   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**

   ```bash
   vercel login
   ```

3. **Deploy**

   ```bash
   vercel
   ```

4. **Production Deployment**
   ```bash
   vercel --prod
   ```

#### Configuration

Create `vercel.json` in project root:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install"
}
```

### Netlify

1. **Connect Repository**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Choose your repository

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18.x`

3. **Deploy**
   - Click "Deploy site"

#### Configuration

Create `netlify.toml` in project root:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### GitHub Pages

1. **Enable GitHub Pages**
   - Go to repository Settings
   - Scroll to "Pages" section
   - Choose "GitHub Actions" as source

2. **Update Workflow**
   The provided `.github/workflows/ci.yml` includes deployment steps.

3. **Update Base URL**
   Update `vite.config.ts`:
   ```typescript
   export default defineConfig({
     base: '/judys-cafe/', // Your repository name
     // ... other config
   })
   ```

### AWS S3 + CloudFront

1. **Create S3 Bucket**

   ```bash
   aws s3 mb s3://judys-cafe-app
   ```

2. **Configure Static Website Hosting**

   ```bash
   aws s3 website s3://judys-cafe-app \
     --index-document index.html \
     --error-document index.html
   ```

3. **Build and Upload**

   ```bash
   npm run build
   aws s3 sync dist/ s3://judys-cafe-app --delete
   ```

4. **Create CloudFront Distribution**
   ```bash
   aws cloudfront create-distribution \
     --distribution-config file://cloudfront-config.json
   ```

### Docker

#### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine as build-stage

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine as production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '80:80'
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

#### Build and Run

```bash
# Build image
docker build -t judys-cafe .

# Run container
docker run -p 8080:80 judys-cafe

# Or use Docker Compose
docker-compose up -d
```

## Environment Variables

### Development

Create `.env.local`:

```env
VITE_APP_ENVIRONMENT=development
VITE_DEV_SERVER_PORT=5173
```

### Production

Set environment variables in your deployment platform:

- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Environment Variables
- **GitHub Pages**: Repository Settings → Secrets and Variables

Required variables:

```env
VITE_APP_ENVIRONMENT=production
VITE_APP_NAME="Judy's Cafe"
VITE_APP_VERSION="1.0.0"
```

## Custom Domain Setup

### Vercel

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

### Netlify

1. Go to Site Settings → Domain Management
2. Add custom domain
3. Update DNS records

### CloudFront

1. Request SSL certificate in AWS Certificate Manager
2. Create Route 53 hosted zone
3. Update CloudFront distribution with custom domain

## Monitoring and Analytics

### Error Tracking

Add error tracking service (Sentry example):

```typescript
// main.ts
import * as Sentry from '@sentry/vue'

if (import.meta.env.PROD) {
  Sentry.init({
    app,
    dsn: 'YOUR_SENTRY_DSN',
    environment: import.meta.env.VITE_APP_ENVIRONMENT,
  })
}
```

### Performance Monitoring

Add performance monitoring:

```typescript
// Add to vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          ui: ['@heroicons/vue'],
        },
      },
    },
  },
})
```

### Analytics

Add Google Analytics:

```html
<!-- index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || []
  function gtag() {
    dataLayer.push(arguments)
  }
  gtag('js', new Date())
  gtag('config', 'GA_MEASUREMENT_ID')
</script>
```

## Troubleshooting

### Common Issues

1. **Build Fails**
   - Check Node.js version
   - Clear `node_modules` and reinstall
   - Ensure all environment variables are set

2. **Routes Don't Work**
   - Configure server redirects for SPA
   - Update base URL in `vite.config.ts`

3. **Assets Not Loading**
   - Check public path configuration
   - Verify asset references are correct

### Performance Optimization

1. **Code Splitting**

   ```typescript
   // router/index.ts
   const routes = [
     {
       path: '/dashboard',
       component: () => import('../views/DashboardView.vue'),
     },
   ]
   ```

2. **Asset Optimization**
   ```typescript
   // vite.config.ts
   export default defineConfig({
     build: {
       assetsInlineLimit: 4096,
       cssCodeSplit: true,
     },
   })
   ```

## Security Considerations

1. **Environment Variables**
   - Never commit sensitive data
   - Use VITE\_ prefix for client-side variables
   - Validate environment in CI/CD

2. **Content Security Policy**

   ```html
   <meta
     http-equiv="Content-Security-Policy"
     content="default-src 'self'; script-src 'self' 'unsafe-inline';"
   />
   ```

3. **HTTPS**
   - Always use HTTPS in production
   - Configure HSTS headers
   - Use secure cookies

For more detailed deployment instructions, refer to your chosen platform's documentation.
