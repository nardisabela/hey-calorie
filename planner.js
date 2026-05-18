let alimentos = [];

const dias = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo'
];

const refeicoes = [
  'Café da Manhã',
  'Almoço',
  'Jantar'
];

// Normalizar texto
function normalizarTexto(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// Carrega banco
async function carregarDatabase() {

  const response = await fetch('database.xlsx');

  const arrayBuffer = await response.arrayBuffer();

  const workbook = XLSX.read(arrayBuffer, {
    type: 'array'
  });

  const sheetName = workbook.SheetNames[0];

  const worksheet = workbook.Sheets[sheetName];

  const jsonData = XLSX.utils.sheet_to_json(
    worksheet,
    { header: 1 }
  );

  alimentos = [];

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

    if (tipo === 'alimento') {

      alimentos.push({
        nome,
        categoria,
        calorias
      });
    }
  }

  criarPlanner();
}

// Cria planner
function criarPlanner() {

  const plannerGrid =
    document.getElementById('plannerGrid');

  plannerGrid.innerHTML = '';

  dias.forEach(dia => {

    const card = document.createElement('div');

    card.className = 'day-card';

    card.innerHTML = `
      <h2>${dia}</h2>

      ${refeicoes.map(refeicao => `

        <div class="meal-section">

          <h3>${refeicao}</h3>

          <div
            id="${normalizarTexto(dia)}-${normalizarTexto(refeicao)}"
          ></div>

          <button
            class="addMealButton"
            onclick="adicionarItem(
              '${normalizarTexto(dia)}',
              '${normalizarTexto(refeicao)}'
            )"
          >
            + Adicionar Item
          </button>

        </div>

      `).join('')}

      <div
        class="daily-total"
        id="total-${normalizarTexto(dia)}"
      >
        Total: 0 kcal
      </div>
    `;

    plannerGrid.appendChild(card);

    carregarDia(normalizarTexto(dia));
  });
}

// Adiciona item
function adicionarItem(dia, refeicao, itemSalvo = null) {

  const container =
    document.getElementById(`${dia}-${refeicao}`);

  const row = document.createElement('div');

  row.className = 'meal-row';

  row.innerHTML = `
    <select>

      <option value="">
        Selecione
      </option>

      ${alimentos.map(alimento => `
        <option
          value="${alimento.nome}"
          ${itemSalvo?.nome === alimento.nome ? 'selected' : ''}
        >
          ${alimento.nome}
        </option>
      `).join('')}

    </select>

    <input
      type="number"
      placeholder="g/ml"
      value="${itemSalvo?.quantidade || ''}"
    >

    <button class="removeMealButton">
      <i class="fas fa-trash"></i>
    </button>
  `;

  const select = row.querySelector('select');

  const input = row.querySelector('input');

  const removeButton =
    row.querySelector('.removeMealButton');

  select.addEventListener('change', () => {
    salvarPlanner();
  });

  input.addEventListener('input', () => {
    salvarPlanner();
  });

  removeButton.addEventListener('click', () => {
    row.remove();
    salvarPlanner();
  });

  container.appendChild(row);

  atualizarCaloriasDia(dia);
}

// Calcula calorias
function atualizarCaloriasDia(dia) {

  let total = 0;

  refeicoes.forEach(refeicao => {

    const container =
      document.getElementById(
        `${dia}-${normalizarTexto(refeicao)}`
      );

    const rows =
      container.querySelectorAll('.meal-row');

    rows.forEach(row => {

      const alimentoNome =
        row.querySelector('select').value;

      const quantidade =
        parseFloat(
          row.querySelector('input').value
        );

      const alimento =
        alimentos.find(
          a => a.nome === alimentoNome
        );

      if (alimento && quantidade > 0) {

        total +=
          (alimento.calorias * quantidade) / 100;
      }
    });
  });

  document.getElementById(
    `total-${dia}`
  ).textContent =
    `Total: ${total.toFixed(2)} kcal`;
}

// Salva planner
function salvarPlanner() {

  const planner = {};

  dias.forEach(dia => {

    const diaKey =
      normalizarTexto(dia);

    planner[diaKey] = {};

    refeicoes.forEach(refeicao => {

      const refeicaoKey =
        normalizarTexto(refeicao);

      const container =
        document.getElementById(
          `${diaKey}-${refeicaoKey}`
        );

      const rows =
        container.querySelectorAll('.meal-row');

      planner[diaKey][refeicaoKey] = [];

      rows.forEach(row => {

        planner[diaKey][refeicaoKey].push({

          nome:
            row.querySelector('select').value,

          quantidade:
            row.querySelector('input').value
        });
      });
    });

    atualizarCaloriasDia(diaKey);
  });

  localStorage.setItem(
    'weeklyPlanner',
    JSON.stringify(planner)
  );
}

// Carrega planner
function carregarDia(dia) {

  const planner =
    JSON.parse(
      localStorage.getItem('weeklyPlanner')
    ) || {};

  if (!planner[dia]) return;

  refeicoes.forEach(refeicao => {

    const refeicaoKey =
      normalizarTexto(refeicao);

    const itens =
      planner[dia][refeicaoKey] || [];

    itens.forEach(item => {

      adicionarItem(
        dia,
        refeicaoKey,
        item
      );
    });
  });

  atualizarCaloriasDia(dia);
}

// Tema
const themeToggle =
  document.getElementById('themeToggle');

const body = document.body;

const temaSalvo =
  localStorage.getItem('theme');

if (temaSalvo) {
  body.dataset.theme = temaSalvo;
}

themeToggle.innerHTML =
  body.dataset.theme === 'dark'
    ? '<i class="fas fa-sun"></i> Tema Claro'
    : '<i class="fas fa-moon"></i> Tema Escuro';

themeToggle.addEventListener('click', () => {

  body.dataset.theme =
    body.dataset.theme === 'dark'
      ? 'light'
      : 'dark';

  localStorage.setItem(
    'theme',
    body.dataset.theme
  );

  themeToggle.innerHTML =
    body.dataset.theme === 'dark'
      ? '<i class="fas fa-sun"></i> Tema Claro'
      : '<i class="fas fa-moon"></i> Tema Escuro';
});

// Inicializa
carregarDatabase();