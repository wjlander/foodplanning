import React from 'react';
import styled from 'styled-components';
import { FaUtensils, FaGithub, FaTwitter, FaInstagram } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const FooterContainer = styled.footer`
  background-color: #2c3e50;
  color: white;
  padding: 40px 20px;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 30px;
`;

const FooterSection = styled.div`
  display: flex;
  flex-direction: column;
`;

const FooterLogo = styled(Link)`
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  
  span {
    margin-left: 8px;
  }
`;

const FooterText = styled.p`
  margin-bottom: 15px;
  font-size: 0.9rem;
  line-height: 1.5;
`;

const FooterHeading = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 15px;
`;

const FooterLink = styled(Link)`
  color: #ecf0f1;
  text-decoration: none;
  margin-bottom: 10px;
  font-size: 0.9rem;
  
  &:hover {
    color: #3498db;
  }
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 10px;
`;

const SocialLink = styled.a`
  color: white;
  font-size: 1.2rem;
  
  &:hover {
    color: #3498db;
  }
`;

const Copyright = styled.div`
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.8rem;
`;

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <FooterContainer>
      <FooterContent>
        <FooterSection>
          <FooterLogo to="/">
            <FaUtensils />
            <span>UK Meal Planner</span>
          </FooterLogo>
          <FooterText>
            Plan your meals, track nutrition, and sync with Fitbit - all with UK-specific food data.
          </FooterText>
          <SocialLinks>
            <SocialLink href="#" target="_blank" rel="noopener noreferrer">
              <FaGithub />
            </SocialLink>
            <SocialLink href="#" target="_blank" rel="noopener noreferrer">
              <FaTwitter />
            </SocialLink>
            <SocialLink href="#" target="_blank" rel="noopener noreferrer">
              <FaInstagram />
            </SocialLink>
          </SocialLinks>
        </FooterSection>
        
        <FooterSection>
          <FooterHeading>Features</FooterHeading>
          <FooterLink to="/meal-planner">Meal Planning</FooterLink>
          <FooterLink to="/barcode-scanner">Barcode Scanning</FooterLink>
          <FooterLink to="/nutrition">Nutrition Tracking</FooterLink>
          <FooterLink to="/recipes">Recipe Management</FooterLink>
        </FooterSection>
        
        <FooterSection>
          <FooterHeading>Resources</FooterHeading>
          <FooterLink to="/faq">FAQ</FooterLink>
          <FooterLink to="/blog">Blog</FooterLink>
          <FooterLink to="/support">Support</FooterLink>
          <FooterLink to="/privacy">Privacy Policy</FooterLink>
        </FooterSection>
        
        <FooterSection>
          <FooterHeading>Contact</FooterHeading>
          <FooterText>
            Have questions or feedback? We'd love to hear from you!
          </FooterText>
          <FooterLink to="/contact">Contact Us</FooterLink>
        </FooterSection>
      </FooterContent>
      
      <Copyright>
        &copy; {currentYear} UK Meal Planner. All rights reserved.
      </Copyright>
    </FooterContainer>
  );
};

export default Footer;