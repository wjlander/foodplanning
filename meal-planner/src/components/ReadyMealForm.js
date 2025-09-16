import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { createReadyMeal, updateReadyMeal } from '../services/readyMealService';

const ReadyMealForm = ({ show, onHide, onSubmit, readyMeal, userId }) => {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    description: '',
    meal_type: [],
    calories_per_serving: '',
    protein_g: '',
    carbs_g: '',
    fat_g: '',
    serving_size: '',
    serving_size_grams: '',
    in_stock: true,
    barcode: '',
    image_url: ''
  });
  
  const [validated, setValidated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form with ready meal data when editing
  useEffect(() => {
    if (readyMeal) {
      setFormData({
        ...readyMeal,
        calories_per_serving: readyMeal.calories_per_serving || '',
        protein_g: readyMeal.protein_g || '',
        carbs_g: readyMeal.carbs_g || '',
        fat_g: readyMeal.fat_g || '',
        serving_size_grams: readyMeal.serving_size_grams || '',
        meal_type: readyMeal.meal_type || []
      });
    } else {
      // Reset form when adding a new ready meal
      setFormData({
        name: '',
        brand: '',
        description: '',
        meal_type: [],
        calories_per_serving: '',
        protein_g: '',
        carbs_g: '',
        fat_g: '',
        serving_size: '',
        serving_size_grams: '',
        in_stock: true,
        barcode: '',
        image_url: ''
      });
    }
    
    setValidated(false);
  }, [readyMeal, show]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Convert numeric fields to numbers
    if (['calories_per_serving', 'protein_g', 'carbs_g', 'fat_g', 'serving_size_grams'].includes(name)) {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? '' : parseFloat(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle meal type checkbox changes
  const handleMealTypeChange = (type) => {
    setFormData(prev => {
      const currentTypes = [...(prev.meal_type || [])];
      
      if (currentTypes.includes(type)) {
        // Remove the type if already selected
        return {
          ...prev,
          meal_type: currentTypes.filter(t => t !== type)
        };
      } else {
        // Add the type if not selected
        return {
          ...prev,
          meal_type: [...currentTypes, type]
        };
      }
    });
  };
  
  // Handle stock status change
  const handleStockStatusChange = (e) => {
    setFormData(prev => ({
      ...prev,
      in_stock: e.target.value === 'true'
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const form = e.currentTarget;
    
    // Form validation
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let result;
      
      if (readyMeal) {
        // Update existing ready meal
        result = await updateReadyMeal(readyMeal.id, formData, userId);
      } else {
        // Create new ready meal
        result = await createReadyMeal(formData, userId);
      }
      
      if (result) {
        toast.success(`Ready meal ${readyMeal ? 'updated' : 'created'} successfully`);
        onSubmit(result);
      }
    } catch (error) {
      console.error('Error saving ready meal:', error);
      toast.error(`Failed to ${readyMeal ? 'update' : 'create'} ready meal`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{readyMeal ? 'Edit' : 'Add'} Ready Meal</Modal.Title>
      </Modal.Header>
      
      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Name *</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a name.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Brand</Form.Label>
                <Form.Control
                  type="text"
                  name="brand"
                  value={formData.brand || ''}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Meal Type *</Form.Label>
            <div>
              <Form.Check
                inline
                type="checkbox"
                label="Breakfast"
                checked={formData.meal_type?.includes('breakfast') || false}
                onChange={() => handleMealTypeChange('breakfast')}
                id="meal-type-breakfast"
              />
              <Form.Check
                inline
                type="checkbox"
                label="Lunch"
                checked={formData.meal_type?.includes('lunch') || false}
                onChange={() => handleMealTypeChange('lunch')}
                id="meal-type-lunch"
              />
              <Form.Check
                inline
                type="checkbox"
                label="Dinner"
                checked={formData.meal_type?.includes('dinner') || false}
                onChange={() => handleMealTypeChange('dinner')}
                id="meal-type-dinner"
              />
              <Form.Check
                inline
                type="checkbox"
                label="Snack"
                checked={formData.meal_type?.includes('snack') || false}
                onChange={() => handleMealTypeChange('snack')}
                id="meal-type-snack"
              />
            </div>
            {validated && (!formData.meal_type || formData.meal_type.length === 0) && (
              <div className="text-danger small">Please select at least one meal type.</div>
            )}
          </Form.Group>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Calories per Serving</Form.Label>
                <Form.Control
                  type="number"
                  name="calories_per_serving"
                  value={formData.calories_per_serving}
                  onChange={handleChange}
                  min="0"
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Serving Size</Form.Label>
                <Form.Control
                  type="text"
                  name="serving_size"
                  value={formData.serving_size || ''}
                  onChange={handleChange}
                  placeholder="e.g., 1 package, 300g"
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Protein (g)</Form.Label>
                <Form.Control
                  type="number"
                  name="protein_g"
                  value={formData.protein_g}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                />
              </Form.Group>
            </Col>
            
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Carbs (g)</Form.Label>
                <Form.Control
                  type="number"
                  name="carbs_g"
                  value={formData.carbs_g}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                />
              </Form.Group>
            </Col>
            
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Fat (g)</Form.Label>
                <Form.Control
                  type="number"
                  name="fat_g"
                  value={formData.fat_g}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Barcode</Form.Label>
                <Form.Control
                  type="text"
                  name="barcode"
                  value={formData.barcode || ''}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Stock Status</Form.Label>
                <Form.Select
                  name="in_stock"
                  value={formData.in_stock.toString()}
                  onChange={handleStockStatusChange}
                >
                  <option value="true">In Stock</option>
                  <option value="false">Out of Stock</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          
          <Form.Group className="mb-3">
            <Form.Label>Image URL</Form.Label>
            <Form.Control
              type="url"
              name="image_url"
              value={formData.image_url || ''}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
          </Form.Group>
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            disabled={isSubmitting || (!formData.meal_type || formData.meal_type.length === 0)}
          >
            {isSubmitting ? 'Saving...' : readyMeal ? 'Update' : 'Save'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ReadyMealForm;