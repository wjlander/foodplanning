import { supabase } from '../utils/supabaseClient';
import { toast } from 'react-toastify';

// Open Food Facts API base URL
const OPEN_FOOD_FACTS_API_URL = 'https://uk.openfoodfacts.org/api/v0';

/**
 * Search for food items in the database
 * @param {string} query - The search query
 * @param {number} limit - Maximum number of results to return
 * @returns {Array} - Array of food items
 */
export const searchFoodItems = async (query, limit = 20) => {
  try {
    if (!query || query.trim() === '') {
      return [];
    }
    
    // First search our database
    const { data: localData, error: localError } = await supabase
      .from('food_items')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true })
      .limit(limit);
    
    if (localError) throw localError;
    
    // If we have enough results, return them
    if (localData && localData.length >= limit) {
      return localData;
    }
    
    // Otherwise, also search Open Food Facts API
    const response = await fetch(`${OPEN_FOOD_FACTS_API_URL}/search?search_terms=${encodeURIComponent(query)}&page_size=${limit}&json=true`);
    
    if (!response.ok) {
      throw new Error(`Open Food Facts API error: ${response.status} ${response.statusText}`);
    }
    
    const apiData = await response.json();
    
    // Convert API data to our format
    const apiItems = apiData.products.map(product => ({
      id: null, // Will be assigned when saved to our database
      barcode: product.code,
      name: product.product_name || 'Unknown Product',
      brand: product.brands || '',
      description: product.generic_name || '',
      serving_size: product.serving_size || '',
      serving_size_grams: product.serving_quantity || 100,
      calories_per_100g: product.nutriments['energy-kcal_100g'] || 0,
      protein_g: product.nutriments.proteins_100g || 0,
      carbs_g: product.nutriments.carbohydrates_100g || 0,
      fat_g: product.nutriments.fat_100g || 0,
      fiber_g: product.nutriments.fiber_100g || 0,
      sugar_g: product.nutriments.sugars_100g || 0,
      sodium_mg: product.nutriments.sodium_100g ? product.nutriments.sodium_100g * 1000 : 0,
      is_user_created: false,
      source: 'Open Food Facts',
      is_uk_product: product.countries && product.countries.includes('United Kingdom'),
      image_url: product.image_url || '',
      meal_type: null, // New field
      in_stock: true, // New field
      last_purchased_date: null // New field
    }));
    
    // Combine local and API results, removing duplicates
    const combinedResults = [...localData];
    
    for (const apiItem of apiItems) {
      // Check if this item is already in our results by barcode
      const existingItem = combinedResults.find(item => item.barcode === apiItem.barcode);
      
      if (!existingItem) {
        combinedResults.push(apiItem);
      }
    }
    
    // Limit to the requested number of results
    return combinedResults.slice(0, limit);
  } catch (error) {
    console.error('Error searching food items:', error);
    toast.error(`Search error: ${error.message}`);
    return [];
  }
};

/**
 * Get food item by barcode
 * @param {string} barcode - The barcode to search for
 * @returns {Object|null} - The food item or null if not found
 */
export const getFoodItemByBarcode = async (barcode) => {
  try {
    // First check our database
    const { data: localData, error: localError } = await supabase
      .from('food_items')
      .select('*')
      .eq('barcode', barcode)
      .single();
    
    if (localError && localError.code !== 'PGRST116') {
      throw localError;
    }
    
    if (localData) {
      return localData;
    }
    
    // If not in our database, check Open Food Facts API
    const response = await fetch(`${OPEN_FOOD_FACTS_API_URL}/product/${barcode}.json`);
    
    if (!response.ok) {
      throw new Error(`Open Food Facts API error: ${response.status} ${response.statusText}`);
    }
    
    const apiData = await response.json();
    
    if (apiData.status !== 1) {
      return null; // Product not found
    }
    
    const product = apiData.product;
    
    // Convert API data to our format
    const foodItem = {
      barcode,
      name: product.product_name || 'Unknown Product',
      brand: product.brands || '',
      description: product.generic_name || '',
      serving_size: product.serving_size || '',
      serving_size_grams: product.serving_quantity || 100,
      calories_per_100g: product.nutriments['energy-kcal_100g'] || 0,
      protein_g: product.nutriments.proteins_100g || 0,
      carbs_g: product.nutriments.carbohydrates_100g || 0,
      fat_g: product.nutriments.fat_100g || 0,
      fiber_g: product.nutriments.fiber_100g || 0,
      sugar_g: product.nutriments.sugars_100g || 0,
      sodium_mg: product.nutriments.sodium_100g ? product.nutriments.sodium_100g * 1000 : 0,
      is_user_created: false,
      source: 'Open Food Facts',
      is_uk_product: product.countries && product.countries.includes('United Kingdom'),
      image_url: product.image_url || '',
      meal_type: null, // New field
      in_stock: true, // New field
      last_purchased_date: null // New field
    };
    
    // Save to our database for future use
    const { data: savedData, error: saveError } = await supabase
      .from('food_items')
      .insert([foodItem])
      .select();
    
    if (saveError) throw saveError;
    
    return savedData[0];
  } catch (error) {
    console.error('Error getting food item by barcode:', error);
    toast.error(`Barcode lookup error: ${error.message}`);
    return null;
  }
};

/**
 * Create a custom food item
 * @param {Object} foodItem - The food item to create
 * @param {string} userId - The user ID
 * @returns {Object|null} - The created food item or null if creation failed
 */
export const createCustomFoodItem = async (foodItem, userId) => {
  try {
    const newFoodItem = {
      ...foodItem,
      is_user_created: true,
      user_id: userId,
      source: 'User Created'
    };
    
    const { data, error } = await supabase
      .from('food_items')
      .insert([newFoodItem])
      .select();
    
    if (error) throw error;
    
    toast.success('Food item created successfully');
    return data[0];
  } catch (error) {
    console.error('Error creating custom food item:', error);
    toast.error(`Failed to create food item: ${error.message}`);
    return null;
  }
};

/**
 * Update a custom food item
 * @param {string} id - The food item ID
 * @param {Object} foodItem - The updated food item data
 * @param {string} userId - The user ID
 * @returns {Object|null} - The updated food item or null if update failed
 */
export const updateCustomFoodItem = async (id, foodItem, userId) => {
  try {
    // Ensure user can only update their own custom food items
    const { data: existingItem, error: fetchError } = await supabase
      .from('food_items')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (!existingItem) {
      throw new Error('Food item not found');
    }
    
    if (!existingItem.is_user_created || existingItem.user_id !== userId) {
      throw new Error('You can only update your own custom food items');
    }
    
    const { data, error } = await supabase
      .from('food_items')
      .update(foodItem)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    toast.success('Food item updated successfully');
    return data[0];
  } catch (error) {
    console.error('Error updating custom food item:', error);
    toast.error(`Failed to update food item: ${error.message}`);
    return null;
  }
};

/**
 * Delete a custom food item
 * @param {string} id - The food item ID
 * @param {string} userId - The user ID
 * @returns {boolean} - Whether the deletion was successful
 */
export const deleteCustomFoodItem = async (id, userId) => {
  try {
    // Ensure user can only delete their own custom food items
    const { data: existingItem, error: fetchError } = await supabase
      .from('food_items')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (!existingItem) {
      throw new Error('Food item not found');
    }
    
    if (!existingItem.is_user_created || existingItem.user_id !== userId) {
      throw new Error('You can only delete your own custom food items');
    }
    
    // Check if the food item is used in any recipes or meals
    const { count: recipeCount, error: recipeError } = await supabase
      .from('recipe_ingredients')
      .select('*', { count: 'exact', head: true })
      .eq('food_item_id', id);
    
    if (recipeError) throw recipeError;
    
    const { count: mealCount, error: mealError } = await supabase
      .from('meal_items')
      .select('*', { count: 'exact', head: true })
      .eq('food_item_id', id);
    
    if (mealError) throw mealError;
    
    if (recipeCount > 0 || mealCount > 0) {
      throw new Error('Cannot delete food item as it is used in recipes or meals');
    }
    
    const { error } = await supabase
      .from('food_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    toast.success('Food item deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting custom food item:', error);
    toast.error(`Failed to delete food item: ${error.message}`);
    return false;
  }
};

/**
 * Get user's custom food items
 * @param {string} userId - The user ID
 * @returns {Array} - Array of custom food items
 */
export const getUserCustomFoodItems = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .eq('user_id', userId)
      .eq('is_user_created', true)
      .order('name', { ascending: true });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error getting custom food items:', error);
    toast.error(`Failed to load custom food items: ${error.message}`);
    return [];
  }
};

/**
 * Update the stock status of a food item
 * @param {string} id - The food item ID
 * @param {boolean} inStock - Whether the food item is in stock
 * @param {string} userId - The user ID
 * @returns {Object|null} - The updated food item or null if update failed
 */
export const updateFoodItemStockStatus = async (id, inStock, userId) => {
  try {
    // Ensure user can only update their own custom food items
    const { data: existingItem, error: fetchError } = await supabase
      .from('food_items')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (!existingItem) {
      throw new Error('Food item not found');
    }
    
    if (existingItem.is_user_created && existingItem.user_id !== userId) {
      throw new Error('You can only update your own custom food items');
    }
    
    const updates = {
      in_stock: inStock,
      last_purchased_date: inStock ? new Date().toISOString().split('T')[0] : existingItem.last_purchased_date
    };
    
    const { data, error } = await supabase
      .from('food_items')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    toast.success(`Food item marked as ${inStock ? 'in stock' : 'out of stock'}`);
    return data[0];
  } catch (error) {
    console.error('Error updating food item stock status:', error);
    toast.error(`Failed to update stock status: ${error.message}`);
    return null;
  }
};

/**
 * Update the meal type of a food item
 * @param {string} id - The food item ID
 * @param {Array} mealType - Array of meal types (breakfast, lunch, dinner, snack)
 * @param {string} userId - The user ID
 * @returns {Object|null} - The updated food item or null if update failed
 */
export const updateFoodItemMealType = async (id, mealType, userId) => {
  try {
    // Ensure user can only update their own custom food items
    const { data: existingItem, error: fetchError } = await supabase
      .from('food_items')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (!existingItem) {
      throw new Error('Food item not found');
    }
    
    if (existingItem.is_user_created && existingItem.user_id !== userId) {
      throw new Error('You can only update your own custom food items');
    }
    
    const { data, error } = await supabase
      .from('food_items')
      .update({ meal_type: mealType })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    toast.success('Food item meal type updated successfully');
    return data[0];
  } catch (error) {
    console.error('Error updating food item meal type:', error);
    toast.error(`Failed to update meal type: ${error.message}`);
    return null;
  }
};

/**
 * Get food items by meal type
 * @param {string} userId - The user ID
 * @param {string} mealType - The meal type (breakfast, lunch, dinner, snack)
 * @returns {Array} - Array of food items
 */
export const getFoodItemsByMealType = async (userId, mealType) => {
  try {
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .or(`user_id.eq.${userId},is_user_created.eq.false`)
      .contains('meal_type', [mealType])
      .order('name', { ascending: true });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error(`Error getting ${mealType} food items:`, error);
    toast.error(`Failed to load ${mealType} food items: ${error.message}`);
    return [];
  }
};

/**
 * Get out-of-stock food items
 * @param {string} userId - The user ID
 * @returns {Array} - Array of out-of-stock food items
 */
export const getOutOfStockFoodItems = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .eq('user_id', userId)
      .eq('in_stock', false)
      .order('name', { ascending: true });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error getting out-of-stock food items:', error);
    toast.error(`Failed to load out-of-stock food items: ${error.message}`);
    return [];
  }
};