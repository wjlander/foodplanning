import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Mock the AuthContext
jest.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({ user: null, setUser: jest.fn() })
}));

// Mock the supabase client
jest.mock('./utils/supabaseClient', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      }))
    }
  },
  getCurrentUser: jest.fn().mockResolvedValue({ user: null, error: null })
}));

// Mock the LoadingSpinner component
jest.mock('./components/LoadingSpinner', () => () => <div data-testid="loading-spinner">Loading...</div>);

test('renders App component without crashing', () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
});

test('shows loading spinner initially', () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  
  const loadingElement = screen.getByTestId('loading-spinner');
  expect(loadingElement).toBeInTheDocument();
});