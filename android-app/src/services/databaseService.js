import SQLite from 'react-native-sqlite-storage';

// Enable promise-based API
SQLite.enablePromise(true);

// Database connection
let database = null;

/**
 * Initialize the database
 * @returns {Promise<void>}
 */
export const initDatabase = async () => {
  try {
    // Open database
    database = await SQLite.openDatabase({
      name: 'mealplanner.db',
      location: 'default',
    });
    
    // Create tables
    await createTables();
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

/**
 * Get the database instance
 * @returns {Promise<SQLite.SQLiteDatabase>}
 */
export const getLocalDatabase = async () => {
  if (!database) {
    await initDatabase();
  }
  return database;
};

/**
 * Create database tables
 * @returns {Promise<void>}
 */
const createTables = async () => {
  try {
    // Create food_items table
    await database.executeSql(`
      CREATE TABLE IF NOT EXISTS food_items (
        id TEXT PRIMARY KEY,
        barcode TEXT,
        name TEXT NOT NULL,
        brand TEXT,
        description TEXT,
        serving_size TEXT,
        serving_size_grams REAL,
        calories_per_100g INTEGER,
        protein_g REAL,
        carbs_g REAL,
        fat_g REAL,
        fiber_g REAL,
        sugar_g REAL,
        sodium_mg REAL,
        is_user_created INTEGER DEFAULT 0,
        user_id TEXT,
        source TEXT,
        is_uk_product INTEGER DEFAULT 1,
        image_url TEXT,
        meal_type TEXT,
        in_stock INTEGER DEFAULT 1,
        last_purchased_date TEXT,
        synced INTEGER DEFAULT 0
      )
    `);
    
    // Create index on barcode
    await database.executeSql('CREATE INDEX IF NOT EXISTS idx_food_items_barcode ON food_items(barcode)');
    
    // Create ready_meals table
    await database.executeSql(`
      CREATE TABLE IF NOT EXISTS ready_meals (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        brand TEXT,
        description TEXT,
        meal_type TEXT,
        calories_per_serving INTEGER,
        protein_g REAL,
        carbs_g REAL,
        fat_g REAL,
        serving_size TEXT,
        serving_size_grams REAL,
        in_stock INTEGER DEFAULT 1,
        last_purchased_date TEXT,
        barcode TEXT,
        image_url TEXT,
        rating INTEGER,
        rating_count INTEGER DEFAULT 0,
        last_made_date TEXT,
        created_at TEXT,
        updated_at TEXT,
        synced INTEGER DEFAULT 0
      )
    `);
    
    // Create recipes table
    await database.executeSql(`
      CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        servings INTEGER NOT NULL DEFAULT 1,
        prep_time_minutes INTEGER,
        cook_time_minutes INTEGER,
        instructions TEXT,
        is_favorite INTEGER DEFAULT 0,
        image_url TEXT,
        tags TEXT,
        meal_type TEXT,
        rating INTEGER,
        rating_count INTEGER DEFAULT 0,
        last_made_date TEXT,
        created_at TEXT,
        updated_at TEXT,
        synced INTEGER DEFAULT 0
      )
    `);
    
    // Create recipe_ingredients table
    await database.executeSql(`
      CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id TEXT PRIMARY KEY,
        recipe_id TEXT NOT NULL,
        food_item_id TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        notes TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
        FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE RESTRICT
      )
    `);
    
    // Create meal_plans table
    await database.executeSql(`
      CREATE TABLE IF NOT EXISTS meal_plans (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        notes TEXT,
        created_at TEXT,
        updated_at TEXT,
        synced INTEGER DEFAULT 0
      )
    `);
    
    // Create meals table
    await database.executeSql(`
      CREATE TABLE IF NOT EXISTS meals (
        id TEXT PRIMARY KEY,
        meal_plan_id TEXT NOT NULL,
        meal_type TEXT NOT NULL,
        time_of_day TEXT,
        notes TEXT,
        is_completed INTEGER DEFAULT 0,
        synced_to_fitbit INTEGER DEFAULT 0,
        fitbit_sync_time TEXT,
        created_at TEXT,
        updated_at TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE CASCADE
      )
    `);
    
    // Create meal_items table
    await database.executeSql(`
      CREATE TABLE IF NOT EXISTS meal_items (
        id TEXT PRIMARY KEY,
        meal_id TEXT NOT NULL,
        food_item_id TEXT,
        recipe_id TEXT,
        ready_meal_id TEXT,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        servings INTEGER DEFAULT 1,
        notes TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
        FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE RESTRICT,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE RESTRICT,
        FOREIGN KEY (ready_meal_id) REFERENCES ready_meals(id) ON DELETE RESTRICT
      )
    `);
    
    // Create shopping_lists table
    await database.executeSql(`
      CREATE TABLE IF NOT EXISTS shopping_lists (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        start_date TEXT,
        end_date TEXT,
        is_completed INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT,
        synced INTEGER DEFAULT 0
      )
    `);
    
    // Create shopping_list_items table
    await database.executeSql(`
      CREATE TABLE IF NOT EXISTS shopping_list_items (
        id TEXT PRIMARY KEY,
        shopping_list_id TEXT NOT NULL,
        food_item_id TEXT,
        ready_meal_id TEXT,
        name TEXT NOT NULL,
        quantity REAL,
        unit TEXT,
        is_purchased INTEGER DEFAULT 0,
        category TEXT,
        notes TEXT,
        is_out_of_stock INTEGER DEFAULT 0,
        food_item_type TEXT DEFAULT 'food_item',
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (shopping_list_id) REFERENCES shopping_lists(id) ON DELETE CASCADE,
        FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE SET NULL,
        FOREIGN KEY (ready_meal_id) REFERENCES ready_meals(id) ON DELETE SET NULL
      )
    `);
    
    // Create meal_ratings table
    await database.executeSql(`
      CREATE TABLE IF NOT EXISTS meal_ratings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        recipe_id TEXT,
        ready_meal_id TEXT,
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at TEXT,
        updated_at TEXT,
        synced INTEGER DEFAULT 0
      )
    `);
    
    // Create sync_queue table for tracking pending sync operations
    await database.executeSql(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        data TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating database tables:', error);
    throw error;
  }
};

/**
 * Close the database connection
 * @returns {Promise<void>}
 */
export const closeDatabase = async () => {
  try {
    if (database) {
      await database.close();
      database = null;
      console.log('Database closed successfully');
    }
  } catch (error) {
    console.error('Error closing database:', error);
    throw error;
  }
};

/**
 * Add an item to the sync queue
 * @param {string} tableName - The name of the table
 * @param {string} recordId - The ID of the record
 * @param {string} operation - The operation (INSERT, UPDATE, DELETE)
 * @param {Object} data - The data to sync (for INSERT and UPDATE)
 * @returns {Promise<void>}
 */
export const addToSyncQueue = async (tableName, recordId, operation, data = null) => {
  try {
    const db = await getLocalDatabase();
    await db.executeSql(
      'INSERT INTO sync_queue (table_name, record_id, operation, data) VALUES (?, ?, ?, ?)',
      [tableName, recordId, operation, data ? JSON.stringify(data) : null]
    );
  } catch (error) {
    console.error('Error adding to sync queue:', error);
    throw error;
  }
};

/**
 * Process the sync queue
 * @returns {Promise<void>}
 */
export const processSyncQueue = async () => {
  try {
    const db = await getLocalDatabase();
    
    // Get all items in the sync queue
    const queueResults = await db.executeSql(
      'SELECT * FROM sync_queue ORDER BY created_at ASC',
      []
    );
    
    const queueItems = [];
    for (let i = 0; i < queueResults[0].rows.length; i++) {
      queueItems.push(queueResults[0].rows.item(i));
    }
    
    // Process each item
    for (const item of queueItems) {
      // Process the sync operation
      // This would involve making API calls to Supabase
      // Implementation depends on the specific requirements
      
      // Remove the item from the queue after processing
      await db.executeSql(
        'DELETE FROM sync_queue WHERE id = ?',
        [item.id]
      );
    }
  } catch (error) {
    console.error('Error processing sync queue:', error);
    throw error;
  }
};