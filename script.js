document.addEventListener("DOMContentLoaded", () => {
  // Utility functions
  function normalizeText(text) {
    return text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  }

  // Debounce function to limit API calls
  function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }

  // Highlight matching text in suggestions
  function highlightMatch(text, query) {
    const normalizedText = normalizeText(text);
    const normalizedQuery = normalizeText(query);
    const startIndex = normalizedText.indexOf(normalizedQuery);
    
    if (startIndex === -1) return text;
    
    const endIndex = startIndex + query.length;
    return (
      text.substring(0, startIndex) +
      '<span class="highlight">' +
      text.substring(startIndex, endIndex) +
      '</span>' +
      text.substring(endIndex)
    );
  }

  // Food search API call
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

  // Filter and sort products for better suggestions
  function filterAndSortProducts(products, query) {
    const normalizedQuery = normalizeText(query);
    return products
      .filter(p => p.product_name && normalizeText(p.product_name).includes(normalizedQuery))
      .sort((a, b) => {
        // Sort by relevance (exact matches first)
        const aName = normalizeText(a.product_name);
        const bName = normalizeText(b.product_name);
        
        if (aName.startsWith(normalizedQuery) && !bName.startsWith(normalizedQuery)) return -1;
        if (!aName.startsWith(normalizedQuery) && bName.startsWith(normalizedQuery)) return 1;
        
        // Then by completeness of data
        const aScore = (a.nutriments ? 1 : 0) + (a.serving_size ? 1 : 0);
        const bScore = (b.nutriments ? 1 : 0) + (b.serving_size ? 1 : 0);
        return bScore - aScore;
      });
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

  // DOM elements
  const foodInput = document.getElementById('foodInput');
  const foodSuggestions = document.getElementById('foodSuggestions');
  const foodButton = document.getElementById('foodButton');
  const exerciseButton = document.getElementById('exerciseButton');
  const themeToggle = document.getElementById('themeToggle');

  // Enhanced food input with debounced suggestions
  if (foodInput && foodSuggestions) {
    const showSuggestions = debounce(async (query) => {
      if (query.length < 2) {
        foodSuggestions.innerHTML = "";
        foodSuggestions.classList.remove('active');
        return;
      }
      
      foodSuggestions.innerHTML = "<div class='suggestion'>Searching...</div>";
      foodSuggestions.classList.add('active');
      
      try {
        const products = await searchOpenFoodFacts(query);
        const filteredProducts = filterAndSortProducts(products, query).slice(0, 5);
        
        if (filteredProducts.length === 0) {
          foodSuggestions.innerHTML = "<div class='suggestion'>No matches found</div>";
          return;
        }
        
        foodSuggestions.innerHTML = filteredProducts
          .map(p => `<div class='suggestion'>${highlightMatch(p.product_name, query)}</div>`)
          .join('');
        
        // Add click handlers to suggestions
        document.querySelectorAll('.suggestion').forEach(item => {
          item.addEventListener('click', () => {
            foodInput.value = item.textContent;
            foodSuggestions.innerHTML = "";
            foodSuggestions.classList.remove('active');
            document.getElementById('foodQuantity').focus();
          });
        });
      } catch (error) {
        console.error("Suggestion Error:", error);
        foodSuggestions.innerHTML = "<div class='suggestion'>Error loading suggestions</div>";
      }
    }, 300);

    foodInput.addEventListener('input', () => {
      showSuggestions(foodInput.value.trim());
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!foodInput.contains(e.target) && !foodSuggestions.contains(e.target)) {
        foodSuggestions.classList.remove('active');
      }
    });

    // Keyboard navigation for suggestions
    foodInput.addEventListener('keydown', (e) => {
      if (!foodSuggestions.classList.contains('active')) return;
      
      const suggestions = document.querySelectorAll('.suggestion');
      if (suggestions.length === 0) return;
      
      let currentIndex = -1;
      suggestions.forEach((suggestion, index) => {
        if (suggestion.classList.contains('selected')) {
          currentIndex = index;
          suggestion.classList.remove('selected');
        }
      });
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % suggestions.length;
        suggestions[nextIndex].classList.add('selected');
        suggestions[nextIndex].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + suggestions.length) % suggestions.length;
        suggestions[prevIndex].classList.add('selected');
        suggestions[prevIndex].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && currentIndex >= 0) {
        e.preventDefault();
        foodInput.value = suggestions[currentIndex].textContent;
        foodSuggestions.innerHTML = "";
        foodSuggestions.classList.remove('active');
        document.getElementById('foodQuantity').focus();
      }
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
