-- Add rating field to recipes table
ALTER TABLE recipes
ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN rating_count INTEGER DEFAULT 0,
ADD COLUMN last_made_date DATE;

-- Add rating field to ready_meals table
ALTER TABLE ready_meals
ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN rating_count INTEGER DEFAULT 0,
ADD COLUMN last_made_date DATE;

-- Create meal_ratings table to track individual ratings
CREATE TABLE meal_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ready_meal_id UUID REFERENCES ready_meals(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Either recipe_id or ready_meal_id must be provided, but not both
  CHECK ((recipe_id IS NOT NULL AND ready_meal_id IS NULL) OR 
         (recipe_id IS NULL AND ready_meal_id IS NOT NULL))
);

-- Enable Row Level Security
ALTER TABLE meal_ratings ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only access their own ratings
CREATE POLICY meal_ratings_policy ON meal_ratings
  USING (auth.uid() = user_id);

-- Create function to update average rating
CREATE OR REPLACE FUNCTION update_average_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update recipe rating
  IF NEW.recipe_id IS NOT NULL THEN
    UPDATE recipes
    SET 
      rating = (
        SELECT ROUND(AVG(rating))
        FROM meal_ratings
        WHERE recipe_id = NEW.recipe_id
      ),
      rating_count = (
        SELECT COUNT(*)
        FROM meal_ratings
        WHERE recipe_id = NEW.recipe_id
      )
    WHERE id = NEW.recipe_id;
  END IF;
  
  -- Update ready meal rating
  IF NEW.ready_meal_id IS NOT NULL THEN
    UPDATE ready_meals
    SET 
      rating = (
        SELECT ROUND(AVG(rating))
        FROM meal_ratings
        WHERE ready_meal_id = NEW.ready_meal_id
      ),
      rating_count = (
        SELECT COUNT(*)
        FROM meal_ratings
        WHERE ready_meal_id = NEW.ready_meal_id
      )
    WHERE id = NEW.ready_meal_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update average rating
CREATE TRIGGER update_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON meal_ratings
FOR EACH ROW EXECUTE FUNCTION update_average_rating();

-- Create function to suggest meals based on rating
CREATE OR REPLACE FUNCTION suggest_top_rated_meals(p_user_id UUID, p_meal_type TEXT, p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  type TEXT, -- 'ready_meal' or 'recipe'
  meal_type TEXT[],
  rating INTEGER,
  rating_count INTEGER,
  last_made_date DATE
) AS $$
BEGIN
  -- Return top-rated recipes matching the meal type
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.description,
    'recipe'::TEXT as type,
    r.meal_type,
    r.rating,
    r.rating_count,
    r.last_made_date
  FROM recipes r
  WHERE 
    r.user_id = p_user_id AND
    p_meal_type = ANY(r.meal_type) AND
    r.rating IS NOT NULL
  ORDER BY r.rating DESC, r.rating_count DESC, r.last_made_date ASC NULLS FIRST
  LIMIT p_limit;
  
  -- Return top-rated ready meals matching the meal type
  RETURN QUERY
  SELECT 
    rm.id,
    rm.name,
    rm.description,
    'ready_meal'::TEXT as type,
    rm.meal_type,
    rm.rating,
    rm.rating_count,
    rm.last_made_date
  FROM ready_meals rm
  WHERE 
    rm.user_id = p_user_id AND
    p_meal_type = ANY(rm.meal_type) AND
    rm.rating IS NOT NULL
  ORDER BY rm.rating DESC, rm.rating_count DESC, rm.last_made_date ASC NULLS FIRST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;