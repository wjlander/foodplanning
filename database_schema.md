# Supabase Database Schema for UK Meal Planning Application

## Overview

This document outlines the database schema design for a UK-based meal planning application using Supabase. The schema is designed to support barcode scanning, meal planning, nutrition tracking, and Fitbit integration.

## Tables Structure

### 1. users
Stores user account information and preferences.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
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
  fitbit_tokens JSONB,
  
  -- Row Level Security will be applied to this table
  CONSTRAINT proper_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only access their own data
CREATE POLICY users_policy ON users
  USING (auth.uid() = id);
```

### 2. profiles
Stores additional profiles for meal planning (e.g., partner, family member).

```sql
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
```

### 3. food_items
Stores food items from the UK food database and user-created items.

```sql
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
```

### 4. recipes
Stores user-created recipes.

```sql
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
```

### 5. recipe_ingredients
Links recipes to food items with quantities.

```sql
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
```

### 6. meal_plans
Stores meal plans for specific dates.

```sql
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
```

### 7. meals
Stores individual meals within a meal plan.

```sql
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
```

### 8. meal_items
Links meals to food items or recipes with quantities.

```sql
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
```

### 9. shopping_lists
Stores shopping lists generated from meal plans.

```sql
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
```

### 10. shopping_list_items
Stores items in a shopping list.

```sql
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
```

### 11. nutrition_logs
Stores daily nutrition totals.

```sql
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
```

### 12. fitbit_sync_logs
Tracks synchronization with Fitbit.

```sql
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
```

## Database Functions and Triggers

### 1. Update Nutrition Logs

```sql
CREATE OR REPLACE FUNCTION update_nutrition_log()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate nutrition totals from meal items and update nutrition_logs
  -- Implementation details depend on specific calculation requirements
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_nutrition_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON meal_items
FOR EACH ROW EXECUTE FUNCTION update_nutrition_log();
```

### 2. Generate Shopping List from Meal Plan

```sql
CREATE OR REPLACE FUNCTION generate_shopping_list(meal_plan_start_date DATE, meal_plan_end_date DATE, p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_shopping_list_id UUID;
BEGIN
  -- Create new shopping list
  INSERT INTO shopping_lists (user_id, name, start_date, end_date)
  VALUES (p_user_id, 'Shopping List ' || meal_plan_start_date::TEXT || ' to ' || meal_plan_end_date::TEXT, 
          meal_plan_start_date, meal_plan_end_date)
  RETURNING id INTO v_shopping_list_id;
  
  -- Insert items from meal plans into shopping list
  -- Implementation details depend on specific requirements
  
  RETURN v_shopping_list_id;
END;
$$ LANGUAGE plpgsql;
```

## Indexes

```sql
-- Barcode scanning performance
CREATE INDEX idx_food_items_barcode ON food_items(barcode);

-- User's food items lookup
CREATE INDEX idx_food_items_user_id ON food_items(user_id);

-- Meal planning by date
CREATE INDEX idx_meal_plans_user_date ON meal_plans(user_id, date);

-- Nutrition tracking by date
CREATE INDEX idx_nutrition_logs_user_date ON nutrition_logs(user_id, date);

-- Recipe search
CREATE INDEX idx_recipes_name_gin ON recipes USING gin(name gin_trgm_ops);
CREATE INDEX idx_recipes_tags_gin ON recipes USING gin(tags);

-- Food item search
CREATE INDEX idx_food_items_name_gin ON food_items USING gin(name gin_trgm_ops);
CREATE INDEX idx_food_items_brand_gin ON food_items USING gin(brand gin_trgm_ops);
```

## Row Level Security (RLS)

All tables have Row Level Security enabled to ensure users can only access their own data. Policies are created to:

1. Allow users to read/write only their own data
2. Allow access to public food database items
3. Restrict access to other users' custom food items and recipes

## Extensions

```sql
-- For UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- For full-text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- For JSONB operations
CREATE EXTENSION IF NOT EXISTS "hstore";
```

## Supabase Realtime Configuration

Enable realtime for the following tables to support multi-device synchronization:

```sql
-- Enable realtime for meal planning
ALTER PUBLICATION supabase_realtime ADD TABLE meal_plans, meals, meal_items;

-- Enable realtime for shopping lists
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_lists, shopping_list_items;
```

## Backup and Maintenance

Configure regular database backups using Supabase's built-in backup functionality. Set up scheduled maintenance tasks for:

1. Cleaning up old sync logs
2. Optimizing database performance
3. Updating food database items from external sources