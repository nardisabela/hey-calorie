let allItems = [];

// ------------------------------
// NORMALIZA TEXTO
// ------------------------------
function normalizarTexto(texto) {
  return (texto || "")
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// ------------------------------
// NORMALIZA NÚMEROS (comma → dot)
// ------------------------------
function normalizarNumero(valor) {
  if (typeof valor === "string") {
    return parseFloat(valor.replace(",", "."));
  }
  return valor ?? 0;
}

// ------------------------------
// CARREGA DATABASE
// ------------------------------
async function carregarDatabase() {
  try {
    console.log("📦 Loading database.xlsx...");

    const response = await fetch('./database.xlsx');

    if (!response.ok) {
      throw new Error(`Erro ao carregar database: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    console.log("📊 File size:", arrayBuffer.byteLength);

    if (!arrayBuffer.byteLength) {
      throw new Error("Arquivo Excel vazio ou inválido");
    }

    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1
    });

    allItems = [];

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row) continue;

      const [
        nome,
        categoria,
        subcategoria,
        calorias,
        lipidios,
        proteinas,
        carboidratos,
        tipo
      ] = row;

      allItems.push({
        nome: nome?.trim(),
        categoria: normalizarTexto(categoria),
        subcategoria: subcategoria?.trim(),
        calorias: normalizarNumero(calorias),
        lipidios: normalizarNumero(lipidios),
        proteinas: normalizarNumero(proteinas),
        carboidratos: normalizarNumero(carboidratos),
        tipo: normalizarTexto(tipo)
      });
    }

    console.log("✅ Items loaded:", allItems.length);

    renderizarResultados(allItems);

  } catch (error) {
    console.error("❌ Erro ao carregar database:", error);
  }
}

// ------------------------------
// RENDERIZA TABELA
// ------------------------------
function renderizarResultados(items) {
  const tbody = document.getElementById('resultsBody');

  if (!tbody) {
    console.error("❌ #resultsBody não encontrado no HTML");
    return;
  }

  if (!items || items.length === 0) {
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
      <td>${item.nome || '-'}</td>
      <td>${item.categoria || '-'}</td>
      <td>${item.subcategoria || '-'}</td>
      <td>${item.calorias ?? '-'}</td>
      <td>${item.lipidios ?? '-'}</td>
      <td>${item.proteinas ?? '-'}</td>
      <td>${item.carboidratos ?? '-'}</td>
      <td>
        <span class="tipo-tag ${
          item.tipo === 'alimento'
            ? 'tipo-alimento'
            : 'tipo-exercicio'
        }">
          ${item.tipo || '-'}
        </span>
      </td>
    </tr>
  `).join('');
}

// ------------------------------
// FILTRO
// ------------------------------
function filtrarResultados() {
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');

  if (!searchInput || !categoryFilter) return;

  const termo = normalizarTexto(searchInput.value);
  const categoriaSelecionada = normalizarTexto(categoryFilter.value);

  const filtrados = allItems.filter(item => {
    const nomeMatch = normalizarTexto(item.nome).includes(termo);

    let categoriaMatch = true;

    if (categoriaSelecionada !== 'todos') {
      categoriaMatch =
        normalizarTexto(item.categoria) === categoriaSelecionada;
    }

    return nomeMatch && categoriaMatch;
  });

  renderizarResultados(filtrados);
}

// ------------------------------
// INIT (GitHub Pages SAFE)
// ------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const tbody = document.getElementById('resultsBody');

  if (!searchInput || !categoryFilter || !tbody) {
    console.error("❌ HTML elements missing (check IDs)");
    return;
  }

  searchInput.addEventListener('input', filtrarResultados);
  categoryFilter.addEventListener('change', filtrarResultados);

  carregarDatabase();
});
