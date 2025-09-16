# UK Meal Planner

![UK Meal Planner Logo](meal-planner/public/logo192.png)

A comprehensive meal planning application designed specifically for UK users, featuring barcode scanning, meal planning, nutrition tracking, and Fitbit integration.

## 🌟 Features

### Web Application
- **Barcode Scanning**: Quickly add food items by scanning barcodes
- **Meal Planning**: Plan meals for breakfast, lunch, dinner, and snacks
- **Ready Meals Management**: Track and manage ready meals with stock status
- **Recipe Management**: Create, store, and organize recipes
- **Nutrition Tracking**: Monitor calories, macros, and nutritional intake
- **Shopping List Generation**: Create shopping lists from meal plans or out-of-stock items
- **Fitbit Integration**: Sync your meals with Fitbit food tracking
- **Dark Mode**: Comfortable viewing experience in low-light conditions
- **Meal Rating System**: Rate and review your meals for future reference
- **Meal Suggestions**: Get personalized meal suggestions based on your ratings

### Android App
- **Offline Support**: Access your data even without internet connection
- **Barcode Scanning**: Use your phone's camera to scan food barcodes
- **Synchronization**: Automatically sync data when online
- **Push Notifications**: Get reminders for meals and shopping
- **Material Design**: Modern and responsive UI

## 📋 Table of Contents

- [Installation](#-installation)
- [Web Application Setup](#-web-application-setup)
- [Android App Setup](#-android-app-setup)
- [Database Setup](#-database-setup)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account
- Fitbit Developer account (for API access)
- Android Studio (for Android app development)

### Clone the Repository

```bash
git clone https://github.com/wjlander/foodplanning.git
cd foodplanning
```

## 💻 Web Application Setup

### Install Dependencies

```bash
cd meal-planner
npm install
```

### Environment Configuration

Create a `.env` file in the `meal-planner` directory:

```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_FITBIT_CLIENT_ID=your_fitbit_client_id
REACT_APP_FITBIT_REDIRECT_URI=your_fitbit_redirect_uri
```

### Development Server

```bash
npm start
```

The application will be available at `http://localhost:3000`.

### Building for Production

```bash
npm run build
```

## 📱 Android App Setup

### Prerequisites

- Android Studio
- JDK 11 or higher
- Android SDK
- React Native CLI

### Setup Instructions

1. Install React Native CLI:
   ```bash
   npm install -g react-native-cli
   ```

2. Install Android Studio and set up the Android SDK:
   - Download and install Android Studio from [developer.android.com](https://developer.android.com/studio)
   - During installation, make sure to select:
     - Android SDK
     - Android SDK Platform
     - Android Virtual Device
   - Set up environment variables:
     - Add `ANDROID_HOME` pointing to your Android SDK location
     - Add platform-tools to your PATH

3. Install dependencies:
   ```bash
   cd android-app
   npm install
   ```

4. Create a `.env` file in the `android-app` directory:
   ```
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. Start Metro Bundler:
   ```bash
   npx react-native start
   ```

6. Run the app on an Android device or emulator:
   ```bash
   npx react-native run-android
   ```

### Building the APK

1. Generate a signing key:
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Place the keystore file in `android/app` directory

3. Edit `android/gradle.properties` to add:
   ```
   MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
   MYAPP_RELEASE_KEY_ALIAS=my-key-alias
   MYAPP_RELEASE_STORE_PASSWORD=*****
   MYAPP_RELEASE_KEY_PASSWORD=*****
   ```

4. Build the release APK:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

5. The APK will be available at `android/app/build/outputs/apk/release/app-release.apk`

## 🗄️ Database Setup

The application uses Supabase as its database. Follow these steps to set up your database:

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. Execute the SQL scripts in the following order:
   - `database_schema.md` - Main database schema
   - `database_schema_updates.sql` - Updates for ready meals and stock status
   - `meal_rating_schema.sql` - Schema for meal rating system

### Database Schema Overview

The database includes tables for:
- Users and profiles
- Food items and recipes
- Ready meals
- Meal plans and meals
- Shopping lists
- Nutrition logs
- Fitbit sync logs
- Meal ratings

## 🚢 Deployment

### Web Application Deployment

#### Vercel Deployment (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy to Vercel:
   ```bash
   cd meal-planner
   vercel
   ```

3. For production deployment:
   ```bash
   vercel --prod
   ```

#### Netlify Deployment

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Deploy to Netlify:
   ```bash
   cd meal-planner
   netlify deploy
   ```

3. For production deployment:
   ```bash
   netlify deploy --prod
   ```

#### Manual Deployment

1. Build the application:
   ```bash
   cd meal-planner
   npm run build
   ```

2. Deploy the `build` directory to your web server

### Android App Deployment

#### Google Play Store

1. Create a Google Play Developer account
2. Generate a signed APK or App Bundle:
   ```bash
   cd android-app/android
   ./gradlew bundleRelease
   ```
3. Upload the AAB file to Google Play Console
4. Complete the store listing and release the app

#### Direct APK Distribution

1. Generate a signed APK:
   ```bash
   cd android-app/android
   ./gradlew assembleRelease
   ```
2. Distribute the APK file located at `android/app/build/outputs/apk/release/app-release.apk`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub or contact the maintainers.