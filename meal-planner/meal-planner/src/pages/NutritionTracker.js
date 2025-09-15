import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { format, subDays, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { FaChartPie, FaArrowLeft, FaArrowRight, FaCalendarAlt, FaUtensils } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const NutritionContainer = styled.div`
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

const DateNavigation = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
  background-color: white;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const DateDisplay = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 8px;
    color: #3498db;
  }
`;

const NavButton = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 8px 15px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.3s;
  
  svg {
    margin-right: 5px;
  }
  
  &:hover {
    background-color: #2980b9;
  }
  
  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
`;

const ViewToggle = styled.div`
  display: flex;
  margin-bottom: 20px;
`;

const ToggleButton = styled.button`
  background-color: ${props => props.active ? '#3498db' : 'white'};
  color: ${props => props.active ? 'white' : '#3498db'};
  border: 1px solid #3498db;
  padding: 8px 15px;
  cursor: pointer;
  transition: all 0.3s;
  
  &:first-child {
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
  }
  
  &:last-child {
    border-top-right-radius: 5px;
    border-bottom-right-radius: 5px;
  }
  
  &:hover {
    background-color: ${props => props.active ? '#2980b9' : '#f5f9fc'};
  }
`;

const NutritionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const NutritionCard = styled.div`
  background-color: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const CardTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 15px;
  color: #2c3e50;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 8px;
    color: #3498db;
  }
`;

const MacroSummary = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
`;

const MacroItem = styled.div`
  text-align: center;
`;

const MacroValue = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.color || '#2c3e50'};
`;

const MacroLabel = styled.div`
  font-size: 0.9rem;
  color: #7f8c8d;
`;

const ChartContainer = styled.div`
  height: 300px;
  margin-bottom: 20px;
`;

const MealBreakdown = styled.div`
  margin-top: 20px;
`;

const MealItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #ecf0f1;
  
  &:last-child {
    border-bottom: none;
  }
`;

const MealType = styled.div`
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 8px;
    color: #3498db;
  }
`;

const MealCalories = styled.div`
  font-weight: 600;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const EmptyStateMessage = styled.p`
  color: #7f8c8d;
  margin-bottom: 20px;
`;

const EmptyStateButton = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #2980b9;
  }
`;

const NutritionTracker = () => {
  const [view, setView] = useState('day'); // 'day' or 'week'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [nutritionData, setNutritionData] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchNutritionData = async () => {
      try {
        setLoading(true);
        
        if (view === 'day') {
          // Fetch single day data
          const formattedDate = format(selectedDate, 'yyyy-MM-dd');
          
          const { data, error } = await supabase
            .from('nutrition_logs')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', formattedDate)
            .single();
          
          if (error && error.code !== 'PGRST116') {
            throw error;
          }
          
          setNutritionData(data || null);
        } else {
          // Fetch weekly data
          const startDate = format(startOfWeek(selectedDate), 'yyyy-MM-dd');
          const endDate = format(endOfWeek(selectedDate), 'yyyy-MM-dd');
          
          const { data, error } = await supabase
            .from('nutrition_logs')
            .select('*')
            .eq('user_id', user.id)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });
          
          if (error) {
            throw error;
          }
          
          setWeeklyData(data || []);
        }
      } catch (error) {
        console.error('Error fetching nutrition data:', error);
        toast.error('Failed to load nutrition data');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchNutritionData();
    }
  }, [user, selectedDate, view]);
  
  const handlePrevious = () => {
    if (view === 'day') {
      setSelectedDate(subDays(selectedDate, 1));
    } else {
      setSelectedDate(subDays(selectedDate, 7));
    }
  };
  
  const handleNext = () => {
    if (view === 'day') {
      setSelectedDate(addDays(selectedDate, 1));
    } else {
      setSelectedDate(addDays(selectedDate, 7));
    }
  };
  
  const handleViewToggle = (newView) => {
    setView(newView);
  };
  
  const handleCreateMealPlan = () => {
    navigate('/meal-planner');
  };
  
  const renderDailyView = () => {
    if (!nutritionData) {
      return (
        <EmptyState>
          <EmptyStateMessage>
            No nutrition data available for this day. Add meals to your meal plan to see nutrition information.
          </EmptyStateMessage>
          <EmptyStateButton onClick={handleCreateMealPlan}>
            Create Meal Plan
          </EmptyStateButton>
        </EmptyState>
      );
    }
    
    // Calculate percentages for macros
    const totalCalories = nutritionData.total_calories || 0;
    const proteinCalories = (nutritionData.total_protein_g || 0) * 4;
    const carbsCalories = (nutritionData.total_carbs_g || 0) * 4;
    const fatCalories = (nutritionData.total_fat_g || 0) * 9;
    
    const proteinPercentage = totalCalories > 0 ? Math.round((proteinCalories / totalCalories) * 100) : 0;
    const carbsPercentage = totalCalories > 0 ? Math.round((carbsCalories / totalCalories) * 100) : 0;
    const fatPercentage = totalCalories > 0 ? Math.round((fatCalories / totalCalories) * 100) : 0;
    
    // Doughnut chart data for macros
    const macroChartData = {
      labels: ['Protein', 'Carbs', 'Fat'],
      datasets: [
        {
          data: [proteinPercentage, carbsPercentage, fatPercentage],
          backgroundColor: ['#2ecc71', '#f39c12', '#e74c3c'],
          borderWidth: 0,
        },
      ],
    };
    
    // Mock meal breakdown data (in a real app, this would come from the database)
    const mealBreakdownData = [
      { type: 'breakfast', calories: Math.round(totalCalories * 0.25) },
      { type: 'lunch', calories: Math.round(totalCalories * 0.35) },
      { type: 'dinner', calories: Math.round(totalCalories * 0.3) },
      { type: 'snack', calories: Math.round(totalCalories * 0.1) },
    ];
    
    return (
      <>
        <NutritionGrid>
          <NutritionCard>
            <CardTitle>
              <FaChartPie />
              Daily Calories
            </CardTitle>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#3498db', textAlign: 'center', marginBottom: '10px' }}>
              {nutritionData.total_calories || 0}
            </div>
            <div style={{ textAlign: 'center', color: '#7f8c8d' }}>
              of 2000 goal
            </div>
            
            <MealBreakdown>
              <h4>Meal Breakdown</h4>
              {mealBreakdownData.map((meal) => (
                <MealItem key={meal.type}>
                  <MealType>
                    <FaUtensils />
                    {meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}
                  </MealType>
                  <MealCalories>{meal.calories} kcal</MealCalories>
                </MealItem>
              ))}
            </MealBreakdown>
          </NutritionCard>
          
          <NutritionCard>
            <CardTitle>
              <FaChartPie />
              Macronutrients
            </CardTitle>
            <div style={{ height: '200px' }}>
              <Doughnut 
                data={macroChartData} 
                options={{
                  maintainAspectRatio: false,
                  cutout: '70%',
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            </div>
            
            <MacroSummary>
              <MacroItem>
                <MacroValue color="#2ecc71">{nutritionData.total_protein_g || 0}g</MacroValue>
                <MacroLabel>Protein</MacroLabel>
              </MacroItem>
              <MacroItem>
                <MacroValue color="#f39c12">{nutritionData.total_carbs_g || 0}g</MacroValue>
                <MacroLabel>Carbs</MacroLabel>
              </MacroItem>
              <MacroItem>
                <MacroValue color="#e74c3c">{nutritionData.total_fat_g || 0}g</MacroValue>
                <MacroLabel>Fat</MacroLabel>
              </MacroItem>
            </MacroSummary>
          </NutritionCard>
          
          <NutritionCard>
            <CardTitle>
              <FaChartPie />
              Additional Nutrients
            </CardTitle>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Fiber</span>
                <span>{nutritionData.total_fiber_g || 0}g</span>
              </div>
              <div style={{ height: '8px', backgroundColor: '#ecf0f1', borderRadius: '4px' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${Math.min(((nutritionData.total_fiber_g || 0) / 25) * 100, 100)}%`, 
                    backgroundColor: '#3498db', 
                    borderRadius: '4px' 
                  }}
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Sugar</span>
                <span>{nutritionData.total_sugar_g || 0}g</span>
              </div>
              <div style={{ height: '8px', backgroundColor: '#ecf0f1', borderRadius: '4px' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${Math.min(((nutritionData.total_sugar_g || 0) / 50) * 100, 100)}%`, 
                    backgroundColor: '#f39c12', 
                    borderRadius: '4px' 
                  }}
                />
              </div>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Sodium</span>
                <span>{nutritionData.total_sodium_mg || 0}mg</span>
              </div>
              <div style={{ height: '8px', backgroundColor: '#ecf0f1', borderRadius: '4px' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${Math.min(((nutritionData.total_sodium_mg || 0) / 2300) * 100, 100)}%`, 
                    backgroundColor: '#e74c3c', 
                    borderRadius: '4px' 
                  }}
                />
              </div>
            </div>
          </NutritionCard>
        </NutritionGrid>
      </>
    );
  };
  
  const renderWeeklyView = () => {
    if (weeklyData.length === 0) {
      return (
        <EmptyState>
          <EmptyStateMessage>
            No nutrition data available for this week. Add meals to your meal plan to see nutrition information.
          </EmptyStateMessage>
          <EmptyStateButton onClick={handleCreateMealPlan}>
            Create Meal Plan
          </EmptyStateButton>
        </EmptyState>
      );
    }
    
    // Prepare data for charts
    const dates = weeklyData.map(day => format(new Date(day.date), 'EEE'));
    const calories = weeklyData.map(day => day.total_calories || 0);
    const protein = weeklyData.map(day => day.total_protein_g || 0);
    const carbs = weeklyData.map(day => day.total_carbs_g || 0);
    const fat = weeklyData.map(day => day.total_fat_g || 0);
    
    // Calories chart data
    const caloriesChartData = {
      labels: dates,
      datasets: [
        {
          label: 'Calories',
          data: calories,
          backgroundColor: 'rgba(52, 152, 219, 0.5)',
          borderColor: '#3498db',
          borderWidth: 2,
        },
      ],
    };
    
    // Macros chart data
    const macrosChartData = {
      labels: dates,
      datasets: [
        {
          label: 'Protein (g)',
          data: protein,
          backgroundColor: 'rgba(46, 204, 113, 0.5)',
          borderColor: '#2ecc71',
          borderWidth: 2,
        },
        {
          label: 'Carbs (g)',
          data: carbs,
          backgroundColor: 'rgba(243, 156, 18, 0.5)',
          borderColor: '#f39c12',
          borderWidth: 2,
        },
        {
          label: 'Fat (g)',
          data: fat,
          backgroundColor: 'rgba(231, 76, 60, 0.5)',
          borderColor: '#e74c3c',
          borderWidth: 2,
        },
      ],
    };
    
    // Calculate weekly averages
    const avgCalories = Math.round(calories.reduce((sum, val) => sum + val, 0) / calories.length);
    const avgProtein = Math.round(protein.reduce((sum, val) => sum + val, 0) / protein.length);
    const avgCarbs = Math.round(carbs.reduce((sum, val) => sum + val, 0) / carbs.length);
    const avgFat = Math.round(fat.reduce((sum, val) => sum + val, 0) / fat.length);
    
    return (
      <>
        <NutritionGrid>
          <NutritionCard style={{ gridColumn: '1 / -1' }}>
            <CardTitle>
              <FaChartPie />
              Weekly Calories
            </CardTitle>
            <ChartContainer>
              <Bar 
                data={caloriesChartData} 
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Calories',
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                }}
              />
            </ChartContainer>
          </NutritionCard>
          
          <NutritionCard style={{ gridColumn: '1 / -1' }}>
            <CardTitle>
              <FaChartPie />
              Weekly Macronutrients
            </CardTitle>
            <ChartContainer>
              <Line 
                data={macrosChartData} 
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Grams',
                      },
                    },
                  },
                }}
              />
            </ChartContainer>
          </NutritionCard>
          
          <NutritionCard>
            <CardTitle>
              <FaChartPie />
              Weekly Averages
            </CardTitle>
            <MacroSummary>
              <MacroItem>
                <MacroValue>{avgCalories}</MacroValue>
                <MacroLabel>Calories</MacroLabel>
              </MacroItem>
              <MacroItem>
                <MacroValue color="#2ecc71">{avgProtein}g</MacroValue>
                <MacroLabel>Protein</MacroLabel>
              </MacroItem>
              <MacroItem>
                <MacroValue color="#f39c12">{avgCarbs}g</MacroValue>
                <MacroLabel>Carbs</MacroLabel>
              </MacroItem>
              <MacroItem>
                <MacroValue color="#e74c3c">{avgFat}g</MacroValue>
                <MacroLabel>Fat</MacroLabel>
              </MacroItem>
            </MacroSummary>
          </NutritionCard>
        </NutritionGrid>
      </>
    );
  };
  
  if (loading) {
    return <LoadingSpinner text="Loading nutrition data..." />;
  }
  
  return (
    <NutritionContainer>
      <PageTitle>
        <FaChartPie />
        Nutrition Tracker
      </PageTitle>
      
      <DateNavigation>
        <NavButton onClick={handlePrevious}>
          <FaArrowLeft />
          {view === 'day' ? 'Previous Day' : 'Previous Week'}
        </NavButton>
        
        <DateDisplay>
          <FaCalendarAlt />
          {view === 'day' 
            ? format(selectedDate, 'EEEE, MMMM d, yyyy')
            : `Week of ${format(startOfWeek(selectedDate), 'MMM d')} - ${format(endOfWeek(selectedDate), 'MMM d, yyyy')}`
          }
        </DateDisplay>
        
        <NavButton onClick={handleNext}>
          {view === 'day' ? 'Next Day' : 'Next Week'}
          <FaArrowRight />
        </NavButton>
      </DateNavigation>
      
      <ViewToggle>
        <ToggleButton 
          active={view === 'day'} 
          onClick={() => handleViewToggle('day')}
        >
          Daily View
        </ToggleButton>
        <ToggleButton 
          active={view === 'week'} 
          onClick={() => handleViewToggle('week')}
        >
          Weekly View
        </ToggleButton>
      </ViewToggle>
      
      {view === 'day' ? renderDailyView() : renderWeeklyView()}
    </NutritionContainer>
  );
};

export default NutritionTracker;