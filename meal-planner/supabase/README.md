# Supabase Setup for UK Meal Planner

This directory contains the database schema and setup instructions for the UK Meal Planner application using Supabase.

## Getting Started

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign up or log in
2. Create a new project
3. Note your project URL and anon key (you'll need these for the application)

### 2. Set Up the Database Schema

1. Navigate to the SQL Editor in your Supabase dashboard
2. Copy the contents of `schema.sql` from this directory
3. Paste it into the SQL Editor and run the script
4. This will create all necessary tables, functions, triggers, and security policies

### 3. Configure Authentication

1. Go to Authentication > Settings in your Supabase dashboard
2. Enable Email authentication
3. Configure any additional authentication providers as needed
4. Set up email templates for verification, password reset, etc.

### 4. Set Up Storage

1. Go to Storage in your Supabase dashboard
2. Create the following buckets:
   - `food-images` - for food item images
   - `recipe-images` - for recipe images
   - `user-uploads` - for user-uploaded content
3. Set the following bucket policies:
   - `food-images`: Public read, authenticated write
   - `recipe-images`: Public read, authenticated write
   - `user-uploads`: Private (authenticated read/write)

### 5. Configure Environment Variables

Add the following environment variables to your application:

```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Schema

The database schema includes the following tables:

- `users` - User profiles (extends Supabase auth.users)
- `profiles` - Additional profiles for meal planning (e.g., partner, family member)
- `food_items` - Food database with nutritional information
- `recipes` - User-created recipes
- `recipe_ingredients` - Ingredients for recipes
- `meal_plans` - Daily meal plans
- `meals` - Individual meals within a meal plan (breakfast, lunch, dinner, snack)
- `meal_items` - Food items or recipes in a meal
- `shopping_lists` - Shopping lists generated from meal plans
- `shopping_list_items` - Items in a shopping list
- `nutrition_logs` - Daily nutrition totals
- `fitbit_sync_logs` - Logs of Fitbit synchronization

## Security

The schema includes Row Level Security (RLS) policies to ensure users can only access their own data. Public food items from the database are accessible to all users, but user-created food items are private.

## Functions and Triggers

The schema includes the following functions and triggers:

- `update_nutrition_log()` - Automatically updates nutrition logs when meal items change
- `generate_shopping_list()` - Generates a shopping list from meal plans for a date range

## Indexes

Indexes are created for frequently queried fields to improve performance:

- Barcode scanning
- User's food items
- Meal planning by date
- Nutrition tracking by date
- Recipe and food item search (using GIN indexes for text search)

## Realtime

Realtime is enabled for key tables to support multi-device synchronization:

- Meal plans, meals, and meal items
- Shopping lists and shopping list items