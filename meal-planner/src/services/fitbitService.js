import { supabase } from '../utils/supabaseClient';
import { toast } from 'react-toastify';

// Fitbit API base URL
const FITBIT_API_BASE_URL = 'https://api.fitbit.com/1';

/**
 * Get Fitbit tokens for the current user
 * @param {string} userId - The user ID
 * @returns {Object|null} - The Fitbit tokens or null if not found
 */
export const getFitbitTokens = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('fitbit_tokens, fitbit_connected')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    if (!data || !data.fitbit_connected || !data.fitbit_tokens) {
      return null;
    }
    
    return data.fitbit_tokens;
  } catch (error) {
    console.error('Error getting Fitbit tokens:', error);
    return null;
  }
};

/**
 * Refresh Fitbit access token if expired
 * @param {string} userId - The user ID
 * @param {Object} tokens - The current Fitbit tokens
 * @returns {Object|null} - The updated tokens or null if refresh failed
 */
export const refreshFitbitToken = async (userId, tokens) => {
  try {
    // Check if token needs refresh
    const tokenTimestamp = new Date(tokens.timestamp);
    const expiresIn = tokens.expires_in || 28800; // Default to 8 hours
    const expirationTime = new Date(tokenTimestamp.getTime() + expiresIn * 1000);
    
    // Add a 5-minute buffer
    const bufferTime = 5 * 60 * 1000;
    const now = new Date();
    
    if (now.getTime() < expirationTime.getTime() - bufferTime) {
      // Token is still valid
      return tokens;
    }
    
    // Token needs refresh
    const response = await fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${process.env.REACT_APP_FITBIT_CLIENT_ID}:${process.env.REACT_APP_FITBIT_CLIENT_SECRET}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`);
    }
    
    const newTokens = await response.json();
    
    // Update tokens in database
    const updatedTokens = {
      ...tokens,
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token || tokens.refresh_token,
      expires_in: newTokens.expires_in || tokens.expires_in,
      timestamp: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('users')
      .update({ fitbit_tokens: updatedTokens })
      .eq('id', userId);
    
    if (error) throw error;
    
    return updatedTokens;
  } catch (error) {
    console.error('Error refreshing Fitbit token:', error);
    
    // Log the error
    await supabase
      .from('fitbit_sync_logs')
      .insert([{
        user_id: userId,
        status: 'error',
        error_message: `Token refresh failed: ${error.message}`
      }]);
    
    return null;
  }
};

/**
 * Push a meal to Fitbit food log
 * @param {string} userId - The user ID
 * @param {Object} meal - The meal to push
 * @param {string} date - The date in YYYY-MM-DD format
 * @returns {boolean} - Whether the push was successful
 */
export const pushMealToFitbit = async (userId, meal, date) => {
  try {
    // Get Fitbit tokens
    let tokens = await getFitbitTokens(userId);
    
    if (!tokens) {
      throw new Error('Fitbit not connected');
    }
    
    // Refresh token if needed
    tokens = await refreshFitbitToken(userId, tokens);
    
    if (!tokens) {
      throw new Error('Failed to refresh Fitbit token');
    }
    
    // Map meal type to Fitbit meal type
    const mealTypeMap = {
      'breakfast': 1,
      'lunch': 2,
      'dinner': 3,
      'snack': 7
    };
    
    const fitbitMealTypeId = mealTypeMap[meal.meal_type] || 7;
    
    // Push each food item in the meal
    for (const item of meal.meal_items) {
      if (item.food_item) {
        // Create a food log entry
        const response = await fetch(`${FITBIT_API_BASE_URL}/user/-/foods/log.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `${tokens.token_type} ${tokens.access_token}`
          },
          body: new URLSearchParams({
            foodName: item.food_item.name,
            mealTypeId: fitbitMealTypeId,
            unitId: 147, // grams
            amount: item.quantity,
            date: date,
            calories: Math.round((item.food_item.calories_per_100g * item.quantity) / 100)
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Fitbit API error: ${JSON.stringify(errorData)}`);
        }
      }
      
      // TODO: Handle recipes by breaking them down into ingredients
    }
    
    // Update meal as synced
    const { error } = await supabase
      .from('meals')
      .update({
        synced_to_fitbit: true,
        fitbit_sync_time: new Date().toISOString()
      })
      .eq('id', meal.id);
    
    if (error) throw error;
    
    // Log successful sync
    await supabase
      .from('fitbit_sync_logs')
      .insert([{
        user_id: userId,
        status: 'success',
        details: { meal_id: meal.id, meal_type: meal.meal_type, date }
      }]);
    
    return true;
  } catch (error) {
    console.error('Error pushing meal to Fitbit:', error);
    
    // Log the error
    await supabase
      .from('fitbit_sync_logs')
      .insert([{
        user_id: userId,
        status: 'error',
        error_message: `Failed to push meal: ${error.message}`,
        details: { meal_id: meal.id, meal_type: meal.meal_type, date }
      }]);
    
    toast.error(`Failed to sync with Fitbit: ${error.message}`);
    return false;
  }
};

/**
 * Sync all meals for a day to Fitbit
 * @param {string} userId - The user ID
 * @param {string} date - The date in YYYY-MM-DD format
 * @returns {Object} - Result of the sync operation
 */
export const syncDayToFitbit = async (userId, date) => {
  try {
    // Get meal plan for the day
    const { data: mealPlan, error: mealPlanError } = await supabase
      .from('meal_plans')
      .select(`
        *,
        meals:meals(
          *,
          meal_items:meal_items(
            *,
            food_item:food_items(*)
          )
        )
      `)
      .eq('user_id', userId)
      .eq('date', date)
      .single();
    
    if (mealPlanError) throw mealPlanError;
    
    if (!mealPlan) {
      return { success: false, message: 'No meal plan found for this date' };
    }
    
    // Push each meal that hasn't been synced yet
    let syncCount = 0;
    for (const meal of mealPlan.meals) {
      if (!meal.synced_to_fitbit && meal.meal_items.length > 0) {
        const success = await pushMealToFitbit(userId, meal, date);
        if (success) {
          syncCount++;
        }
      }
    }
    
    if (syncCount > 0) {
      toast.success(`Successfully synced ${syncCount} meals to Fitbit`);
      return { success: true, message: `Synced ${syncCount} meals to Fitbit` };
    } else {
      toast.info('No new meals to sync with Fitbit');
      return { success: true, message: 'No new meals to sync' };
    }
  } catch (error) {
    console.error('Error syncing day to Fitbit:', error);
    toast.error(`Failed to sync with Fitbit: ${error.message}`);
    return { success: false, message: error.message };
  }
};

/**
 * Disconnect Fitbit account
 * @param {string} userId - The user ID
 * @returns {boolean} - Whether the disconnection was successful
 */
export const disconnectFitbit = async (userId) => {
  try {
    // Get Fitbit tokens
    const tokens = await getFitbitTokens(userId);
    
    if (tokens) {
      // Revoke access token
      try {
        await fetch('https://api.fitbit.com/oauth2/revoke', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(`${process.env.REACT_APP_FITBIT_CLIENT_ID}:${process.env.REACT_APP_FITBIT_CLIENT_SECRET}`)}`
          },
          body: new URLSearchParams({
            token: tokens.access_token
          })
        });
      } catch (revokeError) {
        console.error('Error revoking Fitbit token:', revokeError);
        // Continue with disconnection even if revoke fails
      }
    }
    
    // Update user record
    const { error } = await supabase
      .from('users')
      .update({
        fitbit_connected: false,
        fitbit_tokens: null
      })
      .eq('id', userId);
    
    if (error) throw error;
    
    toast.success('Fitbit account disconnected successfully');
    return true;
  } catch (error) {
    console.error('Error disconnecting Fitbit:', error);
    toast.error(`Failed to disconnect Fitbit: ${error.message}`);
    return false;
  }
};

/**
 * Check if Fitbit is connected
 * @param {string} userId - The user ID
 * @returns {boolean} - Whether Fitbit is connected
 */
export const isFitbitConnected = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('fitbit_connected')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    return data?.fitbit_connected || false;
  } catch (error) {
    console.error('Error checking Fitbit connection:', error);
    return false;
  }
};

/**
 * Get Fitbit authorization URL
 * @returns {string} - The authorization URL
 */
export const getFitbitAuthUrl = () => {
  const clientId = process.env.REACT_APP_FITBIT_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.REACT_APP_FITBIT_REDIRECT_URI);
  const scope = encodeURIComponent('nutrition profile');
  
  return `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&expires_in=604800`;
};