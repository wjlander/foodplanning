import { supabase } from '../utils/supabaseClient';
import { toast } from 'react-toastify';

/**
 * Get all ready meals for a user
 * @param {string} userId - The user ID
 * @returns {Array} - Array of ready meals
 */
export const getUserReadyMeals = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('ready_meals')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error getting ready meals:', error);
    toast.error(`Failed to load ready meals: ${error.message}`);
    return [];
  }
};

/**
 * Get ready meals filtered by meal type
 * @param {string} userId - The user ID
 * @param {string} mealType - The meal type (breakfast, lunch, dinner, snack)
 * @returns {Array} - Array of ready meals
 */
export const getReadyMealsByType = async (userId, mealType) => {
  try {
    const { data, error } = await supabase
      .from('ready_meals')
      .select('*')
      .eq('user_id', userId)
      .contains('meal_type', [mealType])
      .order('name', { ascending: true });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error(`Error getting ${mealType} ready meals:`, error);
    toast.error(`Failed to load ${mealType} ready meals: ${error.message}`);
    return [];
  }
};

/**
 * Get ready meals that are in stock
 * @param {string} userId - The user ID
 * @returns {Array} - Array of ready meals
 */
export const getInStockReadyMeals = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('ready_meals')
      .select('*')
      .eq('user_id', userId)
      .eq('in_stock', true)
      .order('name', { ascending: true });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error getting in-stock ready meals:', error);
    toast.error(`Failed to load in-stock ready meals: ${error.message}`);
    return [];
  }
};

/**
 * Get ready meals that are out of stock
 * @param {string} userId - The user ID
 * @returns {Array} - Array of ready meals
 */
export const getOutOfStockReadyMeals = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('ready_meals')
      .select('*')
      .eq('user_id', userId)
      .eq('in_stock', false)
      .order('name', { ascending: true });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error getting out-of-stock ready meals:', error);
    toast.error(`Failed to load out-of-stock ready meals: ${error.message}`);
    return [];
  }
};

/**
 * Create a new ready meal
 * @param {Object} readyMeal - The ready meal data
 * @param {string} userId - The user ID
 * @returns {Object|null} - The created ready meal or null if creation failed
 */
export const createReadyMeal = async (readyMeal, userId) => {
  try {
    const newReadyMeal = {
      ...readyMeal,
      user_id: userId
    };
    
    const { data, error } = await supabase
      .from('ready_meals')
      .insert([newReadyMeal])
      .select();
    
    if (error) throw error;
    
    toast.success('Ready meal created successfully');
    return data[0];
  } catch (error) {
    console.error('Error creating ready meal:', error);
    toast.error(`Failed to create ready meal: ${error.message}`);
    return null;
  }
};

/**
 * Update a ready meal
 * @param {string} id - The ready meal ID
 * @param {Object} readyMeal - The updated ready meal data
 * @param {string} userId - The user ID
 * @returns {Object|null} - The updated ready meal or null if update failed
 */
export const updateReadyMeal = async (id, readyMeal, userId) => {
  try {
    // Ensure user can only update their own ready meals
    const { data: existingMeal, error: fetchError } = await supabase
      .from('ready_meals')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (!existingMeal) {
      throw new Error('Ready meal not found');
    }
    
    if (existingMeal.user_id !== userId) {
      throw new Error('You can only update your own ready meals');
    }
    
    const { data, error } = await supabase
      .from('ready_meals')
      .update(readyMeal)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    toast.success('Ready meal updated successfully');
    return data[0];
  } catch (error) {
    console.error('Error updating ready meal:', error);
    toast.error(`Failed to update ready meal: ${error.message}`);
    return null;
  }
};

/**
 * Delete a ready meal
 * @param {string} id - The ready meal ID
 * @param {string} userId - The user ID
 * @returns {boolean} - Whether the deletion was successful
 */
export const deleteReadyMeal = async (id, userId) => {
  try {
    // Ensure user can only delete their own ready meals
    const { data: existingMeal, error: fetchError } = await supabase
      .from('ready_meals')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (!existingMeal) {
      throw new Error('Ready meal not found');
    }
    
    if (existingMeal.user_id !== userId) {
      throw new Error('You can only delete your own ready meals');
    }
    
    const { error } = await supabase
      .from('ready_meals')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    toast.success('Ready meal deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting ready meal:', error);
    toast.error(`Failed to delete ready meal: ${error.message}`);
    return false;
  }
};

/**
 * Update the stock status of a ready meal
 * @param {string} id - The ready meal ID
 * @param {boolean} inStock - Whether the ready meal is in stock
 * @param {string} userId - The user ID
 * @returns {Object|null} - The updated ready meal or null if update failed
 */
export const updateReadyMealStockStatus = async (id, inStock, userId) => {
  try {
    // Ensure user can only update their own ready meals
    const { data: existingMeal, error: fetchError } = await supabase
      .from('ready_meals')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (!existingMeal) {
      throw new Error('Ready meal not found');
    }
    
    if (existingMeal.user_id !== userId) {
      throw new Error('You can only update your own ready meals');
    }
    
    const updates = {
      in_stock: inStock,
      last_purchased_date: inStock ? new Date().toISOString().split('T')[0] : existingMeal.last_purchased_date
    };
    
    const { data, error } = await supabase
      .from('ready_meals')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    toast.success(`Ready meal marked as ${inStock ? 'in stock' : 'out of stock'}`);
    return data[0];
  } catch (error) {
    console.error('Error updating ready meal stock status:', error);
    toast.error(`Failed to update stock status: ${error.message}`);
    return null;
  }
};

/**
 * Get meal suggestions based on meal type
 * @param {string} userId - The user ID
 * @param {string} mealType - The meal type (breakfast, lunch, dinner, snack)
 * @returns {Array} - Array of suggested meals
 */
export const getMealSuggestions = async (userId, mealType) => {
  try {
    const { data, error } = await supabase
      .rpc('suggest_meals', {
        p_user_id: userId,
        p_meal_type: mealType
      });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error(`Error getting ${mealType} suggestions:`, error);
    toast.error(`Failed to load meal suggestions: ${error.message}`);
    return [];
  }
};

/**
 * Generate a shopping list for out-of-stock items
 * @param {string} userId - The user ID
 * @returns {Object|null} - The created shopping list or null if creation failed
 */
export const generateOutOfStockShoppingList = async (userId) => {
  try {
    const { data, error } = await supabase.rpc(
      'generate_out_of_stock_shopping_list',
      {
        p_user_id: userId
      }
    );
    
    if (error) throw error;
    
    // Fetch the created shopping list
    const shoppingListId = data;
    
    const { data: shoppingList, error: fetchError } = await supabase
      .from('shopping_lists')
      .select(`
        *,
        shopping_list_items:shopping_list_items(*)
      `)
      .eq('id', shoppingListId)
      .single();
    
    if (fetchError) throw fetchError;
    
    toast.success('Out-of-stock shopping list generated successfully');
    return shoppingList;
  } catch (error) {
    console.error('Error generating out-of-stock shopping list:', error);
    toast.error(`Failed to generate shopping list: ${error.message}`);
    return null;
  }
};