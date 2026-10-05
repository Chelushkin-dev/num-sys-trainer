(() => {
  const ALL_BASES = [2, 8, 10, 16];
  const BASE_NAMES = { 2:'Двоичная (2)', 8:'Восьмеричная (8)', 10:'Десятичная (10)', 16:'Шестнадцатеричная (16)' };

  // ===== Утилиты =====
  const $ = id => document.getElementById(id);
  const toBase = (n, b) => b === 10 ? n.toString() : b === 16 ? n.toString(16).toUpperCase() : n.toString(b);
  const norm = s => String(s).trim().toUpperCase();

  // ===== Drawer / Views =====
  const drawer = $('drawer'), overlay = $('drawerOverlay');
  const openDrawer = () => { drawer.classList.add('open'); overlay.classList.add('show'); };
  const closeDrawer = () => { drawer.classList.remove('open'); overlay.classList.remove('show'); };
  $('burgerBtn').addEventListener('click', openDrawer);
  overlay.addEventListener('click', closeDrawer);

  const titles = { trainer:'Тренажёр', converter:'Конвертер', diapasons:'Диапазоны', help:'Справка' };
  document.querySelectorAll('.drawer-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      document.querySelectorAll('.drawer-item').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
      $('topbarTitle').textContent = titles[view] || 'Системы счисления';
      closeDrawer();
    });
  });

  /* ============================================================
     ТРЕНАЖЁР
  ============================================================ */
  const state = {
    rangeMin: 1, rangeMax: 255, sourceBase: 10,
    currentDecimal: 0, answers: {}, user: {}
  };
  const baseToggles = document.querySelectorAll('#baseToggles .base-toggle');

  function updateBaseTogglesUI() {
    baseToggles.forEach(t => t.classList.toggle('active', +t.dataset.base === state.sourceBase));
  }
  baseToggles.forEach(t => t.addEventListener('click', () => {
    state.sourceBase = +t.dataset.base;
    updateBaseTogglesUI();
  }));

  function readSettings() {
    let min = parseInt($('rangeMin').value, 10), max = parseInt($('rangeMax').value, 10);
    if (isNaN(min) || min < 0) min = 0;
    if (isNaN(max) || max < 0) max = 0;
    if (min > max) [min, max] = [max, min];
    if (min > 1e6) min = 1e6;
    if (max > 1e6) max = 1e6;
    $('rangeMin').value = min; $('rangeMax').value = max;
    state.rangeMin = min; state.rangeMax = max;
  }

  function newTrainerTask() {
    readSettings();
    const { rangeMin: a, rangeMax: b } = state;
    state.currentDecimal = Math.floor(Math.random() * (b - a + 1)) + a;
    state.answers = {};
    ALL_BASES.forEach(base => state.answers[base] = toBase(state.currentDecimal, base));
    $('randomNumberDisplay').textContent = state.answers[state.sourceBase];
    $('sourceLabel').textContent = 'Дано в ' + state.sourceBase + '-й';
    state.user = {};
    renderTrainerBases();
  }

  function renderTrainerBases() {
    const grid = $('basesGrid');
    grid.innerHTML = '';
    ALL_BASES.filter(b => b !== state.sourceBase).forEach(base => {
      const row = document.createElement('div');
      row.className = 'base-row';
      row.dataset.base = base;
      row.innerHTML = `
        <div class="base-header">
          <span class="base-label">Перевести в ${BASE_NAMES[base]}</span>
          <span class="feedback"></span>
        </div>
        <div class="input-group">
          <input type="text" class="base-input" data-base="${base}"
                 value="${state.user[base] || ''}" placeholder="Введите число"
                 autocomplete="off" autocapitalize="off" spellcheck="false">
          <button class="check-btn" data-base="${base}">Проверить</button>
        </div>`;
      grid.appendChild(row);
    });
    grid.querySelectorAll('.base-input').forEach(inp => {
      inp.addEventListener('input', e => {
        const base = +e.target.dataset.base;
        state.user[base] = e.target.value;
        e.target.classList.remove('correct-input', 'incorrect-input');
        const fb = e.target.closest('.base-row').querySelector('.feedback');
        fb.textContent = ''; fb.className = 'feedback';
      });
      inp.addEventListener('keypress', e => {
        if (e.key === 'Enter') e.target.closest('.base-row').querySelector('.check-btn').click();
      });
    });
    grid.querySelectorAll('.check-btn').forEach(btn => btn.addEventListener('click', e => {
      const base = +e.currentTarget.dataset.base;
      const row = e.currentTarget.closest('.base-row');
      const inp = row.querySelector('.base-input');
      state.user[base] = inp.value;
      const ok = norm(inp.value) === norm(state.answers[base]);
      inp.classList.toggle('correct-input', ok);
      inp.classList.toggle('incorrect-input', !ok);
      const fb = row.querySelector('.feedback');
      fb.textContent = ok ? 'Верно' : 'Ошибка';
      fb.className = 'feedback ' + (ok ? 'correct' : 'incorrect');
    }));
  }

  $('applyBtn').addEventListener('click', newTrainerTask);
  $('newTaskBtn').addEventListener('click', newTrainerTask);
  updateBaseTogglesUI();
  newTrainerTask();

  /* ============================================================
     КОНВЕРТЕР
  ============================================================ */
  const convInputs = { 2: $('convBin'), 8: $('convOct'), 10: $('convDec'), 16: $('convHex') };
  const convPatterns = { 2:/^[01]+$/, 8:/^[0-7]+$/, 10:/^[0-9]+$/, 16:/^[0-9A-Fa-f]+$/ };

  function parseInBase(str, base) {
    str = str.trim().toUpperCase();
    if (!str) return null;
    let r = 0n, bb = BigInt(base);
    for (const ch of str) {
      const c = ch.charCodeAt(0);
      let d;
      if (c >= 48 && c <= 57) d = c - 48;
      else if (c >= 65 && c <= 70) d = c - 65 + 10;
      else return null;
      if (d >= base) return null;
      r = r * bb + BigInt(d);
    }
    return r;
  }
  function bigIntToBase(num, base) {
    if (num === 0n) return '0';
    if (base === 10) return num.toString();
    const digits = '0123456789ABCDEF';
    let r = '', bb = BigInt(base);
    while (num > 0n) { r = digits[Number(num % bb)] + r; num /= bb; }
    return r;
  }

  function handleConvInput(e) {
    const inp = e.target, base = +inp.dataset.base, v = inp.value.trim();
    Object.values(convInputs).forEach(i => i.classList.remove('error', 'success'));
    $('copyStatus').textContent = '';
    if (v === '') {
      Object.entries(convInputs).forEach(([b, i]) => { if (+b !== base) i.value = ''; });
      return;
    }
    if (!convPatterns[base].test(v)) { inp.classList.add('error'); return; }
    const dec = parseInBase(v, base);
    if (dec === null) { inp.classList.add('error'); return; }
    inp.classList.add('success');
    Object.entries(convInputs).forEach(([b, i]) => {
      const bn = +b;
      if (bn !== base) i.value = bigIntToBase(dec, bn);
    });
  }
  Object.values(convInputs).forEach(i => i.addEventListener('input', handleConvInput));

  $('clearConverterBtn').addEventListener('click', () => {
    Object.values(convInputs).forEach(i => { i.value = ''; i.classList.remove('error','success'); });
    $('copyStatus').textContent = '';
    convInputs[10].focus();
  });
  $('copyConverterBtn').addEventListener('click', () => {
    const lines = [
      'Двоичная (2): ' + convInputs[2].value,
      'Восьмеричная (8): ' + convInputs[8].value,
      'Десятичная (10): ' + convInputs[10].value,
      'Шестнадцатеричная (16): ' + convInputs[16].value
    ];
    const text = lines.join('\n');
    const status = $('copyStatus');
    if (!Object.values(convInputs).some(i => i.value.trim())) {
      status.style.color = '#dc2626'; status.textContent = 'Нечего копировать';
      return;
    }
    const done = () => {
      status.style.color = '#16a34a'; status.textContent = 'Скопировано';
      setTimeout(() => { if (status.textContent === 'Скопировано') status.textContent = ''; }, 1800);
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done).catch(() => fb(text, done));
    else fb(text, done);
  });
  function fb(text, cb) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); cb(); } catch (_) {}
    document.body.removeChild(ta);
  }

  /* ============================================================
     ДИАПАЗОНЫ
  ============================================================ */
  const diapState = { min: 0, max: 999, ineq: 'strict', answer: null, sys: [2,8,10,16] };

  document.querySelectorAll('#ineqToggles .base-toggle').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('#ineqToggles .base-toggle').forEach(x => x.classList.toggle('active', x === t));
    diapState.ineq = t.dataset.ineq;
  }));

  function readDiapasonSettings() {
    let a = parseInt($('diapMin').value, 10), b = parseInt($('diapMax').value, 10);
    if (isNaN(a) || a < 0) a = 0;
    if (isNaN(b) || b < 0) b = 0;
    if (a > b) [a, b] = [b, a];
    $('diapMin').value = a; $('diapMax').value = b;
    diapState.min = a; diapState.max = b;
    diapState.sys = [];
    document.querySelectorAll('#diapasonSystems input[type=checkbox]').forEach(c => {
      if (c.checked) diapState.sys.push(+c.dataset.base);
    });
    if (diapState.sys.length === 0) diapState.sys = [10];
  }

  function subscript(base) {
    const d = '₀₁₂₃₄₅₆₇₈₉';
    return String(base).split('').map(c => d[+c]).join('');
  }

  function generateDiapasonTask() {
    readDiapasonSettings();
    const { min, max, sys } = diapState;
    const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
    let n1 = rnd(min, max), n2 = rnd(min, max);
    let guard = 0;
    while (n1 === n2 && guard++ < 50) n2 = rnd(min, max);
    if (n1 > n2) [n1, n2] = [n2, n1];
    if (diapState.ineq === 'strict' && n2 - n1 < 2) n2 = n1 + 2;

    const pickBase = () => sys[Math.floor(Math.random() * sys.length)];
    const b1 = pickBase(), b2 = pickBase();
    const s1 = toBase(n1, b1) + subscript(b1);
    const s2 = toBase(n2, b2) + subscript(b2);

    let task;
    if (diapState.ineq === 'strict') {
      task = s1 + ' < X < ' + s2;
      diapState.answer = { min: n1 + 1, max: n2 - 1 };
    } else if (diapState.ineq === 'half') {
      task = s1 + ' ≤ X < ' + s2;
      diapState.answer = { min: n1, max: n2 - 1 };
    } else {
      task = s1 + ' ≤ X ≤ ' + s2;
      diapState.answer = { min: n1, max: n2 };
    }

    $('diapasonTask').textContent = task;
    $('diapasonAnswer').value = '';
    $('diapasonAnswer').classList.remove('correct-input', 'incorrect-input');
    $('diapasonFeedback').textContent = '';
    $('diapasonFeedback').className = 'feedback';
  }

  $('diapasonGenerateBtn').addEventListener('click', generateDiapasonTask);

  $('diapasonCheckBtn').addEventListener('click', () => {
    const v = $('diapasonAnswer').value.trim();
    const fb = $('diapasonFeedback');
    const inp = $('diapasonAnswer');
    if (!diapState.answer) {
      fb.textContent = 'Сначала сгенерируйте задачу';
      fb.className = 'feedback incorrect';
      return;
    }
    if (!/^\d+$/.test(v)) {
      fb.textContent = 'Введите целое неотрицательное число';
      fb.className = 'feedback incorrect';
      return;
    }
    const x = parseInt(v, 10);
    const { min: lo, max: hi } = diapState.answer;
    const count = hi >= lo ? (hi - lo + 1) : 0;
    const ok = x >= lo && x <= hi;
    inp.classList.toggle('correct-input', ok);
    inp.classList.toggle('incorrect-input', !ok);

    if (count === 0) {
      fb.textContent = 'В этом диапазоне нет целых X';
      fb.className = 'feedback incorrect';
      return;
    }
    fb.textContent = ok
      ? `Верно. Количество целых X: ${count}`
      : `Неверно. Количество целых X: ${count}`;
    fb.className = 'feedback ' + (ok ? 'correct' : 'incorrect');
  });

  $('diapasonAnswer').addEventListener('keypress', e => {
    if (e.key === 'Enter') $('diapasonCheckBtn').click();
  });

  generateDiapasonTask();
})();