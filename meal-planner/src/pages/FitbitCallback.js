import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { updateFitbitTokens } from '../utils/supabaseClient';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

const CallbackContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 50px 20px;
  min-height: 60vh;
`;

const StatusIcon = styled.div`
  font-size: 5rem;
  color: ${props => props.success ? '#2ecc71' : '#e74c3c'};
  margin-bottom: 20px;
`;

const StatusTitle = styled.h1`
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 15px;
`;

const StatusMessage = styled.p`
  font-size: 1.2rem;
  color: #7f8c8d;
  max-width: 600px;
  margin-bottom: 30px;
`;

const FitbitCallback = () => {
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from the URL
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const error = params.get('error');
        
        if (error) {
          setStatus('error');
          setMessage(`Authorization failed: ${error}`);
          return;
        }
        
        if (!code) {
          setStatus('error');
          setMessage('No authorization code received from Fitbit');
          return;
        }
        
        // Exchange the code for access token
        const tokenResponse = await fetch('https://api.fitbit.com/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(`${process.env.REACT_APP_FITBIT_CLIENT_ID}:${process.env.REACT_APP_FITBIT_CLIENT_SECRET}`)}`
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: process.env.REACT_APP_FITBIT_REDIRECT_URI
          })
        });
        
        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json();
          throw new Error(errorData.errors?.[0]?.message || 'Failed to exchange code for token');
        }
        
        const tokenData = await tokenResponse.json();
        
        // Store the tokens in the database
        const { error: updateError } = await updateFitbitTokens(user.id, {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
          token_type: tokenData.token_type,
          scope: tokenData.scope,
          timestamp: new Date().toISOString()
        });
        
        if (updateError) {
          throw updateError;
        }
        
        setStatus('success');
        setMessage('Your Fitbit account has been successfully connected!');
        
        // Redirect after a delay
        setTimeout(() => {
          navigate('/settings');
          toast.success('Fitbit account connected successfully!');
        }, 3000);
      } catch (error) {
        console.error('Error connecting Fitbit account:', error);
        setStatus('error');
        setMessage(`Failed to connect Fitbit account: ${error.message}`);
      }
    };
    
    if (user) {
      handleCallback();
    } else {
      setStatus('error');
      setMessage('You must be logged in to connect your Fitbit account');
    }
  }, [location, navigate, user]);
  
  if (status === 'loading') {
    return <LoadingSpinner text="Connecting to Fitbit..." />;
  }
  
  return (
    <CallbackContainer>
      <StatusIcon success={status === 'success'}>
        {status === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
      </StatusIcon>
      <StatusTitle>
        {status === 'success' ? 'Connection Successful' : 'Connection Failed'}
      </StatusTitle>
      <StatusMessage>{message}</StatusMessage>
      {status === 'success' && (
        <p>Redirecting to settings page...</p>
      )}
      {status === 'error' && (
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/settings')}
        >
          Return to Settings
        </button>
      )}
    </CallbackContainer>
  );
};

export default FitbitCallback;