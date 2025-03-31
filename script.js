document.addEventListener("DOMContentLoaded", () => {
  function normalizeText(text) {
    return text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  }

  const exerciseDatabase = {
    'walking': { met: 3.5, description: 'Walking at moderate pace (3.5 mph)' },
    'running': { met: 8.0, description: 'Running at 6 mph (10 min/mile)' },
    'swimming': { met: 6.0, description: 'Swimming leisurely' },
    'dance': { met: 5.0, description: 'General dancing' },
    'sex': { met: 1.8, description: 'Sexual activity (moderate effort)' },
    'cycling': { met: 7.5, description: 'Cycling at 12-14 mph' },
    'yoga': { met: 3.0, description: 'Hatha yoga' },
    'weight training': { met: 4.0, description: 'General weight lifting' },
    'basketball': { met: 8.0, description: 'Playing basketball' },
    'football': { met: 8.0, description: 'Playing football/soccer' }
  };

  function calculateExerciseCalories(exerciseName, minutes, weightKg = 70) {
    const normalizedExercise = normalizeText(exerciseName);
    let bestMatch = null, bestScore = 0;
    for (const [name, data] of Object.entries(exerciseDatabase)) {
      const score = similarity(normalizedExercise, name);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = { name, ...data };
      }
    }
    if (!bestMatch || bestScore < 0.3) {
      return { found: false, calories: minutes * 5, description: 'General physical activity' };
    }
    const calories = (bestMatch.met * weightKg * (minutes / 60)).toFixed(2);
    return { found: true, calories, description: bestMatch.description, exerciseName: bestMatch.name };
  }

  function similarity(s1, s2) {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0) return 1.0;
    return (longer.length - editDistance(longer, shorter)) / longer.length;
  }

  function editDistance(s1, s2) {
    const costs = Array(s2.length + 1).fill(0);
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) costs[j] = j;
        else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1[i - 1] !== s2[j - 1]) {
            newValue = Math.min(newValue, lastValue, costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }

  function showError(element, message) {
    if (element) {
      element.textContent = message;
      element.style.color = "red";
    }
  }

  function showResults(element, message) {
    if (element) {
      element.textContent = message;
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
