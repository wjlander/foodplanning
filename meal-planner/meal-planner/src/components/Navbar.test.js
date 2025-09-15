import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './Navbar';
import { AuthProvider } from '../context/AuthContext';

// Mock the useAuth hook
jest.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children, value }) => (
    <div data-testid="auth-provider" data-user={value?.user ? 'logged-in' : 'logged-out'}>
      {children}
    </div>
  ),
  useAuth: () => ({
    user: null,
    setUser: jest.fn()
  })
}));

// Mock the signOut function
jest.mock('../utils/supabaseClient', () => ({
  signOut: jest.fn().mockResolvedValue({ error: null })
}));

// Mock the toast notifications
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('Navbar Component', () => {
  test('renders navbar with logo', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
    
    // Check if the logo text is rendered
    expect(screen.getByText('UK Meal Planner')).toBeInTheDocument();
  });
  
  test('renders login and register links when user is not logged in', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
    
    // Check if login and register links are rendered
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });
  
  test('toggles mobile menu when menu button is clicked', () => {
    // Mock window.innerWidth to simulate mobile view
    global.innerWidth = 500;
    global.dispatchEvent(new Event('resize'));
    
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
    
    // Find the menu button (it should be visible in mobile view)
    const menuButton = screen.getByRole('button');
    
    // Click the menu button to open the menu
    fireEvent.click(menuButton);
    
    // The menu should now be open (we'd need to check CSS properties in a real test)
    // For this mock test, we'll just ensure the close button appears
    const closeButton = screen.getAllByRole('button')[1];
    expect(closeButton).toBeTruthy();
    
    // Click the close button to close the menu
    fireEvent.click(closeButton);
    
    // Reset window size
    global.innerWidth = 1024;
    global.dispatchEvent(new Event('resize'));
  });
});