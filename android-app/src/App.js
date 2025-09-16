import React, { useState, useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider, DefaultTheme, DarkTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import navigation
import AppNavigator from './navigation/AppNavigator';

// Import contexts
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { DatabaseProvider } from './context/DatabaseContext';

// Import services
import { initDatabase } from './services/databaseService';

// Ignore specific warnings
LogBox.ignoreLogs([
  'ReactNativeFiberHostComponent: Calling getNode() on the ref of an Animated component',
  'VirtualizedLists should never be nested inside plain ScrollViews',
]);

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize app
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        // Initialize database
        await initDatabase();
        
        // Check if user is logged in
        const token = await AsyncStorage.getItem('userToken');
        setUserToken(token);
        
        // Check theme preference
        const themeMode = await AsyncStorage.getItem('themeMode');
        setIsDarkMode(themeMode === 'dark');
      } catch (e) {
        console.error('Initialization error:', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  // Auth context
  const authContext = {
    signIn: async (token) => {
      try {
        await AsyncStorage.setItem('userToken', token);
        setUserToken(token);
      } catch (e) {
        console.error('Error storing token:', e);
      }
    },
    signOut: async () => {
      try {
        await AsyncStorage.removeItem('userToken');
        setUserToken(null);
      } catch (e) {
        console.error('Error removing token:', e);
      }
    },
    userToken,
  };

  // Theme context
  const themeContext = {
    toggleTheme: async () => {
      try {
        const newThemeMode = isDarkMode ? 'light' : 'dark';
        await AsyncStorage.setItem('themeMode', newThemeMode);
        setIsDarkMode(!isDarkMode);
      } catch (e) {
        console.error('Error toggling theme:', e);
      }
    },
    isDarkMode,
  };

  // Theme configuration
  const theme = isDarkMode ? {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: '#90caf9',
      accent: '#ce93d8',
    },
  } : {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: '#3498db',
      accent: '#f1c40f',
    },
  };

  if (isLoading) {
    // You could show a splash screen here
    return null;
  }

  return (
    <ThemeProvider value={themeContext}>
      <AuthProvider value={authContext}>
        <DatabaseProvider>
          <PaperProvider theme={theme}>
            <NavigationContainer theme={isDarkMode ? DarkTheme : DefaultTheme}>
              <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
              <AppNavigator />
            </NavigationContainer>
          </PaperProvider>
        </DatabaseProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;