#!/bin/bash

# UK Meal Planner Deployment Script

# Exit on error
set -e

echo "🚀 Deploying UK Meal Planner..."

# Check if environment variables are set
if [ -z "$REACT_APP_SUPABASE_URL" ] || [ -z "$REACT_APP_SUPABASE_ANON_KEY" ]; then
  echo "❌ Error: Environment variables REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY must be set."
  exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run tests
echo "🧪 Running tests..."
npm test -- --watchAll=false

# Build the application
echo "🔨 Building the application..."
npm run build

# Deploy to hosting service (example using Firebase)
# Uncomment and modify as needed for your hosting provider
# echo "🔥 Deploying to Firebase..."
# firebase deploy

# Deploy to Netlify
# Uncomment and modify as needed for Netlify
# echo "🌐 Deploying to Netlify..."
# netlify deploy --prod

# Deploy to Vercel
# Uncomment and modify as needed for Vercel
# echo "▲ Deploying to Vercel..."
# vercel --prod

echo "✅ Deployment complete!"