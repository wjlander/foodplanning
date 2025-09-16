import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { 
  Text, 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  useTheme, 
  Avatar, 
  Divider,
  List,
  Chip
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Import services
import { getLocalDatabase, processSyncQueue } from '../services/databaseService';
import { syncFoodItems } from '../services/foodService';

const HomeScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [userName, setUserName] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [topRatedMeals, setTopRatedMeals] = useState([]);
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [syncStatus, setSyncStatus] = useState('up-to-date');

  // Load user data and check connectivity
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const name = await AsyncStorage.getItem('userName');
        setUserName(name || 'there');
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    const checkConnectivity = async () => {
      const netInfo = await NetInfo.fetch();
      setIsOnline(netInfo.isConnected);
    };

    loadUserData();
    checkConnectivity();
    loadDashboardData();

    // Set up connectivity listener
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
      
      // If we're back online, sync data
      if (state.isConnected) {
        syncData();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Get local database
      const db = await getLocalDatabase();
      
      // Get today's meals
      const mealsResult = await db.executeSql(`
        SELECT m.*, mp.date
        FROM meals m
        JOIN meal_plans mp ON m.meal_plan_id = mp.id
        WHERE mp.date = ?
        ORDER BY CASE 
          WHEN m.meal_type = 'breakfast' THEN 1
          WHEN m.meal_type = 'lunch' THEN 2
          WHEN m.meal_type = 'dinner' THEN 3
          WHEN m.meal_type = 'snack' THEN 4
          ELSE 5
        END
      `, [today]);
      
      const meals = [];
      for (let i = 0; i < mealsResult[0].rows.length; i++) {
        const meal = mealsResult[0].rows.item(i);
        
        // Get meal items
        const itemsResult = await db.executeSql(`
          SELECT mi.*, 
            fi.name as food_name, fi.calories_per_100g,
            r.name as recipe_name,
            rm.name as ready_meal_name, rm.calories_per_serving
          FROM meal_items mi
          LEFT JOIN food_items fi ON mi.food_item_id = fi.id
          LEFT JOIN recipes r ON mi.recipe_id = r.id
          LEFT JOIN ready_meals rm ON mi.ready_meal_id = rm.id
          WHERE mi.meal_id = ?
        `, [meal.id]);
        
        const items = [];
        for (let j = 0; j < itemsResult[0].rows.length; j++) {
          items.push(itemsResult[0].rows.item(j));
        }
        
        meals.push({
          ...meal,
          items
        });
      }
      
      setTodaysMeals(meals);
      
      // Get top rated meals
      const topRatedResult = await db.executeSql(`
        SELECT r.id, r.name, r.description, r.rating, r.rating_count, 'recipe' as type
        FROM recipes r
        WHERE r.rating IS NOT NULL
        UNION ALL
        SELECT rm.id, rm.name, rm.description, rm.rating, rm.rating_count, 'ready_meal' as type
        FROM ready_meals rm
        WHERE rm.rating IS NOT NULL
        ORDER BY rating DESC, rating_count DESC
        LIMIT 5
      `, []);
      
      const topRated = [];
      for (let i = 0; i < topRatedResult[0].rows.length; i++) {
        topRated.push(topRatedResult[0].rows.item(i));
      }
      
      setTopRatedMeals(topRated);
      
      // Get out of stock items
      const outOfStockResult = await db.executeSql(`
        SELECT id, name, 'food_item' as type
        FROM food_items
        WHERE in_stock = 0
        UNION ALL
        SELECT id, name, 'ready_meal' as type
        FROM ready_meals
        WHERE in_stock = 0
        LIMIT 10
      `, []);
      
      const outOfStock = [];
      for (let i = 0; i < outOfStockResult[0].rows.length; i++) {
        outOfStock.push(outOfStockResult[0].rows.item(i));
      }
      
      setOutOfStockItems(outOfStock);
      
      // Check sync status
      const syncQueueResult = await db.executeSql(
        'SELECT COUNT(*) as count FROM sync_queue',
        []
      );
      
      const syncCount = syncQueueResult[0].rows.item(0).count;
      setSyncStatus(syncCount > 0 ? 'needs-sync' : 'up-to-date');
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  // Sync data with server
  const syncData = async () => {
    if (!isOnline) return;
    
    try {
      setSyncStatus('syncing');
      await syncFoodItems();
      await processSyncQueue();
      setSyncStatus('up-to-date');
    } catch (error) {
      console.error('Error syncing data:', error);
      setSyncStatus('sync-error');
    }
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    if (isOnline) {
      await syncData();
    }
    setRefreshing(false);
  };

  // Get meal type icon
  const getMealTypeIcon = (mealType) => {
    switch (mealType) {
      case 'breakfast':
        return 'coffee';
      case 'lunch':
        return 'food';
      case 'dinner':
        return 'food-variant';
      case 'snack':
        return 'cookie';
      default:
        return 'silverware-fork-knife';
    }
  };

  // Get sync status icon and color
  const getSyncStatusInfo = () => {
    switch (syncStatus) {
      case 'up-to-date':
        return { icon: 'cloud-check', color: '#4CAF50', text: 'All data synced' };
      case 'needs-sync':
        return { icon: 'cloud-sync', color: '#FF9800', text: 'Sync needed' };
      case 'syncing':
        return { icon: 'cloud-sync', color: '#2196F3', text: 'Syncing...' };
      case 'sync-error':
        return { icon: 'cloud-alert', color: '#F44336', text: 'Sync error' };
      default:
        return { icon: 'cloud', color: '#9E9E9E', text: 'Unknown status' };
    }
  };

  const syncStatusInfo = getSyncStatusInfo();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
        />
      }
    >
      {/* Welcome Card */}
      <Card style={styles.welcomeCard}>
        <Card.Content>
          <Title style={styles.welcomeTitle}>Welcome, {userName}!</Title>
          <Paragraph>
            {new Date().toLocaleDateString('en-GB', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Paragraph>
          
          {/* Connectivity Status */}
          <View style={styles.statusContainer}>
            <Chip 
              icon={isOnline ? 'wifi' : 'wifi-off'} 
              mode="outlined"
              style={{ backgroundColor: isOnline ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)' }}
            >
              {isOnline ? 'Online' : 'Offline'}
            </Chip>
            
            <Chip 
              icon={syncStatusInfo.icon} 
              mode="outlined"
              style={{ backgroundColor: `${syncStatusInfo.color}20` }}
              onPress={isOnline ? syncData : null}
              disabled={!isOnline || syncStatus === 'syncing'}
            >
              {syncStatusInfo.text}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Quick Actions</Title>
          <View style={styles.quickActionsContainer}>
            <Button 
              mode="contained" 
              icon="calendar-plus" 
              onPress={() => navigation.navigate('Meal Planner')}
              style={styles.actionButton}
            >
              Plan Meals
            </Button>
            <Button 
              mode="contained" 
              icon="barcode-scan" 
              onPress={() => navigation.navigate('Scan')}
              style={styles.actionButton}
            >
              Scan Food
            </Button>
            <Button 
              mode="contained" 
              icon="cart" 
              onPress={() => navigation.navigate('Foods', { screen: 'Shopping List' })}
              style={styles.actionButton}
            >
              Shopping List
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Today's Meals */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Today's Meals</Title>
          {todaysMeals.length > 0 ? (
            todaysMeals.map((meal, index) => (
              <View key={meal.id}>
                <List.Item
                  title={meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}
                  left={props => <List.Icon {...props} icon={getMealTypeIcon(meal.meal_type)} />}
                  right={props => <List.Icon {...props} icon="chevron-right" />}
                  onPress={() => navigation.navigate('Meal Planner')}
                  description={
                    meal.items.length > 0 
                      ? `${meal.items.length} item${meal.items.length !== 1 ? 's' : ''}`
                      : 'No items added yet'
                  }
                />
                {index < todaysMeals.length - 1 && <Divider />}
              </View>
            ))
          ) : (
            <Paragraph style={styles.emptyText}>No meals planned for today</Paragraph>
          )}
          <Button 
            mode="outlined" 
            icon="plus" 
            onPress={() => navigation.navigate('Meal Planner')}
            style={styles.cardButton}
          >
            Plan Today's Meals
          </Button>
        </Card.Content>
      </Card>

      {/* Top Rated Meals */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Top Rated Meals</Title>
          {topRatedMeals.length > 0 ? (
            topRatedMeals.map((meal, index) => (
              <View key={meal.id}>
                <List.Item
                  title={meal.name}
                  description={meal.description || `${meal.type === 'recipe' ? 'Recipe' : 'Ready Meal'}`}
                  left={props => (
                    <Avatar.Icon 
                      {...props} 
                      icon={meal.type === 'recipe' ? 'book-open' : 'food'} 
                      size={40}
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                  )}
                  right={props => (
                    <View style={styles.ratingContainer}>
                      <Icon name="star" size={16} color="#FFC107" />
                      <Text style={styles.ratingText}>{meal.rating}</Text>
                    </View>
                  )}
                  onPress={() => navigation.navigate(
                    'Foods', 
                    { 
                      screen: meal.type === 'recipe' ? 'Recipe Detail' : 'Ready Meal Detail',
                      params: { id: meal.id }
                    }
                  )}
                />
                {index < topRatedMeals.length - 1 && <Divider />}
              </View>
            ))
          ) : (
            <Paragraph style={styles.emptyText}>No rated meals yet</Paragraph>
          )}
          <Button 
            mode="outlined" 
            icon="star" 
            onPress={() => navigation.navigate('Foods', { screen: 'Recipes' })}
            style={styles.cardButton}
          >
            View All Recipes
          </Button>
        </Card.Content>
      </Card>

      {/* Out of Stock Items */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Out of Stock Items</Title>
          {outOfStockItems.length > 0 ? (
            outOfStockItems.map((item, index) => (
              <View key={item.id}>
                <List.Item
                  title={item.name}
                  left={props => (
                    <List.Icon 
                      {...props} 
                      icon={item.type === 'food_item' ? 'food-apple' : 'food'} 
                    />
                  )}
                  right={props => <List.Icon {...props} icon="cart-plus" />}
                  onPress={() => navigation.navigate(
                    'Foods', 
                    { 
                      screen: item.type === 'food_item' ? 'Food Detail' : 'Ready Meal Detail',
                      params: { id: item.id }
                    }
                  )}
                />
                {index < outOfStockItems.length - 1 && <Divider />}
              </View>
            ))
          ) : (
            <Paragraph style={styles.emptyText}>All items in stock</Paragraph>
          )}
          <Button 
            mode="outlined" 
            icon="cart" 
            onPress={() => navigation.navigate('Foods', { screen: 'Shopping List' })}
            style={styles.cardButton}
          >
            Generate Shopping List
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  welcomeCard: {
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  card: {
    marginBottom: 16,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  actionButton: {
    marginVertical: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  emptyText: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
  cardButton: {
    marginTop: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: 'bold',
  },
});

export default HomeScreen;