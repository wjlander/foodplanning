import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import Quagga from 'quagga';
import { FaBarcode, FaCamera, FaTimesCircle, FaCheckCircle, FaPlus, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getFoodItemByBarcode, createFoodItem } from '../utils/supabaseClient';
import LoadingSpinner from '../components/LoadingSpinner';

const ScannerContainer = styled.div`
  padding: 20px 0;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  margin-bottom: 20px;
  color: #2c3e50;
`;

const ScannerSection = styled.div`
  background-color: white;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
`;

const ScannerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ScannerTitle = styled.h2`
  font-size: 1.5rem;
  color: #2c3e50;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 10px;
    color: #3498db;
  }
`;

const ScannerViewport = styled.div`
  position: relative;
  max-width: 100%;
  overflow: hidden;
  border-radius: 10px;
  margin-bottom: 20px;
  
  #interactive.viewport {
    position: relative;
    width: 100%;
    height: 300px;
    overflow: hidden;
    
    video, canvas {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  canvas.drawingBuffer {
    position: absolute;
    top: 0;
    left: 0;
  }
`;

const ScannerControls = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
`;

const ScanButton = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 30px;
  padding: 12px 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background-color 0.3s;
  
  svg {
    margin-right: 8px;
  }
  
  &:hover {
    background-color: #2980b9;
  }
  
  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
`;

const StopButton = styled(ScanButton)`
  background-color: #e74c3c;
  
  &:hover {
    background-color: #c0392b;
  }
`;

const ScanInstructions = styled.p`
  text-align: center;
  margin-bottom: 20px;
  color: #7f8c8d;
`;

const BarcodeResult = styled.div`
  background-color: ${props => props.found ? '#eafaf1' : '#fef5e7'};
  border-left: 4px solid ${props => props.found ? '#2ecc71' : '#f39c12'};
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
`;

const BarcodeValue = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 10px;
    color: ${props => props.found ? '#2ecc71' : '#f39c12'};
  }
`;

const BarcodeMessage = styled.p`
  color: #7f8c8d;
`;

const FoodItemCard = styled.div`
  background-color: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  margin-top: 20px;
`;

const FoodItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
`;

const FoodItemTitle = styled.h3`
  font-size: 1.3rem;
  color: #2c3e50;
  margin-bottom: 5px;
`;

const FoodItemBrand = styled.p`
  color: #7f8c8d;
  font-size: 0.9rem;
`;

const NutritionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 20px;
`;

const NutritionItem = styled.div`
  background-color: #f8f9fa;
  border-radius: 5px;
  padding: 10px;
  text-align: center;
`;

const NutritionLabel = styled.div`
  font-size: 0.8rem;
  color: #7f8c8d;
  margin-bottom: 5px;
`;

const NutritionValue = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
`;

const AddToMealButton = styled.button`
  background-color: #2ecc71;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 15px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background-color 0.3s;
  
  svg {
    margin-right: 8px;
  }
  
  &:hover {
    background-color: #27ae60;
  }
`;

const ManualSearchSection = styled.div`
  margin-top: 30px;
`;

const SearchForm = styled.form`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
  
  &:focus {
    border-color: #3498db;
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const SearchButton = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 0 20px;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 8px;
  }
  
  &:hover {
    background-color: #2980b9;
  }
`;

const BarcodeScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [barcode, setBarcode] = useState(null);
  const [foodItem, setFoodItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const scannerRef = useRef(null);
  
  useEffect(() => {
    // Clean up Quagga when component unmounts
    return () => {
      if (scanning) {
        Quagga.stop();
      }
    };
  }, [scanning]);
  
  const initScanner = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setScanning(true);
      
      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: 480,
            height: 320,
            facingMode: "environment"
          },
        },
        decoder: {
          readers: [
            "ean_reader",
            "ean_8_reader",
            "upc_reader",
            "upc_e_reader"
          ],
          debug: {
            showCanvas: true,
            showPatches: true,
            showFoundPatches: true,
            showSkeleton: true,
            showLabels: true,
            showPatchLabels: true,
            showRemainingPatchLabels: true,
          }
        },
      }, (err) => {
        if (err) {
          console.error("Error initializing Quagga:", err);
          toast.error("Could not access camera. Please check permissions.");
          setScanning(false);
          return;
        }
        
        Quagga.start();
        
        Quagga.onDetected((result) => {
          const code = result.codeResult.code;
          setBarcode(code);
          stopScanner();
          fetchFoodItem(code);
        });
      });
    } else {
      toast.error("Your device doesn't support camera access");
    }
  };
  
  const stopScanner = () => {
    if (scanning) {
      Quagga.stop();
      setScanning(false);
    }
  };
  
  const fetchFoodItem = async (code) => {
    setLoading(true);
    try {
      // First try to get from our database
      const { data, error } = await getFoodItemByBarcode(code);
      
      if (error) throw error;
      
      if (data) {
        setFoodItem(data);
      } else {
        // If not in our database, try to fetch from Open Food Facts API
        const response = await fetch(`${process.env.REACT_APP_OPEN_FOOD_FACTS_URL}/product/${code}.json`);
        const apiData = await response.json();
        
        if (apiData.status === 1) {
          const product = apiData.product;
          
          // Create a new food item from the API data
          const newFoodItem = {
            barcode: code,
            name: product.product_name || 'Unknown Product',
            brand: product.brands || '',
            description: product.generic_name || '',
            serving_size: product.serving_size || '',
            serving_size_grams: product.serving_quantity || 100,
            calories_per_100g: product.nutriments['energy-kcal_100g'] || 0,
            protein_g: product.nutriments.proteins_100g || 0,
            carbs_g: product.nutriments.carbohydrates_100g || 0,
            fat_g: product.nutriments.fat_100g || 0,
            fiber_g: product.nutriments.fiber_100g || 0,
            sugar_g: product.nutriments.sugars_100g || 0,
            sodium_mg: product.nutriments.sodium_100g ? product.nutriments.sodium_100g * 1000 : 0,
            is_user_created: false,
            source: 'Open Food Facts',
            is_uk_product: product.countries && product.countries.includes('United Kingdom'),
            image_url: product.image_url || ''
          };
          
          // Save to our database
          const { data: savedData, error: saveError } = await createFoodItem(newFoodItem);
          
          if (saveError) throw saveError;
          
          setFoodItem(savedData[0]);
        } else {
          setFoodItem(null);
          toast.info("Product not found in database");
        }
      }
    } catch (error) {
      console.error("Error fetching food item:", error);
      toast.error("Failed to fetch product information");
      setFoodItem(null);
    } finally {
      setLoading(false);
    }
  };
  
  const handleManualSearch = (e) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      setBarcode(manualBarcode);
      fetchFoodItem(manualBarcode);
    }
  };
  
  const addToMeal = () => {
    // This would typically navigate to the meal planner with the food item
    // or open a modal to add to a specific meal
    toast.success(`${foodItem.name} added to your meal plan`);
  };
  
  return (
    <ScannerContainer>
      <PageTitle>Barcode Scanner</PageTitle>
      
      <ScannerSection>
        <ScannerHeader>
          <ScannerTitle>
            <FaBarcode />
            Scan UK Product Barcode
          </ScannerTitle>
        </ScannerHeader>
        
        <ScannerViewport ref={scannerRef} id="interactive" className="viewport" />
        
        <ScannerControls>
          {!scanning ? (
            <ScanButton onClick={initScanner} disabled={scanning}>
              <FaCamera />
              Start Scanning
            </ScanButton>
          ) : (
            <StopButton onClick={stopScanner}>
              <FaTimesCircle />
              Stop Scanning
            </StopButton>
          )}
        </ScannerControls>
        
        <ScanInstructions>
          Point your camera at a product barcode to scan
        </ScanInstructions>
        
        {barcode && (
          <BarcodeResult found={foodItem !== null}>
            <BarcodeValue found={foodItem !== null}>
              {foodItem !== null ? <FaCheckCircle /> : <FaTimesCircle />}
              Barcode: {barcode}
            </BarcodeValue>
            <BarcodeMessage>
              {loading ? 'Searching for product...' : 
                foodItem !== null ? 'Product found in database' : 
                'Product not found. Try another barcode or add it manually.'}
            </BarcodeMessage>
          </BarcodeResult>
        )}
        
        {loading && <LoadingSpinner text="Searching for product..." />}
        
        {foodItem && !loading && (
          <FoodItemCard>
            <FoodItemHeader>
              <div>
                <FoodItemTitle>{foodItem.name}</FoodItemTitle>
                <FoodItemBrand>{foodItem.brand}</FoodItemBrand>
              </div>
              <AddToMealButton onClick={addToMeal}>
                <FaPlus />
                Add to Meal
              </AddToMealButton>
            </FoodItemHeader>
            
            <p>{foodItem.description}</p>
            
            <NutritionGrid>
              <NutritionItem>
                <NutritionLabel>Calories</NutritionLabel>
                <NutritionValue>{foodItem.calories_per_100g} kcal</NutritionValue>
              </NutritionItem>
              
              <NutritionItem>
                <NutritionLabel>Protein</NutritionLabel>
                <NutritionValue>{foodItem.protein_g}g</NutritionValue>
              </NutritionItem>
              
              <NutritionItem>
                <NutritionLabel>Carbs</NutritionLabel>
                <NutritionValue>{foodItem.carbs_g}g</NutritionValue>
              </NutritionItem>
              
              <NutritionItem>
                <NutritionLabel>Fat</NutritionLabel>
                <NutritionValue>{foodItem.fat_g}g</NutritionValue>
              </NutritionItem>
              
              <NutritionItem>
                <NutritionLabel>Sugar</NutritionLabel>
                <NutritionValue>{foodItem.sugar_g}g</NutritionValue>
              </NutritionItem>
              
              <NutritionItem>
                <NutritionLabel>Fiber</NutritionLabel>
                <NutritionValue>{foodItem.fiber_g}g</NutritionValue>
              </NutritionItem>
            </NutritionGrid>
          </FoodItemCard>
        )}
        
        <ManualSearchSection>
          <h3>Manual Barcode Entry</h3>
          <p>Can't scan? Enter the barcode manually:</p>
          
          <SearchForm onSubmit={handleManualSearch}>
            <SearchInput
              type="text"
              placeholder="Enter barcode number"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
            />
            <SearchButton type="submit">
              <FaSearch />
              Search
            </SearchButton>
          </SearchForm>
        </ManualSearchSection>
      </ScannerSection>
    </ScannerContainer>
  );
};

export default BarcodeScanner;