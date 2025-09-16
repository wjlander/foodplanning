# UK Meal Planner Deployment Guide

This document provides detailed instructions for deploying both the web application and Android app for the UK Meal Planner project.

## Table of Contents

- [Database Setup](#database-setup)
- [Web Application Deployment](#web-application-deployment)
  - [Vercel Deployment](#vercel-deployment)
  - [Netlify Deployment](#netlify-deployment)
  - [AWS Amplify Deployment](#aws-amplify-deployment)
  - [Manual Deployment](#manual-deployment)
- [Android App Deployment](#android-app-deployment)
  - [Google Play Store](#google-play-store)
  - [Direct APK Distribution](#direct-apk-distribution)
- [Environment Variables](#environment-variables)
- [Continuous Integration/Continuous Deployment](#continuous-integrationcontinuous-deployment)
- [Monitoring and Analytics](#monitoring-and-analytics)
- [Troubleshooting](#troubleshooting)

## Database Setup

Before deploying the application, you need to set up the Supabase database:

1. **Create a Supabase Account**:
   - Go to [supabase.com](https://supabase.com) and sign up for an account
   - Create a new project

2. **Execute SQL Scripts**:
   - Navigate to the SQL Editor in your Supabase dashboard
   - Execute the following SQL scripts in order:
     1. `database_schema.md` - Main database schema
     2. `database_schema_updates.sql` - Updates for ready meals and stock status
     3. `meal_rating_schema.sql` - Schema for meal rating system

3. **Set Up Row-Level Security**:
   - Ensure all tables have RLS enabled
   - Verify that the policies are correctly set up to restrict access to user data

4. **Create API Keys**:
   - Go to Project Settings > API
   - Note your project URL and anon/public key for environment variables

## Web Application Deployment

### Vercel Deployment

Vercel is recommended for its simplicity and integration with React applications.

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy the Application**:
   ```bash
   cd meal-planner
   vercel
   ```

4. **Configure Environment Variables**:
   - In the Vercel dashboard, go to your project
   - Navigate to Settings > Environment Variables
   - Add the required environment variables (see [Environment Variables](#environment-variables))

5. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

6. **Set Up Custom Domain** (Optional):
   - In the Vercel dashboard, go to your project
   - Navigate to Settings > Domains
   - Add your custom domain and follow the verification steps

### Netlify Deployment

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Initialize Netlify Configuration**:
   ```bash
   cd meal-planner
   netlify init
   ```

4. **Configure Environment Variables**:
   - In the Netlify dashboard, go to your site
   - Navigate to Site settings > Build & deploy > Environment
   - Add the required environment variables

5. **Deploy to Production**:
   ```bash
   netlify deploy --prod
   ```

6. **Set Up Custom Domain** (Optional):
   - In the Netlify dashboard, go to your site
   - Navigate to Site settings > Domain management
   - Add your custom domain and follow the verification steps

### AWS Amplify Deployment

1. **Install AWS Amplify CLI**:
   ```bash
   npm install -g @aws-amplify/cli
   ```

2. **Configure AWS Amplify**:
   ```bash
   amplify configure
   ```

3. **Initialize Amplify in Your Project**:
   ```bash
   cd meal-planner
   amplify init
   ```

4. **Add Hosting**:
   ```bash
   amplify add hosting
   ```

5. **Deploy the Application**:
   ```bash
   amplify publish
   ```

6. **Configure Environment Variables**:
   - In the AWS Amplify Console, go to your app
   - Navigate to App settings > Environment variables
   - Add the required environment variables

### Manual Deployment

1. **Build the Application**:
   ```bash
   cd meal-planner
   npm run build
   ```

2. **Deploy to Web Server**:
   - Copy the contents of the `build` directory to your web server's public directory
   - For Apache, ensure you have a `.htaccess` file for SPA routing:
     ```
     <IfModule mod_rewrite.c>
       RewriteEngine On
       RewriteBase /
       RewriteRule ^index\.html$ - [L]
       RewriteCond %{REQUEST_FILENAME} !-f
       RewriteCond %{REQUEST_FILENAME} !-d
       RewriteRule . /index.html [L]
     </IfModule>
     ```
   - For Nginx, configure your server block:
     ```
     location / {
       try_files $uri $uri/ /index.html;
     }
     ```

3. **Set Up Environment Variables**:
   - Create a `.env` file on your server
   - Add the required environment variables
   - Ensure the file is not accessible from the web

## Android App Deployment

### Google Play Store

1. **Create a Google Play Developer Account**:
   - Go to [play.google.com/apps/publish](https://play.google.com/apps/publish)
   - Sign up for a developer account ($25 one-time fee)

2. **Prepare Your App**:
   - Update `android-app/android/app/build.gradle` with your app details:
     ```gradle
     android {
         defaultConfig {
             applicationId "com.yourdomain.ukmealplanner"
             versionCode 1
             versionName "1.0.0"
         }
     }
     ```

3. **Generate a Signing Key**:
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

4. **Configure Gradle for Signing**:
   - Place the keystore file in `android-app/android/app`
   - Edit `android-app/android/gradle.properties`:
     ```
     MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
     MYAPP_RELEASE_KEY_ALIAS=my-key-alias
     MYAPP_RELEASE_STORE_PASSWORD=*****
     MYAPP_RELEASE_KEY_PASSWORD=*****
     ```
   - Update `android-app/android/app/build.gradle`:
     ```gradle
     android {
         signingConfigs {
             release {
                 storeFile file(MYAPP_RELEASE_STORE_FILE)
                 storePassword MYAPP_RELEASE_STORE_PASSWORD
                 keyAlias MYAPP_RELEASE_KEY_ALIAS
                 keyPassword MYAPP_RELEASE_KEY_PASSWORD
             }
         }
         buildTypes {
             release {
                 signingConfig signingConfigs.release
             }
         }
     }
     ```

5. **Generate App Bundle**:
   ```bash
   cd android-app/android
   ./gradlew bundleRelease
   ```

6. **Upload to Google Play Console**:
   - Go to [play.google.com/apps/publish](https://play.google.com/apps/publish)
   - Create a new application
   - Navigate to Production > Create new release
   - Upload the AAB file from `android-app/android/app/build/outputs/bundle/release/app-release.aab`
   - Complete the store listing, content rating, and pricing & distribution
   - Submit for review

### Direct APK Distribution

1. **Generate Signed APK**:
   ```bash
   cd android-app/android
   ./gradlew assembleRelease
   ```

2. **Distribute the APK**:
   - The APK will be available at `android-app/android/app/build/outputs/apk/release/app-release.apk`
   - Upload the APK to your website or file sharing service
   - Provide instructions for users to enable "Install from Unknown Sources" in their device settings

## Environment Variables

### Web Application

Create a `.env` file in the `meal-planner` directory with the following variables:

```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_FITBIT_CLIENT_ID=your_fitbit_client_id
REACT_APP_FITBIT_REDIRECT_URI=your_fitbit_redirect_uri
```

### Android App

Create a `.env` file in the `android-app` directory with the following variables:

```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Continuous Integration/Continuous Deployment

### GitHub Actions

1. **Create a GitHub Actions Workflow File**:
   - Create a file at `.github/workflows/deploy.yml`:
     ```yaml
     name: Deploy

     on:
       push:
         branches: [ main ]

     jobs:
       deploy-web:
         runs-on: ubuntu-latest
         steps:
           - uses: actions/checkout@v2
           - name: Setup Node.js
             uses: actions/setup-node@v2
             with:
               node-version: '16'
           - name: Install dependencies
             run: cd meal-planner && npm ci
           - name: Build
             run: cd meal-planner && npm run build
           - name: Deploy to Vercel
             uses: amondnet/vercel-action@v20
             with:
               vercel-token: ${{ secrets.VERCEL_TOKEN }}
               vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
               vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
               working-directory: ./meal-planner
               vercel-args: '--prod'
     ```

2. **Set Up GitHub Secrets**:
   - Go to your GitHub repository
   - Navigate to Settings > Secrets
   - Add the required secrets for your deployment platform

### Vercel Integration

1. **Connect Vercel to GitHub**:
   - In the Vercel dashboard, click "New Project"
   - Import your GitHub repository
   - Configure project settings
   - Deploy

## Monitoring and Analytics

### Google Analytics

1. **Create a Google Analytics Account**:
   - Go to [analytics.google.com](https://analytics.google.com)
   - Create a new property

2. **Add Tracking Code to Web App**:
   - In `meal-planner/public/index.html`, add:
     ```html
     <script async src="https://www.googletagmanager.com/gtag/js?id=YOUR_TRACKING_ID"></script>
     <script>
       window.dataLayer = window.dataLayer || [];
       function gtag(){dataLayer.push(arguments);}
       gtag('js', new Date());
       gtag('config', 'YOUR_TRACKING_ID');
     </script>
     ```

### Error Monitoring with Sentry

1. **Create a Sentry Account**:
   - Go to [sentry.io](https://sentry.io)
   - Create a new project

2. **Install Sentry SDK**:
   ```bash
   cd meal-planner
   npm install @sentry/react @sentry/tracing
   ```

3. **Initialize Sentry**:
   - In `meal-planner/src/index.js`, add:
     ```javascript
     import * as Sentry from "@sentry/react";
     import { BrowserTracing } from "@sentry/tracing";

     Sentry.init({
       dsn: "YOUR_SENTRY_DSN",
       integrations: [new BrowserTracing()],
       tracesSampleRate: 1.0,
     });
     ```

## Troubleshooting

### Common Issues and Solutions

#### Web Application

1. **Blank Page After Deployment**:
   - Check if environment variables are correctly set
   - Verify that the build process completed successfully
   - Check browser console for errors

2. **API Connection Issues**:
   - Ensure Supabase URL and key are correct
   - Check CORS settings in Supabase

3. **Authentication Problems**:
   - Verify Supabase authentication settings
   - Check redirect URLs in authentication providers

#### Android App

1. **App Crashes on Launch**:
   - Check Android logs using `adb logcat`
   - Verify that environment variables are correctly set
   - Ensure all native dependencies are properly linked

2. **Barcode Scanner Not Working**:
   - Check camera permissions
   - Verify that the device has a compatible camera
   - Test with different barcode formats

3. **Sync Issues**:
   - Check network connectivity
   - Verify that the Supabase URL and key are correct
   - Check local database initialization

### Getting Help

If you encounter issues not covered here, please:
1. Check the GitHub repository issues
2. Create a new issue with detailed information about the problem
3. Contact the maintainers for urgent issues