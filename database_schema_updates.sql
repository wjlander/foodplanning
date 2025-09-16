-- Add meal type and stock status to food_items table
ALTER TABLE food_items
ADD COLUMN meal_type TEXT[] DEFAULT NULL,
ADD COLUMN in_stock BOOLEAN DEFAULT TRUE,
ADD COLUMN last_purchased_date DATE DEFAULT NULL;

-- Create ready_meals table
CREATE TABLE ready_meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  description TEXT,
  meal_type TEXT[] NOT NULL, -- Array of meal types: breakfast, lunch, dinner, snack
  calories_per_serving INTEGER,
  protein_g DECIMAL(5,2),
  carbs_g DECIMAL(5,2),
  fat_g DECIMAL(5,2),
  serving_size TEXT,
  serving_size_grams DECIMAL(7,2),
  in_stock BOOLEAN DEFAULT TRUE,
  last_purchased_date DATE DEFAULT NULL,
  barcode TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE ready_meals ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only access their own ready meals
CREATE POLICY ready_meals_policy ON ready_meals
  USING (auth.uid() = user_id);

-- Add meal type to recipes table
ALTER TABLE recipes
ADD COLUMN meal_type TEXT[] DEFAULT NULL;

-- Create function to suggest meals based on meal time
CREATE OR REPLACE FUNCTION suggest_meals(p_user_id UUID, p_meal_type TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  type TEXT, -- 'ready_meal', 'recipe', or 'food_item'
  meal_type TEXT[],
  calories INTEGER,
  in_stock BOOLEAN
) AS $$
BEGIN
  -- Return ready meals matching the meal type
  RETURN QUERY
  SELECT 
    rm.id,
    rm.name,
    rm.description,
    'ready_meal'::TEXT as type,
    rm.meal_type,
    rm.calories_per_serving as calories,
    rm.in_stock
  FROM ready_meals rm
  WHERE 
    rm.user_id = p_user_id AND
    p_meal_type = ANY(rm.meal_type);
  
  -- Return recipes matching the meal type
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.description,
    'recipe'::TEXT as type,
    r.meal_type,
    0 as calories, -- Calories would need to be calculated from ingredients
    TRUE as in_stock -- Recipes are always "in stock" but ingredients might not be
  FROM recipes r
  WHERE 
    r.user_id = p_user_id AND
    p_meal_type = ANY(r.meal_type);
    
  -- Return food items matching the meal type
  RETURN QUERY
  SELECT 
    fi.id,
    fi.name,
    fi.description,
    'food_item'::TEXT as type,
    fi.meal_type,
    fi.calories_per_100g as calories,
    fi.in_stock
  FROM food_items fi
  WHERE 
    (fi.user_id = p_user_id OR fi.user_id IS NULL) AND
    p_meal_type = ANY(fi.meal_type);
END;
$$ LANGUAGE plpgsql;

-- Update shopping_list_items to track out-of-stock items
ALTER TABLE shopping_list_items
ADD COLUMN is_out_of_stock BOOLEAN DEFAULT FALSE,
ADD COLUMN food_item_type TEXT DEFAULT 'food_item', -- 'food_item' or 'ready_meal'
ADD COLUMN ready_meal_id UUID REFERENCES ready_meals(id) ON DELETE SET NULL;

-- Create function to generate shopping list for out-of-stock items
CREATE OR REPLACE FUNCTION generate_out_of_stock_shopping_list(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_shopping_list_id UUID;
BEGIN
  -- Create new shopping list
  INSERT INTO shopping_lists (user_id, name, start_date, end_date)
  VALUES (p_user_id, 'Out of Stock Items - ' || NOW()::DATE::TEXT, NOW()::DATE, NULL)
  RETURNING id INTO v_shopping_list_id;
  
  -- Add out-of-stock food items to the shopping list
  INSERT INTO shopping_list_items (
    shopping_list_id,
    food_item_id,
    name,
    quantity,
    unit,
    is_purchased,
    category,
    is_out_of_stock,
    food_item_type
  )
  SELECT 
    v_shopping_list_id,
    id,
    name,
    1, -- Default quantity
    'item', -- Default unit
    FALSE, -- Not purchased
    'Out of Stock', -- Category
    TRUE, -- Is out of stock
    'food_item' -- Type
  FROM food_items
  WHERE user_id = p_user_id AND in_stock = FALSE;
  
  -- Add out-of-stock ready meals to the shopping list
  INSERT INTO shopping_list_items (
    shopping_list_id,
    ready_meal_id,
    name,
    quantity,
    unit,
    is_purchased,
    category,
    is_out_of_stock,
    food_item_type
  )
  SELECT 
    v_shopping_list_id,
    id,
    name,
    1, -- Default quantity
    'item', -- Default unit
    FALSE, -- Not purchased
    'Out of Stock Ready Meals', -- Category
    TRUE, -- Is out of stock
    'ready_meal' -- Type
  FROM ready_meals
  WHERE user_id = p_user_id AND in_stock = FALSE;
  
  RETURN v_shopping_list_id;
END;
$$ LANGUAGE plpgsql;