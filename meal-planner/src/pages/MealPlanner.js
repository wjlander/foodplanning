import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Form, Tabs, Tab, Alert } from 'react-bootstrap';
import { FaPlus, FaTrash, FaSync, FaCopy, FaShoppingCart } from 'react-icons/fa';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import MealSuggestions from '../components/MealSuggestions';
import { 
  getMealPlanByDate, 
  createMealPlan, 
  addFoodItemToMeal, 
  addRecipeToMeal,
  addReadyMealToMeal,
  removeMealItem, 
  syncMealPlanWithFitbit,
  copyMealPlan,
  generateShoppingList
} from '../services/mealPlannerService.updated';
import { searchFoodItems } from '../services/foodDataService.updated';

const MealPlanner = () => {
  const { user } = useContext(AuthContext);
  const [currentDate, setCurrentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState(null);
  const [selectedMealType, setSelectedMealType] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch meal plan for the current date
  useEffect(() => {
    const fetchMealPlan = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        let plan = await getMealPlanByDate(user.id, currentDate);
        
        if (!plan) {
          plan = await createMealPlan(user.id, currentDate);
        }
        
        setMealPlan(plan);
      } catch (error) {
        console.error('Error fetching meal plan:', error);
        toast.error('Failed to load meal plan');
      } finally {
        setLoading(false);
      }
    };

    fetchMealPlan();
  }, [user, currentDate]);

  // Search for food items
  useEffect(() => {
    const searchFood = async () => {
      if (!searchTerm || searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }
      
      setSearching(true);
      try {
        const results = await searchFoodItems(searchTerm);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching food items:', error);
        toast.error('Search failed');
      } finally {
        setSearching(false);
      }
    };

    const timeoutId = setTimeout(searchFood, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Navigate to previous day
  const goToPreviousDay = () => {
    setCurrentDate(format(subDays(parseISO(currentDate), 1), 'yyyy-MM-dd'));
  };

  // Navigate to next day
  const goToNextDay = () => {
    setCurrentDate(format(addDays(parseISO(currentDate), 1), 'yyyy-MM-dd'));
  };

  // Handle adding food item to meal
  const handleAddFoodItem = async (mealId, foodItemId) => {
    try {
      const result = await addFoodItemToMeal(mealId, foodItemId, 100);
      
      if (result) {
        // Update local state
        setMealPlan(prevPlan => {
          const updatedMeals = prevPlan.meals.map(meal => {
            if (meal.id === mealId) {
              return {
                ...meal,
                meal_items: [...meal.meal_items, result]
              };
            }
            return meal;
          });
          
          return {
            ...prevPlan,
            meals: updatedMeals
          };
        });
        
        // Clear search
        setSearchTerm('');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error adding food item:', error);
      toast.error('Failed to add food item');
    }
  };

  // Handle removing meal item
  const handleRemoveMealItem = async (mealItemId, mealId) => {
    try {
      const success = await removeMealItem(mealItemId);
      
      if (success) {
        // Update local state
        setMealPlan(prevPlan => {
          const updatedMeals = prevPlan.meals.map(meal => {
            if (meal.id === mealId) {
              return {
                ...meal,
                meal_items: meal.meal_items.filter(item => item.id !== mealItemId)
              };
            }
            return meal;
          });
          
          return {
            ...prevPlan,
            meals: updatedMeals
          };
        });
      }
    } catch (error) {
      console.error('Error removing meal item:', error);
      toast.error('Failed to remove item');
    }
  };

  // Handle syncing with Fitbit
  const handleSyncWithFitbit = async () => {
    try {
      const result = await syncMealPlanWithFitbit(user.id, currentDate);
      
      if (result.success) {
        toast.success('Successfully synced with Fitbit');
      } else {
        toast.error(`Sync failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error syncing with Fitbit:', error);
      toast.error('Failed to sync with Fitbit');
    }
  };

  // Handle copying meal plan
  const handleCopyMealPlan = async () => {
    const targetDate = prompt('Enter target date (YYYY-MM-DD):', format(addDays(parseISO(currentDate), 1), 'yyyy-MM-dd'));
    
    if (!targetDate) return;
    
    try {
      const result = await copyMealPlan(user.id, currentDate, targetDate);
      
      if (result) {
        toast.success(`Meal plan copied to ${targetDate}`);
      }
    } catch (error) {
      console.error('Error copying meal plan:', error);
      toast.error('Failed to copy meal plan');
    }
  };

  // Handle generating shopping list
  const handleGenerateShoppingList = async () => {
    try {
      const result = await generateShoppingList(user.id, currentDate, currentDate, `Shopping List for ${currentDate}`);
      
      if (result) {
        toast.success('Shopping list generated successfully');
        // Redirect to shopping list page
        window.location.href = '/shopping-list';
      }
    } catch (error) {
      console.error('Error generating shopping list:', error);
      toast.error('Failed to generate shopping list');
    }
  };

  // Handle meal selection for suggestions
  const handleMealSelection = (mealId, mealType) => {
    setSelectedMealId(mealId);
    setSelectedMealType(mealType);
    setShowSuggestions(true);
  };

  // Handle adding suggested item to meal
  const handleAddSuggestion = async (item) => {
    if (!selectedMealId) return;
    
    try {
      let result;
      
      if (item.type === 'food_item') {
        result = await addFoodItemToMeal(selectedMealId, item.id, 100);
      } else if (item.type === 'recipe') {
        result = await addRecipeToMeal(selectedMealId, item.id, 1);
      } else if (item.type === 'ready_meal') {
        result = await addReadyMealToMeal(selectedMealId, item.id, 1);
      }
      
      if (result) {
        // Update local state
        setMealPlan(prevPlan => {
          const updatedMeals = prevPlan.meals.map(meal => {
            if (meal.id === selectedMealId) {
              return {
                ...meal,
                meal_items: [...meal.meal_items, result]
              };
            }
            return meal;
          });
          
          return {
            ...prevPlan,
            meals: updatedMeals
          };
        });
        
        toast.success('Item added to meal');
      }
    } catch (error) {
      console.error('Error adding suggestion to meal:', error);
      toast.error('Failed to add item to meal');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container className="py-4">
      <h1 className="mb-4">Meal Planner</h1>
      
      {/* Date navigation */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Button variant="outline-primary" onClick={goToPreviousDay}>
          Previous Day
        </Button>
        
        <h3>{format(parseISO(currentDate), 'EEEE, MMMM d, yyyy')}</h3>
        
        <Button variant="outline-primary" onClick={goToNextDay}>
          Next Day
        </Button>
      </div>
      
      {/* Action buttons */}
      <div className="d-flex justify-content-end mb-4">
        <Button variant="outline-primary" className="me-2" onClick={handleSyncWithFitbit}>
          <FaSync className="me-2" /> Sync with Fitbit
        </Button>
        
        <Button variant="outline-secondary" className="me-2" onClick={handleCopyMealPlan}>
          <FaCopy className="me-2" /> Copy Meal Plan
        </Button>
        
        <Button variant="outline-success" onClick={handleGenerateShoppingList}>
          <FaShoppingCart className="me-2" /> Generate Shopping List
        </Button>
      </div>
      
      {/* Meal tabs */}
      <Tabs defaultActiveKey="breakfast" className="mb-4">
        {mealPlan?.meals.map(meal => (
          <Tab 
            key={meal.id} 
            eventKey={meal.meal_type} 
            title={meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}
          >
            <Card className="mb-4">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h4>{meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}</h4>
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => handleMealSelection(meal.id, meal.meal_type)}
                >
                  <FaPlus className="me-1" /> Add Item
                </Button>
              </Card.Header>
              <Card.Body>
                {meal.meal_items.length === 0 ? (
                  <Alert variant="info">
                    No items added to this meal yet. Use the "Add Item" button to add food items or recipes.
                  </Alert>
                ) : (
                  <ul className="list-group">
                    {meal.meal_items.map(item => (
                      <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <strong>
                            {item.food_item?.name || item.recipe?.name || 'Unknown Item'}
                          </strong>
                          <div className="text-muted small">
                            {item.quantity} {item.unit}
                            {item.food_item && (
                              <span> • {item.food_item.calories_per_100g} kcal/100g</span>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => handleRemoveMealItem(item.id, meal.id)}
                        >
                          <FaTrash />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                
                {/* Food search */}
                {selectedMealId === meal.id && !showSuggestions && (
                  <div className="mt-4">
                    <Form.Group className="mb-3">
                      <Form.Label>Search for food items</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </Form.Group>
                    
                    {searching && <p>Searching...</p>}
                    
                    {searchResults.length > 0 && (
                      <ul className="list-group">
                        {searchResults.map(item => (
                          <li 
                            key={item.id || item.barcode} 
                            className="list-group-item d-flex justify-content-between align-items-center"
                          >
                            <div>
                              <strong>{item.name}</strong>
                              {item.brand && <div className="text-muted small">{item.brand}</div>}
                            </div>
                            <Button 
                              variant="primary" 
                              size="sm"
                              onClick={() => handleAddFoodItem(meal.id, item.id)}
                              disabled={!item.id}
                            >
                              <FaPlus /> Add
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                    
                    <div className="mt-3 d-flex justify-content-between">
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => setSelectedMealId(null)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => setShowSuggestions(true)}
                      >
                        Show Suggestions
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Meal suggestions */}
                {selectedMealId === meal.id && showSuggestions && (
                  <div className="mt-4">
                    <MealSuggestions 
                      mealType={meal.meal_type}
                      mealId={meal.id}
                      onAddToMeal={handleAddSuggestion}
                    />
                    
                    <div className="mt-3 d-flex justify-content-between">
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => {
                          setShowSuggestions(false);
                          setSelectedMealId(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => setShowSuggestions(false)}
                      >
                        Search Food Items
                      </Button>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Tab>
        ))}
      </Tabs>
    </Container>
  );
};

export default MealPlanner;