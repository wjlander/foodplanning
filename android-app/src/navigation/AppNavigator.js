import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import MealPlannerScreen from '../screens/MealPlannerScreen';
import BarcodeScannerScreen from '../screens/BarcodeScannerScreen';
import FoodDatabaseScreen from '../screens/FoodDatabaseScreen';
import RecipesScreen from '../screens/RecipesScreen';
import ReadyMealsScreen from '../screens/ReadyMealsScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import FoodDetailScreen from '../screens/FoodDetailScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import ReadyMealDetailScreen from '../screens/ReadyMealDetailScreen';
import AddFoodScreen from '../screens/AddFoodScreen';
import AddRecipeScreen from '../screens/AddRecipeScreen';
import AddReadyMealScreen from '../screens/AddReadyMealScreen';

// Import auth context
import { useAuth } from '../context/AuthContext';

// Create navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main tab navigator
const MainTabNavigator = () => {
  const theme = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        },
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Meal Planner"
        component={MealPlannerScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Scan"
        component={BarcodeScannerScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="barcode-scan" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Foods"
        component={FoodNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="food-apple" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Food navigator (nested stack)
const FoodNavigator = () => {
  const theme = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
      }}
    >
      <Stack.Screen name="Food Database" component={FoodDatabaseScreen} />
      <Stack.Screen name="Recipes" component={RecipesScreen} />
      <Stack.Screen name="Ready Meals" component={ReadyMealsScreen} />
      <Stack.Screen name="Shopping List" component={ShoppingListScreen} />
      <Stack.Screen name="Food Detail" component={FoodDetailScreen} />
      <Stack.Screen name="Recipe Detail" component={RecipeDetailScreen} />
      <Stack.Screen name="Ready Meal Detail" component={ReadyMealDetailScreen} />
      <Stack.Screen name="Add Food" component={AddFoodScreen} />
      <Stack.Screen name="Add Recipe" component={AddRecipeScreen} />
      <Stack.Screen name="Add Ready Meal" component={AddReadyMealScreen} />
    </Stack.Navigator>
  );
};

// Auth navigator
const AuthNavigator = () => {
  const theme = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

// Root navigator
const AppNavigator = () => {
  const { userToken } = useAuth();
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {userToken ? (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;