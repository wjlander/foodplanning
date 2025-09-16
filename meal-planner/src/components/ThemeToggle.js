import React from 'react';
import { Button } from 'react-bootstrap';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <Button 
      variant={theme === 'dark' ? 'outline-light' : 'outline-dark'} 
      size="sm" 
      onClick={toggleTheme}
      className="d-flex align-items-center"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <FaSun className="me-1" /> : <FaMoon className="me-1" />}
      {theme === 'dark' ? 'Light' : 'Dark'} Mode
    </Button>
  );
};

export default ThemeToggle;