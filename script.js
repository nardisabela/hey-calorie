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
    database = {};
    for (let i = 1; i < jsonData.length; i++) {
      const [nome, categoria, subcategoria, calorias, lipidios, proteinas, carboidratos] = jsonData[i];
      if (!database[categoria]) {
        database[categoria] = {};
      }
      if (!database[categoria][subcategoria]) {
        database[categoria][subcategoria] = {};
      }
      database[categoria][subcategoria][nome.toLowerCase()] = {
        calorias,
        lipidios,
        proteinas,
        carboidratos,
      };
    }

    console.log('Base de dados carregada:', database);
  } catch (error) {
    console.error('Erro ao carregar a base de dados:', error);
  }
}

// Função para buscar nutrientes de um item
function buscarNutrientes(item) {
  console.log('Buscando item:', item);
  for (const categoria in database) {
    for (const subcategoria in database[categoria]) {
      if (database[categoria][subcategoria][item]) {
        console.log('Item encontrado:', item, 'Nutrientes:', database[categoria][subcategoria][item]);
        return database[categoria][subcategoria][item];
      }
    }
  }
  console.log('Item não encontrado:', item);
  return null;
}

// Função para calcular nutrientes de um alimento ou bebida
function calcularNutrientes(item, quantidade) {
  const nutrientesPor100g = buscarNutrientes(item);
  if (nutrientesPor100g !== null) {
    return {
      calorias: (nutrientesPor100g.calorias * quantidade) / 100,
      lipidios: (nutrientesPor100g.lipidios * quantidade) / 100,
      proteinas: (nutrientesPor100g.proteinas * quantidade) / 100,
      carboidratos: (nutrientesPor100g.carboidratos * quantidade) / 100,
    };
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
    const nutrientes = calcularNutrientes(foodInput, quantidade);

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

// Carrega a base de dados ao iniciar o aplicativo
carregarDatabase();
// Alternar tema escuro/claro
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

themeToggle.addEventListener('click', () => {
  body.dataset.theme = body.dataset.theme === 'dark' ? 'light' : 'dark';
  themeToggle.innerHTML = body.dataset.theme === 'dark' ? '<i class="fas fa-sun"></i> Tema Claro' : '<i class="fas fa-moon"></i> Tema Escuro';
});