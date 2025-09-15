import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaUtensils, FaBarcode, FaBook, FaShoppingBasket, FaChartPie } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { format } from 'date-fns';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

const DashboardContainer = styled.div`
  padding: 20px 0;
`;

const WelcomeSection = styled.div`
  background-color: #3498db;
  color: white;
  padding: 30px;
  border-radius: 10px;
  margin-bottom: 30px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
`;

const WelcomeTitle = styled.h1`
  font-size: 2rem;
  margin-bottom: 10px;
`;

const WelcomeSubtitle = styled.p`
  font-size: 1.1rem;
  opacity: 0.9;
`;

const QuickActionsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const QuickActionCard = styled(Link)`
  background-color: white;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  text-decoration: none;
  color: #333;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
`;

const ActionIcon = styled.div`
  font-size: 2.5rem;
  color: #3498db;
  margin-bottom: 15px;
`;

const ActionTitle = styled.h3`
  margin-bottom: 10px;
`;

const ActionDescription = styled.p`
  color: #666;
  font-size: 0.9rem;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  
  @media (max-width: 992px) {
    grid-template-columns: 1fr;
  }
`;

const DashboardCard = styled.div`
  background-color: white;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const CardTitle = styled.h2`
  font-size: 1.5rem;
  color: #2c3e50;
`;

const CardLink = styled(Link)`
  color: #3498db;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

const MealPlanSection = styled.div`
  margin-bottom: 20px;
`;

const MealPlanDate = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 15px;
  color: #2c3e50;
`;

const MealCard = styled.div`
  padding: 15px;
  border-left: 4px solid #3498db;
  background-color: #f8f9fa;
  margin-bottom: 15px;
  border-radius: 5px;
`;

const MealType = styled.h4`
  font-size: 1.1rem;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 8px;
    color: #3498db;
  }
`;

const MealItem = styled.div`
  margin-bottom: 5px;
  font-size: 0.9rem;
  display: flex;
  justify-content: space-between;
`;

const MealItemName = styled.span`
  color: #333;
`;

const MealItemCalories = styled.span`
  color: #7f8c8d;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 30px;
  color: #7f8c8d;
  
  p {
    margin-bottom: 15px;
  }
`;

const NutritionSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-top: 20px;
`;

const NutritionItem = styled.div`
  background-color: #f8f9fa;
  border-radius: 5px;
  padding: 15px;
  text-align: center;
`;

const NutritionLabel = styled.div`
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-bottom: 5px;
`;

const NutritionValue = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
`;

const ProgressBar = styled.div`
  height: 10px;
  background-color: #ecf0f1;
  border-radius: 5px;
  margin-top: 10px;
  overflow: hidden;
`;

const Progress = styled.div`
  height: 100%;
  background-color: ${props => props.color || '#3498db'};
  width: ${props => props.percentage}%;
  transition: width 0.3s ease;
`;

const RecentActivityList = styled.ul`
  list-style: none;
  padding: 0;
`;

const ActivityItem = styled.li`
  padding: 15px 0;
  border-bottom: 1px solid #ecf0f1;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ActivityTime = styled.div`
  font-size: 0.8rem;
  color: #7f8c8d;
  margin-bottom: 5px;
`;

const ActivityDescription = styled.div`
  font-size: 0.95rem;
`;

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todaysMeals, setTodaysMeals] = useState(null);
  const [nutritionSummary, setNutritionSummary] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const today = new Date();
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch today's meal plan
        const todayFormatted = format(today, 'yyyy-MM-dd');
        const { data: mealPlanData, error: mealPlanError } = await supabase
          .from('meal_plans')
          .select(`
            *,
            meals:meals(
              *,
              meal_items:meal_items(
                *,
                food_item:food_items(*),
                recipe:recipes(*)
              )
            )
          `)
          .eq('user_id', user.id)
          .eq('date', todayFormatted)
          .single();
        
        if (mealPlanError && mealPlanError.code !== 'PGRST116') {
          throw mealPlanError;
        }
        
        // Fetch nutrition summary
        const { data: nutritionData, error: nutritionError } = await supabase
          .from('nutrition_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', todayFormatted)
          .single();
        
        if (nutritionError && nutritionError.code !== 'PGRST116') {
          throw nutritionError;
        }
        
        // Fetch recent activity
        const { data: activityData, error: activityError } = await supabase
          .from('fitbit_sync_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('sync_time', { ascending: false })
          .limit(5);
        
        if (activityError) {
          throw activityError;
        }
        
        setTodaysMeals(mealPlanData);
        setNutritionSummary(nutritionData);
        setRecentActivity(activityData || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchDashboardData();
    }
  }, [user, today]);
  
  if (loading) {
    return <LoadingSpinner text="Loading your dashboard..." />;
  }
  
  return (
    <DashboardContainer>
      <WelcomeSection>
        <WelcomeTitle>Welcome, {user?.user_metadata?.firstName || 'there'}!</WelcomeTitle>
        <WelcomeSubtitle>
          {format(today, 'EEEE, MMMM d, yyyy')} - Let's plan your meals for today
        </WelcomeSubtitle>
      </WelcomeSection>
      
      <QuickActionsContainer>
        <QuickActionCard to="/meal-planner">
          <ActionIcon>
            <FaUtensils />
          </ActionIcon>
          <ActionTitle>Plan Meals</ActionTitle>
          <ActionDescription>Create and manage your meal plans</ActionDescription>
        </QuickActionCard>
        
        <QuickActionCard to="/barcode-scanner">
          <ActionIcon>
            <FaBarcode />
          </ActionIcon>
          <ActionTitle>Scan Food</ActionTitle>
          <ActionDescription>Quickly add foods by scanning barcodes</ActionDescription>
        </QuickActionCard>
        
        <QuickActionCard to="/recipes">
          <ActionIcon>
            <FaBook />
          </ActionIcon>
          <ActionTitle>Recipes</ActionTitle>
          <ActionDescription>Browse and create recipes</ActionDescription>
        </QuickActionCard>
        
        <QuickActionCard to="/shopping-list">
          <ActionIcon>
            <FaShoppingBasket />
          </ActionIcon>
          <ActionTitle>Shopping List</ActionTitle>
          <ActionDescription>Generate lists from your meal plans</ActionDescription>
        </QuickActionCard>
      </QuickActionsContainer>
      
      <DashboardGrid>
        <div>
          <DashboardCard>
            <CardHeader>
              <CardTitle>Today's Meals</CardTitle>
              <CardLink to="/meal-planner">Plan Meals</CardLink>
            </CardHeader>
            
            {todaysMeals ? (
              <MealPlanSection>
                <MealPlanDate>{format(today, 'EEEE, MMMM d')}</MealPlanDate>
                
                {todaysMeals.meals
                  .sort((a, b) => {
                    const mealOrder = { breakfast: 1, lunch: 2, dinner: 3, snack: 4 };
                    return mealOrder[a.meal_type] - mealOrder[b.meal_type];
                  })
                  .map(meal => (
                    <MealCard key={meal.id}>
                      <MealType>
                        <FaUtensils />
                        {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}
                      </MealType>
                      
                      {meal.meal_items.length > 0 ? (
                        meal.meal_items.map(item => (
                          <MealItem key={item.id}>
                            <MealItemName>
                              {item.food_item ? item.food_item.name : item.recipe.name}
                            </MealItemName>
                            <MealItemCalories>
                              {item.food_item 
                                ? Math.round((item.food_item.calories_per_100g * item.quantity) / 100)
                                : 'Recipe'} kcal
                            </MealItemCalories>
                          </MealItem>
                        ))
                      ) : (
                        <MealItem>
                          <MealItemName>No items added yet</MealItemName>
                        </MealItem>
                      )}
                    </MealCard>
                  ))}
              </MealPlanSection>
            ) : (
              <EmptyState>
                <p>You haven't planned any meals for today yet.</p>
                <Link to="/meal-planner" className="btn btn-primary">
                  Plan Today's Meals
                </Link>
              </EmptyState>
            )}
          </DashboardCard>
          
          <DashboardCard>
            <CardHeader>
              <CardTitle>Nutrition Summary</CardTitle>
              <CardLink to="/nutrition">View Details</CardLink>
            </CardHeader>
            
            {nutritionSummary ? (
              <NutritionSummary>
                <NutritionItem>
                  <NutritionLabel>Calories</NutritionLabel>
                  <NutritionValue>{nutritionSummary.total_calories} / 2000</NutritionValue>
                  <ProgressBar>
                    <Progress 
                      percentage={Math.min((nutritionSummary.total_calories / 2000) * 100, 100)} 
                      color="#3498db" 
                    />
                  </ProgressBar>
                </NutritionItem>
                
                <NutritionItem>
                  <NutritionLabel>Protein</NutritionLabel>
                  <NutritionValue>{nutritionSummary.total_protein_g}g / 100g</NutritionValue>
                  <ProgressBar>
                    <Progress 
                      percentage={Math.min((nutritionSummary.total_protein_g / 100) * 100, 100)} 
                      color="#2ecc71" 
                    />
                  </ProgressBar>
                </NutritionItem>
                
                <NutritionItem>
                  <NutritionLabel>Carbs</NutritionLabel>
                  <NutritionValue>{nutritionSummary.total_carbs_g}g / 250g</NutritionValue>
                  <ProgressBar>
                    <Progress 
                      percentage={Math.min((nutritionSummary.total_carbs_g / 250) * 100, 100)} 
                      color="#f39c12" 
                    />
                  </ProgressBar>
                </NutritionItem>
                
                <NutritionItem>
                  <NutritionLabel>Fat</NutritionLabel>
                  <NutritionValue>{nutritionSummary.total_fat_g}g / 70g</NutritionValue>
                  <ProgressBar>
                    <Progress 
                      percentage={Math.min((nutritionSummary.total_fat_g / 70) * 100, 100)} 
                      color="#e74c3c" 
                    />
                  </ProgressBar>
                </NutritionItem>
              </NutritionSummary>
            ) : (
              <EmptyState>
                <p>No nutrition data available for today.</p>
                <p>Add meals to your plan to see nutrition information.</p>
              </EmptyState>
            )}
          </DashboardCard>
        </div>
        
        <div>
          <DashboardCard>
            <CardHeader>
              <CardTitle>Fitbit Status</CardTitle>
              <CardLink to="/settings">Connect</CardLink>
            </CardHeader>
            
            {user?.user_metadata?.fitbit_connected ? (
              <div>
                <p style={{ color: '#2ecc71', marginBottom: '15px' }}>
                  <FaChartPie style={{ marginRight: '8px' }} />
                  Connected to Fitbit
                </p>
                <p>Your meal data will automatically sync with your Fitbit account.</p>
              </div>
            ) : (
              <EmptyState>
                <p>Connect your Fitbit account to sync your meal data.</p>
                <Link to="/settings" className="btn btn-primary">
                  Connect Fitbit
                </Link>
              </EmptyState>
            )}
          </DashboardCard>
          
          <DashboardCard>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            
            {recentActivity.length > 0 ? (
              <RecentActivityList>
                {recentActivity.map(activity => (
                  <ActivityItem key={activity.id}>
                    <ActivityTime>
                      {format(new Date(activity.sync_time), 'MMM d, yyyy h:mm a')}
                    </ActivityTime>
                    <ActivityDescription>
                      {activity.status === 'success' 
                        ? 'Successfully synced meals with Fitbit'
                        : `Sync failed: ${activity.error_message}`}
                    </ActivityDescription>
                  </ActivityItem>
                ))}
              </RecentActivityList>
            ) : (
              <EmptyState>
                <p>No recent activity to display.</p>
              </EmptyState>
            )}
          </DashboardCard>
        </div>
      </DashboardGrid>
    </DashboardContainer>
  );
};

export default Dashboard;