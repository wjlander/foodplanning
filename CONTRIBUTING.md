# Contributing to UK Meal Planner

Thank you for your interest in contributing to the UK Meal Planner project! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
  - [Project Structure](#project-structure)
  - [Development Environment](#development-environment)
- [Development Workflow](#development-workflow)
  - [Branching Strategy](#branching-strategy)
  - [Commit Guidelines](#commit-guidelines)
  - [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
  - [JavaScript/React](#javascriptreact)
  - [CSS/Styling](#cssstyling)
  - [React Native](#react-native)
- [Testing](#testing)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)
- [Feature Requests](#feature-requests)
- [Community](#community)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) to understand what behaviors will and will not be tolerated.

## Getting Started

### Project Structure

The UK Meal Planner project consists of two main parts:

1. **Web Application** (`/meal-planner`): React-based web application
2. **Android App** (`/android-app`): React Native Android application

Key directories and files:

```
foodplanning/
├── meal-planner/              # Web application
│   ├── public/                # Static files
│   ├── src/                   # Source code
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # React context providers
│   │   ├── hooks/             # Custom React hooks
│   │   ├── pages/             # Page components
│   │   ├── services/          # API and service functions
│   │   ├── styles/            # Global styles
│   │   ├── utils/             # Utility functions
│   │   ├── App.js             # Main application component
│   │   └── index.js           # Application entry point
│   ├── package.json           # Dependencies and scripts
│   └── README.md              # Web app documentation
├── android-app/               # Android application
│   ├── android/               # Android native code
│   ├── src/                   # React Native source code
│   ├── package.json           # Dependencies and scripts
│   └── README.md              # Android app documentation
├── database_schema.md         # Database schema documentation
├── CONTRIBUTING.md            # This file
├── DEPLOYMENT.md              # Deployment instructions
├── README.md                  # Project overview
└── TESTING.md                 # Testing guidelines
```

### Development Environment

#### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git
- Supabase account (for database)
- Android Studio (for Android app development)

#### Setting Up the Web Application

1. **Clone the repository**:
   ```bash
   git clone https://github.com/wjlander/foodplanning.git
   cd foodplanning
   ```

2. **Install dependencies**:
   ```bash
   cd meal-planner
   npm install
   ```

3. **Set up environment variables**:
   - Create a `.env` file in the `meal-planner` directory:
     ```
     REACT_APP_SUPABASE_URL=your_supabase_url
     REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
     REACT_APP_FITBIT_CLIENT_ID=your_fitbit_client_id
     REACT_APP_FITBIT_REDIRECT_URI=your_fitbit_redirect_uri
     ```

4. **Start the development server**:
   ```bash
   npm start
   ```

#### Setting Up the Android App

1. **Install dependencies**:
   ```bash
   cd android-app
   npm install
   ```

2. **Set up environment variables**:
   - Create a `.env` file in the `android-app` directory:
     ```
     REACT_APP_SUPABASE_URL=your_supabase_url
     REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

3. **Start the development server**:
   ```bash
   npx react-native start
   ```

4. **Run the app on an emulator or device**:
   ```bash
   npx react-native run-android
   ```

For detailed Android setup instructions, see [android-app/SETUP.md](android-app/SETUP.md).

## Development Workflow

### Branching Strategy

We follow a simplified Git Flow branching strategy:

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Feature branches
- `bugfix/*`: Bug fix branches
- `hotfix/*`: Urgent fixes for production

#### Creating a Feature Branch

```bash
git checkout develop
git pull
git checkout -b feature/your-feature-name
```

### Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Changes to the build process or tools

Examples:
```
feat(meal-planner): add meal rating system
fix(barcode): resolve camera permission issue
docs(readme): update installation instructions
```

### Pull Request Process

1. **Update your branch**:
   ```bash
   git checkout develop
   git pull
   git checkout feature/your-feature-name
   git rebase develop
   ```

2. **Push your changes**:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request**:
   - Go to the repository on GitHub
   - Click "New Pull Request"
   - Select `develop` as the base branch and your feature branch as the compare branch
   - Fill out the PR template

4. **PR Requirements**:
   - All tests must pass
   - Code must follow the project's coding standards
   - Documentation must be updated if necessary
   - PR must be reviewed by at least one maintainer

5. **After Approval**:
   - Maintainers will merge the PR
   - Delete your branch after it's merged

## Coding Standards

### JavaScript/React

We follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript) with some modifications:

- Use functional components with hooks instead of class components
- Use named exports for components
- Use arrow functions for event handlers
- Use async/await for asynchronous operations

#### Component Structure

```jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { someFunction } from '../utils/helpers';

const ComponentName = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialState);
  
  useEffect(() => {
    // Side effects here
  }, [dependencies]);
  
  const handleSomething = () => {
    // Event handler
  };
  
  return (
    <div>
      {/* JSX here */}
    </div>
  );
};

ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
};

ComponentName.defaultProps = {
  prop2: 0,
};

export default ComponentName;
```

### CSS/Styling

We use a combination of styled-components and CSS modules:

- Use styled-components for component-specific styling
- Use CSS modules for page-level styling
- Use a consistent naming convention for classes

#### Styled Components Example

```jsx
import styled from 'styled-components';

const Button = styled.button`
  background-color: ${props => props.primary ? 'blue' : 'white'};
  color: ${props => props.primary ? 'white' : 'blue'};
  padding: 10px 15px;
  border-radius: 4px;
  border: 2px solid blue;
  cursor: pointer;
`;

export default Button;
```

### React Native

For the Android app, we follow the [React Native Community Style Guide](https://github.com/facebook/react-native/tree/main/packages/eslint-config-react-native-community):

- Use the StyleSheet API for styling
- Keep styles close to the components that use them
- Use platform-specific code when necessary

#### React Native Component Example

```jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const MyComponent = ({ title }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MyComponent;
```

## Testing

We strive for good test coverage. Please include tests with your contributions.

### Web Application Testing

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test interactions between components
- **End-to-End Tests**: Test complete user flows

```bash
# Run all tests
cd meal-planner
npm test

# Run tests with coverage
npm test -- --coverage
```

### Android App Testing

- **Unit Tests**: Test individual functions and hooks
- **Component Tests**: Test React Native components
- **E2E Tests**: Test complete user flows with Detox

```bash
# Run unit tests
cd android-app
npm test

# Run E2E tests
cd android-app
npx detox test
```

For detailed testing guidelines, see [TESTING.md](TESTING.md).

## Documentation

Good documentation is crucial for the project. Please update documentation when making changes:

- Update component documentation with JSDoc comments
- Update README files when adding new features
- Add examples for complex functionality
- Document API endpoints and parameters

### JSDoc Example

```javascript
/**
 * Searches for food items by name
 * @param {string} query - The search query
 * @param {number} [limit=20] - Maximum number of results to return
 * @returns {Promise<Array>} - Array of food items
 */
export const searchFoodByName = async (query, limit = 20) => {
  // Implementation
};
```

## Issue Reporting

If you find a bug or have a suggestion, please create an issue:

1. Go to the [Issues](https://github.com/wjlander/foodplanning/issues) page
2. Click "New Issue"
3. Select the appropriate template
4. Fill out the required information

### Bug Report Template

```
## Description
A clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Screenshots
If applicable, add screenshots

## Environment
- Device/OS: [e.g. iPhone 12/iOS 15]
- Browser: [e.g. Chrome 96]
- App Version: [e.g. 1.0.0]
```

## Feature Requests

For feature requests, please create an issue using the feature request template:

```
## Problem Statement
A clear description of the problem this feature would solve

## Proposed Solution
A clear description of what you want to happen

## Alternative Solutions
Any alternative solutions you've considered

## Additional Context
Any other context or screenshots about the feature request
```

## Community

- **Discord**: Join our [Discord server](https://discord.gg/example) for discussions
- **Meetings**: We hold community meetings every other Thursday at 18:00 UTC
- **Twitter**: Follow us [@UKMealPlanner](https://twitter.com/example) for updates

---

Thank you for contributing to UK Meal Planner! Your efforts help make this project better for everyone.