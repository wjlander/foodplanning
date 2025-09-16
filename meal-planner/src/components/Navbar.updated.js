import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaBars, FaTimes, FaUser, FaSignOutAlt, FaUtensils, FaBarcode, FaDatabase, FaBook, FaChartPie, FaShoppingBasket, FaCog, FaHamburger } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { signOut } from '../utils/supabaseClient';
import { toast } from 'react-toastify';

const NavContainer = styled.nav`
  background-color: #2c3e50;
  color: white;
  padding: 0 20px;
`;

const NavContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  height: 70px;
`;

const Logo = styled(Link)`
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
  display: flex;
  align-items: center;
  
  span {
    margin-left: 8px;
  }
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  display: none;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  
  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    right: ${({ isOpen }) => (isOpen ? '0' : '-100%')};
    width: 250px;
    height: 100vh;
    background-color: #2c3e50;
    flex-direction: column;
    align-items: flex-start;
    padding: 70px 20px 20px;
    transition: right 0.3s ease;
    z-index: 100;
  }
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  margin: 0 15px;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 8px;
  }
  
  &:hover {
    color: #3498db;
  }
  
  @media (max-width: 768px) {
    margin: 15px 0;
  }
`;

const NavButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  margin: 0 15px;
  display: flex;
  align-items: center;
  font-size: 1rem;
  
  svg {
    margin-right: 8px;
  }
  
  &:hover {
    color: #3498db;
  }
  
  @media (max-width: 768px) {
    margin: 15px 0;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  position: absolute;
  top: 20px;
  right: 20px;
  display: none;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const closeMenu = () => {
    setIsMenuOpen(false);
  };
  
  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) throw error;
      setUser(null);
      navigate('/');
    } catch (error) {
      toast.error(`Error signing out: ${error.message}`);
    }
  };
  
  return (
    <NavContainer>
      <NavContent>
        <Logo to="/">
          <FaUtensils />
          <span>UK Meal Planner</span>
        </Logo>
        
        <MenuButton onClick={toggleMenu}>
          <FaBars />
        </MenuButton>
        
        <NavLinks isOpen={isMenuOpen}>
          <CloseButton onClick={closeMenu}>
            <FaTimes />
          </CloseButton>
          
          {user ? (
            <>
              <NavLink to="/dashboard" onClick={closeMenu}>
                <FaChartPie /> Dashboard
              </NavLink>
              <NavLink to="/meal-planner" onClick={closeMenu}>
                <FaUtensils /> Meal Planner
              </NavLink>
              <NavLink to="/barcode-scanner" onClick={closeMenu}>
                <FaBarcode /> Scan
              </NavLink>
              <NavLink to="/food-database" onClick={closeMenu}>
                <FaDatabase /> Foods
              </NavLink>
              <NavLink to="/recipes" onClick={closeMenu}>
                <FaBook /> Recipes
              </NavLink>
              <NavLink to="/ready-meals" onClick={closeMenu}>
                <FaHamburger /> Ready Meals
              </NavLink>
              <NavLink to="/nutrition" onClick={closeMenu}>
                <FaChartPie /> Nutrition
              </NavLink>
              <NavLink to="/shopping-list" onClick={closeMenu}>
                <FaShoppingBasket /> Shopping
              </NavLink>
              <NavLink to="/settings" onClick={closeMenu}>
                <FaCog /> Settings
              </NavLink>
              <NavButton onClick={handleSignOut}>
                <FaSignOutAlt /> Sign Out
              </NavButton>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={closeMenu}>
                <FaUser /> Login
              </NavLink>
              <NavLink to="/register" onClick={closeMenu}>
                Register
              </NavLink>
            </>
          )}
        </NavLinks>
      </NavContent>
    </NavContainer>
  );
};

export default Navbar;