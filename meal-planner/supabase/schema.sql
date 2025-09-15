-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users Table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  height_cm INTEGER,
  weight_kg DECIMAL(5,2),
  activity_level TEXT,
  dietary_preferences JSONB,
  daily_calorie_goal INTEGER,
  macro_goals JSONB,
  fitbit_connected BOOLEAN DEFAULT FALSE,
  fitbit_tokens JSONB
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only access their own data
CREATE POLICY users_policy ON users
  USING (auth.uid() = id);

-- Profiles Table (for additional people in meal planning)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  date_of_birth DATE,
  height_cm INTEGER,
  weight_kg DECIMAL(5,2),
  activity_level TEXT,
  dietary_preferences JSONB,
  daily_calorie_goal INTEGER,
  macro_goals JSONB,
  
  UNIQUE(user_id, name)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only access their own profiles
CREATE POLICY profiles_policy ON profiles
  USING (auth.uid() = user_id);

-- Food Items Table
CREATE TABLE food_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barcode TEXT UNIQUE,
  name TEXT NOT NULL,
  brand TEXT,
  description TEXT,
  serving_size TEXT,
  serving_size_grams DECIMAL(7,2),
  calories_per_100g INTEGER,
  protein_g DECIMAL(5,2),
  carbs_g DECIMAL(5,2),
  fat_g DECIMAL(5,2),
  fiber_g DECIMAL(5,2),
  sugar_g DECIMAL(5,2),
  sodium_mg DECIMAL(7,2),
  is_user_created BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source TEXT,
  additional_nutrients JSONB,
  is_uk_product BOOLEAN DEFAULT TRUE,
  image_url TEXT
);

-- Index for barcode scanning
CREATE INDEX food_items_barcode_idx ON food_items(barcode);

-- Enable Row Level Security
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;

-- Policy for public food items (from database)
CREATE POLICY food_items_public_policy ON food_items
  USING (is_user_created = FALSE);

-- Policy for user-created food items
CREATE POLICY food_items_user_policy ON food_items
  USING (is_user_created = TRUE AND auth.uid() = user_id);

-- Recipes Table
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  servings INTEGER NOT NULL DEFAULT 1,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_favorite BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  tags TEXT[]
);

-- Enable Row Level Security
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only access their own recipes
CREATE POLICY recipes_policy ON recipes
  USING (auth.uid() = user_id);

-- Recipe Ingredients Table
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE RESTRICT,
  quantity DECIMAL(7,2) NOT NULL,
  unit TEXT NOT NULL,
  notes TEXT,
  
  UNIQUE(recipe_id, food_item_id)
);

-- Enable Row Level Security
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Create policy based on recipe ownership
CREATE POLICY recipe_ingredients_policy ON recipe_ingredients
  USING (EXISTS (
    SELECT 1 FROM recipes 
    WHERE recipes.id = recipe_ingredients.recipe_id 
    AND recipes.user_id = auth.uid()
  ));

-- Meal Plans Table
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only access their own meal plans
CREATE POLICY meal_plans_policy ON meal_plans
  USING (auth.uid() = user_id);

-- Meals Table
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  time_of_day TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  synced_to_fitbit BOOLEAN DEFAULT FALSE,
  fitbit_sync_time TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(meal_plan_id, meal_type)
);

-- Enable Row Level Security
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- Create policy based on meal plan ownership
CREATE POLICY meals_policy ON meals
  USING (EXISTS (
    SELECT 1 FROM meal_plans 
    WHERE meal_plans.id = meals.meal_plan_id 
    AND meal_plans.user_id = auth.uid()
  ));

-- Meal Items Table
CREATE TABLE meal_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  food_item_id UUID REFERENCES food_items(id) ON DELETE RESTRICT,
  recipe_id UUID REFERENCES recipes(id) ON DELETE RESTRICT,
  quantity DECIMAL(7,2) NOT NULL,
  unit TEXT NOT NULL,
  servings INTEGER DEFAULT 1,
  notes TEXT,
  
  -- Either food_item_id or recipe_id must be provided, but not both
  CHECK ((food_item_id IS NOT NULL AND recipe_id IS NULL) OR 
         (food_item_id IS NULL AND recipe_id IS NOT NULL))
);

-- Enable Row Level Security
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;

-- Create policy based on meal ownership
CREATE POLICY meal_items_policy ON meal_items
  USING (EXISTS (
    SELECT 1 FROM meals 
    JOIN meal_plans ON meals.meal_plan_id = meal_plans.id
    WHERE meals.id = meal_items.meal_id 
    AND meal_plans.user_id = auth.uid()
  ));

-- Shopping Lists Table
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  start_date DATE,
  end_date DATE,
  is_completed BOOLEAN DEFAULT FALSE
);

-- Enable Row Level Security
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only access their own shopping lists
CREATE POLICY shopping_lists_policy ON shopping_lists
  USING (auth.uid() = user_id);

-- Shopping List Items Table
CREATE TABLE shopping_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  food_item_id UUID REFERENCES food_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity DECIMAL(7,2),
  unit TEXT,
  is_purchased BOOLEAN DEFAULT FALSE,
  category TEXT,
  notes TEXT
);

-- Enable Row Level Security
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Create policy based on shopping list ownership
CREATE POLICY shopping_list_items_policy ON shopping_list_items
  USING (EXISTS (
    SELECT 1 FROM shopping_lists 
    WHERE shopping_lists.id = shopping_list_items.shopping_list_id 
    AND shopping_lists.user_id = auth.uid()
  ));

-- Nutrition Logs Table
CREATE TABLE nutrition_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_calories INTEGER,
  total_protein_g DECIMAL(7,2),
  total_carbs_g DECIMAL(7,2),
  total_fat_g DECIMAL(7,2),
  total_fiber_g DECIMAL(7,2),
  total_sugar_g DECIMAL(7,2),
  total_sodium_mg DECIMAL(7,2),
  additional_nutrients JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Either for the main user or a profile
  CHECK ((profile_id IS NULL) OR (user_id IS NOT NULL AND profile_id IS NOT NULL)),
  UNIQUE(user_id, profile_id, date)
);

-- Enable Row Level Security
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only access their own nutrition logs
CREATE POLICY nutrition_logs_policy ON nutrition_logs
  USING (auth.uid() = user_id);

-- Fitbit Sync Logs Table
CREATE TABLE fitbit_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sync_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL,
  details JSONB,
  error_message TEXT
);

-- Enable Row Level Security
ALTER TABLE fitbit_sync_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only access their own sync logs
CREATE POLICY fitbit_sync_logs_policy ON fitbit_sync_logs
  USING (auth.uid() = user_id);

-- Function to update nutrition log when meal items change
CREATE OR REPLACE FUNCTION update_nutrition_log()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_date DATE;
  v_total_calories INTEGER := 0;
  v_total_protein_g DECIMAL(7,2) := 0;
  v_total_carbs_g DECIMAL(7,2) := 0;
  v_total_fat_g DECIMAL(7,2) := 0;
  v_total_fiber_g DECIMAL(7,2) := 0;
  v_total_sugar_g DECIMAL(7,2) := 0;
  v_total_sodium_mg DECIMAL(7,2) := 0;
BEGIN
  -- Get user_id and date from the meal plan
  SELECT mp.user_id, mp.date INTO v_user_id, v_date
  FROM meals m
  JOIN meal_plans mp ON m.meal_plan_id = mp.id
  WHERE m.id = NEW.meal_id;
  
  -- Calculate nutrition totals for all meals on this date
  SELECT 
    SUM(CASE 
      WHEN mi.food_item_id IS NOT NULL THEN 
        (fi.calories_per_100g * mi.quantity * mi.servings) / 100
      ELSE 0
    END)::INTEGER,
    SUM(CASE 
      WHEN mi.food_item_id IS NOT NULL THEN 
        (fi.protein_g * mi.quantity * mi.servings) / 100
      ELSE 0
    END),
    SUM(CASE 
      WHEN mi.food_item_id IS NOT NULL THEN 
        (fi.carbs_g * mi.quantity * mi.servings) / 100
      ELSE 0
    END),
    SUM(CASE 
      WHEN mi.food_item_id IS NOT NULL THEN 
        (fi.fat_g * mi.quantity * mi.servings) / 100
      ELSE 0
    END),
    SUM(CASE 
      WHEN mi.food_item_id IS NOT NULL THEN 
        (fi.fiber_g * mi.quantity * mi.servings) / 100
      ELSE 0
    END),
    SUM(CASE 
      WHEN mi.food_item_id IS NOT NULL THEN 
        (fi.sugar_g * mi.quantity * mi.servings) / 100
      ELSE 0
    END),
    SUM(CASE 
      WHEN mi.food_item_id IS NOT NULL THEN 
        (fi.sodium_mg * mi.quantity * mi.servings) / 100
      ELSE 0
    END)
  INTO 
    v_total_calories,
    v_total_protein_g,
    v_total_carbs_g,
    v_total_fat_g,
    v_total_fiber_g,
    v_total_sugar_g,
    v_total_sodium_mg
  FROM meal_items mi
  JOIN meals m ON mi.meal_id = m.id
  JOIN meal_plans mp ON m.meal_plan_id = mp.id
  LEFT JOIN food_items fi ON mi.food_item_id = fi.id
  WHERE mp.date = v_date AND mp.user_id = v_user_id;
  
  -- Insert or update nutrition log
  INSERT INTO nutrition_logs (
    user_id, 
    date, 
    total_calories, 
    total_protein_g, 
    total_carbs_g, 
    total_fat_g, 
    total_fiber_g, 
    total_sugar_g, 
    total_sodium_mg
  )
  VALUES (
    v_user_id,
    v_date,
    v_total_calories,
    v_total_protein_g,
    v_total_carbs_g,
    v_total_fat_g,
    v_total_fiber_g,
    v_total_sugar_g,
    v_total_sodium_mg
  )
  ON CONFLICT (user_id, profile_id, date) 
  WHERE profile_id IS NULL
  DO UPDATE SET
    total_calories = EXCLUDED.total_calories,
    total_protein_g = EXCLUDED.total_protein_g,
    total_carbs_g = EXCLUDED.total_carbs_g,
    total_fat_g = EXCLUDED.total_fat_g,
    total_fiber_g = EXCLUDED.total_fiber_g,
    total_sugar_g = EXCLUDED.total_sugar_g,
    total_sodium_mg = EXCLUDED.total_sodium_mg,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for meal items
CREATE TRIGGER update_nutrition_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON meal_items
FOR EACH ROW EXECUTE FUNCTION update_nutrition_log();

-- Function to generate shopping list from meal plan
CREATE OR REPLACE FUNCTION generate_shopping_list(meal_plan_start_date DATE, meal_plan_end_date DATE, p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_shopping_list_id UUID;
  v_item RECORD;
BEGIN
  -- Create new shopping list
  INSERT INTO shopping_lists (user_id, name, start_date, end_date)
  VALUES (p_user_id, 'Shopping List ' || meal_plan_start_date::TEXT || ' to ' || meal_plan_end_date::TEXT, 
          meal_plan_start_date, meal_plan_end_date)
  RETURNING id INTO v_shopping_list_id;
  
  -- Insert food items from meal plans
  FOR v_item IN (
    SELECT 
      fi.id AS food_item_id,
      fi.name,
      SUM(mi.quantity * mi.servings) AS quantity,
      mi.unit
    FROM meal_items mi
    JOIN meals m ON mi.meal_id = m.id
    JOIN meal_plans mp ON m.meal_plan_id = mp.id
    JOIN food_items fi ON mi.food_item_id = fi.id
    WHERE mp.user_id = p_user_id
      AND mp.date BETWEEN meal_plan_start_date AND meal_plan_end_date
      AND mi.food_item_id IS NOT NULL
    GROUP BY fi.id, fi.name, mi.unit
  ) LOOP
    INSERT INTO shopping_list_items (
      shopping_list_id,
      food_item_id,
      name,
      quantity,
      unit
    ) VALUES (
      v_shopping_list_id,
      v_item.food_item_id,
      v_item.name,
      v_item.quantity,
      v_item.unit
    );
  END LOOP;
  
  -- Insert recipe ingredients
  FOR v_item IN (
    SELECT 
      fi.id AS food_item_id,
      fi.name,
      SUM(ri.quantity * mi.servings) AS quantity,
      ri.unit
    FROM meal_items mi
    JOIN meals m ON mi.meal_id = m.id
    JOIN meal_plans mp ON m.meal_plan_id = mp.id
    JOIN recipes r ON mi.recipe_id = r.id
    JOIN recipe_ingredients ri ON r.id = ri.recipe_id
    JOIN food_items fi ON ri.food_item_id = fi.id
    WHERE mp.user_id = p_user_id
      AND mp.date BETWEEN meal_plan_start_date AND meal_plan_end_date
      AND mi.recipe_id IS NOT NULL
    GROUP BY fi.id, fi.name, ri.unit
  ) LOOP
    -- Check if item already exists in the shopping list
    IF EXISTS (
      SELECT 1 FROM shopping_list_items 
      WHERE shopping_list_id = v_shopping_list_id 
        AND food_item_id = v_item.food_item_id
        AND unit = v_item.unit
    ) THEN
      -- Update quantity
      UPDATE shopping_list_items
      SET quantity = quantity + v_item.quantity
      WHERE shopping_list_id = v_shopping_list_id 
        AND food_item_id = v_item.food_item_id
        AND unit = v_item.unit;
    ELSE
      -- Insert new item
      INSERT INTO shopping_list_items (
        shopping_list_id,
        food_item_id,
        name,
        quantity,
        unit
      ) VALUES (
        v_shopping_list_id,
        v_item.food_item_id,
        v_item.name,
        v_item.quantity,
        v_item.unit
      );
    END IF;
  END LOOP;
  
  RETURN v_shopping_list_id;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX idx_food_items_barcode ON food_items(barcode);
CREATE INDEX idx_food_items_user_id ON food_items(user_id);
CREATE INDEX idx_meal_plans_user_date ON meal_plans(user_id, date);
CREATE INDEX idx_nutrition_logs_user_date ON nutrition_logs(user_id, date);
CREATE INDEX idx_recipes_name_gin ON recipes USING gin(name gin_trgm_ops);
CREATE INDEX idx_recipes_tags_gin ON recipes USING gin(tags);
CREATE INDEX idx_food_items_name_gin ON food_items USING gin(name gin_trgm_ops);
CREATE INDEX idx_food_items_brand_gin ON food_items USING gin(brand gin_trgm_ops);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE meal_plans, meals, meal_items;
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_lists, shopping_list_items;