document.addEventListener("DOMContentLoaded", () => {
  function normalizeText(text) {
    return text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  }

  async function searchOpenFoodFacts(query) {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&fields=product_name,nutriments,serving_size,brands`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.products && data.products.length > 0) {
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

  function showError(element, message) {
    if (element) {
      element.textContent = message;
      element.style.color = "red";
    }
  }

  function showResults(element, message) {
    if (element) {
      element.innerHTML = message;
      element.style.color = "";
    }
  }

  const foodButton = document.getElementById('foodButton');
  const exerciseButton = document.getElementById('exerciseButton');
  const themeToggle = document.getElementById('themeToggle');

  if (foodButton) {
    foodButton.addEventListener('click', async () => {
      const foodInput = document.getElementById('foodInput');
      const foodQuantity = document.getElementById('foodQuantity');
      const foodResult = document.getElementById('foodResult');
      if (!foodInput || !foodQuantity || !foodResult) return;
      const food = foodInput.value.trim();
      const quantity = parseFloat(foodQuantity.value);
      if (!food || isNaN(quantity) || quantity <= 0) {
        showError(foodResult, "Please enter valid food and quantity");
        return;
      }
      showResults(foodResult, "Fetching data...");
      try {
        const foodData = await searchOpenFoodFacts(food);
        if (foodData) {
          const ratio = quantity / (parseFloat(foodData.servingSize) || 100);
          showResults(foodResult, `
            <strong>Food:</strong> ${foodData.name} <br>
            <strong>Calories:</strong> ${(foodData.calories * ratio).toFixed(2)} kcal <br>
            <strong>Fat:</strong> ${(foodData.nutrients.fat * ratio).toFixed(2)}g <br>
            <strong>Protein:</strong> ${(foodData.nutrients.proteins * ratio).toFixed(2)}g <br>
            <strong>Carbs:</strong> ${(foodData.nutrients.carbohydrates * ratio).toFixed(2)}g
          `);
        } else {
          showError(foodResult, "Food not found. Try a different name.");
        }
      } catch (error) {
        console.error("Food Fetch Error:", error);
        showError(foodResult, "Failed to get data. Please try again.");
      }
    });
  }

  if (exerciseButton) {
    exerciseButton.addEventListener('click', async () => {
      const exerciseInput = document.getElementById('exerciseInput');
      const exerciseDuration = document.getElementById('exerciseDuration');
      const exerciseResult = document.getElementById('exerciseResult');
      if (!exerciseInput || !exerciseDuration || !exerciseResult) return;
      const exercise = exerciseInput.value.trim();
      const minutes = parseFloat(exerciseDuration.value);
      if (!exercise || isNaN(minutes) || minutes <= 0) {
        showError(exerciseResult, "Please enter valid exercise and duration");
        return;
      }
      showResults(exerciseResult, "Calculating...");
      const result = calculateExerciseCalories(exercise, minutes);
      showResults(exerciseResult, `Calories burned: ${result.calories} kcal`);
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
      themeToggle.innerHTML = document.body.dataset.theme === 'dark' 
        ? '<i class="fas fa-sun"></i> Light Theme' 
        : '<i class="fas fa-moon"></i> Dark Theme';
    });
  }

  document.body.dataset.theme = 'light';
});
