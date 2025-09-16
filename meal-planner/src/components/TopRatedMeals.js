import React, { useState, useEffect, useContext } from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { FaStar } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getTopRatedMeals } from '../services/mealRatingService';
import LoadingSpinner from './LoadingSpinner';

const TopRatedMeals = ({ mealType, limit = 5 }) => {
  const { user } = useContext(AuthContext);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopRatedMeals = async () => {
      if (!user || !mealType) return;
      
      setLoading(true);
      try {
        const data = await getTopRatedMeals(user.id, mealType, limit);
        setMeals(data || []);
      } catch (error) {
        console.error(`Error fetching top-rated ${mealType} meals:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopRatedMeals();
  }, [user, mealType, limit]);

  // Format date to show days ago
  const formatDateAgo = (dateString) => {
    if (!dateString) return 'Never made';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (meals.length === 0) {
    return (
      <Card className="mb-4">
        <Card.Body className="text-center">
          <Card.Title>No Rated {mealType.charAt(0).toUpperCase() + mealType.slice(1)} Meals</Card.Title>
          <Card.Text>
            You haven't rated any {mealType} meals yet. Rate your meals to see recommendations here.
          </Card.Text>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="top-rated-meals mb-4">
      <h4 className="mb-3">Top Rated {mealType.charAt(0).toUpperCase() + mealType.slice(1)} Meals</h4>
      <Row xs={1} md={2} lg={3} className="g-4">
        {meals.map(meal => (
          <Col key={`${meal.type}-${meal.id}`}>
            <Card className="h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <Card.Title>{meal.name}</Card.Title>
                  <Badge bg={meal.type === 'recipe' ? 'primary' : 'info'}>
                    {meal.type === 'recipe' ? 'Recipe' : 'Ready Meal'}
                  </Badge>
                </div>
                
                <div className="mb-2 d-flex align-items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <FaStar 
                      key={i} 
                      className={i < meal.rating ? 'text-warning' : 'text-muted'}
                    />
                  ))}
                  <span className="ms-2">({meal.rating_count} {meal.rating_count === 1 ? 'rating' : 'ratings'})</span>
                </div>
                
                {meal.description && (
                  <Card.Text className="mb-2">{meal.description}</Card.Text>
                )}
                
                <div className="text-muted small mb-2">
                  Last made: {formatDateAgo(meal.last_made_date)}
                </div>
                
                <Link 
                  to={meal.type === 'recipe' ? `/recipes/${meal.id}` : `/ready-meals/${meal.id}`}
                  className="stretched-link"
                />
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default TopRatedMeals;