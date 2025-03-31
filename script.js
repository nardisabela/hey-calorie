// Text normalization function (remove accents and convert to lowercase)
function normalizeText(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// Realistic exercise database with MET values (calories burned per kg per hour)
// Values based on https://www.health.harvard.edu/diet-and-weight-loss/calories-burned-in-30-minutes-for-people-of-three-different-weights
const exerciseDatabase = {
  'walking': {
    met: 3.5,
    description: 'Walking at moderate pace (3.5 mph)'
  },
  'running': {
    met: 8.0,
    description: 'Running at 6 mph (10 min/mile)'
  },
  'swimming': {
    met: 6.0,
    description: 'Swimming leisurely'
  },
  'dance': {
    met: 5.0,
    description: 'General dancing'
  },
  'sex': {
    met: 1.8,
    description: 'Sexual activity (moderate effort)'
  },
  'cycling': {
    met: 7.5,
    description: 'Cycling at 12-14 mph'
  },
  'yoga': {
    met: 3.0,
    description: 'Hatha yoga'
  },
  'weight training': {
    met: 4.0,
    description: 'General weight lifting'
  },
  'basketball': {
    met: 8.0,
    description: 'Playing basketball'
  },
  'football': {
    met: 8.0,
    description: 'Playing football/soccer'
  }
};

// Calculate calories burned during exercise
function calculateExerciseCalories(exerciseName, minutes, weightKg = 70) {
  const normalizedExercise = normalizeText(exerciseName);
  
  // Find the closest matching exercise
  let bestMatch = null;
  let bestScore = 0;
  
  for (const [name, data] of Object.entries(exerciseDatabase)) {
    const score = similarity(normalizedExercise, name);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = { name, ...data };
    }
  }
  
  // Minimum similarity threshold (30%)
  if (!bestMatch || bestScore < 0.3) {
    return {
      found: false,
      calories: minutes * 5, // Default estimate for unknown exercises
      description: 'General physical activity'
    };
  }
  
  // Calculate calories using MET formula: calories = MET * weight(kg) * time(hours)
  const hours = minutes / 60;
  const calories = bestMatch.met * weightKg * hours;
  
  return {
    found: true,
    calories,
    description: bestMatch.description,
    exerciseName: bestMatch.name
  };
}

// Simple string similarity function (0-1)
function similarity(s1, s2) {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  return (longer.length - editDistance(longer, shorter)) / parseFloat(longer.length);
}

// Levenshtein distance for string similarity
function editDistance(s1, s2) {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
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
    // Get user weight or use default (70kg)
    const weightInput = document.getElementById('weightInput').value;
    const weightKg = weightInput ? parseFloat(weightInput) : 70;
    
    return calculateExerciseCalories(item, quantity, weightKg);
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
  const exerciseDetails = document.getElementById('exerciseDetails');

  exerciseResult.textContent = "";
  exerciseDetails.textContent = "";
  exerciseResult.style.color = "";

  if (!exerciseInput || isNaN(minutes) || minutes <= 0) {
    showError(exerciseResult, "Please enter valid exercise and duration");
    return;
  }

  showLoading(exerciseResult);
  
  try {
    const result = await calculateNutrients(exerciseInput, minutes, 'exercise');
    
    if (result.found) {
      showResults(exerciseResult, `Calories burned: ${result.calories.toFixed(2)} kcal`);
      exerciseDetails.textContent = `Activity: ${result.description} (${result.exerciseName})`;
    } else {
      showResults(exerciseResult, `Calories burned: ~${result.calories.toFixed(2)} kcal`);
      exerciseDetails.textContent = `Note: Used generic estimate for "${exerciseInput}"`;
    }
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
