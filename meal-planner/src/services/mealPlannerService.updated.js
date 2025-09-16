import { supabase } from '../utils/supabaseClient';
import { toast } from 'react-toastify';
import { syncDayToFitbit, isFitbitConnected } from './fitbitService';

/**
 * Get meal plan for a specific date
 * @param {string} userId - The user ID
 * @param {string} date - The date in YYYY-MM-DD format
 * @returns {Object|null} - The meal plan or null if not found
 */
export const getMealPlanByDate = async (userId, date) => {
  try {
    const { data, error } = await supabase
      .from('meal_plans')
      .select(`
        *,
        meals:meals(
          *,
          meal_items:meal_items(
            *,
            food_item:food_items(*),
            recipe:recipes(*)
          )
        )
      `)
      .eq('user_id', userId)
      .eq('date', date)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting meal plan:', error);
    toast.error(`Failed to load meal plan: ${error.message}`);
    return null;
  }
};

/**
 * Create a new meal plan for a specific date
 * @param {string} userId - The user ID
 * @param {string} date - The date in YYYY-MM-DD format
 * @returns {Object|null} - The created meal plan or null if creation failed
 */
export const createMealPlan = async (userId, date) => {
  try {
    // Check if a meal plan already exists for this date
    const existingPlan = await getMealPlanByDate(userId, date);
    
    if (existingPlan) {
      return existingPlan;
    }
    
    // Create new meal plan
    const { data: mealPlanData, error: mealPlanError } = await supabase
      .from('meal_plans')
      .insert([{
        user_id: userId,
        date
      }])
      .select();
    
    if (mealPlanError) throw mealPlanError;
    
    const mealPlan = mealPlanData[0];
    
    // Create default meals
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    const mealPromises = mealTypes.map(mealType => 
      supabase
        .from('meals')
        .insert([{
          meal_plan_id: mealPlan.id,
          meal_type: mealType
        }])
    );
    
    await Promise.all(mealPromises);
    
    // Fetch the complete meal plan with meals
    return await getMealPlanByDate(userId, date);
  } catch (error) {
    console.error('Error creating meal plan:', error);
    toast.error(`Failed to create meal plan: ${error.message}`);
    return null;
  }
};

/**
 * Add a food item to a meal
 * @param {string} mealId - The meal ID
 * @param {string} foodItemId - The food item ID
 * @param {number} quantity - The quantity in grams
 * @param {string} unit - The unit of measurement
 * @returns {Object|null} - The created meal item or null if creation failed
 */
export const addFoodItemToMeal = async (mealId, foodItemId, quantity, unit = 'g') => {
  try {
    const { data, error } = await supabase
      .from('meal_items')
      .insert([{
        meal_id: mealId,
        food_item_id: foodItemId,
        quantity,
        unit,
        servings: 1
      }])
      .select(`
        *,
        food_item:food_items(*)
      `);
    
    if (error) throw error;
    
    toast.success('Food item added to meal');
    return data[0];
  } catch (error) {
    console.error('Error adding food item to meal:', error);
    toast.error(`Failed to add food item: ${error.message}`);
    return null;
  }
};

/**
 * Add a recipe to a meal
 * @param {string} mealId - The meal ID
 * @param {string} recipeId - The recipe ID
 * @param {number} servings - The number of servings
 * @returns {Object|null} - The created meal item or null if creation failed
 */
export const addRecipeToMeal = async (mealId, recipeId, servings = 1) => {
  try {
    const { data, error } = await supabase
      .from('meal_items')
      .insert([{
        meal_id: mealId,
        recipe_id: recipeId,
        quantity: 1,
        unit: 'serving',
        servings
      }])
      .select(`
        *,
        recipe:recipes(*)
      `);
    
    if (error) throw error;
    
    toast.success('Recipe added to meal');
    return data[0];
  } catch (error) {
    console.error('Error adding recipe to meal:', error);
    toast.error(`Failed to add recipe: ${error.message}`);
    return null;
  }
};

/**
 * Add a ready meal to a meal
 * @param {string} mealId - The meal ID
 * @param {string} readyMealId - The ready meal ID
 * @param {number} servings - The number of servings
 * @returns {Object|null} - The created meal item or null if creation failed
 */
export const addReadyMealToMeal = async (mealId, readyMealId, servings = 1) => {
  try {
    // First get the ready meal details
    const { data: readyMeal, error: readyMealError } = await supabase
      .from('ready_meals')
      .select('*')
      .eq('id', readyMealId)
      .single();
    
    if (readyMealError) throw readyMealError;
    
    // Create a food item entry for this ready meal if it doesn't exist
    let foodItemId;
    
    const { data: existingFoodItem, error: existingError } = await supabase
      .from('food_items')
      .select('id')
      .eq('barcode', readyMeal.barcode)
      .maybeSingle();
    
    if (existingError && existingError.code !== 'PGRST116') throw existingError;
    
    if (existingFoodItem) {
      foodItemId = existingFoodItem.id;
    } else {
      // Create a new food item based on the ready meal
      const { data: newFoodItem, error: createError } = await supabase
        .from('food_items')
        .insert([{
          name: readyMeal.name,
          brand: readyMeal.brand,
          description: readyMeal.description,
          barcode: readyMeal.barcode,
          serving_size: readyMeal.serving_size,
          serving_size_grams: readyMeal.serving_size_grams,
          calories_per_100g: readyMeal.calories_per_serving,
          protein_g: readyMeal.protein_g,
          carbs_g: readyMeal.carbs_g,
          fat_g: readyMeal.fat_g,
          is_user_created: true,
          user_id: readyMeal.user_id,
          source: 'Ready Meal',
          image_url: readyMeal.image_url,
          meal_type: readyMeal.meal_type,
          in_stock: readyMeal.in_stock
        }])
        .select('id');
      
      if (createError) throw createError;
      foodItemId = newFoodItem[0].id;
    }
    
    // Now add the food item to the meal
    return await addFoodItemToMeal(mealId, foodItemId, 1, 'serving');
  } catch (error) {
    console.error('Error adding ready meal to meal:', error);
    toast.error(`Failed to add ready meal: ${error.message}`);
    return null;
  }
};

/**
 * Update a meal item
 * @param {string} mealItemId - The meal item ID
 * @param {Object} updates - The updates to apply
 * @returns {Object|null} - The updated meal item or null if update failed
 */
export const updateMealItem = async (mealItemId, updates) => {
  try {
    const { data, error } = await supabase
      .from('meal_items')
      .update(updates)
      .eq('id', mealItemId)
      .select(`
        *,
        food_item:food_items(*),
        recipe:recipes(*)
      `);
    
    if (error) throw error;
    
    toast.success('Meal item updated');
    return data[0];
  } catch (error) {
    console.error('Error updating meal item:', error);
    toast.error(`Failed to update meal item: ${error.message}`);
    return null;
  }
};

/**
 * Remove a meal item
 * @param {string} mealItemId - The meal item ID
 * @returns {boolean} - Whether the removal was successful
 */
export const removeMealItem = async (mealItemId) => {
  try {
    const { error } = await supabase
      .from('meal_items')
      .delete()
      .eq('id', mealItemId);
    
    if (error) throw error;
    
    toast.success('Item removed from meal');
    return true;
  } catch (error) {
    console.error('Error removing meal item:', error);
    toast.error(`Failed to remove item: ${error.message}`);
    return false;
  }
};

/**
 * Get meal plans for a date range
 * @param {string} userId - The user ID
 * @param {string} startDate - The start date in YYYY-MM-DD format
 * @param {string} endDate - The end date in YYYY-MM-DD format
 * @returns {Array} - Array of meal plans
 */
export const getMealPlansForDateRange = async (userId, startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('meal_plans')
      .select(`
        *,
        meals:meals(
          *,
          meal_items:meal_items(
            *,
            food_item:food_items(*),
            recipe:recipes(*)
          )
        )
      `)
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error getting meal plans for date range:', error);
    toast.error(`Failed to load meal plans: ${error.message}`);
    return [];
  }
};

/**
 * Generate a shopping list from meal plans
 * @param {string} userId - The user ID
 * @param {string} startDate - The start date in YYYY-MM-DD format
 * @param {string} endDate - The end date in YYYY-MM-DD format
 * @param {string} name - The name of the shopping list
 * @returns {Object|null} - The created shopping list or null if creation failed
 */
export const generateShoppingList = async (userId, startDate, endDate, name) => {
  try {
    // Call the database function to generate the shopping list
    const { data, error } = await supabase.rpc(
      'generate_shopping_list',
      {
        meal_plan_start_date: startDate,
        meal_plan_end_date: endDate,
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
    
    toast.success('Shopping list generated successfully');
    return shoppingList;
  } catch (error) {
    console.error('Error generating shopping list:', error);
    toast.error(`Failed to generate shopping list: ${error.message}`);
    return null;
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

/**
 * Sync meal plan with Fitbit
 * @param {string} userId - The user ID
 * @param {string} date - The date in YYYY-MM-DD format
 * @returns {Object} - Result of the sync operation
 */
export const syncMealPlanWithFitbit = async (userId, date) => {
  try {
    // Check if Fitbit is connected
    const connected = await isFitbitConnected(userId);
    
    if (!connected) {
      return { success: false, message: 'Fitbit account not connected' };
    }
    
    // Sync with Fitbit
    return await syncDayToFitbit(userId, date);
  } catch (error) {
    console.error('Error syncing with Fitbit:', error);
    toast.error(`Failed to sync with Fitbit: ${error.message}`);
    return { success: false, message: error.message };
  }
};

/**
 * Copy a meal plan to another date
 * @param {string} userId - The user ID
 * @param {string} sourceDate - The source date in YYYY-MM-DD format
 * @param {string} targetDate - The target date in YYYY-MM-DD format
 * @returns {Object|null} - The copied meal plan or null if copy failed
 */
export const copyMealPlan = async (userId, sourceDate, targetDate) => {
  try {
    // Get source meal plan
    const sourcePlan = await getMealPlanByDate(userId, sourceDate);
    
    if (!sourcePlan) {
      throw new Error('Source meal plan not found');
    }
    
    // Check if target date already has a meal plan
    const existingTargetPlan = await getMealPlanByDate(userId, targetDate);
    
    if (existingTargetPlan) {
      throw new Error('Target date already has a meal plan');
    }
    
    // Create new meal plan for target date
    const { data: newPlanData, error: newPlanError } = await supabase
      .from('meal_plans')
      .insert([{
        user_id: userId,
        date: targetDate,
        notes: sourcePlan.notes
      }])
      .select();
    
    if (newPlanError) throw newPlanError;
    
    const newPlan = newPlanData[0];
    
    // Copy meals
    for (const meal of sourcePlan.meals) {
      // Create new meal
      const { data: newMealData, error: newMealError } = await supabase
        .from('meals')
        .insert([{
          meal_plan_id: newPlan.id,
          meal_type: meal.meal_type,
          time_of_day: meal.time_of_day,
          notes: meal.notes
        }])
        .select();
      
      if (newMealError) throw newMealError;
      
      const newMeal = newMealData[0];
      
      // Copy meal items
      for (const item of meal.meal_items) {
        const newItem = {
          meal_id: newMeal.id,
          quantity: item.quantity,
          unit: item.unit,
          servings: item.servings,
          notes: item.notes
        };
        
        if (item.food_item_id) {
          newItem.food_item_id = item.food_item_id;
        } else if (item.recipe_id) {
          newItem.recipe_id = item.recipe_id;
        }
        
        await supabase
          .from('meal_items')
          .insert([newItem]);
      }
    }
    
    toast.success(`Meal plan copied to ${targetDate}`);
    return await getMealPlanByDate(userId, targetDate);
  } catch (error) {
    console.error('Error copying meal plan:', error);
    toast.error(`Failed to copy meal plan: ${error.message}`);
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