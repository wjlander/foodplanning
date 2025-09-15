import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FaCog, FaUser, FaWeight, FaRuler, FaUtensils, FaFitbit, FaLink, FaUnlink } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import { getFitbitAuthUrl, disconnectFitbit, isFitbitConnected } from '../services/fitbitService';

const SettingsContainer = styled.div`
  padding: 20px 0;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  margin-bottom: 20px;
  color: #2c3e50;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 10px;
    color: #3498db;
  }
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 3fr;
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SettingsNav = styled.div`
  background-color: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const NavItem = styled.div`
  padding: 12px 15px;
  margin-bottom: 5px;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.3s;
  background-color: ${props => props.active ? '#3498db' : 'transparent'};
  color: ${props => props.active ? 'white' : '#2c3e50'};
  
  svg {
    margin-right: 10px;
  }
  
  &:hover {
    background-color: ${props => props.active ? '#3498db' : '#f5f9fc'};
  }
`;

const SettingsPanel = styled.div`
  background-color: white;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const PanelTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: #2c3e50;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 10px;
    color: #3498db;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
`;

const StyledField = styled(Field)`
  width: 100%;
  padding: 12px 15px;
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

const StyledSelect = styled(Field)`
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
  transition: border-color 0.3s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 15px center;
  background-size: 16px;
  
  &:focus {
    border-color: #3498db;
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const StyledErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 0.9rem;
  margin-top: 5px;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
`;

const SubmitButton = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 12px 20px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;
  
  svg {
    margin-right: 8px;
  }
  
  &:hover {
    background-color: #2980b9;
  }
  
  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
`;

const IntegrationCard = styled.div`
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const IntegrationInfo = styled.div`
  display: flex;
  align-items: center;
`;

const IntegrationIcon = styled.div`
  font-size: 2rem;
  margin-right: 15px;
  color: #3498db;
`;

const IntegrationDetails = styled.div``;

const IntegrationTitle = styled.h3`
  margin-bottom: 5px;
`;

const IntegrationStatus = styled.div`
  color: ${props => props.connected ? '#2ecc71' : '#7f8c8d'};
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 5px;
  }
`;

const IntegrationButton = styled.button`
  background-color: ${props => props.connected ? '#e74c3c' : '#3498db'};
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 15px;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background-color 0.3s;
  
  svg {
    margin-right: 8px;
  }
  
  &:hover {
    background-color: ${props => props.connected ? '#c0392b' : '#2980b9'};
  }
`;

// Validation schemas
const ProfileSchema = Yup.object().shape({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
});

const NutritionSchema = Yup.object().shape({
  height_cm: Yup.number().positive('Height must be positive').required('Height is required'),
  weight_kg: Yup.number().positive('Weight must be positive').required('Weight is required'),
  activity_level: Yup.string().required('Activity level is required'),
  daily_calorie_goal: Yup.number().positive('Calorie goal must be positive').required('Calorie goal is required'),
  protein_goal: Yup.number().positive('Protein goal must be positive').required('Protein goal is required'),
  carbs_goal: Yup.number().positive('Carbs goal must be positive').required('Carbs goal is required'),
  fat_goal: Yup.number().positive('Fat goal must be positive').required('Fat goal is required'),
});

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fitbitConnected, setFitbitConnected] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile data
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        setUserData(data);
        
        // Check Fitbit connection status
        const connected = await isFitbitConnected(user.id);
        setFitbitConnected(connected);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchUserData();
    }
  }, [user]);
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  const handleProfileUpdate = async (values, { setSubmitting }) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: values.firstName,
          last_name: values.lastName,
          updated_at: new Date()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          firstName: values.firstName,
          lastName: values.lastName
        }
      });
      
      if (authError) throw authError;
      
      toast.success('Profile updated successfully');
      
      // Update local state
      setUserData({
        ...userData,
        first_name: values.firstName,
        last_name: values.lastName
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(`Failed to update profile: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleNutritionUpdate = async (values, { setSubmitting }) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          height_cm: values.height_cm,
          weight_kg: values.weight_kg,
          activity_level: values.activity_level,
          daily_calorie_goal: values.daily_calorie_goal,
          macro_goals: {
            protein: values.protein_goal,
            carbs: values.carbs_goal,
            fat: values.fat_goal
          },
          updated_at: new Date()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast.success('Nutrition settings updated successfully');
      
      // Update local state
      setUserData({
        ...userData,
        height_cm: values.height_cm,
        weight_kg: values.weight_kg,
        activity_level: values.activity_level,
        daily_calorie_goal: values.daily_calorie_goal,
        macro_goals: {
          protein: values.protein_goal,
          carbs: values.carbs_goal,
          fat: values.fat_goal
        }
      });
    } catch (error) {
      console.error('Error updating nutrition settings:', error);
      toast.error(`Failed to update nutrition settings: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleConnectFitbit = () => {
    const authUrl = getFitbitAuthUrl();
    window.location.href = authUrl;
  };
  
  const handleDisconnectFitbit = async () => {
    try {
      const success = await disconnectFitbit(user.id);
      
      if (success) {
        setFitbitConnected(false);
      }
    } catch (error) {
      console.error('Error disconnecting Fitbit:', error);
      toast.error(`Failed to disconnect Fitbit: ${error.message}`);
    }
  };
  
  if (loading) {
    return <LoadingSpinner text="Loading settings..." />;
  }
  
  return (
    <SettingsContainer>
      <PageTitle>
        <FaCog />
        Settings
      </PageTitle>
      
      <SettingsGrid>
        <SettingsNav>
          <NavItem 
            active={activeTab === 'profile'} 
            onClick={() => handleTabChange('profile')}
          >
            <FaUser />
            Profile
          </NavItem>
          <NavItem 
            active={activeTab === 'nutrition'} 
            onClick={() => handleTabChange('nutrition')}
          >
            <FaUtensils />
            Nutrition Goals
          </NavItem>
          <NavItem 
            active={activeTab === 'integrations'} 
            onClick={() => handleTabChange('integrations')}
          >
            <FaLink />
            Integrations
          </NavItem>
        </SettingsNav>
        
        <SettingsPanel>
          {activeTab === 'profile' && (
            <>
              <PanelTitle>
                <FaUser />
                Profile Settings
              </PanelTitle>
              
              <Formik
                initialValues={{
                  firstName: userData?.first_name || '',
                  lastName: userData?.last_name || '',
                  email: user?.email || ''
                }}
                validationSchema={ProfileSchema}
                onSubmit={handleProfileUpdate}
              >
                {({ isSubmitting }) => (
                  <Form>
                    <FormRow>
                      <FormGroup>
                        <Label htmlFor="firstName">First Name</Label>
                        <StyledField
                          type="text"
                          id="firstName"
                          name="firstName"
                          placeholder="Enter your first name"
                        />
                        <ErrorMessage name="firstName" component={StyledErrorMessage} />
                      </FormGroup>
                      
                      <FormGroup>
                        <Label htmlFor="lastName">Last Name</Label>
                        <StyledField
                          type="text"
                          id="lastName"
                          name="lastName"
                          placeholder="Enter your last name"
                        />
                        <ErrorMessage name="lastName" component={StyledErrorMessage} />
                      </FormGroup>
                    </FormRow>
                    
                    <FormGroup>
                      <Label htmlFor="email">Email Address</Label>
                      <StyledField
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Enter your email"
                        disabled
                      />
                      <ErrorMessage name="email" component={StyledErrorMessage} />
                    </FormGroup>
                    
                    <SubmitButton type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Save Profile'}
                    </SubmitButton>
                  </Form>
                )}
              </Formik>
            </>
          )}
          
          {activeTab === 'nutrition' && (
            <>
              <PanelTitle>
                <FaUtensils />
                Nutrition Goals
              </PanelTitle>
              
              <Formik
                initialValues={{
                  height_cm: userData?.height_cm || 170,
                  weight_kg: userData?.weight_kg || 70,
                  activity_level: userData?.activity_level || 'moderate',
                  daily_calorie_goal: userData?.daily_calorie_goal || 2000,
                  protein_goal: userData?.macro_goals?.protein || 100,
                  carbs_goal: userData?.macro_goals?.carbs || 250,
                  fat_goal: userData?.macro_goals?.fat || 70
                }}
                validationSchema={NutritionSchema}
                onSubmit={handleNutritionUpdate}
              >
                {({ isSubmitting }) => (
                  <Form>
                    <FormRow>
                      <FormGroup>
                        <Label htmlFor="height_cm">Height (cm)</Label>
                        <StyledField
                          type="number"
                          id="height_cm"
                          name="height_cm"
                          min="0"
                        />
                        <ErrorMessage name="height_cm" component={StyledErrorMessage} />
                      </FormGroup>
                      
                      <FormGroup>
                        <Label htmlFor="weight_kg">Weight (kg)</Label>
                        <StyledField
                          type="number"
                          id="weight_kg"
                          name="weight_kg"
                          min="0"
                          step="0.1"
                        />
                        <ErrorMessage name="weight_kg" component={StyledErrorMessage} />
                      </FormGroup>
                    </FormRow>
                    
                    <FormGroup>
                      <Label htmlFor="activity_level">Activity Level</Label>
                      <StyledSelect as="select" id="activity_level" name="activity_level">
                        <option value="sedentary">Sedentary (little or no exercise)</option>
                        <option value="light">Light (light exercise 1-3 days/week)</option>
                        <option value="moderate">Moderate (moderate exercise 3-5 days/week)</option>
                        <option value="active">Active (hard exercise 6-7 days/week)</option>
                        <option value="very_active">Very Active (very hard exercise & physical job)</option>
                      </StyledSelect>
                      <ErrorMessage name="activity_level" component={StyledErrorMessage} />
                    </FormGroup>
                    
                    <FormGroup>
                      <Label htmlFor="daily_calorie_goal">Daily Calorie Goal</Label>
                      <StyledField
                        type="number"
                        id="daily_calorie_goal"
                        name="daily_calorie_goal"
                        min="0"
                      />
                      <ErrorMessage name="daily_calorie_goal" component={StyledErrorMessage} />
                    </FormGroup>
                    
                    <PanelTitle>
                      <FaUtensils />
                      Macronutrient Goals
                    </PanelTitle>
                    
                    <FormRow>
                      <FormGroup>
                        <Label htmlFor="protein_goal">Protein (g)</Label>
                        <StyledField
                          type="number"
                          id="protein_goal"
                          name="protein_goal"
                          min="0"
                        />
                        <ErrorMessage name="protein_goal" component={StyledErrorMessage} />
                      </FormGroup>
                      
                      <FormGroup>
                        <Label htmlFor="carbs_goal">Carbs (g)</Label>
                        <StyledField
                          type="number"
                          id="carbs_goal"
                          name="carbs_goal"
                          min="0"
                        />
                        <ErrorMessage name="carbs_goal" component={StyledErrorMessage} />
                      </FormGroup>
                      
                      <FormGroup>
                        <Label htmlFor="fat_goal">Fat (g)</Label>
                        <StyledField
                          type="number"
                          id="fat_goal"
                          name="fat_goal"
                          min="0"
                        />
                        <ErrorMessage name="fat_goal" component={StyledErrorMessage} />
                      </FormGroup>
                    </FormRow>
                    
                    <SubmitButton type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Save Nutrition Goals'}
                    </SubmitButton>
                  </Form>
                )}
              </Formik>
            </>
          )}
          
          {activeTab === 'integrations' && (
            <>
              <PanelTitle>
                <FaLink />
                Integrations
              </PanelTitle>
              
              <IntegrationCard>
                <IntegrationInfo>
                  <IntegrationIcon>
                    <FaFitbit />
                  </IntegrationIcon>
                  <IntegrationDetails>
                    <IntegrationTitle>Fitbit</IntegrationTitle>
                    <IntegrationStatus connected={fitbitConnected}>
                      {fitbitConnected ? (
                        <>
                          <FaLink />
                          Connected
                        </>
                      ) : (
                        <>
                          <FaUnlink />
                          Not Connected
                        </>
                      )}
                    </IntegrationStatus>
                  </IntegrationDetails>
                </IntegrationInfo>
                
                {fitbitConnected ? (
                  <IntegrationButton 
                    connected={true}
                    onClick={handleDisconnectFitbit}
                  >
                    <FaUnlink />
                    Disconnect
                  </IntegrationButton>
                ) : (
                  <IntegrationButton 
                    connected={false}
                    onClick={handleConnectFitbit}
                  >
                    <FaLink />
                    Connect
                  </IntegrationButton>
                )}
              </IntegrationCard>
              
              <p>
                Connecting your Fitbit account allows you to automatically sync your meals and nutrition data with your Fitbit food log.
              </p>
            </>
          )}
        </SettingsPanel>
      </SettingsGrid>
    </SettingsContainer>
  );
};

export default Settings;