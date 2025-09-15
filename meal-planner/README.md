# UK Meal Planner

A UK-based meal planning application that allows users to scan barcodes for ingredients and ready meals, plan meals for 1-2 people, track calories and macros, and sync with Fitbit food tracking.

## Features

- Barcode scanning for quick food entry
- UK-specific food database
- Meal planning for breakfast, lunch, dinner, and snacks
- Support for 1-2 people
- Calorie and macro tracking
- Fitbit integration for food tracking
- Supabase database for data storage

## Tech Stack

- React.js for the frontend
- Supabase for backend and database
- Quagga.js for barcode scanning
- Chart.js for nutrition visualization
- Fitbit API for integration

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account
- Fitbit Developer account (for API access)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with your Supabase and Fitbit API credentials:
   ```
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   REACT_APP_FITBIT_CLIENT_ID=your_fitbit_client_id
   ```
4. Start the development server:
   ```
   npm start
   ```

## Database Setup

The application uses Supabase as its database. The schema includes tables for:

- Users and profiles
- Food items and recipes
- Meal plans and meals
- Shopping lists
- Nutrition logs
- Fitbit sync logs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.