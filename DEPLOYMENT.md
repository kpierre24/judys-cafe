# Deployment Guide for Judy's Cafe

This guide will walk you through deploying Judy's Cafe to Supabase (backend) and Vercel (frontend).

## Prerequisites

- [Supabase account](https://supabase.com/)
- [Vercel account](https://vercel.com/)
- [GitHub account](https://github.com/) (for CI/CD)
- **Node.js 20.19+ or 22.12+** installed locally (required for Vite 7+)

## 🗄️ Step 1: Set up Supabase Database

### 1.1 Create a New Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `judys-cafe`
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

### 1.2 Configure the Database

1. Wait for your project to be ready (2-3 minutes)
2. Go to the **SQL Editor** in your Supabase dashboard
3. Copy the contents of `database/schema.sql` from this repository
4. Paste it into the SQL Editor and run it
5. This will create all necessary tables, indexes, and policies

### 1.3 Get Your Supabase Credentials

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

### 1.4 Set up Authentication (Optional)

If you want to enable user authentication:
1. Go to **Authentication** → **Settings**
2. Configure your authentication providers
3. Set up email templates if using email auth

## 🚀 Step 2: Deploy to Vercel

### 2.1 Prepare Your Repository

1. Ensure your code is pushed to GitHub
2. Make sure all dependencies are installed and the project builds locally:
   ```bash
   npm install
   npm run build
   ```

### 2.2 Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect it's a Vite project

### 2.3 Configure Environment Variables

In Vercel project settings, add these environment variables:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_NAME=Judy's Cafe
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production
```

### 2.4 Deploy

1. Click "Deploy"
2. Vercel will build and deploy your application
3. You'll get a deployment URL (e.g., `https://judys-cafe.vercel.app`)

## 🔄 Step 3: Set up CI/CD (Optional but Recommended)

### 3.1 GitHub Secrets

Add these secrets to your GitHub repository:
1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Add the following secrets:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VERCEL_TOKEN=your-vercel-token
ORG_ID=your-vercel-org-id
PROJECT_ID=your-vercel-project-id
```

### 3.2 Get Vercel Credentials

1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Create a new token and copy it (this is your `VERCEL_TOKEN`)
3. Go to your project settings in Vercel
4. Copy the Project ID and Organization ID

### 3.3 GitHub Actions Workflow

The workflow file is already created at `.github/workflows/ci-cd.yml`. This will:
- Run ESLint and Prettier checks
- Run TypeScript validation
- Run tests
- Build the application
- Deploy to Vercel (on main branch)

## 🏠 Step 4: Local Development Setup

### 4.1 Environment Variables

1. Copy `.env.local.template` to `.env.local`
2. Fill in your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_APP_NAME=Judy's Cafe
   VITE_APP_VERSION=1.0.0
   VITE_APP_ENVIRONMENT=development
   ```

### 4.2 Install Dependencies and Run

```bash
npm install
npm run dev
```

## 🔧 Step 5: Post-Deployment Configuration

### 5.1 Custom Domain (Optional)

1. In Vercel, go to your project settings
2. Go to "Domains"
3. Add your custom domain
4. Follow Vercel's instructions to configure DNS

### 5.2 Performance Monitoring

1. Enable Vercel Analytics in your project settings
2. Consider adding error tracking (Sentry, etc.)

### 5.3 Database Backups

1. In Supabase, go to **Settings** → **Database**
2. Enable automated backups
3. Consider setting up additional backup strategies for production

## 🛠️ Troubleshooting

### Common Issues

1. **Node.js Version Error ("Vite requires Node.js version 20.19+ or 22.12+")**
   - **Problem**: Deployment fails with Node.js version error and `crypto.hash is not a function`
   - **Solution**: 
     - Ensure your GitHub Actions workflow uses Node.js 20+ (already configured)
     - For Vercel: The deployment should automatically use Node.js 20 (configured in vercel.json)
     - For local development: Use Node Version Manager (nvm):
       ```bash
       # Install Node.js 20.19.0
       nvm install 20.19.0
       nvm use 20.19.0
       ```
     - Check `.nvmrc` file is present in your project root
   - **Verification**: Run `node --version` to confirm version is 20.19+ or 22.12+

2. **Build Fails**
   - Check environment variables are set correctly
   - Ensure TypeScript errors are fixed locally first
   - Check Vercel build logs

2. **Database Connection Issues**
   - Verify Supabase URL and key are correct
   - Check if RLS policies are correctly configured
   - Ensure your domain is whitelisted in Supabase

3. **Authentication Issues**
   - Check Supabase Auth configuration
   - Verify redirect URLs in Supabase settings
   - Ensure proper RLS policies for user access

### Performance Tips

1. **Optimize Images**: Use Vercel's automatic image optimization
2. **Enable Caching**: Configure proper cache headers
3. **Bundle Analysis**: Use `npm run build` and analyze bundle size
4. **Database Optimization**: Add proper indexes for frequently queried data

## 📊 Monitoring and Analytics

### Vercel Analytics
- Enable in project settings for traffic insights
- Monitor Core Web Vitals

### Supabase Dashboard
- Monitor database performance
- Check API usage and limits
- Review authentication metrics

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env.local` to version control
2. **RLS Policies**: Review and customize database policies for your use case
3. **HTTPS**: Always use HTTPS in production (Vercel provides this automatically)
4. **API Keys**: Regularly rotate your Supabase keys
5. **CORS**: Configure proper CORS settings in Supabase

## 📈 Scaling Considerations

1. **Database**: Supabase offers different pricing tiers for scaling
2. **CDN**: Vercel's global CDN handles frontend scaling
3. **Caching**: Implement proper caching strategies
4. **Database Optimization**: Add indexes, optimize queries as needed

## 🆘 Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Vue.js Documentation](https://vuejs.org/guide/)
- [Vite Documentation](https://vitejs.dev/guide/)

## 🔄 Updating Your Deployment

1. Push changes to your main branch
2. GitHub Actions will automatically build and deploy
3. Alternatively, trigger manual deployments in Vercel dashboard
4. Database schema changes require manual SQL execution in Supabase

---

**Note**: This deployment setup provides a production-ready foundation. Customize the configuration based on your specific requirements and scale as needed.
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
