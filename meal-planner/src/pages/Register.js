import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FaEnvelope, FaLock, FaUser, FaUserPlus } from 'react-icons/fa';
import { signUp } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

const RegisterContainer = styled.div`
  max-width: 500px;
  margin: 60px auto;
  padding: 30px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
`;

const RegisterHeader = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const RegisterTitle = styled.h1`
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 10px;
`;

const RegisterSubtitle = styled.p`
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

const RegisterButton = styled.button`
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

const LoginLink = styled.div`
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

const TermsText = styled.p`
  font-size: 0.9rem;
  color: #7f8c8d;
  text-align: center;
  margin-top: 20px;
  
  a {
    color: #3498db;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

// Validation schema
const RegisterSchema = Yup.object().shape({
  firstName: Yup.string()
    .required('First name is required'),
  lastName: Yup.string()
    .required('Last name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required')
});

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();
  
  const handleRegister = async (values, { setSubmitting, setFieldError }) => {
    setIsLoading(true);
    
    try {
      const { user, error } = await signUp(values.email, values.password);
      
      if (error) {
        if (error.message.includes('already registered')) {
          setFieldError('email', 'This email is already registered');
          toast.error('This email is already registered');
        } else {
          toast.error(`Registration error: ${error.message}`);
        }
        return;
      }
      
      // Create user profile in the database
      // This would typically be handled by a Supabase function trigger
      // or by a separate API call to create the user profile
      
      setUser(user);
      toast.success('Registration successful! Please check your email to verify your account.');
      navigate('/dashboard');
    } catch (error) {
      toast.error(`An unexpected error occurred: ${error.message}`);
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };
  
  if (isLoading) {
    return <LoadingSpinner text="Creating your account..." />;
  }
  
  return (
    <RegisterContainer>
      <RegisterHeader>
        <RegisterTitle>Create an Account</RegisterTitle>
        <RegisterSubtitle>Start planning your meals today</RegisterSubtitle>
      </RegisterHeader>
      
      <Formik
        initialValues={{
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: ''
        }}
        validationSchema={RegisterSchema}
        onSubmit={handleRegister}
      >
        {({ isSubmitting, errors, touched }) => (
          <StyledForm>
            <FormGroup>
              <Label htmlFor="firstName">First Name</Label>
              <InputGroup>
                <InputIcon>
                  <FaUser />
                </InputIcon>
                <StyledField
                  type="text"
                  name="firstName"
                  id="firstName"
                  placeholder="Enter your first name"
                  className={errors.firstName && touched.firstName ? 'error' : ''}
                />
              </InputGroup>
              <ErrorMessage name="firstName" component={StyledErrorMessage} />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="lastName">Last Name</Label>
              <InputGroup>
                <InputIcon>
                  <FaUser />
                </InputIcon>
                <StyledField
                  type="text"
                  name="lastName"
                  id="lastName"
                  placeholder="Enter your last name"
                  className={errors.lastName && touched.lastName ? 'error' : ''}
                />
              </InputGroup>
              <ErrorMessage name="lastName" component={StyledErrorMessage} />
            </FormGroup>
            
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
                  placeholder="Create a password"
                  className={errors.password && touched.password ? 'error' : ''}
                />
              </InputGroup>
              <ErrorMessage name="password" component={StyledErrorMessage} />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <InputGroup>
                <InputIcon>
                  <FaLock />
                </InputIcon>
                <StyledField
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  placeholder="Confirm your password"
                  className={errors.confirmPassword && touched.confirmPassword ? 'error' : ''}
                />
              </InputGroup>
              <ErrorMessage name="confirmPassword" component={StyledErrorMessage} />
            </FormGroup>
            
            <RegisterButton type="submit" disabled={isSubmitting}>
              <FaUserPlus />
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </RegisterButton>
            
            <TermsText>
              By signing up, you agree to our <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>
            </TermsText>
            
            <LoginLink>
              Already have an account? <Link to="/login">Log in</Link>
            </LoginLink>
          </StyledForm>
        )}
      </Formik>
    </RegisterContainer>
  );
};

export default Register;