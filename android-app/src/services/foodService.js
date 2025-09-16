import { supabase } from '../utils/supabaseClient';
import { getLocalDatabase } from './databaseService';
import NetInfo from '@react-native-community/netinfo';

// Open Food Facts API base URL
const OPEN_FOOD_FACTS_API_URL = 'https://uk.openfoodfacts.org/api/v0';

/**
 * Search for food item by barcode
 * @param {string} barcode - The barcode to search for
 * @returns {Promise<Object|null>} - The food item or null if not found
 */
export const searchFoodByBarcode = async (barcode) => {
  try {
    // Check if we're online
    const netInfo = await NetInfo.fetch();
    const isConnected = netInfo.isConnected;
    
    // Try to get from local database first
    const db = await getLocalDatabase();
    const localFood = await db.executeSql(
      'SELECT * FROM food_items WHERE barcode = ?',
      [barcode]
    );
    
    // If found locally, return it
    if (localFood[0].rows.length > 0) {
      return localFood[0].rows.item(0);
    }
    
    // If offline and not in local DB, return null
    if (!isConnected) {
      return null;
    }
    
    // Try to get from Supabase
    const { data: supabaseData, error: supabaseError } = await supabase
      .from('food_items')
      .select('*')
      .eq('barcode', barcode)
      .single();
    
    if (supabaseData) {
      // Save to local database for offline access
      await saveToLocalDatabase(supabaseData);
      return supabaseData;
    }
    
    // If not in Supabase, try Open Food Facts API
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
      meal_type: null,
      in_stock: true,
      last_purchased_date: null
    };
    
    // Save to Supabase if online
    if (isConnected) {
      const { data: savedData, error: saveError } = await supabase
        .from('food_items')
        .insert([foodItem])
        .select();
      
      if (savedData && savedData.length > 0) {
        // Save to local database
        await saveToLocalDatabase(savedData[0]);
        return savedData[0];
      }
    }
    
    // Save to local database
    await saveToLocalDatabase(foodItem);
    return foodItem;
  } catch (error) {
    console.error('Error searching food by barcode:', error);
    throw error;
  }
};

/**
 * Save food item to local database
 * @param {Object} foodItem - The food item to save
 * @returns {Promise<void>}
 */
const saveToLocalDatabase = async (foodItem) => {
  try {
    const db = await getLocalDatabase();
    
    // Check if food item already exists
    const existingFood = await db.executeSql(
      'SELECT id FROM food_items WHERE barcode = ?',
      [foodItem.barcode]
    );
    
    if (existingFood[0].rows.length > 0) {
      // Update existing food item
      await db.executeSql(
        `UPDATE food_items SET 
          name = ?, 
          brand = ?, 
          description = ?, 
          serving_size = ?, 
          serving_size_grams = ?, 
          calories_per_100g = ?, 
          protein_g = ?, 
          carbs_g = ?, 
          fat_g = ?, 
          fiber_g = ?, 
          sugar_g = ?, 
          sodium_mg = ?, 
          is_user_created = ?, 
          source = ?, 
          is_uk_product = ?, 
          image_url = ?, 
          meal_type = ?, 
          in_stock = ?, 
          last_purchased_date = ?,
          synced = ?
        WHERE barcode = ?`,
        [
          foodItem.name,
          foodItem.brand,
          foodItem.description,
          foodItem.serving_size,
          foodItem.serving_size_grams,
          foodItem.calories_per_100g,
          foodItem.protein_g,
          foodItem.carbs_g,
          foodItem.fat_g,
          foodItem.fiber_g,
          foodItem.sugar_g,
          foodItem.sodium_mg,
          foodItem.is_user_created ? 1 : 0,
          foodItem.source,
          foodItem.is_uk_product ? 1 : 0,
          foodItem.image_url,
          foodItem.meal_type ? JSON.stringify(foodItem.meal_type) : null,
          foodItem.in_stock ? 1 : 0,
          foodItem.last_purchased_date,
          1, // synced
          foodItem.barcode
        ]
      );
    } else {
      // Insert new food item
      await db.executeSql(
        `INSERT INTO food_items (
          id, 
          barcode, 
          name, 
          brand, 
          description, 
          serving_size, 
          serving_size_grams, 
          calories_per_100g, 
          protein_g, 
          carbs_g, 
          fat_g, 
          fiber_g, 
          sugar_g, 
          sodium_mg, 
          is_user_created, 
          source, 
          is_uk_product, 
          image_url, 
          meal_type, 
          in_stock, 
          last_purchased_date,
          synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          foodItem.id || null,
          foodItem.barcode,
          foodItem.name,
          foodItem.brand,
          foodItem.description,
          foodItem.serving_size,
          foodItem.serving_size_grams,
          foodItem.calories_per_100g,
          foodItem.protein_g,
          foodItem.carbs_g,
          foodItem.fat_g,
          foodItem.fiber_g,
          foodItem.sugar_g,
          foodItem.sodium_mg,
          foodItem.is_user_created ? 1 : 0,
          foodItem.source,
          foodItem.is_uk_product ? 1 : 0,
          foodItem.image_url,
          foodItem.meal_type ? JSON.stringify(foodItem.meal_type) : null,
          foodItem.in_stock ? 1 : 0,
          foodItem.last_purchased_date,
          1 // synced
        ]
      );
    }
  } catch (error) {
    console.error('Error saving food to local database:', error);
    throw error;
  }
};

/**
 * Search for food items by name
 * @param {string} query - The search query
 * @param {number} limit - Maximum number of results to return
 * @returns {Promise<Array>} - Array of food items
 */
export const searchFoodByName = async (query, limit = 20) => {
  try {
    if (!query || query.trim() === '') {
      return [];
    }
    
    // Check if we're online
    const netInfo = await NetInfo.fetch();
    const isConnected = netInfo.isConnected;
    
    // Search local database
    const db = await getLocalDatabase();
    const localResults = await db.executeSql(
      'SELECT * FROM food_items WHERE name LIKE ? ORDER BY name LIMIT ?',
      [`%${query}%`, limit]
    );
    
    const localFoods = [];
    for (let i = 0; i < localResults[0].rows.length; i++) {
      localFoods.push(localResults[0].rows.item(i));
    }
    
    // If offline or we have enough results, return local results
    if (!isConnected || localFoods.length >= limit) {
      return localFoods;
    }
    
    // Search Supabase
    const { data: supabaseData, error: supabaseError } = await supabase
      .from('food_items')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true })
      .limit(limit);
    
    if (supabaseError) {
      throw supabaseError;
    }
    
    // Combine results, removing duplicates
    const combinedResults = [...localFoods];
    
    for (const supabaseItem of supabaseData || []) {
      // Check if this item is already in our results by barcode
      const existingItem = combinedResults.find(item => 
        item.barcode === supabaseItem.barcode || item.id === supabaseItem.id
      );
      
      if (!existingItem) {
        combinedResults.push(supabaseItem);
        // Save to local database
        await saveToLocalDatabase(supabaseItem);
      }
    }
    
    // If we still need more results, search Open Food Facts API
    if (combinedResults.length < limit && isConnected) {
      const response = await fetch(`${OPEN_FOOD_FACTS_API_URL}/search?search_terms=${encodeURIComponent(query)}&page_size=${limit}&json=true`);
      
      if (!response.ok) {
        throw new Error(`Open Food Facts API error: ${response.status} ${response.statusText}`);
      }
      
      const apiData = await response.json();
      
      // Convert API data to our format
      const apiItems = apiData.products.map(product => ({
        id: null,
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
        meal_type: null,
        in_stock: true,
        last_purchased_date: null
      }));
      
      // Add API items to results, removing duplicates
      for (const apiItem of apiItems) {
        // Check if this item is already in our results by barcode
        const existingItem = combinedResults.find(item => item.barcode === apiItem.barcode);
        
        if (!existingItem) {
          combinedResults.push(apiItem);
        }
      }
    }
    
    // Limit to the requested number of results
    return combinedResults.slice(0, limit);
  } catch (error) {
    console.error('Error searching food by name:', error);
    throw error;
  }
};

/**
 * Create a custom food item
 * @param {Object} foodItem - The food item to create
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} - The created food item or null if creation failed
 */
export const createCustomFoodItem = async (foodItem, userId) => {
  try {
    const newFoodItem = {
      ...foodItem,
      is_user_created: true,
      user_id: userId,
      source: 'User Created'
    };
    
    // Check if we're online
    const netInfo = await NetInfo.fetch();
    const isConnected = netInfo.isConnected;
    
    let savedItem = null;
    
    // Save to Supabase if online
    if (isConnected) {
      const { data, error } = await supabase
        .from('food_items')
        .insert([newFoodItem])
        .select();
      
      if (error) throw error;
      
      savedItem = data[0];
    } else {
      // Generate a temporary ID for offline use
      newFoodItem.id = `temp_${Date.now()}`;
      savedItem = newFoodItem;
    }
    
    // Save to local database
    await saveToLocalDatabase({
      ...savedItem,
      synced: isConnected ? 1 : 0
    });
    
    return savedItem;
  } catch (error) {
    console.error('Error creating custom food item:', error);
    throw error;
  }
};

/**
 * Update food item stock status
 * @param {string} id - The food item ID
 * @param {boolean} inStock - Whether the food item is in stock
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} - The updated food item or null if update failed
 */
export const updateFoodItemStockStatus = async (id, inStock, userId) => {
  try {
    // Check if we're online
    const netInfo = await NetInfo.fetch();
    const isConnected = netInfo.isConnected;
    
    const updates = {
      in_stock: inStock,
      last_purchased_date: inStock ? new Date().toISOString().split('T')[0] : null
    };
    
    let updatedItem = null;
    
    // Update in Supabase if online
    if (isConnected) {
      const { data, error } = await supabase
        .from('food_items')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      updatedItem = data[0];
    }
    
    // Update in local database
    const db = await getLocalDatabase();
    await db.executeSql(
      `UPDATE food_items SET 
        in_stock = ?, 
        last_purchased_date = ?,
        synced = ?
      WHERE id = ?`,
      [
        inStock ? 1 : 0,
        inStock ? new Date().toISOString().split('T')[0] : null,
        isConnected ? 1 : 0,
        id
      ]
    );
    
    // Get updated item from local database if not already fetched from Supabase
    if (!updatedItem) {
      const localResult = await db.executeSql(
        'SELECT * FROM food_items WHERE id = ?',
        [id]
      );
      
      if (localResult[0].rows.length > 0) {
        updatedItem = localResult[0].rows.item(0);
      }
    }
    
    return updatedItem;
  } catch (error) {
    console.error('Error updating food item stock status:', error);
    throw error;
  }
};

/**
 * Synchronize local food items with Supabase
 * @returns {Promise<void>}
 */
export const syncFoodItems = async () => {
  try {
    // Check if we're online
    const netInfo = await NetInfo.fetch();
    const isConnected = netInfo.isConnected;
    
    if (!isConnected) {
      return;
    }
    
    // Get unsynced food items from local database
    const db = await getLocalDatabase();
    const unsyncedResults = await db.executeSql(
      'SELECT * FROM food_items WHERE synced = 0',
      []
    );
    
    const unsyncedItems = [];
    for (let i = 0; i < unsyncedResults[0].rows.length; i++) {
      unsyncedItems.push(unsyncedResults[0].rows.item(i));
    }
    
    // Sync each unsynced item
    for (const item of unsyncedItems) {
      // Convert SQLite boolean to JS boolean
      const foodItem = {
        ...item,
        is_user_created: item.is_user_created === 1,
        is_uk_product: item.is_uk_product === 1,
        in_stock: item.in_stock === 1,
        meal_type: item.meal_type ? JSON.parse(item.meal_type) : null
      };
      
      // Remove temporary ID if it exists
      if (foodItem.id && foodItem.id.startsWith('temp_')) {
        delete foodItem.id;
      }
      
      // Remove synced flag
      delete foodItem.synced;
      
      // Insert or update in Supabase
      if (!foodItem.id) {
        // New item
        const { data, error } = await supabase
          .from('food_items')
          .insert([foodItem])
          .select();
        
        if (error) throw error;
        
        // Update local item with new ID and mark as synced
        await db.executeSql(
          'UPDATE food_items SET id = ?, synced = 1 WHERE barcode = ?',
          [data[0].id, foodItem.barcode]
        );
      } else {
        // Existing item
        const { error } = await supabase
          .from('food_items')
          .update(foodItem)
          .eq('id', foodItem.id);
        
        if (error) throw error;
        
        // Mark as synced
        await db.executeSql(
          'UPDATE food_items SET synced = 1 WHERE id = ?',
          [foodItem.id]
        );
      }
    }
  } catch (error) {
    console.error('Error syncing food items:', error);
    throw error;
  }
};