import { supabase } from '../utils/supabaseClient';
import { toast } from 'react-toastify';

/**
 * Get ratings for a recipe
 * @param {string} recipeId - The recipe ID
 * @returns {Array} - Array of ratings
 */
export const getRecipeRatings = async (recipeId) => {
  try {
    const { data, error } = await supabase
      .from('meal_ratings')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error getting recipe ratings:', error);
    toast.error(`Failed to load ratings: ${error.message}`);
    return [];
  }
};

/**
 * Get ratings for a ready meal
 * @param {string} readyMealId - The ready meal ID
 * @returns {Array} - Array of ratings
 */
export const getReadyMealRatings = async (readyMealId) => {
  try {
    const { data, error } = await supabase
      .from('meal_ratings')
      .select('*')
      .eq('ready_meal_id', readyMealId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error getting ready meal ratings:', error);
    toast.error(`Failed to load ratings: ${error.message}`);
    return [];
  }
};

/**
 * Rate a recipe
 * @param {string} recipeId - The recipe ID
 * @param {number} rating - The rating (1-5)
 * @param {string} comment - Optional comment
 * @param {string} userId - The user ID
 * @returns {Object|null} - The created rating or null if creation failed
 */
export const rateRecipe = async (recipeId, rating, comment, userId) => {
  try {
    // Check if user has already rated this recipe
    const { data: existingRating, error: checkError } = await supabase
      .from('meal_ratings')
      .select('id')
      .eq('recipe_id', recipeId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) throw checkError;
    
    let result;
    
    if (existingRating) {
      // Update existing rating
      const { data, error } = await supabase
        .from('meal_ratings')
        .update({
          rating,
          comment,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRating.id)
        .select();
      
      if (error) throw error;
      result = data[0];
      toast.success('Rating updated successfully');
    } else {
      // Create new rating
      const { data, error } = await supabase
        .from('meal_ratings')
        .insert([{
          recipe_id: recipeId,
          user_id: userId,
          rating,
          comment
        }])
        .select();
      
      if (error) throw error;
      result = data[0];
      toast.success('Rating submitted successfully');
    }
    
    // Update last_made_date for the recipe
    await supabase
      .from('recipes')
      .update({
        last_made_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', recipeId);
    
    return result;
  } catch (error) {
    console.error('Error rating recipe:', error);
    toast.error(`Failed to submit rating: ${error.message}`);
    return null;
  }
};

/**
 * Rate a ready meal
 * @param {string} readyMealId - The ready meal ID
 * @param {number} rating - The rating (1-5)
 * @param {string} comment - Optional comment
 * @param {string} userId - The user ID
 * @returns {Object|null} - The created rating or null if creation failed
 */
export const rateReadyMeal = async (readyMealId, rating, comment, userId) => {
  try {
    // Check if user has already rated this ready meal
    const { data: existingRating, error: checkError } = await supabase
      .from('meal_ratings')
      .select('id')
      .eq('ready_meal_id', readyMealId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) throw checkError;
    
    let result;
    
    if (existingRating) {
      // Update existing rating
      const { data, error } = await supabase
        .from('meal_ratings')
        .update({
          rating,
          comment,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRating.id)
        .select();
      
      if (error) throw error;
      result = data[0];
      toast.success('Rating updated successfully');
    } else {
      // Create new rating
      const { data, error } = await supabase
        .from('meal_ratings')
        .insert([{
          ready_meal_id: readyMealId,
          user_id: userId,
          rating,
          comment
        }])
        .select();
      
      if (error) throw error;
      result = data[0];
      toast.success('Rating submitted successfully');
    }
    
    // Update last_made_date for the ready meal
    await supabase
      .from('ready_meals')
      .update({
        last_made_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', readyMealId);
    
    return result;
  } catch (error) {
    console.error('Error rating ready meal:', error);
    toast.error(`Failed to submit rating: ${error.message}`);
    return null;
  }
};

/**
 * Delete a rating
 * @param {string} ratingId - The rating ID
 * @param {string} userId - The user ID
 * @returns {boolean} - Whether the deletion was successful
 */
export const deleteRating = async (ratingId, userId) => {
  try {
    // Ensure user can only delete their own ratings
    const { data: existingRating, error: fetchError } = await supabase
      .from('meal_ratings')
      .select('*')
      .eq('id', ratingId)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (!existingRating) {
      throw new Error('Rating not found');
    }
    
    if (existingRating.user_id !== userId) {
      throw new Error('You can only delete your own ratings');
    }
    
    const { error } = await supabase
      .from('meal_ratings')
      .delete()
      .eq('id', ratingId);
    
    if (error) throw error;
    
    toast.success('Rating deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting rating:', error);
    toast.error(`Failed to delete rating: ${error.message}`);
    return false;
  }
};

/**
 * Get top-rated meals by meal type
 * @param {string} userId - The user ID
 * @param {string} mealType - The meal type (breakfast, lunch, dinner, snack)
 * @param {number} limit - Maximum number of results to return
 * @returns {Array} - Array of top-rated meals
 */
export const getTopRatedMeals = async (userId, mealType, limit = 5) => {
  try {
    const { data, error } = await supabase.rpc(
      'suggest_top_rated_meals',
      {
        p_user_id: userId,
        p_meal_type: mealType,
        p_limit: limit
      }
    );
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error(`Error getting top-rated ${mealType} meals:`, error);
    toast.error(`Failed to load top-rated meals: ${error.message}`);
    return [];
  }
};