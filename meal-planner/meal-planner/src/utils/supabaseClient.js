import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and anon key from environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authentication helpers
export const signUp = async (email, password) => {
  const { user, error } = await supabase.auth.signUp({ email, password });
  return { user, error };
};

export const signIn = async (email, password) => {
  const { user, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

// Food item helpers
export const getFoodItemByBarcode = async (barcode) => {
  const { data, error } = await supabase
    .from('food_items')
    .select('*')
    .eq('barcode', barcode)
    .single();
  
  return { data, error };
};

export const searchFoodItems = async (query) => {
  const { data, error } = await supabase
    .from('food_items')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name', { ascending: true })
    .limit(20);
  
  return { data, error };
};

export const createFoodItem = async (foodItem) => {
  const { data, error } = await supabase
    .from('food_items')
    .insert([{ ...foodItem, is_user_created: true }])
    .select();
  
  return { data, error };
};

// Meal planning helpers
export const getMealPlanByDate = async (userId, date) => {
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
  
  return { data, error };
};

export const createMealPlan = async (mealPlan) => {
  const { data, error } = await supabase
    .from('meal_plans')
    .insert([mealPlan])
    .select();
  
  return { data, error };
};

export const addMealToMealPlan = async (meal) => {
  const { data, error } = await supabase
    .from('meals')
    .insert([meal])
    .select();
  
  return { data, error };
};

export const addItemToMeal = async (mealItem) => {
  const { data, error } = await supabase
    .from('meal_items')
    .insert([mealItem])
    .select();
  
  return { data, error };
};

// Recipe helpers
export const getUserRecipes = async (userId) => {
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      recipe_ingredients:recipe_ingredients(
        *,
        food_item:food_items(*)
      )
    `)
    .eq('user_id', userId)
    .order('name', { ascending: true });
  
  return { data, error };
};

export const createRecipe = async (recipe) => {
  const { data, error } = await supabase
    .from('recipes')
    .insert([recipe])
    .select();
  
  return { data, error };
};

// Nutrition tracking helpers
export const getNutritionLogByDate = async (userId, date) => {
  const { data, error } = await supabase
    .from('nutrition_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single();
  
  return { data, error };
};

export const createOrUpdateNutritionLog = async (nutritionLog) => {
  const { data, error } = await supabase
    .from('nutrition_logs')
    .upsert([nutritionLog])
    .select();
  
  return { data, error };
};

// Fitbit integration helpers
export const updateFitbitTokens = async (userId, tokens) => {
  const { data, error } = await supabase
    .from('users')
    .update({ fitbit_connected: true, fitbit_tokens: tokens })
    .eq('id', userId)
    .select();
  
  return { data, error };
};

export const logFitbitSync = async (syncLog) => {
  const { data, error } = await supabase
    .from('fitbit_sync_logs')
    .insert([syncLog])
    .select();
  
  return { data, error };
};

// Shopping list helpers
export const createShoppingList = async (shoppingList) => {
  const { data, error } = await supabase
    .from('shopping_lists')
    .insert([shoppingList])
    .select();
  
  return { data, error };
};

export const addItemToShoppingList = async (shoppingListItem) => {
  const { data, error } = await supabase
    .from('shopping_list_items')
    .insert([shoppingListItem])
    .select();
  
  return { data, error };
};

export const getUserShoppingLists = async (userId) => {
  const { data, error } = await supabase
    .from('shopping_lists')
    .select(`
      *,
      shopping_list_items:shopping_list_items(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return { data, error };
};