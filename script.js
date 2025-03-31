// Text normalization function (remove accents and convert to lowercase)
function normalizeText(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// Search Open Food Facts API with timeout and error handling
async function searchOpenFoodFacts(query) {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&fields=product_name,nutriments,serving_size,brands`;
  
  try {
    // Add timeout to fetch request
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.products && data.products.length > 0) {
      // Find the first product with complete nutrition data
      const product = data.products.find(p => p.nutriments?.['energy-kcal_100g']) || data.products[0];
      
      return {
        name: product.product_name || query,
        calories: product.nutriments?.['energy-kcal_100g'] || 0,
        servingSize: product.serving_size || '100g',
        nutrients: {
          fat: product.nutriments?.fat_100g || 0,
          proteins: product.nutriments?.proteins_100g || 0,
          carbohydrates: product.nutriments?.carbohydrates_100g || 0
        }
      };
    }
    return null;
  } catch (error) {
    console.error("API Error:", error);
    return null;
  }
}

// Calculate nutrients based on quantity
async function calculateNutrients(item, quantity, type) {
  if (type === 'food') {
    const foodData = await searchOpenFoodFacts(item);
    if (foodData) {
      // Extract numeric value from serving size (e.g., "100g" → 100)
      const servingSize = parseFloat(foodData.servingSize) || 100;
      const ratio = quantity / servingSize;
      
      return {
        name: foodData.name,
        calories: (foodData.calories || 0) * ratio,
        fat: (foodData.nutrients?.fat || 0) * ratio,
        proteins: (foodData.nutrients?.proteins || 0) * ratio,
        carbohydrates: (foodData.nutrients?.carbohydrates || 0) * ratio,
      };
    }
    return null;
  } else if (type === 'exercise') {
    // Simple exercise calculations (you can expand this)
    const exerciseCalories = {
      'walking': 4,
      'running': 10,
      'cycling': 8,
      'swimming': 7
    };
    
    const normalizedExercise = normalizeText(item);
    const caloriesPerMin = exerciseCalories[normalizedExercise] || 5;
    
    return {
      calories: caloriesPerMin * quantity
    };
  }
}

// Display helpers
function showLoading(element) {
  element.textContent = "Searching...";
}

function showError(element, message) {
  element.textContent = message;
  element.style.color = "red";
}

function showResults(element, message) {
  element.textContent = message;
  element.style.color = "";
}

// Food button event listener
document.getElementById('foodButton').addEventListener('click', async () => {
  const foodInput = document.getElementById('foodInput').value.trim();
  const quantity = parseFloat(document.getElementById('foodQuantity').value);
  const foodResult = document.getElementById('foodResult');
  const fatResult = document.getElementById('fatResult');
  const proteinResult = document.getElementById('proteinResult');
  const carbsResult = document.getElementById('carbsResult');

  // Clear previous results
  [foodResult, fatResult, proteinResult, carbsResult].forEach(el => {
    el.textContent = "";
    el.style.color = "";
  });

  if (!foodInput || isNaN(quantity) || quantity <= 0) {
    showError(foodResult, "Please enter valid food and quantity");
    return;
  }

  showLoading(foodResult);
  
  try {
    const nutrients = await calculateNutrients(foodInput, quantity, 'food');
    
    if (nutrients) {
      showResults(foodResult, `Food: ${nutrients.name}`);
      showResults(fatResult, `Calories: ${nutrients.calories.toFixed(2)} kcal`);
      showResults(proteinResult, `Fat: ${nutrients.fat.toFixed(2)}g | Protein: ${nutrients.proteins.toFixed(2)}g`);
      showResults(carbsResult, `Carbs: ${nutrients.carbohydrates.toFixed(2)}g`);
    } else {
      showError(foodResult, "Food not found. Try a different name.");
    }
  } catch (error) {
    console.error("Calculation Error:", error);
    showError(foodResult, "Failed to get data. Please try again.");
  }
});

// Exercise button event listener
document.getElementById('exerciseButton').addEventListener('click', async () => {
  const exerciseInput = document.getElementById('exerciseInput').value.trim();
  const minutes = parseFloat(document.getElementById('exerciseDuration').value);
  const exerciseResult = document.getElementById('exerciseResult');

  exerciseResult.textContent = "";
  exerciseResult.style.color = "";

  if (!exerciseInput || isNaN(minutes) || minutes <= 0) {
    showError(exerciseResult, "Please enter valid exercise and duration");
    return;
  }

  showLoading(exerciseResult);
  
  try {
    const calories = await calculateNutrients(exerciseInput, minutes, 'exercise');
    showResults(exerciseResult, `Calories burned: ${calories.calories.toFixed(2)} kcal`);
  } catch (error) {
    console.error("Exercise Error:", error);
    showError(exerciseResult, "Failed to calculate. Please try again.");
  }
});

// Theme toggle functionality
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

themeToggle.addEventListener('click', () => {
  body.dataset.theme = body.dataset.theme === 'dark' ? 'light' : 'dark';
  themeToggle.innerHTML = body.dataset.theme === 'dark' 
    ? '<i class="fas fa-sun"></i> Light Theme' 
    : '<i class="fas fa-moon"></i> Dark Theme';
});

// Initialize with light theme
body.dataset.theme = 'light';
