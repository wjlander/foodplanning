import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaUtensils, FaBarcode, FaChartPie, FaMobileAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const HeroSection = styled.section`
  background: linear-gradient(rgba(44, 62, 80, 0.8), rgba(44, 62, 80, 0.8)),
              url('https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80') center/cover no-repeat;
  color: white;
  padding: 100px 20px;
  text-align: center;
`;

const HeroTitle = styled.h1`
  font-size: 3rem;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.2rem;
  max-width: 800px;
  margin: 0 auto 30px;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
  
  @media (max-width: 576px) {
    flex-direction: column;
    align-items: center;
  }
`;

const Button = styled(Link)`
  display: inline-block;
  padding: 12px 30px;
  border-radius: 30px;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }
`;

const PrimaryButton = styled(Button)`
  background-color: #3498db;
  color: white;
  
  &:hover {
    background-color: #2980b9;
  }
`;

const SecondaryButton = styled(Button)`
  background-color: transparent;
  color: white;
  border: 2px solid white;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const FeaturesSection = styled.section`
  padding: 80px 20px;
  background-color: #f8f9fa;
`;

const SectionTitle = styled.h2`
  text-align: center;
  margin-bottom: 50px;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
`;

const FeatureCard = styled.div`
  background-color: white;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-10px);
  }
`;

const FeatureIcon = styled.div`
  font-size: 2.5rem;
  color: #3498db;
  margin-bottom: 20px;
`;

const FeatureTitle = styled.h3`
  margin-bottom: 15px;
`;

const FeatureDescription = styled.p`
  color: #666;
`;

const HowItWorksSection = styled.section`
  padding: 80px 20px;
`;

const StepsContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`;

const Step = styled.div`
  display: flex;
  margin-bottom: 50px;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
  
  &:nth-child(even) {
    flex-direction: row-reverse;
    
    @media (max-width: 768px) {
      flex-direction: column;
    }
  }
`;

const StepContent = styled.div`
  flex: 1;
  padding: 0 30px;
`;

const StepNumber = styled.div`
  background-color: #3498db;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-bottom: 15px;
  
  @media (max-width: 768px) {
    margin: 0 auto 15px;
  }
`;

const StepTitle = styled.h3`
  margin-bottom: 15px;
`;

const StepDescription = styled.p`
  color: #666;
`;

const StepImage = styled.div`
  flex: 1;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  
  img {
    width: 100%;
    height: auto;
    display: block;
  }
  
  @media (max-width: 768px) {
    margin-top: 30px;
    max-width: 500px;
  }
`;

const CTASection = styled.section`
  background-color: #3498db;
  color: white;
  padding: 80px 20px;
  text-align: center;
`;

const CTATitle = styled.h2`
  margin-bottom: 20px;
`;

const CTADescription = styled.p`
  max-width: 800px;
  margin: 0 auto 30px;
  font-size: 1.1rem;
`;

const Home = () => {
  const { user } = useAuth();
  
  return (
    <>
      <HeroSection>
        <HeroTitle>UK Meal Planning Made Simple</HeroTitle>
        <HeroSubtitle>
          Plan your meals, scan UK products, track nutrition, and sync with Fitbit - all in one app.
        </HeroSubtitle>
        <ButtonGroup>
          {user ? (
            <PrimaryButton to="/dashboard">Go to Dashboard</PrimaryButton>
          ) : (
            <>
              <PrimaryButton to="/register">Get Started</PrimaryButton>
              <SecondaryButton to="/login">Log In</SecondaryButton>
            </>
          )}
        </ButtonGroup>
      </HeroSection>
      
      <FeaturesSection>
        <SectionTitle>Features</SectionTitle>
        <FeaturesGrid>
          <FeatureCard>
            <FeatureIcon>
              <FaBarcode />
            </FeatureIcon>
            <FeatureTitle>UK Barcode Scanning</FeatureTitle>
            <FeatureDescription>
              Quickly add foods to your meal plan by scanning barcodes of UK products.
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>
              <FaUtensils />
            </FeatureIcon>
            <FeatureTitle>Meal Planning</FeatureTitle>
            <FeatureDescription>
              Plan up to 4 meals per day for 1-2 people with our intuitive meal planner.
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>
              <FaChartPie />
            </FeatureIcon>
            <FeatureTitle>Nutrition Tracking</FeatureTitle>
            <FeatureDescription>
              Track calories and macros with detailed nutrition information for all your meals.
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>
              <FaMobileAlt />
            </FeatureIcon>
            <FeatureTitle>Fitbit Integration</FeatureTitle>
            <FeatureDescription>
              Sync your meals directly to your Fitbit food tracker for seamless nutrition tracking.
            </FeatureDescription>
          </FeatureCard>
        </FeaturesGrid>
      </FeaturesSection>
      
      <HowItWorksSection>
        <SectionTitle>How It Works</SectionTitle>
        <StepsContainer>
          <Step>
            <StepContent>
              <StepNumber>1</StepNumber>
              <StepTitle>Scan Products or Search Foods</StepTitle>
              <StepDescription>
                Use our barcode scanner to quickly add UK products to your food database, or search our extensive UK food database.
              </StepDescription>
            </StepContent>
            <StepImage>
              <img src="https://images.unsplash.com/photo-1512054502232-10a0a035d672?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" alt="Barcode scanning" />
            </StepImage>
          </Step>
          
          <Step>
            <StepContent>
              <StepNumber>2</StepNumber>
              <StepTitle>Plan Your Meals</StepTitle>
              <StepDescription>
                Create meal plans for breakfast, lunch, dinner, and snacks. Adjust portions for 1-2 people and save your favorite meals.
              </StepDescription>
            </StepContent>
            <StepImage>
              <img src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" alt="Meal planning" />
            </StepImage>
          </Step>
          
          <Step>
            <StepContent>
              <StepNumber>3</StepNumber>
              <StepTitle>Track Nutrition</StepTitle>
              <StepDescription>
                Monitor your calorie intake and macronutrients with our detailed nutrition dashboard. Set goals and track your progress.
              </StepDescription>
            </StepContent>
            <StepImage>
              <img src="https://images.unsplash.com/photo-1615485290382-441e4d049cb5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" alt="Nutrition tracking" />
            </StepImage>
          </Step>
          
          <Step>
            <StepContent>
              <StepNumber>4</StepNumber>
              <StepTitle>Sync with Fitbit</StepTitle>
              <StepDescription>
                Connect your Fitbit account and automatically sync your meals to your Fitbit food tracker for a complete health overview.
              </StepDescription>
            </StepContent>
            <StepImage>
              <img src="https://images.unsplash.com/photo-1510017803434-a899398421b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" alt="Fitbit integration" />
            </StepImage>
          </Step>
        </StepsContainer>
      </HowItWorksSection>
      
      <CTASection>
        <CTATitle>Ready to Start Planning Your Meals?</CTATitle>
        <CTADescription>
          Join thousands of UK users who are simplifying their meal planning, tracking nutrition, and achieving their health goals.
        </CTADescription>
        <ButtonGroup>
          {user ? (
            <PrimaryButton to="/dashboard" style={{ backgroundColor: 'white', color: '#3498db' }}>
              Go to Dashboard
            </PrimaryButton>
          ) : (
            <PrimaryButton to="/register" style={{ backgroundColor: 'white', color: '#3498db' }}>
              Get Started for Free
            </PrimaryButton>
          )}
        </ButtonGroup>
      </CTASection>
    </>
  );
};

export default Home;