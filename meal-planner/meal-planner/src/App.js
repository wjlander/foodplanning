import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase, getCurrentUser } from './utils/supabaseClient';
import { toast } from 'react-toastify';

// Import components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

// Import pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MealPlanner from './pages/MealPlanner';
import BarcodeScanner from './pages/BarcodeScanner';
import FoodDatabase from './pages/FoodDatabase';
import Recipes from './pages/Recipes';
import NutritionTracker from './pages/NutritionTracker';
import ShoppingList from './pages/ShoppingList';
import Settings from './pages/Settings';
import FitbitCallback from './pages/FitbitCallback';
import NotFound from './pages/NotFound';

// Import context
import { AuthProvider } from './context/AuthContext';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for user on initial load
    const checkUser = async () => {
      try {
        const { user, error } = await getCurrentUser();
        if (error) throw error;
        setUser(user);
      } catch (error) {
        console.error('Error checking user:', error.message);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user);
          toast.success('Successfully signed in!');
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          toast.info('Signed out');
        }
      }
    );

    // Clean up subscription
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <AuthProvider value={{ user, setUser }}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute user={user} />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="meal-planner" element={<MealPlanner />} />
            <Route path="barcode-scanner" element={<BarcodeScanner />} />
            <Route path="food-database" element={<FoodDatabase />} />
            <Route path="recipes" element={<Recipes />} />
            <Route path="nutrition" element={<NutritionTracker />} />
            <Route path="shopping-list" element={<ShoppingList />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* Fitbit OAuth Callback */}
          <Route path="fitbit-callback" element={<FitbitCallback />} />
          
          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;