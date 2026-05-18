let allItems = [];

// Normaliza texto
function normalizarTexto(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// Carrega o Excel
async function carregarDatabase() {
  try {

    const response = await fetch('database.xlsx');

    if (!response.ok) {
      throw new Error('Erro ao carregar a base de dados');
    }

    const arrayBuffer = await response.arrayBuffer();

    const workbook = XLSX.read(arrayBuffer, {
      type: 'array'
    });

    const sheetName = workbook.SheetNames[0];

    const worksheet = workbook.Sheets[sheetName];

    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1
    });

    allItems = [];

    for (let i = 1; i < jsonData.length; i++) {

      const [
        nome,
        categoria,
        subcategoria,
        calorias,
        lipidios,
        proteinas,
        carboidratos,
        tipo
      ] = jsonData[i];

      allItems.push({
        nome,
        categoria,
        subcategoria,
        calorias,
        lipidios,
        proteinas,
        carboidratos,
        tipo
      });
    }

    renderizarResultados(allItems);

  } catch (error) {
    console.error(error);
  }
}

function renderizarResultados(items) {

  const tbody = document.getElementById('resultsBody');

  if (items.length === 0) {

    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="no-results">
          Nenhum item encontrado.
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = items.map(item => `

    <tr>

      <td>${item.nome}</td>

      <td>${item.categoria}</td>

      <td>${item.subcategoria}</td>

      <td>${item.calorias}</td>

      <td>${item.lipidios || '-'}</td>

      <td>${item.proteinas || '-'}</td>

      <td>${item.carboidratos || '-'}</td>

      <td>
        <span class="
          tipo-tag
          ${item.tipo === 'alimento'
            ? 'tipo-alimento'
            : 'tipo-exercicio'}
        ">
          ${item.tipo}
        </span>
      </td>

    </tr>

  `).join('');
}

// Filtro de pesquisa
function filtrarResultados() {

  const termo = normalizarTexto(
    document.getElementById('searchInput').value
  );

  const categoriaSelecionada =
    document.getElementById('categoryFilter').value;

  const filtrados = allItems.filter(item => {

    const nomeMatch =
      normalizarTexto(item.nome).includes(termo);

    let categoriaMatch = true;

    if (categoriaSelecionada !== 'todos') {

      categoriaMatch =
        normalizarTexto(item.categoria) ===
        normalizarTexto(categoriaSelecionada);
    }

    return nomeMatch && categoriaMatch;
  });

  renderizarResultados(filtrados);
}

// Eventos
document
  .getElementById('searchInput')
  .addEventListener('input', filtrarResultados);

document
  .getElementById('categoryFilter')
  .addEventListener('change', filtrarResultados);

// Carrega os dados
carregarDatabase();