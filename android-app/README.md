# UK Meal Planner - Android App

This is the Android version of the UK Meal Planner application, built with React Native.

## Features

- Barcode scanning for quick food entry
- Offline support for meal planning
- Push notifications for meal reminders
- Synchronization with the web application
- Dark mode support
- Material Design UI

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Android Studio
- JDK 11
- Android SDK

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with your Supabase and API credentials:
   ```
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start the development server:
   ```
   npm start
   ```
5. Run on Android:
   ```
   npm run android
   ```

## Project Structure

```
android-app/
├── android/                # Android native code
├── ios/                    # iOS native code
├── src/
│   ├── api/                # API services
│   ├── components/         # Reusable components
│   ├── context/            # React context providers
│   ├── hooks/              # Custom React hooks
│   ├── navigation/         # Navigation configuration
│   ├── screens/            # Screen components
│   ├── services/           # Business logic services
│   ├── styles/             # Global styles
│   ├── utils/              # Utility functions
│   ├── App.js              # Main application component
│   └── index.js            # Application entry point
├── .env                    # Environment variables
├── app.json                # Application configuration
├── babel.config.js         # Babel configuration
├── index.js                # Entry point
├── metro.config.js         # Metro bundler configuration
└── package.json            # Project dependencies
```

## Barcode Scanning

The app uses the `react-native-camera` and `react-native-vision-camera` libraries for barcode scanning. The scanning functionality is implemented in the `BarcodeScanner` component.

### How to Use Barcode Scanning

1. Navigate to the "Scan" tab in the app
2. Point your camera at a barcode
3. The app will automatically detect and scan the barcode
4. The food item will be looked up in the database
5. You can add the food item to your meal plan

## Offline Support

The app uses a local SQLite database to store data when offline. When the device is back online, the data is synchronized with the Supabase backend.

### Synchronization Process

1. Local changes are stored in the SQLite database
2. When the device is online, the app checks for pending changes
3. Changes are sent to the Supabase backend
4. The local database is updated with the latest data from the backend

## Push Notifications

The app uses Firebase Cloud Messaging (FCM) for push notifications. Notifications are sent for:

- Meal reminders
- New features or updates
- Synchronization status

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.