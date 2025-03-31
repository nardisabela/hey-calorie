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
      return data.products || [];
    } catch (error) {
      console.error("API Error:", error);
      return [];
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

  const foodInput = document.getElementById('foodInput');
  const foodSuggestions = document.getElementById('foodSuggestions');
  const foodButton = document.getElementById('foodButton');
  const exerciseButton = document.getElementById('exerciseButton');
  const themeToggle = document.getElementById('themeToggle');

  if (foodInput) {
    foodInput.addEventListener('input', async () => {
      const query = foodInput.value.trim();
      if (query.length < 2) {
        foodSuggestions.innerHTML = "";
        return;
      }
      const products = await searchOpenFoodFacts(query);
      foodSuggestions.innerHTML = products.slice(0, 5).map(p => `<div class='suggestion'>${p.product_name}</div>`).join('');
      document.querySelectorAll('.suggestion').forEach(item => {
        item.addEventListener('click', () => {
          foodInput.value = item.textContent;
          foodSuggestions.innerHTML = "";
        });
      });
    });
  }

  if (foodButton) {
    foodButton.addEventListener('click', async () => {
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
        const products = await searchOpenFoodFacts(food);
        const product = products.find(p => normalizeText(p.product_name) === normalizeText(food)) ||
                        products.find(p => normalizeText(p.product_name).includes(normalizeText(food))) ||
                        products[0];
        if (product) {
          const servingSize = parseFloat(product.serving_size) || 100;
          const ratio = quantity / servingSize;
          showResults(foodResult, `
            <strong>Food:</strong> ${product.product_name} <br>
            <strong>Calories:</strong> ${(product.nutriments?.['energy-kcal_100g'] * ratio).toFixed(2)} kcal <br>
            <strong>Fat:</strong> ${(product.nutriments?.fat_100g * ratio).toFixed(2)}g <br>
            <strong>Protein:</strong> ${(product.nutriments?.proteins_100g * ratio).toFixed(2)}g <br>
            <strong>Carbs:</strong> ${(product.nutriments?.carbohydrates_100g * ratio).toFixed(2)}g
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
