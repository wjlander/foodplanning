import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaExclamationTriangle, FaHome, FaArrowLeft } from 'react-icons/fa';

const NotFoundContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 50px 20px;
  min-height: 60vh;
`;

const NotFoundIcon = styled.div`
  font-size: 5rem;
  color: #f39c12;
  margin-bottom: 20px;
`;

const NotFoundTitle = styled.h1`
  font-size: 3rem;
  color: #2c3e50;
  margin-bottom: 15px;
`;

const NotFoundMessage = styled.p`
  font-size: 1.2rem;
  color: #7f8c8d;
  max-width: 600px;
  margin-bottom: 30px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 20px;
  
  @media (max-width: 576px) {
    flex-direction: column;
  }
`;

const Button = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 25px;
  border-radius: 5px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  
  svg {
    margin-right: 8px;
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
  background-color: #ecf0f1;
  color: #2c3e50;
  
  &:hover {
    background-color: #bdc3c7;
  }
`;

const NotFound = () => {
  return (
    <NotFoundContainer>
      <NotFoundIcon>
        <FaExclamationTriangle />
      </NotFoundIcon>
      <NotFoundTitle>404</NotFoundTitle>
      <NotFoundMessage>
        Oops! The page you're looking for doesn't exist or has been moved.
      </NotFoundMessage>
      <ButtonGroup>
        <PrimaryButton to="/">
          <FaHome />
          Go to Home
        </PrimaryButton>
        <SecondaryButton to="#" onClick={() => window.history.back()}>
          <FaArrowLeft />
          Go Back
        </SecondaryButton>
      </ButtonGroup>
    </NotFoundContainer>
  );
};

export default NotFound;