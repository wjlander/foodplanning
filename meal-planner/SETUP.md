# UK Meal Planner Setup Guide

This guide will walk you through setting up the UK Meal Planner application for development and deployment.

## Prerequisites

Before you begin, make sure you have the following installed:

- Node.js (v14 or higher)
- npm or yarn
- Git

You'll also need accounts for:
- [Supabase](https://supabase.com/) - For database and authentication
- [Fitbit Developer](https://dev.fitbit.com/) - For Fitbit API integration

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/uk-meal-planner.git
cd uk-meal-planner
```

## Step 2: Install Dependencies

```bash
npm install
# or
yarn install
```

## Step 3: Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com/)
2. Go to the SQL Editor in your Supabase dashboard
3. Copy the contents of `supabase/schema.sql` and run it in the SQL Editor
4. This will create all the necessary tables, functions, and security policies

## Step 4: Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_FITBIT_CLIENT_ID=your_fitbit_client_id
REACT_APP_FITBIT_CLIENT_SECRET=your_fitbit_client_secret
REACT_APP_FITBIT_REDIRECT_URI=http://localhost:3000/fitbit-callback
```

Replace the placeholder values with your actual credentials.

## Step 5: Set Up Fitbit API Integration

1. Go to [dev.fitbit.com](https://dev.fitbit.com/) and log in
2. Create a new application
3. Set the OAuth 2.0 Application Type to "Client"
4. Set the Callback URL to `http://localhost:3000/fitbit-callback` (for development)
5. Request the following scopes:
   - `nutrition`
   - `profile`
6. Save your application and note the Client ID and Client Secret

## Step 6: Start the Development Server

```bash
npm start
# or
yarn start
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Step 7: Build for Production

When you're ready to deploy the application:

```bash
npm run build
# or
yarn build
```

This will create a `build` directory with the production-ready files.

## Deployment Options

### Option 1: Netlify

1. Install the Netlify CLI: `npm install -g netlify-cli`
2. Login to Netlify: `netlify login`
3. Deploy the site: `netlify deploy --prod`

### Option 2: Vercel

1. Install the Vercel CLI: `npm install -g vercel`
2. Login to Vercel: `vercel login`
3. Deploy the site: `vercel --prod`

### Option 3: Firebase

1. Install the Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize Firebase: `firebase init`
4. Deploy the site: `firebase deploy`

## Environment Variables for Production

Make sure to set the same environment variables in your production environment. For Netlify, Vercel, or Firebase, you can set these in their respective dashboards.

## Troubleshooting

### Database Issues

If you encounter database issues:

1. Check that your Supabase URL and anon key are correct
2. Verify that the database schema was created correctly
3. Check the Row Level Security (RLS) policies

### Fitbit Integration Issues

If Fitbit integration isn't working:

1. Verify your Fitbit API credentials
2. Check that the redirect URI matches exactly
3. Ensure you've requested the necessary scopes

### API Rate Limits

The Open Food Facts API has rate limits. If you're experiencing issues:

1. Implement caching for frequently accessed data
2. Consider using a proxy server
3. Add error handling for rate limit responses

## Additional Resources

- [Supabase Documentation](https://supabase.io/docs)
- [Fitbit API Documentation](https://dev.fitbit.com/build/reference/web-api/)
- [Open Food Facts API Documentation](https://world.openfoodfacts.org/data)
- [React Documentation](https://reactjs.org/docs/getting-started.html)