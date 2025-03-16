let database;

// Função para carregar o Excel e converter para JSON
async function carregarDatabase() {
  try {
    // Carrega o arquivo Excel
    const response = await fetch('database.xlsx');
    if (!response.ok) {
      throw new Error('Erro ao carregar a base de dados');
    }
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Converte a primeira planilha para JSON
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Converte o JSON para a estrutura desejada
    database = { alimentos: {}, exercicios: {} };
    for (let i = 1; i < jsonData.length; i++) {
      const [nome, categoria, subcategoria, calorias, lipidios, proteinas, carboidratos, tipo] = jsonData[i];
      if (tipo === 'alimento') {
        if (!database.alimentos[categoria]) {
          database.alimentos[categoria] = {};
        }
        if (!database.alimentos[categoria][subcategoria]) {
          database.alimentos[categoria][subcategoria] = {};
        }
        database.alimentos[categoria][subcategoria][nome.toLowerCase()] = {
          calorias,
          lipidios,
          proteinas,
          carboidratos,
        };
      } else if (tipo === 'exercício') {
        if (!database.exercicios[categoria]) {
          database.exercicios[categoria] = {};
        }
        if (!database.exercicios[categoria][subcategoria]) {
          database.exercicios[categoria][subcategoria] = {};
        }
        database.exercicios[categoria][subcategoria][nome.toLowerCase()] = {
          calorias,
        };
      }
    }

    console.log('Base de dados carregada:', database);
  } catch (error) {
    console.error('Erro ao carregar a base de dados:', error);
  }
}

// Função para buscar nutrientes de um item
function buscarNutrientes(item, tipo) {
  console.log('Buscando item:', item);
  const categoriaBase = tipo === 'alimento' ? database.alimentos : database.exercicios;
  for (const categoria in categoriaBase) {
    for (const subcategoria in categoriaBase[categoria]) {
      if (categoriaBase[categoria][subcategoria][item]) {
        console.log('Item encontrado:', item, 'Nutrientes:', categoriaBase[categoria][subcategoria][item]);
        return categoriaBase[categoria][subcategoria][item];
      }
    }
  }
  console.log('Item não encontrado:', item);
  return null;
}

// Função para calcular nutrientes de um alimento ou exercício
function calcularNutrientes(item, quantidade, tipo) {
  const nutrientesPor100g = buscarNutrientes(item, tipo);
  if (nutrientesPor100g !== null) {
    if (tipo === 'alimento') {
      return {
        calorias: (nutrientesPor100g.calorias * quantidade) / 100,
        lipidios: (nutrientesPor100g.lipidios * quantidade) / 100,
        proteinas: (nutrientesPor100g.proteinas * quantidade) / 100,
        carboidratos: (nutrientesPor100g.carboidratos * quantidade) / 100,
      };
    } else if (tipo === 'exercício') {
      return {
        calorias: nutrientesPor100g.calorias * quantidade,
      };
    }
  } else {
    return null;
  }
}

// Eventos dos botões
document.getElementById('foodButton').addEventListener('click', () => {
  const foodInput = document.getElementById('foodInput').value.trim().toLowerCase();
  const quantidade = parseFloat(document.getElementById('foodQuantity').value);
  const foodResult = document.getElementById('foodResult');
  const lipidiosResult = document.getElementById('lipidiosResult');
  const proteinasResult = document.getElementById('proteinasResult');
  const carboidratosResult = document.getElementById('carboidratosResult');

  if (foodInput && !isNaN(quantidade) && quantidade > 0) {
    const nutrientes = calcularNutrientes(foodInput, quantidade, 'alimento');

    if (nutrientes !== null) {
      foodResult.textContent = `Calorias: ${nutrientes.calorias.toFixed(2)}`;
      lipidiosResult.textContent = `Lípidos: ${nutrientes.lipidios.toFixed(2)}g`;
      proteinasResult.textContent = `Proteínas: ${nutrientes.proteinas.toFixed(2)}g`;
      carboidratosResult.textContent = `Carboidratos: ${nutrientes.carboidratos.toFixed(2)}g`;
    } else {
      foodResult.textContent = 'Item não encontrado. Verifique o nome e tente novamente.';
      lipidiosResult.textContent = '';
      proteinasResult.textContent = '';
      carboidratosResult.textContent = '';
    }
  } else {
    foodResult.textContent = 'Por favor, insira um item e uma quantidade válida.';
    lipidiosResult.textContent = '';
    proteinasResult.textContent = '';
    carboidratosResult.textContent = '';
  }
});

document.getElementById('exerciseButton').addEventListener('click', () => {
  const exerciseInput = document.getElementById('exerciseInput').value.trim().toLowerCase();
  const minutos = parseFloat(document.getElementById('exerciseDuration').value);
  const exerciseResult = document.getElementById('exerciseResult');

  if (exerciseInput && !isNaN(minutos) && minutos > 0) {
    const calorias = calcularNutrientes(exerciseInput, minutos, 'exercício');

    if (calorias !== null) {
      exerciseResult.textContent = `Calorias Gastas: ${calorias.calorias.toFixed(2)}`;
    } else {
      exerciseResult.textContent = 'Exercício não encontrado. Verifique o nome e tente novamente.';
    }
  } else {
    exerciseResult.textContent = 'Por favor, insira um exercício e uma duração válida.';
  }
});

// Carrega a base de dados ao iniciar o aplicativo
carregarDatabase();

// Alternar tema escuro/claro
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

themeToggle.addEventListener('click', () => {
  body.dataset.theme = body.dataset.theme === 'dark' ? 'light' : 'dark';
  themeToggle.innerHTML = body.dataset.theme === 'dark' ? '<i class="fas fa-sun"></i> Tema Claro' : '<i class="fas fa-moon"></i> Tema Escuro';
});
