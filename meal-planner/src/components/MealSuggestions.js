import React, { useState, useEffect, useContext } from 'react';
import { Card, Button, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { FaUtensils, FaPlus, FaShoppingCart } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { getMealSuggestions } from '../services/mealPlannerService';
import { updateFoodItemStockStatus } from '../services/foodDataService.updated';
import { updateReadyMealStockStatus } from '../services/readyMealService';

const MealSuggestions = ({ mealType, mealId, onAddToMeal }) => {
  const { user } = useContext(AuthContext);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!user || !mealType) return;
      
      setLoading(true);
      try {
        const data = await getMealSuggestions(user.id, mealType);
        setSuggestions(data || []);
      } catch (error) {
        console.error(`Error fetching ${mealType} suggestions:`, error);
        toast.error(`Failed to load meal suggestions: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [user, mealType]);

  const handleAddToMeal = (item) => {
    if (onAddToMeal) {
      onAddToMeal(item);
    }
  };

  const handleUpdateStockStatus = async (item, inStock) => {
    try {
      if (item.type === 'ready_meal') {
        await updateReadyMealStockStatus(item.id, inStock, user.id);
      } else if (item.type === 'food_item') {
        await updateFoodItemStockStatus(item.id, inStock, user.id);
      }
      
      // Update local state
      setSuggestions(prevSuggestions => 
        prevSuggestions.map(suggestion => 
          suggestion.id === item.id && suggestion.type === item.type
            ? { ...suggestion, in_stock: inStock }
            : suggestion
        )
      );
      
      toast.success(`Item marked as ${inStock ? 'in stock' : 'out of stock'}`);
    } catch (error) {
      console.error('Error updating stock status:', error);
      toast.error(`Failed to update stock status: ${error.message}`);
    }
  };

  const renderMealTypeBadges = (mealTypes) => {
    if (!mealTypes || mealTypes.length === 0) return null;
    
    const badgeColors = {
      breakfast: 'primary',
      lunch: 'success',
      dinner: 'danger',
      snack: 'warning'
    };
    
    return mealTypes.map(type => (
      <Badge 
        key={type} 
        bg={badgeColors[type] || 'secondary'} 
        className="me-1 mb-1"
      >
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    ));
  };

  const renderTypeBadge = (type) => {
    const badgeColors = {
      'ready_meal': 'info',
      'recipe': 'primary',
      'food_item': 'secondary'
    };
    
    return (
      <Badge bg={badgeColors[type] || 'secondary'} className="me-1 mb-1">
        {type === 'ready_meal' ? 'Ready Meal' : 
         type === 'recipe' ? 'Recipe' : 'Food Item'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading suggestions...</p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card className="mb-4">
        <Card.Body className="text-center">
          <FaUtensils className="mb-3" size={30} />
          <Card.Title>No Suggestions Available</Card.Title>
          <Card.Text>
            No {mealType} suggestions found. Try adding more items and marking them as {mealType}.
          </Card.Text>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="meal-suggestions mb-4">
      <h4 className="mb-3">{mealType.charAt(0).toUpperCase() + mealType.slice(1)} Suggestions</h4>
      <Row xs={1} md={2} lg={3} className="g-4">
        {suggestions.map(item => (
          <Col key={`${item.type}-${item.id}`}>
            <Card className="h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <Card.Title>{item.name}</Card.Title>
                  <Badge bg={item.in_stock ? 'success' : 'danger'}>
                    {item.in_stock ? 'In Stock' : 'Out of Stock'}
                  </Badge>
                </div>
                
                <div className="mb-2">
                  {renderTypeBadge(item.type)}
                  {renderMealTypeBadges(item.meal_type)}
                </div>
                
                {item.description && (
                  <Card.Text className="mb-2">{item.description}</Card.Text>
                )}
                
                {item.calories > 0 && (
                  <div className="mb-2">
                    <strong>Calories:</strong> {item.calories}
                  </div>
                )}
              </Card.Body>
              <Card.Footer>
                <div className="d-flex justify-content-between">
                  <Button
                    variant={item.in_stock ? 'outline-danger' : 'outline-success'}
                    size="sm"
                    onClick={() => handleUpdateStockStatus(item, !item.in_stock)}
                  >
                    {item.in_stock ? (
                      <>
                        <FaShoppingCart className="me-1" /> Need to Buy
                      </>
                    ) : (
                      <>
                        <FaShoppingCart className="me-1" /> In Stock
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAddToMeal(item)}
                    disabled={!mealId || !item.in_stock}
                  >
                    <FaPlus className="me-1" /> Add to Meal
                  </Button>
                </div>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default MealSuggestions;