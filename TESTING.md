# Testing Guide for UK Meal Planner

This document provides comprehensive testing procedures for both the web application and Android app of the UK Meal Planner project.

## Table of Contents

- [Testing Strategy](#testing-strategy)
- [Web Application Testing](#web-application-testing)
  - [Unit Testing](#unit-testing)
  - [Integration Testing](#integration-testing)
  - [End-to-End Testing](#end-to-end-testing)
  - [Performance Testing](#performance-testing)
  - [Accessibility Testing](#accessibility-testing)
- [Android App Testing](#android-app-testing)
  - [Unit Testing](#android-unit-testing)
  - [Integration Testing](#android-integration-testing)
  - [UI Testing](#ui-testing)
  - [Performance Testing](#android-performance-testing)
- [Database Testing](#database-testing)
- [API Testing](#api-testing)
- [Security Testing](#security-testing)
- [User Acceptance Testing](#user-acceptance-testing)
- [Continuous Integration Testing](#continuous-integration-testing)
- [Test Reporting](#test-reporting)

## Testing Strategy

### Testing Pyramid

The UK Meal Planner follows the testing pyramid approach:

1. **Unit Tests**: Largest number of tests, focusing on individual functions and components
2. **Integration Tests**: Testing interactions between components
3. **End-to-End Tests**: Smallest number of tests, focusing on complete user flows

### Test Environments

- **Development**: Local development environment for developers
- **Staging**: Environment that mirrors production for testing before deployment
- **Production**: Live environment for end users

## Web Application Testing

### Unit Testing

#### Setup

1. **Install Testing Dependencies**:
   ```bash
   cd meal-planner
   npm install --save-dev jest @testing-library/react @testing-library/jest-dom
   ```

2. **Configure Jest**:
   - Create `jest.config.js` in the project root:
     ```javascript
     module.exports = {
       testEnvironment: 'jsdom',
       setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
       moduleNameMapper: {
         '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
         '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js'
       }
     };
     ```

3. **Create Setup File**:
   - Create `src/setupTests.js`:
     ```javascript
     import '@testing-library/jest-dom';
     ```

#### Running Unit Tests

```bash
npm test
```

#### Example Unit Test

```javascript
// src/components/__tests__/ThemeToggle.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import ThemeToggle from '../ThemeToggle';
import { ThemeContext } from '../../context/ThemeContext';

describe('ThemeToggle', () => {
  it('renders correctly in light mode', () => {
    const toggleTheme = jest.fn();
    const { getByText } = render(
      <ThemeContext.Provider value={{ theme: 'light', toggleTheme }}>
        <ThemeToggle />
      </ThemeContext.Provider>
    );
    
    expect(getByText('Dark Mode')).toBeInTheDocument();
  });
  
  it('renders correctly in dark mode', () => {
    const toggleTheme = jest.fn();
    const { getByText } = render(
      <ThemeContext.Provider value={{ theme: 'dark', toggleTheme }}>
        <ThemeToggle />
      </ThemeContext.Provider>
    );
    
    expect(getByText('Light Mode')).toBeInTheDocument();
  });
  
  it('calls toggleTheme when clicked', () => {
    const toggleTheme = jest.fn();
    const { getByRole } = render(
      <ThemeContext.Provider value={{ theme: 'light', toggleTheme }}>
        <ThemeToggle />
      </ThemeContext.Provider>
    );
    
    fireEvent.click(getByRole('button'));
    expect(toggleTheme).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Testing

#### Setup

1. **Install Testing Dependencies**:
   ```bash
   npm install --save-dev @testing-library/react @testing-library/user-event msw
   ```

2. **Setup Mock Service Worker**:
   - Create `src/mocks/handlers.js`:
     ```javascript
     import { rest } from 'msw';
     
     export const handlers = [
       rest.get('https://api.example.com/food-items', (req, res, ctx) => {
         return res(
           ctx.json([
             { id: 1, name: 'Apple', calories: 95 },
             { id: 2, name: 'Banana', calories: 105 }
           ])
         );
       }),
     ];
     ```
   
   - Create `src/mocks/server.js`:
     ```javascript
     import { setupServer } from 'msw/node';
     import { handlers } from './handlers';
     
     export const server = setupServer(...handlers);
     ```

#### Running Integration Tests

```bash
npm test
```

#### Example Integration Test

```javascript
// src/pages/__tests__/FoodDatabase.test.js
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { server } from '../../mocks/server';
import FoodDatabase from '../FoodDatabase';

// Start server before all tests
beforeAll(() => server.listen());
// Reset handlers after each test
afterEach(() => server.resetHandlers());
// Close server after all tests
afterAll(() => server.close());

describe('FoodDatabase', () => {
  it('loads and displays food items', async () => {
    render(
      <BrowserRouter>
        <FoodDatabase />
      </BrowserRouter>
    );
    
    // Wait for food items to load
    await waitFor(() => {
      expect(screen.getByText('Apple')).toBeInTheDocument();
      expect(screen.getByText('Banana')).toBeInTheDocument();
    });
  });
  
  it('filters food items when searching', async () => {
    render(
      <BrowserRouter>
        <FoodDatabase />
      </BrowserRouter>
    );
    
    // Wait for food items to load
    await waitFor(() => {
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });
    
    // Type in search box
    const searchInput = screen.getByPlaceholderText('Search food items...');
    userEvent.type(searchInput, 'Apple');
    
    // Check that only Apple is displayed
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.queryByText('Banana')).not.toBeInTheDocument();
  });
});
```

### End-to-End Testing

#### Setup

1. **Install Cypress**:
   ```bash
   npm install --save-dev cypress
   ```

2. **Initialize Cypress**:
   ```bash
   npx cypress open
   ```

3. **Configure Cypress**:
   - Edit `cypress.json`:
     ```json
     {
       "baseUrl": "http://localhost:3000",
       "viewportWidth": 1280,
       "viewportHeight": 720
     }
     ```

#### Running End-to-End Tests

```bash
# Start the application
npm start

# In another terminal
npx cypress run
```

#### Example End-to-End Test

```javascript
// cypress/integration/meal_planning.spec.js
describe('Meal Planning', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('POST', '**/auth/v1/token', {
      fixture: 'auth_response.json'
    });
    
    // Visit the app
    cy.visit('/');
    
    // Login
    cy.get('[data-testid=email-input]').type('test@example.com');
    cy.get('[data-testid=password-input]').type('password123');
    cy.get('[data-testid=login-button]').click();
    
    // Navigate to meal planner
    cy.get('[data-testid=meal-planner-link]').click();
  });
  
  it('allows adding a food item to a meal', () => {
    // Select a date
    cy.get('[data-testid=date-picker]').click();
    cy.get('.react-datepicker__day--today').click();
    
    // Add item to breakfast
    cy.get('[data-testid=breakfast-add-button]').click();
    cy.get('[data-testid=food-search]').type('Apple');
    cy.get('[data-testid=food-item-Apple]').click();
    
    // Verify item was added
    cy.get('[data-testid=breakfast-items]').should('contain', 'Apple');
  });
  
  it('allows removing a food item from a meal', () => {
    // Add an item first
    cy.get('[data-testid=breakfast-add-button]').click();
    cy.get('[data-testid=food-search]').type('Apple');
    cy.get('[data-testid=food-item-Apple]').click();
    
    // Remove the item
    cy.get('[data-testid=remove-item-button]').click();
    
    // Verify item was removed
    cy.get('[data-testid=breakfast-items]').should('not.contain', 'Apple');
  });
});
```

### Performance Testing

#### Setup

1. **Install Lighthouse CI**:
   ```bash
   npm install -g @lhci/cli
   ```

2. **Configure Lighthouse CI**:
   - Create `.lighthouserc.js`:
     ```javascript
     module.exports = {
       ci: {
         collect: {
           startServerCommand: 'npm run start',
           url: ['http://localhost:3000'],
           numberOfRuns: 3,
         },
         upload: {
           target: 'temporary-public-storage',
         },
         assert: {
           preset: 'lighthouse:recommended',
           assertions: {
             'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
             'interactive': ['error', { maxNumericValue: 5000 }],
           },
         },
       },
     };
     ```

#### Running Performance Tests

```bash
lhci autorun
```

### Accessibility Testing

#### Setup

1. **Install axe-core**:
   ```bash
   npm install --save-dev @axe-core/react
   ```

2. **Configure axe in development**:
   - Add to `src/index.js`:
     ```javascript
     if (process.env.NODE_ENV !== 'production') {
       import('@axe-core/react').then(axe => {
         axe.default(React, ReactDOM, 1000);
       });
     }
     ```

#### Running Accessibility Tests

Accessibility issues will be reported in the browser console during development.

For automated testing:

```bash
npm install --save-dev jest-axe
```

Example test:

```javascript
// src/components/__tests__/accessibility.test.js
import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import App from '../App';

expect.extend(toHaveNoViolations);

describe('Accessibility tests', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<App />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## Android App Testing

### Android Unit Testing

#### Setup

Unit tests are located in the `android-app/src/test` directory.

#### Running Unit Tests

```bash
cd android-app
npm test
```

#### Example Unit Test

```javascript
// src/utils/__tests__/dateUtils.test.js
import { formatDate, isToday } from '../dateUtils';

describe('Date Utils', () => {
  it('formats date correctly', () => {
    const date = new Date(2023, 0, 15); // January 15, 2023
    expect(formatDate(date)).toBe('2023-01-15');
  });
  
  it('detects today correctly', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    expect(isToday(today)).toBe(true);
    expect(isToday(yesterday)).toBe(false);
  });
});
```

### Android Integration Testing

#### Setup

Integration tests are located in the `android-app/src/androidTest` directory.

#### Running Integration Tests

```bash
cd android-app/android
./gradlew connectedAndroidTest
```

### UI Testing

#### Setup

1. **Install Detox**:
   ```bash
   npm install --save-dev detox
   ```

2. **Initialize Detox**:
   ```bash
   npx detox init -r jest
   ```

3. **Configure Detox**:
   - Edit `.detoxrc.json`:
     ```json
     {
       "testRunner": "jest",
       "runnerConfig": "e2e/config.json",
       "configurations": {
         "android.emu.debug": {
           "type": "android.emulator",
           "binaryPath": "android/app/build/outputs/apk/debug/app-debug.apk",
           "build": "cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug && cd ..",
           "device": {
             "avdName": "Pixel_3a_API_30"
           }
         }
       }
     }
     ```

#### Running UI Tests

```bash
npx detox build --configuration android.emu.debug
npx detox test --configuration android.emu.debug
```

#### Example UI Test

```javascript
// e2e/barcodeScan.test.js
describe('Barcode Scanner', () => {
  beforeAll(async () => {
    await device.launchApp();
    await device.reloadReactNative();
  });

  it('should navigate to barcode scanner', async () => {
    await element(by.text('Scan')).tap();
    await expect(element(by.text('Point your camera at a barcode'))).toBeVisible();
  });

  it('should show permission request', async () => {
    await expect(element(by.text('Camera permission is required'))).toBeVisible();
    await element(by.text('Allow')).tap();
  });

  // More tests for barcode scanning functionality
});
```

### Android Performance Testing

#### Setup

1. **Install Android Profiler**:
   - Android Studio > Tools > Android Profiler

2. **Configure Performance Testing**:
   - Add performance annotations to your code:
     ```java
     @LargeTest
     @RunWith(AndroidJUnit4.class)
     public class PerformanceTest {
       @Rule
       public ActivityTestRule<MainActivity> mActivityRule = new ActivityTestRule<>(MainActivity.class);
       
       @Test
       public void measureStartupTime() {
         // Performance testing code
       }
     }
     ```

#### Running Performance Tests

Use Android Profiler to monitor:
- CPU usage
- Memory allocation
- Network activity
- Energy consumption

## Database Testing

### Setup

1. **Create Test Database**:
   - Create a separate test database in Supabase

2. **Configure Test Environment**:
   - Create `.env.test` with test database credentials

### Testing Database Migrations

```bash
# Run migrations on test database
npx supabase db push --db-url=your_test_db_url
```

### Testing Database Queries

```javascript
// src/services/__tests__/databaseService.test.js
import { supabase } from '../../utils/supabaseClient';
import { getMealPlanByDate } from '../mealPlannerService';

// Mock Supabase client
jest.mock('../../utils/supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn()
  }
}));

describe('Database Service', () => {
  it('fetches meal plan by date', async () => {
    // Mock response
    const mockMealPlan = { id: '123', date: '2023-01-15' };
    supabase.single.mockResolvedValue({ data: mockMealPlan, error: null });
    
    // Call function
    const result = await getMealPlanByDate('user123', '2023-01-15');
    
    // Assertions
    expect(supabase.from).toHaveBeenCalledWith('meal_plans');
    expect(supabase.eq).toHaveBeenCalledWith('user_id', 'user123');
    expect(supabase.eq).toHaveBeenCalledWith('date', '2023-01-15');
    expect(result).toEqual(mockMealPlan);
  });
});
```

## API Testing

### Setup

1. **Install Supertest**:
   ```bash
   npm install --save-dev supertest
   ```

2. **Configure API Tests**:
   - Create `src/api/__tests__/api.test.js`

### Running API Tests

```bash
npm test src/api/__tests__/api.test.js
```

### Example API Test

```javascript
// src/api/__tests__/api.test.js
const request = require('supertest');
const express = require('express');
const app = express();

// Import API routes
const foodRoutes = require('../routes/foodRoutes');
app.use('/api/food', foodRoutes);

describe('Food API', () => {
  it('GET /api/food should return food items', async () => {
    const res = await request(app).get('/api/food');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });
  
  it('GET /api/food/:id should return a specific food item', async () => {
    const res = await request(app).get('/api/food/1');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('id', 1);
  });
  
  it('POST /api/food should create a new food item', async () => {
    const res = await request(app)
      .post('/api/food')
      .send({ name: 'Test Food', calories: 100 });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('name', 'Test Food');
  });
});
```

## Security Testing

### Setup

1. **Install OWASP ZAP**:
   - Download from [zaproxy.org](https://www.zaproxy.org/)

2. **Configure Security Tests**:
   - Create `security-tests.sh`:
     ```bash
     #!/bin/bash
     
     # Start the application
     npm start &
     APP_PID=$!
     
     # Wait for app to start
     sleep 10
     
     # Run ZAP scan
     zap-cli quick-scan --self-contained --start-options "-config api.disablekey=true" http://localhost:3000
     
     # Stop the application
     kill $APP_PID
     ```

### Running Security Tests

```bash
chmod +x security-tests.sh
./security-tests.sh
```

### Manual Security Testing

1. **Authentication Testing**:
   - Test password strength requirements
   - Test account lockout after failed attempts
   - Test session timeout
   - Test CSRF protection

2. **Authorization Testing**:
   - Test access control
   - Test role-based permissions
   - Test API endpoint security

3. **Data Protection**:
   - Test data encryption
   - Test secure storage of sensitive information
   - Test data validation and sanitization

## User Acceptance Testing

### Test Plan

1. **Create Test Scenarios**:
   - Document user flows to test
   - Create test cases with expected results

2. **Recruit Test Users**:
   - Select users representing the target audience
   - Provide clear instructions

3. **Conduct Testing Sessions**:
   - Observe users completing tasks
   - Collect feedback

### Example Test Scenario

```
Test Scenario: Adding a Food Item to a Meal Plan

Preconditions:
- User is logged in
- User is on the Meal Planner page

Steps:
1. Select today's date
2. Click "Add Item" for Breakfast
3. Search for "Apple"
4. Select "Apple" from the search results
5. Confirm the addition

Expected Result:
- "Apple" appears in the Breakfast section
- Nutritional information is updated
```

## Continuous Integration Testing

### GitHub Actions Setup

1. **Create GitHub Actions Workflow**:
   - Create `.github/workflows/test.yml`:
     ```yaml
     name: Test

     on:
       push:
         branches: [ main, develop ]
       pull_request:
         branches: [ main, develop ]

     jobs:
       test:
         runs-on: ubuntu-latest
         steps:
           - uses: actions/checkout@v2
           - name: Setup Node.js
             uses: actions/setup-node@v2
             with:
               node-version: '16'
           - name: Install dependencies
             run: cd meal-planner && npm ci
           - name: Run tests
             run: cd meal-planner && npm test
           - name: Run linting
             run: cd meal-planner && npm run lint
       
       e2e:
         runs-on: ubuntu-latest
         steps:
           - uses: actions/checkout@v2
           - name: Setup Node.js
             uses: actions/setup-node@v2
             with:
               node-version: '16'
           - name: Install dependencies
             run: cd meal-planner && npm ci
           - name: Install Cypress
             run: cd meal-planner && npm install cypress
           - name: Start server
             run: cd meal-planner && npm start & npx wait-on http://localhost:3000
           - name: Run Cypress tests
             run: cd meal-planner && npx cypress run
     ```

### Running CI Tests

CI tests will run automatically on push and pull requests to main and develop branches.

## Test Reporting

### Setup

1. **Install Jest HTML Reporter**:
   ```bash
   npm install --save-dev jest-html-reporter
   ```

2. **Configure Jest**:
   - Update `jest.config.js`:
     ```javascript
     module.exports = {
       // ... other config
       reporters: [
         'default',
         ['jest-html-reporter', {
           pageTitle: 'Test Report',
           outputPath: './test-report.html'
         }]
       ]
     };
     ```

### Generating Reports

```bash
npm test
```

The report will be available at `test-report.html`.

### Integrating with CI

Update your CI workflow to publish test reports:

```yaml
- name: Upload test report
  uses: actions/upload-artifact@v2
  with:
    name: test-report
    path: meal-planner/test-report.html
```

## Test Coverage

### Setup

Jest includes coverage reporting by default.

### Running Coverage Reports

```bash
npm test -- --coverage
```

### Coverage Thresholds

Configure coverage thresholds in `jest.config.js`:

```javascript
module.exports = {
  // ... other config
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

---

This testing guide should be regularly updated as the application evolves. All team members should follow these testing procedures to ensure the quality and reliability of the UK Meal Planner application.