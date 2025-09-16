import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Form, ListGroup, Badge, Tabs, Tab, Alert } from 'react-bootstrap';
import { FaPlus, FaTrash, FaCheck, FaShoppingCart, FaList } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { supabase } from '../utils/supabaseClient';
import { generateOutOfStockShoppingList } from '../services/readyMealService';

const ShoppingList = () => {
  const { user } = useContext(AuthContext);
  const [shoppingLists, setShoppingLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Fetch shopping lists
  useEffect(() => {
    const fetchShoppingLists = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('shopping_lists')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setShoppingLists(data || []);
        
        // Select the first list if available
        if (data && data.length > 0 && !selectedList) {
          await fetchShoppingListItems(data[0].id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching shopping lists:', error);
        toast.error('Failed to load shopping lists');
        setLoading(false);
      }
    };

    fetchShoppingLists();
  }, [user]);

  // Fetch shopping list items
  const fetchShoppingListItems = async (listId) => {
    try {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select(`
          *,
          shopping_list_items:shopping_list_items(*)
        `)
        .eq('id', listId)
        .single();
      
      if (error) throw error;
      
      setSelectedList(data);
    } catch (error) {
      console.error('Error fetching shopping list items:', error);
      toast.error('Failed to load shopping list items');
    } finally {
      setLoading(false);
    }
  };

  // Create a new shopping list
  const handleCreateList = async () => {
    const name = prompt('Enter a name for the new shopping list:');
    
    if (!name) return;
    
    try {
      const { data, error } = await supabase
        .from('shopping_lists')
        .insert([{
          user_id: user.id,
          name,
          start_date: new Date().toISOString().split('T')[0],
          is_completed: false
        }])
        .select();
      
      if (error) throw error;
      
      const newList = data[0];
      
      // Update local state
      setShoppingLists([newList, ...shoppingLists]);
      
      // Select the new list
      await fetchShoppingListItems(newList.id);
      
      toast.success('Shopping list created successfully');
    } catch (error) {
      console.error('Error creating shopping list:', error);
      toast.error('Failed to create shopping list');
    }
  };

  // Generate out-of-stock shopping list
  const handleGenerateOutOfStockList = async () => {
    try {
      const result = await generateOutOfStockShoppingList(user.id);
      
      if (result) {
        // Refresh shopping lists
        const { data, error } = await supabase
          .from('shopping_lists')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setShoppingLists(data || []);
        
        // Select the new list
        await fetchShoppingListItems(result.id);
        
        toast.success('Out-of-stock shopping list generated successfully');
      }
    } catch (error) {
      console.error('Error generating out-of-stock shopping list:', error);
      toast.error('Failed to generate shopping list');
    }
  };

  // Add item to shopping list
  const handleAddItem = async (e) => {
    e.preventDefault();
    
    if (!newItemName || !selectedList) return;
    
    try {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .insert([{
          shopping_list_id: selectedList.id,
          name: newItemName,
          quantity: newItemQuantity ? parseFloat(newItemQuantity) : null,
          unit: newItemUnit || null,
          is_purchased: false,
          category: 'Added Items'
        }])
        .select();
      
      if (error) throw error;
      
      // Update local state
      setSelectedList({
        ...selectedList,
        shopping_list_items: [...selectedList.shopping_list_items, data[0]]
      });
      
      // Clear form
      setNewItemName('');
      setNewItemQuantity('');
      setNewItemUnit('');
      
      toast.success('Item added to shopping list');
    } catch (error) {
      console.error('Error adding item to shopping list:', error);
      toast.error('Failed to add item');
    }
  };

  // Toggle item purchased status
  const handleTogglePurchased = async (itemId, isPurchased) => {
    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({ is_purchased: !isPurchased })
        .eq('id', itemId);
      
      if (error) throw error;
      
      // Update local state
      setSelectedList({
        ...selectedList,
        shopping_list_items: selectedList.shopping_list_items.map(item => 
          item.id === itemId ? { ...item, is_purchased: !isPurchased } : item
        )
      });
    } catch (error) {
      console.error('Error updating item status:', error);
      toast.error('Failed to update item status');
    }
  };

  // Remove item from shopping list
  const handleRemoveItem = async (itemId) => {
    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
      
      // Update local state
      setSelectedList({
        ...selectedList,
        shopping_list_items: selectedList.shopping_list_items.filter(item => item.id !== itemId)
      });
      
      toast.success('Item removed from shopping list');
    } catch (error) {
      console.error('Error removing item from shopping list:', error);
      toast.error('Failed to remove item');
    }
  };

  // Mark shopping list as completed
  const handleMarkCompleted = async () => {
    if (!selectedList) return;
    
    try {
      const { error } = await supabase
        .from('shopping_lists')
        .update({ is_completed: !selectedList.is_completed })
        .eq('id', selectedList.id);
      
      if (error) throw error;
      
      // Update local state
      setSelectedList({
        ...selectedList,
        is_completed: !selectedList.is_completed
      });
      
      // Update shopping lists
      setShoppingLists(shoppingLists.map(list => 
        list.id === selectedList.id ? { ...list, is_completed: !selectedList.is_completed } : list
      ));
      
      toast.success(`Shopping list marked as ${selectedList.is_completed ? 'active' : 'completed'}`);
    } catch (error) {
      console.error('Error updating shopping list status:', error);
      toast.error('Failed to update shopping list status');
    }
  };

  // Delete shopping list
  const handleDeleteList = async () => {
    if (!selectedList) return;
    
    if (!window.confirm('Are you sure you want to delete this shopping list?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', selectedList.id);
      
      if (error) throw error;
      
      // Update local state
      const updatedLists = shoppingLists.filter(list => list.id !== selectedList.id);
      setShoppingLists(updatedLists);
      
      // Select another list if available
      if (updatedLists.length > 0) {
        await fetchShoppingListItems(updatedLists[0].id);
      } else {
        setSelectedList(null);
      }
      
      toast.success('Shopping list deleted successfully');
    } catch (error) {
      console.error('Error deleting shopping list:', error);
      toast.error('Failed to delete shopping list');
    }
  };

  // Filter items based on active tab
  const getFilteredItems = () => {
    if (!selectedList || !selectedList.shopping_list_items) return [];
    
    switch (activeTab) {
      case 'purchased':
        return selectedList.shopping_list_items.filter(item => item.is_purchased);
      case 'unpurchased':
        return selectedList.shopping_list_items.filter(item => !item.is_purchased);
      case 'out-of-stock':
        return selectedList.shopping_list_items.filter(item => item.is_out_of_stock);
      default:
        return selectedList.shopping_list_items;
    }
  };

  // Group items by category
  const getGroupedItems = () => {
    const items = getFilteredItems();
    const grouped = {};
    
    items.forEach(item => {
      const category = item.category || 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });
    
    return grouped;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container className="py-4">
      <h1 className="mb-4">Shopping Lists</h1>
      
      {/* Action buttons */}
      <div className="d-flex justify-content-between mb-4">
        <div>
          <Button variant="primary" className="me-2" onClick={handleCreateList}>
            <FaPlus className="me-2" /> New List
          </Button>
          <Button variant="success" onClick={handleGenerateOutOfStockList}>
            <FaShoppingCart className="me-2" /> Generate Out-of-Stock List
          </Button>
        </div>
        
        {selectedList && (
          <div>
            <Button 
              variant={selectedList.is_completed ? 'outline-success' : 'outline-secondary'} 
              className="me-2"
              onClick={handleMarkCompleted}
            >
              <FaCheck className="me-2" /> 
              {selectedList.is_completed ? 'Mark as Active' : 'Mark as Completed'}
            </Button>
            <Button variant="outline-danger" onClick={handleDeleteList}>
              <FaTrash className="me-2" /> Delete List
            </Button>
          </div>
        )}
      </div>
      
      <Row>
        {/* Shopping lists sidebar */}
        <Col md={4} className="mb-4">
          <Card>
            <Card.Header>Your Shopping Lists</Card.Header>
            <ListGroup variant="flush">
              {shoppingLists.length === 0 ? (
                <ListGroup.Item className="text-center py-3">
                  No shopping lists found. Create one to get started!
                </ListGroup.Item>
              ) : (
                shoppingLists.map(list => (
                  <ListGroup.Item 
                    key={list.id} 
                    action 
                    active={selectedList?.id === list.id}
                    onClick={() => fetchShoppingListItems(list.id)}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div>
                      {list.name}
                      <div className="text-muted small">
                        {list.start_date && `Created: ${list.start_date}`}
                      </div>
                    </div>
                    {list.is_completed && (
                      <Badge bg="success">Completed</Badge>
                    )}
                  </ListGroup.Item>
                ))
              )}
            </ListGroup>
          </Card>
        </Col>
        
        {/* Shopping list items */}
        <Col md={8}>
          {!selectedList ? (
            <Alert variant="info">
              Select a shopping list from the sidebar or create a new one.
            </Alert>
          ) : (
            <Card>
              <Card.Header>
                <h4>{selectedList.name}</h4>
                {selectedList.is_completed && (
                  <Badge bg="success">Completed</Badge>
                )}
              </Card.Header>
              
              <Card.Body>
                {/* Add item form */}
                {!selectedList.is_completed && (
                  <Form onSubmit={handleAddItem} className="mb-4">
                    <Row>
                      <Col md={5}>
                        <Form.Group className="mb-3 mb-md-0">
                          <Form.Control
                            type="text"
                            placeholder="Item name"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3 mb-md-0">
                          <Form.Control
                            type="number"
                            placeholder="Quantity"
                            value={newItemQuantity}
                            onChange={(e) => setNewItemQuantity(e.target.value)}
                            min="0"
                            step="0.1"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={2}>
                        <Form.Group className="mb-3 mb-md-0">
                          <Form.Control
                            type="text"
                            placeholder="Unit"
                            value={newItemUnit}
                            onChange={(e) => setNewItemUnit(e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={2}>
                        <Button type="submit" variant="primary" className="w-100">
                          <FaPlus /> Add
                        </Button>
                      </Col>
                    </Row>
                  </Form>
                )}
                
                {/* Item filters */}
                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k)}
                  className="mb-3"
                >
                  <Tab eventKey="all" title="All Items" />
                  <Tab eventKey="unpurchased" title="To Buy" />
                  <Tab eventKey="purchased" title="Purchased" />
                  <Tab eventKey="out-of-stock" title="Out of Stock" />
                </Tabs>
                
                {/* Shopping list items */}
                {selectedList.shopping_list_items.length === 0 ? (
                  <Alert variant="info">
                    This shopping list is empty. Add some items to get started!
                  </Alert>
                ) : (
                  getFilteredItems().length === 0 ? (
                    <Alert variant="info">
                      No items match the current filter.
                    </Alert>
                  ) : (
                    Object.entries(getGroupedItems()).map(([category, items]) => (
                      <div key={category} className="mb-4">
                        <h5>{category}</h5>
                        <ListGroup>
                          {items.map(item => (
                            <ListGroup.Item 
                              key={item.id}
                              className="d-flex justify-content-between align-items-center"
                              variant={item.is_purchased ? 'success' : item.is_out_of_stock ? 'warning' : ''}
                            >
                              <div className="d-flex align-items-center">
                                {!selectedList.is_completed && (
                                  <Form.Check
                                    type="checkbox"
                                    checked={item.is_purchased}
                                    onChange={() => handleTogglePurchased(item.id, item.is_purchased)}
                                    className="me-3"
                                  />
                                )}
                                <div>
                                  <div className={item.is_purchased ? 'text-decoration-line-through' : ''}>
                                    {item.name}
                                  </div>
                                  {(item.quantity || item.unit) && (
                                    <div className="text-muted small">
                                      {item.quantity} {item.unit}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {!selectedList.is_completed && (
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  onClick={() => handleRemoveItem(item.id)}
                                >
                                  <FaTrash />
                                </Button>
                              )}
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      </div>
                    ))
                  )
                )}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ShoppingList;