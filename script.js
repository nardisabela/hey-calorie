// Text normalization function (remove accents and convert to lowercase)
function normalizeText(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// Search Open Food Facts API
async function searchOpenFoodFacts(query) {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&fields=product_name,nutriments,serving_size,brands`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.products && data.products.length > 0) {
      // Return the first matching product
      const product = data.products[0];
      return {
        name: product.product_name,
        calories: product.nutriments?.['energy-kcal_100g'],
        servingSize: product.serving_size || '100g',
        nutrients: {
          fat: product.nutriments?.fat_100g,
          proteins: product.nutriments?.proteins_100g,
          carbohydrates: product.nutriments?.carbohydrates_100g
        }
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching from Open Food Facts:", error);
    return null;
  }
}

// Calculate nutrients based on quantity (async)
async function calculateNutrients(item, quantity, type) {
  if (type === 'food') {
    const foodData = await searchOpenFoodFacts(item);
    if (foodData) {
      // Calculate based on serving size or default to 100g
      const servingSize = parseFloat(foodData.servingSize) || 100;
      const ratio = quantity / servingSize;
      
      return {
        calories: (foodData.calories || 0) * ratio,
        fat: (foodData.nutrients?.fat || 0) * ratio,
        proteins: (foodData.nutrients?.proteins || 0) * ratio,
        carbohydrates: (foodData.nutrients?.carbohydrates || 0) * ratio,
      };
    }
    return null;
  } else if (type === 'exercise') {
    // For exercises, you might want to keep your local database
    // or implement another API. This is just a placeholder.
    return {
      calories: quantity * 5, // Example: 5 calories per minute
    };
  }
}

// Food button event listener
document.getElementById('foodButton').addEventListener('click', async () => {
  const foodInput = document.getElementById('foodInput').value.trim();
  const quantity = parseFloat(document.getElementById('foodQuantity').value);
  const foodResult = document.getElementById('foodResult');
  const fatResult = document.getElementById('fatResult');
  const proteinsResult = document.getElementById('proteinsResult');
  const carbsResult = document.getElementById('carbsResult');

  // Show loading state
  foodResult.textContent = "Searching...";
  fatResult.textContent = "";
  proteinsResult.textContent = "";
  carbsResult.textContent = "";

  if (foodInput && !isNaN(quantity) && quantity > 0) {
    const nutrients = await calculateNutrients(foodInput, quantity, 'food');

    if (nutrients !== null) {
      foodResult.textContent = `Calories: ${nutrients.calories.toFixed(2)}`;
      fatResult.textContent = `Fat: ${nutrients.fat.toFixed(2)}g`;
      proteinsResult.textContent = `Proteins: ${nutrients.proteins.toFixed(2)}g`;
      carbsResult.textContent = `Carbs: ${nutrients.carbohydrates.toFixed(2)}g`;
    } else {
      foodResult.textContent = 'Food not found. Try a different name.';
    }
  } else {
    foodResult.textContent = 'Please enter a valid food and quantity.';
  }
});

// Exercise button event listener
document.getElementById('exerciseButton').addEventListener('click', async () => {
  const exerciseInput = document.getElementById('exerciseInput').value.trim();
  const minutes = parseFloat(document.getElementById('exerciseDuration').value);
  const exerciseResult = document.getElementById('exerciseResult');

  if (exerciseInput && !isNaN(minutes) && minutes > 0) {
    const calories = await calculateNutrients(exerciseInput, minutes, 'exercise');

    if (calories !== null) {
      exerciseResult.textContent = `Calories Burned: ${calories.calories.toFixed(2)}`;
    } else {
      exerciseResult.textContent = 'Exercise not found. Please try again.';
    }
  } else {
    exerciseResult.textContent = 'Please enter a valid exercise and duration.';
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
