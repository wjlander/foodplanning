import React, { useState, useEffect, useContext } from 'react';
import { Card, Button, Form, Row, Col, Badge } from 'react-bootstrap';
import { FaStar, FaRegStar, FaTrash, FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { rateRecipe, rateReadyMeal, getRecipeRatings, getReadyMealRatings, deleteRating } from '../services/mealRatingService';

const MealRating = ({ itemId, itemType }) => {
  const { user } = useContext(AuthContext);
  const [ratings, setRatings] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRatingId, setEditingRatingId] = useState(null);
  const [averageRating, setAverageRating] = useState(0);

  // Fetch ratings on component mount
  useEffect(() => {
    const fetchRatings = async () => {
      let data;
      if (itemType === 'recipe') {
        data = await getRecipeRatings(itemId);
      } else if (itemType === 'ready_meal') {
        data = await getReadyMealRatings(itemId);
      }
      
      setRatings(data || []);
      
      // Calculate average rating
      if (data && data.length > 0) {
        const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
        setAverageRating(Math.round(sum / data.length));
      }
      
      // Check if user has already rated
      const userRating = data?.find(r => r.user_id === user?.id);
      if (userRating) {
        setUserRating(userRating.rating);
        setComment(userRating.comment || '');
        setEditingRatingId(userRating.id);
      }
    };

    if (itemId) {
      fetchRatings();
    }
  }, [itemId, itemType, user]);

  // Handle rating submission
  const handleSubmitRating = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to rate meals');
      return;
    }
    
    if (userRating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let result;
      
      if (itemType === 'recipe') {
        result = await rateRecipe(itemId, userRating, comment, user.id);
      } else if (itemType === 'ready_meal') {
        result = await rateReadyMeal(itemId, userRating, comment, user.id);
      }
      
      if (result) {
        // Refresh ratings
        let updatedRatings;
        if (itemType === 'recipe') {
          updatedRatings = await getRecipeRatings(itemId);
        } else if (itemType === 'ready_meal') {
          updatedRatings = await getReadyMealRatings(itemId);
        }
        
        setRatings(updatedRatings || []);
        
        // Calculate new average rating
        if (updatedRatings && updatedRatings.length > 0) {
          const sum = updatedRatings.reduce((acc, curr) => acc + curr.rating, 0);
          setAverageRating(Math.round(sum / updatedRatings.length));
        }
        
        // Update editing state
        setEditingRatingId(result.id);
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle rating deletion
  const handleDeleteRating = async (ratingId) => {
    if (!user) return;
    
    if (window.confirm('Are you sure you want to delete this rating?')) {
      const success = await deleteRating(ratingId, user.id);
      
      if (success) {
        // Refresh ratings
        let updatedRatings;
        if (itemType === 'recipe') {
          updatedRatings = await getRecipeRatings(itemId);
        } else if (itemType === 'ready_meal') {
          updatedRatings = await getReadyMealRatings(itemId);
        }
        
        setRatings(updatedRatings || []);
        
        // Reset user rating
        setUserRating(0);
        setComment('');
        setEditingRatingId(null);
        
        // Calculate new average rating
        if (updatedRatings && updatedRatings.length > 0) {
          const sum = updatedRatings.reduce((acc, curr) => acc + curr.rating, 0);
          setAverageRating(Math.round(sum / updatedRatings.length));
        } else {
          setAverageRating(0);
        }
      }
    }
  };

  // Render stars for rating selection
  const renderRatingStars = (currentRating, interactive = false) => {
    return (
      <div className="d-flex">
        {[1, 2, 3, 4, 5].map(star => (
          <div 
            key={star} 
            onClick={() => interactive && setUserRating(star)}
            style={{ cursor: interactive ? 'pointer' : 'default' }}
            className="me-1"
          >
            {star <= currentRating ? (
              <FaStar className="text-warning" />
            ) : (
              <FaRegStar className="text-warning" />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="meal-rating mb-4">
      <h4 className="mb-3">Ratings & Reviews</h4>
      
      {/* Average rating */}
      <div className="d-flex align-items-center mb-3">
        <div className="me-2">
          <strong>Average Rating:</strong>
        </div>
        {averageRating > 0 ? (
          <>
            {renderRatingStars(averageRating)}
            <span className="ms-2">({ratings.length} {ratings.length === 1 ? 'review' : 'reviews'})</span>
          </>
        ) : (
          <span>No ratings yet</span>
        )}
      </div>
      
      {/* Rating form */}
      {user && (
        <>
          {!showForm && !editingRatingId && (
            <Button 
              variant="primary" 
              className="mb-3" 
              onClick={() => setShowForm(true)}
            >
              Rate this {itemType === 'recipe' ? 'Recipe' : 'Ready Meal'}
            </Button>
          )}
          
          {!showForm && editingRatingId && (
            <div className="mb-3">
              <div className="d-flex align-items-center">
                <strong className="me-2">Your Rating:</strong>
                {renderRatingStars(userRating)}
              </div>
              {comment && (
                <div className="mt-2">
                  <strong>Your Review:</strong>
                  <p>{comment}</p>
                </div>
              )}
              <div className="mt-2">
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  className="me-2"
                  onClick={() => setShowForm(true)}
                >
                  <FaEdit className="me-1" /> Edit Rating
                </Button>
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  onClick={() => handleDeleteRating(editingRatingId)}
                >
                  <FaTrash className="me-1" /> Delete Rating
                </Button>
              </div>
            </div>
          )}
          
          {showForm && (
            <Card className="mb-3">
              <Card.Body>
                <Form onSubmit={handleSubmitRating}>
                  <Form.Group className="mb-3">
                    <Form.Label>Your Rating</Form.Label>
                    <div>
                      {renderRatingStars(userRating, true)}
                    </div>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Your Review (Optional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your thoughts about this meal..."
                    />
                  </Form.Group>
                  
                  <div className="d-flex justify-content-end">
                    <Button 
                      variant="secondary" 
                      className="me-2"
                      onClick={() => {
                        setShowForm(false);
                        if (!editingRatingId) {
                          setUserRating(0);
                          setComment('');
                        }
                      }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="primary" 
                      type="submit"
                      disabled={isSubmitting || userRating === 0}
                    >
                      {isSubmitting ? 'Submitting...' : editingRatingId ? 'Update Rating' : 'Submit Rating'}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          )}
        </>
      )}
      
      {/* Ratings list */}
      {ratings.length > 0 ? (
        <div>
          <h5 className="mb-3">Reviews</h5>
          {ratings.map(rating => (
            <Card key={rating.id} className="mb-3">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="mb-2">
                      {renderRatingStars(rating.rating)}
                    </div>
                    {rating.comment && (
                      <p className="mb-2">{rating.comment}</p>
                    )}
                    <div className="text-muted small">
                      {new Date(rating.created_at).toLocaleDateString()}
                      {rating.created_at !== rating.updated_at && ' (edited)'}
                    </div>
                  </div>
                  
                  {user && rating.user_id === user.id && (
                    <div>
                      <Badge bg="primary">Your Review</Badge>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      ) : (
        <p>No reviews yet. Be the first to rate this {itemType === 'recipe' ? 'recipe' : 'ready meal'}!</p>
      )}
    </div>
  );
};

export default MealRating;