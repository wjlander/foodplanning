import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Tabs, Tab, Alert } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaShoppingCart, FaCheck, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import ReadyMealForm from '../components/ReadyMealForm';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  getUserReadyMeals, 
  getReadyMealsByType, 
  updateReadyMealStockStatus, 
  deleteReadyMeal,
  generateOutOfStockShoppingList
} from '../services/readyMealService';

const ReadyMeals = () => {
  const { user } = useContext(AuthContext);
  const [readyMeals, setReadyMeals] = useState([]);
  const [filteredMeals, setFilteredMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [mealTypeFilter, setMealTypeFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  // Fetch ready meals on component mount
  useEffect(() => {
    const fetchReadyMeals = async () => {
      setLoading(true);
      try {
        const meals = await getUserReadyMeals(user.id);
        setReadyMeals(meals);
        setFilteredMeals(meals);
      } catch (error) {
        console.error('Error fetching ready meals:', error);
        toast.error('Failed to load ready meals');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchReadyMeals();
    }
  }, [user]);

  // Filter meals when search term, meal type filter, or stock filter changes
  useEffect(() => {
    let filtered = [...readyMeals];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(meal => 
        meal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (meal.brand && meal.brand.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply meal type filter
    if (mealTypeFilter !== 'all') {
      filtered = filtered.filter(meal => 
        meal.meal_type && meal.meal_type.includes(mealTypeFilter)
      );
    }

    // Apply stock filter
    if (stockFilter === 'in-stock') {
      filtered = filtered.filter(meal => meal.in_stock);
    } else if (stockFilter === 'out-of-stock') {
      filtered = filtered.filter(meal => !meal.in_stock);
    }

    setFilteredMeals(filtered);
  }, [readyMeals, searchTerm, mealTypeFilter, stockFilter]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    if (tab === 'all') {
      setMealTypeFilter('all');
    } else {
      setMealTypeFilter(tab);
    }
  };

  // Handle stock status change
  const handleStockStatusChange = async (id, inStock) => {
    try {
      await updateReadyMealStockStatus(id, inStock, user.id);
      
      // Update the local state
      setReadyMeals(prevMeals => 
        prevMeals.map(meal => 
          meal.id === id ? { ...meal, in_stock: inStock } : meal
        )
      );
      
      toast.success(`Ready meal marked as ${inStock ? 'in stock' : 'out of stock'}`);
    } catch (error) {
      console.error('Error updating stock status:', error);
      toast.error('Failed to update stock status');
    }
  };

  // Handle delete ready meal
  const handleDeleteMeal = async (id) => {
    if (window.confirm('Are you sure you want to delete this ready meal?')) {
      try {
        const success = await deleteReadyMeal(id, user.id);
        
        if (success) {
          // Remove from local state
          setReadyMeals(prevMeals => prevMeals.filter(meal => meal.id !== id));
          toast.success('Ready meal deleted successfully');
        }
      } catch (error) {
        console.error('Error deleting ready meal:', error);
        toast.error('Failed to delete ready meal');
      }
    }
  };

  // Handle edit ready meal
  const handleEditMeal = (meal) => {
    setEditingMeal(meal);
    setShowForm(true);
  };

  // Handle form submission
  const handleFormSubmit = (meal) => {
    if (editingMeal) {
      // Update existing meal in local state
      setReadyMeals(prevMeals => 
        prevMeals.map(m => m.id === meal.id ? meal : m)
      );
    } else {
      // Add new meal to local state
      setReadyMeals(prevMeals => [...prevMeals, meal]);
    }
    
    // Close form and reset editing state
    setShowForm(false);
    setEditingMeal(null);
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingMeal(null);
  };

  // Generate shopping list for out-of-stock items
  const handleGenerateShoppingList = async () => {
    try {
      const shoppingList = await generateOutOfStockShoppingList(user.id);
      
      if (shoppingList) {
        toast.success('Shopping list generated successfully');
        // Redirect to shopping list page
        window.location.href = '/shopping-list';
      }
    } catch (error) {
      console.error('Error generating shopping list:', error);
      toast.error('Failed to generate shopping list');
    }
  };

  // Render meal type badges
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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container className="py-4">
      <h1 className="mb-4">Ready Meals</h1>
      
      {/* Action buttons */}
      <div className="d-flex justify-content-between mb-4">
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <FaPlus className="me-2" /> Add Ready Meal
        </Button>
        
        <Button 
          variant="success" 
          onClick={handleGenerateShoppingList}
          disabled={!readyMeals.some(meal => !meal.in_stock)}
        >
          <FaShoppingCart className="me-2" /> Generate Shopping List
        </Button>
      </div>
      
      {/* Search and filters */}
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Control
              type="text"
              placeholder="Search ready meals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Select 
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <option value="all">All Items</option>
            <option value="in-stock">In Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </Form.Select>
        </Col>
      </Row>
      
      {/* Tabs for meal types */}
      <Tabs
        activeKey={activeTab}
        onSelect={handleTabChange}
        className="mb-4"
      >
        <Tab eventKey="all" title="All" />
        <Tab eventKey="breakfast" title="Breakfast" />
        <Tab eventKey="lunch" title="Lunch" />
        <Tab eventKey="dinner" title="Dinner" />
        <Tab eventKey="snack" title="Snacks" />
      </Tabs>
      
      {/* Ready meals list */}
      {filteredMeals.length === 0 ? (
        <Alert variant="info">
          No ready meals found. Add some ready meals to get started!
        </Alert>
      ) : (
        <Row>
          {filteredMeals.map(meal => (
            <Col key={meal.id} md={6} lg={4} className="mb-4">
              <Card>
                {meal.image_url && (
                  <Card.Img 
                    variant="top" 
                    src={meal.image_url} 
                    alt={meal.name}
                    style={{ height: '180px', objectFit: 'cover' }}
                  />
                )}
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <Card.Title>{meal.name}</Card.Title>
                      {meal.brand && <Card.Subtitle className="mb-2 text-muted">{meal.brand}</Card.Subtitle>}
                    </div>
                    <Badge bg={meal.in_stock ? 'success' : 'danger'}>
                      {meal.in_stock ? 'In Stock' : 'Out of Stock'}
                    </Badge>
                  </div>
                  
                  <div className="mb-3">
                    {renderMealTypeBadges(meal.meal_type)}
                  </div>
                  
                  {meal.description && (
                    <Card.Text className="mb-3">{meal.description}</Card.Text>
                  )}
                  
                  <div className="d-flex justify-content-between">
                    <div>
                      {meal.calories_per_serving && (
                        <div><strong>Calories:</strong> {meal.calories_per_serving}</div>
                      )}
                      {meal.serving_size && (
                        <div><strong>Serving:</strong> {meal.serving_size}</div>
                      )}
                    </div>
                    
                    <div className="text-end">
                      {meal.protein_g && <div><strong>Protein:</strong> {meal.protein_g}g</div>}
                      {meal.carbs_g && <div><strong>Carbs:</strong> {meal.carbs_g}g</div>}
                      {meal.fat_g && <div><strong>Fat:</strong> {meal.fat_g}g</div>}
                    </div>
                  </div>
                </Card.Body>
                <Card.Footer>
                  <div className="d-flex justify-content-between">
                    <div>
                      <Button
                        variant={meal.in_stock ? 'outline-danger' : 'outline-success'}
                        size="sm"
                        className="me-2"
                        onClick={() => handleStockStatusChange(meal.id, !meal.in_stock)}
                      >
                        {meal.in_stock ? (
                          <>
                            <FaTimes className="me-1" /> Mark Out of Stock
                          </>
                        ) : (
                          <>
                            <FaCheck className="me-1" /> Mark In Stock
                          </>
                        )}
                      </Button>
                    </div>
                    <div>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEditMeal(meal)}
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteMeal(meal.id)}
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      
      {/* Ready meal form modal */}
      <ReadyMealForm
        show={showForm}
        onHide={handleFormCancel}
        onSubmit={handleFormSubmit}
        readyMeal={editingMeal}
        userId={user?.id}
      />
    </Container>
  );
};

export default ReadyMeals;