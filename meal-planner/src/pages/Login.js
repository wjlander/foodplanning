import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FaEnvelope, FaLock, FaSignInAlt } from 'react-icons/fa';
import { signIn } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

const LoginContainer = styled.div`
  max-width: 500px;
  margin: 60px auto;
  padding: 30px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
`;

const LoginHeader = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const LoginTitle = styled.h1`
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 10px;
`;

const LoginSubtitle = styled.p`
  color: #7f8c8d;
`;

const StyledForm = styled(Form)`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
`;

const InputGroup = styled.div`
  position: relative;
`;

const StyledField = styled(Field)`
  width: 100%;
  padding: 12px 15px 12px 45px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
  transition: border-color 0.3s;
  
  &:focus {
    border-color: #3498db;
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const InputIcon = styled.div`
  position: absolute;
  top: 50%;
  left: 15px;
  transform: translateY(-50%);
  color: #95a5a6;
`;

const StyledErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 0.9rem;
  margin-top: 5px;
`;

const LoginButton = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #2980b9;
  }
  
  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
  
  svg {
    margin-right: 8px;
  }
`;

const ForgotPassword = styled(Link)`
  text-align: right;
  display: block;
  margin-top: 10px;
  color: #3498db;
  font-size: 0.9rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const RegisterLink = styled.div`
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  
  a {
    color: #3498db;
    font-weight: 600;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

// Validation schema
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
});

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();
  
  const handleLogin = async (values, { setSubmitting, setFieldError }) => {
    setIsLoading(true);
    
    try {
      const { user, error } = await signIn(values.email, values.password);
      
      if (error) {
        if (error.message.includes('Invalid login')) {
          setFieldError('email', 'Invalid email or password');
          setFieldError('password', 'Invalid email or password');
          toast.error('Invalid email or password');
        } else {
          toast.error(`Login error: ${error.message}`);
        }
        return;
      }
      
      setUser(user);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(`An unexpected error occurred: ${error.message}`);
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };
  
  if (isLoading) {
    return <LoadingSpinner text="Logging in..." />;
  }
  
  return (
    <LoginContainer>
      <LoginHeader>
        <LoginTitle>Welcome Back</LoginTitle>
        <LoginSubtitle>Log in to access your meal plans</LoginSubtitle>
      </LoginHeader>
      
      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={LoginSchema}
        onSubmit={handleLogin}
      >
        {({ isSubmitting, errors, touched }) => (
          <StyledForm>
            <FormGroup>
              <Label htmlFor="email">Email Address</Label>
              <InputGroup>
                <InputIcon>
                  <FaEnvelope />
                </InputIcon>
                <StyledField
                  type="email"
                  name="email"
                  id="email"
                  placeholder="Enter your email"
                  className={errors.email && touched.email ? 'error' : ''}
                />
              </InputGroup>
              <ErrorMessage name="email" component={StyledErrorMessage} />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="password">Password</Label>
              <InputGroup>
                <InputIcon>
                  <FaLock />
                </InputIcon>
                <StyledField
                  type="password"
                  name="password"
                  id="password"
                  placeholder="Enter your password"
                  className={errors.password && touched.password ? 'error' : ''}
                />
              </InputGroup>
              <ErrorMessage name="password" component={StyledErrorMessage} />
              <ForgotPassword to="/forgot-password">Forgot password?</ForgotPassword>
            </FormGroup>
            
            <LoginButton type="submit" disabled={isSubmitting}>
              <FaSignInAlt />
              {isSubmitting ? 'Logging in...' : 'Log In'}
            </LoginButton>
            
            <RegisterLink>
              Don't have an account? <Link to="/register">Sign up</Link>
            </RegisterLink>
          </StyledForm>
        )}
      </Formik>
    </LoginContainer>
  );
};

export default Login;