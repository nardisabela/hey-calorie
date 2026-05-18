let alimentos = [];
let exercicios = [];

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

// Normaliza texto
function normalizarTexto(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// Carrega database.xlsx
async function carregarDatabase() {

  try {

    const response =
      await fetch('database.xlsx');

    if (!response.ok) {
      throw new Error(
        'Erro ao carregar database.xlsx'
      );
    }

    const arrayBuffer =
      await response.arrayBuffer();

    const workbook =
      XLSX.read(arrayBuffer, {
        type: 'array'
      });

    const sheetName =
      workbook.SheetNames[0];

    const worksheet =
      workbook.Sheets[sheetName];

    const jsonData =
      XLSX.utils.sheet_to_json(
        worksheet,
        { header: 1 }
      );

    alimentos = [];
    exercicios = [];

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

      } else if (tipo === 'exercício') {

        exercicios.push({
          nome,
          categoria,
          calorias
        });
      }
    }

    criarPlanner();

  } catch (error) {

    console.error(error);

    alert(
      'Erro ao carregar database.xlsx. Execute o projeto usando Live Server.'
    );
  }
}

// Cria planner
function criarPlanner() {

  const plannerGrid =
    document.getElementById('plannerGrid');

  plannerGrid.innerHTML = '';

  dias.forEach(dia => {

    const diaKey =
      normalizarTexto(dia);

    const card =
      document.createElement('div');

    card.className = 'day-card';

    card.innerHTML = `
      <h2>${dia}</h2>

      ${refeicoes.map(refeicao => `

        <div class="meal-section">

          <h3>${refeicao}</h3>

          <div
            id="${diaKey}-${normalizarTexto(refeicao)}"
          ></div>

          <button
            class="addMealButton"
            onclick="adicionarItem(
              '${diaKey}',
              '${normalizarTexto(refeicao)}'
            )"
          >
            + Adicionar Item
          </button>

        </div>

      `).join('')}

      <div class="meal-section">

        <h3>🏃 Exercícios</h3>

        <div id="${diaKey}-exercicios"></div>

        <button
          class="addMealButton"
          onclick="adicionarExercicio('${diaKey}')"
        >
          + Adicionar Exercício
        </button>

      </div>

      <div
        class="daily-total"
        id="total-${diaKey}"
      >
        Consumidas: 0 kcal<br>
        Gastas: 0 kcal<br>
        <strong>Saldo: 0 kcal</strong>
      </div>
    `;

    plannerGrid.appendChild(card);

    carregarDia(diaKey);
  });
}

// Adiciona alimento
function adicionarItem(
  dia,
  refeicao,
  itemSalvo = null
) {

  const container =
    document.getElementById(
      `${dia}-${refeicao}`
    );

  const row =
    document.createElement('div');

  row.className = 'meal-row';

  row.innerHTML = `

    <select>

      <option value="">
        Selecione
      </option>

      ${alimentos.map(alimento => `
        <option
          value="${alimento.nome}"
          ${itemSalvo?.nome === alimento.nome
            ? 'selected'
            : ''
          }
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

  const select =
    row.querySelector('select');

  const input =
    row.querySelector('input');

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

// Adiciona exercício
function adicionarExercicio(
  dia,
  itemSalvo = null
) {

  const container =
    document.getElementById(
      `${dia}-exercicios`
    );

  const row =
    document.createElement('div');

  row.className = 'meal-row';

  row.innerHTML = `

    <select>

      <option value="">
        Selecione
      </option>

      ${exercicios.map(exercicio => `
        <option
          value="${exercicio.nome}"
          ${itemSalvo?.nome === exercicio.nome
            ? 'selected'
            : ''
          }
        >
          ${exercicio.nome}
        </option>
      `).join('')}

    </select>

    <input
      type="number"
      placeholder="min"
      value="${itemSalvo?.quantidade || ''}"
    >

    <button class="removeMealButton">
      <i class="fas fa-trash"></i>
    </button>
  `;

  const select =
    row.querySelector('select');

  const input =
    row.querySelector('input');

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

// Atualiza calorias do dia
function atualizarCaloriasDia(dia) {

  let caloriasConsumidas = 0;

  let caloriasGastadas = 0;

  // Refeições
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

      if (
        alimento &&
        !isNaN(quantidade) &&
        quantidade > 0
      ) {

        caloriasConsumidas +=
          (alimento.calorias * quantidade) / 100;
      }
    });
  });

  // Exercícios
  const exercicioContainer =
    document.getElementById(
      `${dia}-exercicios`
    );

  const exercicioRows =
    exercicioContainer.querySelectorAll('.meal-row');

  exercicioRows.forEach(row => {

    const exercicioNome =
      row.querySelector('select').value;

    const minutos =
      parseFloat(
        row.querySelector('input').value
      );

    const exercicio =
      exercicios.find(
        e => e.nome === exercicioNome
      );

    if (
      exercicio &&
      !isNaN(minutos) &&
      minutos > 0
    ) {

      caloriasGastadas +=
        exercicio.calorias * minutos;
    }
  });

  const saldo =
    caloriasConsumidas - caloriasGastadas;

  document.getElementById(
    `total-${dia}`
  ).innerHTML = `
    Consumidas: ${caloriasConsumidas.toFixed(2)} kcal<br>
    Gastas: ${caloriasGastadas.toFixed(2)} kcal<br>
    <strong>Saldo: ${saldo.toFixed(2)} kcal</strong>
  `;
}

// Salva planner
function salvarPlanner() {

  const planner = {};

  dias.forEach(dia => {

    const diaKey =
      normalizarTexto(dia);

    planner[diaKey] = {};

    // Refeições
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

    // Exercícios
    const exercicioContainer =
      document.getElementById(
        `${diaKey}-exercicios`
      );

    const exercicioRows =
      exercicioContainer.querySelectorAll('.meal-row');

    planner[diaKey].exercicios = [];

    exercicioRows.forEach(row => {

      planner[diaKey].exercicios.push({

        nome:
          row.querySelector('select').value,

        quantidade:
          row.querySelector('input').value
      });
    });

    atualizarCaloriasDia(diaKey);
  });

  localStorage.setItem(
    'weeklyPlanner',
    JSON.stringify(planner)
  );
}

// Carrega planner salvo
function carregarDia(dia) {

  const planner =
    JSON.parse(
      localStorage.getItem('weeklyPlanner')
    ) || {};

  if (!planner[dia]) return;

  // Refeições
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

  // Exercícios
  const exerciciosSalvos =
    planner[dia].exercicios || [];

  exerciciosSalvos.forEach(item => {

    adicionarExercicio(
      dia,
      item
    );
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
