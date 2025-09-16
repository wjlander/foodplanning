# Android App Setup Guide

This guide provides detailed instructions for setting up the development environment for the UK Meal Planner Android app.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
  - [Node.js and npm](#nodejs-and-npm)
  - [Java Development Kit (JDK)](#java-development-kit-jdk)
  - [Android Studio](#android-studio)
  - [Android SDK](#android-sdk)
  - [Environment Variables](#environment-variables)
- [Project Setup](#project-setup)
  - [Clone the Repository](#clone-the-repository)
  - [Install Dependencies](#install-dependencies)
  - [Configure Environment Variables](#configure-environment-variables)
- [Running the App](#running-the-app)
  - [Using Android Studio](#using-android-studio)
  - [Using Command Line](#using-command-line)
  - [On a Physical Device](#on-a-physical-device)
  - [On an Emulator](#on-an-emulator)
- [Debugging](#debugging)
  - [React Native Debugger](#react-native-debugger)
  - [Chrome DevTools](#chrome-devtools)
  - [Flipper](#flipper)
- [Common Issues](#common-issues)
- [Additional Resources](#additional-resources)

## Prerequisites

Before you begin, ensure you have the following:

- A computer running Windows, macOS, or Linux
- Internet connection
- Basic knowledge of React Native and Android development
- GitHub account with access to the repository

## Environment Setup

### Node.js and npm

1. **Install Node.js and npm**:
   - Download and install from [nodejs.org](https://nodejs.org/)
   - Recommended version: Node.js 16.x or higher
   - Verify installation:
     ```bash
     node --version
     npm --version
     ```

### Java Development Kit (JDK)

1. **Install JDK 11**:
   - Download and install from [Oracle](https://www.oracle.com/java/technologies/javase-jdk11-downloads.html) or use OpenJDK
   - Verify installation:
     ```bash
     java --version
     ```

### Android Studio

1. **Install Android Studio**:
   - Download from [developer.android.com](https://developer.android.com/studio)
   - During installation, select:
     - Android SDK
     - Android SDK Platform
     - Android Virtual Device
     - Performance (Intel HAXM)

2. **Configure Android Studio**:
   - Launch Android Studio
   - Complete the setup wizard
   - Go to SDK Manager (Preferences > Appearance & Behavior > System Settings > Android SDK)
   - Install the following:
     - Android SDK Platform 31 (Android 12) or newer
     - Android SDK Build-Tools 31.0.0 or newer
     - Android SDK Command-line Tools
     - Android Emulator
     - Android SDK Platform-Tools

### Android SDK

1. **Set Android SDK Location**:
   - Note the location of your Android SDK (shown in SDK Manager)
   - Default locations:
     - Windows: `C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk`
     - macOS: `~/Library/Android/sdk`
     - Linux: `~/Android/Sdk`

### Environment Variables

1. **Set Up Environment Variables**:

   **For Windows**:
   - Open System Properties > Advanced > Environment Variables
   - Add new User variables:
     - ANDROID_HOME: path to your Android SDK
     - Add to PATH:
       - %ANDROID_HOME%\platform-tools
       - %ANDROID_HOME%\emulator
       - %ANDROID_HOME%\tools
       - %ANDROID_HOME%\tools\bin

   **For macOS/Linux**:
   - Edit your shell profile file (~/.bash_profile, ~/.zshrc, etc.):
     ```bash
     export ANDROID_HOME=$HOME/Library/Android/sdk
     export PATH=$PATH:$ANDROID_HOME/emulator
     export PATH=$PATH:$ANDROID_HOME/platform-tools
     export PATH=$PATH:$ANDROID_HOME/tools
     export PATH=$PATH:$ANDROID_HOME/tools/bin
     ```
   - Apply changes:
     ```bash
     source ~/.bash_profile  # or ~/.zshrc
     ```

2. **Verify Environment Variables**:
   ```bash
   echo $ANDROID_HOME
   adb --version
   ```

## Project Setup

### Clone the Repository

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/wjlander/foodplanning.git
   cd foodplanning/android-app
   ```

### Install Dependencies

1. **Install React Native CLI** (if not already installed):
   ```bash
   npm install -g react-native-cli
   ```

2. **Install Project Dependencies**:
   ```bash
   npm install
   ```

### Configure Environment Variables

1. **Create Environment File**:
   - Create a `.env` file in the `android-app` directory:
     ```
     REACT_APP_SUPABASE_URL=your_supabase_url
     REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

## Running the App

### Using Android Studio

1. **Open the Android Project**:
   - Open Android Studio
   - Select "Open an existing Android Studio project"
   - Navigate to `foodplanning/android-app/android` and select it

2. **Run the App**:
   - Select a device or emulator
   - Click the "Run" button (green triangle)

### Using Command Line

1. **Start Metro Bundler**:
   ```bash
   npx react-native start
   ```

2. **Run the App**:
   ```bash
   npx react-native run-android
   ```

### On a Physical Device

1. **Enable Developer Options**:
   - Go to Settings > About phone
   - Tap "Build number" 7 times to enable developer options
   - Go back to Settings > System > Developer options
   - Enable "USB debugging"

2. **Connect Your Device**:
   - Connect your device to your computer via USB
   - Allow USB debugging when prompted on your device
   - Verify connection:
     ```bash
     adb devices
     ```

3. **Run the App**:
   ```bash
   npx react-native run-android
   ```

### On an Emulator

1. **Create an Android Virtual Device (AVD)**:
   - Open Android Studio
   - Go to AVD Manager (Tools > AVD Manager)
   - Click "Create Virtual Device"
   - Select a device definition (e.g., Pixel 4)
   - Select a system image (e.g., Android 12)
   - Complete the AVD creation

2. **Start the Emulator**:
   - In AVD Manager, click the play button next to your AVD
   - Wait for the emulator to start

3. **Run the App**:
   ```bash
   npx react-native run-android
   ```

## Debugging

### React Native Debugger

1. **Install React Native Debugger**:
   - Download from [github.com/jhen0409/react-native-debugger](https://github.com/jhen0409/react-native-debugger/releases)
   - Install and launch

2. **Connect to Debugger**:
   - In your app, shake the device or press `Cmd+M` (macOS) or `Ctrl+M` (Windows/Linux) in the emulator
   - Select "Debug"
   - The React Native Debugger should connect automatically

### Chrome DevTools

1. **Enable Remote Debugging**:
   - In your app, shake the device or press `Cmd+M` (macOS) or `Ctrl+M` (Windows/Linux) in the emulator
   - Select "Debug"

2. **Open Chrome DevTools**:
   - Open Chrome and navigate to `chrome://inspect`
   - Your app should appear under "Remote Target"
   - Click "inspect"

### Flipper

1. **Install Flipper**:
   - Download from [fbflipper.com](https://fbflipper.com/)
   - Install and launch

2. **Connect to Flipper**:
   - Run your app
   - Flipper should automatically detect and connect to your app
   - Use various plugins for debugging (Network, Logs, etc.)

## Common Issues

### App Build Fails

**Issue**: Gradle build fails with errors.

**Solution**:
1. Check your JDK version (should be JDK 11)
2. Ensure all environment variables are correctly set
3. Try cleaning the project:
   ```bash
   cd android
   ./gradlew clean
   ```

### Cannot Connect to Metro Bundler

**Issue**: App fails to connect to Metro bundler.

**Solution**:
1. Ensure Metro is running (`npx react-native start`)
2. Check if your device/emulator can access your development machine
3. Try resetting the cache:
   ```bash
   npx react-native start --reset-cache
   ```

### Native Module Cannot Be Found

**Issue**: Error about missing native modules.

**Solution**:
1. Ensure all dependencies are installed:
   ```bash
   npm install
   ```
2. Link native modules:
   ```bash
   npx react-native link
   ```
3. Rebuild the app:
   ```bash
   npx react-native run-android
   ```

### Camera Permission Issues

**Issue**: Barcode scanner doesn't work due to permission issues.

**Solution**:
1. Check `AndroidManifest.xml` for camera permission:
   ```xml
   <uses-permission android:name="android.permission.CAMERA" />
   ```
2. Ensure your app requests permissions at runtime
3. On device, go to Settings > Apps > Your App > Permissions and grant camera access

## Additional Resources

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Android Developer Documentation](https://developer.android.com/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [React Native Camera Documentation](https://react-native-camera.github.io/react-native-camera/)
- [React Native Vision Camera Documentation](https://mrousavy.com/react-native-vision-camera/)