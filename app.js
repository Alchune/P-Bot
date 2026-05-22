const stats = ['STR', 'DEX', 'CON', 'INT', 'WIL', 'CHA'];
const skills = [
  ['Атлетика', 'STR'], ['Акробатика', 'DEX'], ['Витривалість', 'CON'], ['Ближня зброя', 'STR'],
  ['Стрілецька зброя', 'DEX'], ['Беззбройний бій', 'STR'], ['Непомітність', 'DEX'], ['Крадіжка', 'DEX'],
  ['Замки / Пастки', 'DEX+INT'], ['Уважність', 'WIL'], ['Інтуїція', 'INT+WIL'], ['Аркана', 'INT'],
  ['Історія', 'INT'], ['Ремесло', 'INT+DEX'], ['Медицина', 'INT+WIL'], ['Переконання', 'CHA'],
  ['Залякування', 'STR+CHA'], ['Магія', 'MAGIC'],
];

const simpleFields = ['name', 'race', 'archetype', 'hp', 'ap', 'bp', 'tp', 'mp', 'mpStat', 'weapons', 'armor', 'inventory'];
const savedCharacters = document.getElementById('savedCharacters');

function num(id) {
  return Number(document.getElementById(`stat_${id}`).value || 0);
}

function getMagicStat() {
  const sel = document.getElementById('magicStat');
  return sel ? sel.value : 'INT';
}

function calcBase(formula) {
  if (formula === 'MAGIC') return Math.floor(num(getMagicStat()) / 2);
  if (formula.includes('+')) {
    const [a, b] = formula.split('+');
    return Math.floor((num(a) + num(b)) / 4);
  }
  return Math.floor(num(formula) / 2);
}

function recalcResources() {
  document.getElementById('bp').value = Math.floor(num('STR') / 10);
  document.getElementById('tp').value = Math.floor(num('DEX') / 10);
  document.getElementById('ap').value = Math.floor((num('CON') + num('WIL')) / 10);
  const mpStat = document.getElementById('mpStat').value;
  document.getElementById('mp').value = num(mpStat);
}

function recalc() {
  recalcResources();
  document.querySelectorAll('tr[data-formula]').forEach((row) => {
    const formula = row.dataset.formula;
    const base = calcBase(formula);
    row.querySelector('.base-cell').textContent = base;
    const sp = Number(row.querySelector('.sp').value || 0);
    row.querySelector('.total').value = base + sp;
    if (formula === 'MAGIC') {
      const display = row.querySelector('.formula-display');
      display.textContent = getMagicStat();
    }
  });
}

function init() {
  const statsGrid = document.getElementById('statsGrid');
  stats.forEach((s) => {
    const w = document.createElement('label');
    w.innerHTML = `${s}<input id="stat_${s}" type="number" min="0" value="0"/>`;
    statsGrid.append(w);
  });

  const body = document.getElementById('skillsBody');
  skills.forEach(([name, formula], i) => {
    const tr = document.createElement('tr');
    tr.dataset.formula = formula;
    const formulaCell = formula === 'MAGIC'
      ? '<select id="magicStat"><option value="INT">INT</option><option value="WIL">WIL</option></select>'
      : `<span class="formula-display">${formula}</span>`;
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${name}</td>
      <td><span class="formula-display">${formula === 'MAGIC' ? '' : formula}</span>${formula === 'MAGIC' ? formulaCell : ''}</td>
      <td class="base-cell">0</td>
      <td><input class="sp" type="number" min="0" value="0"></td>
      <td class="total-cell"><input class="total" readonly></td>`;
    body.append(tr);
  });

  document.querySelectorAll('#statsGrid input, .sp, #mpStat').forEach((el) => el.addEventListener('input', recalc));
  document.getElementById('skillsBody').addEventListener('input', (e) => {
    if (e.target.id === 'magicStat') recalc();
  });
  document.getElementById('saveCharacter').addEventListener('click', saveCurrent);
  document.getElementById('newCharacter').addEventListener('click', clearForm);
  document.getElementById('deleteCharacter').addEventListener('click', deleteCurrent);
  savedCharacters.addEventListener('change', (e) => loadData(allCharacters()[e.target.value]));
  refreshSelect();
  recalc();
}

function gatherData() {
  const data = { stats: {}, skills: [] };
  simpleFields.forEach((f) => (data[f] = document.getElementById(f).value));
  data.magicStat = getMagicStat();
  stats.forEach((s) => (data.stats[s] = document.getElementById(`stat_${s}`).value));
  document.querySelectorAll('#skillsBody tr').forEach((row) => data.skills.push({ sp: row.querySelector('.sp').value }));
  return data;
}

function loadData(data) {
  if (!data) return;
  simpleFields.forEach((f) => {
    const el = document.getElementById(f);
    if (el) el.value = data[f] ?? (el.tagName === 'SELECT' ? el.options[0].value : '');
  });
  stats.forEach((s) => (document.getElementById(`stat_${s}`).value = data.stats?.[s] ?? 0));
  if ((data.stats?.WIL ?? '') === '' && data.stats?.WIL !== undefined) {
    document.getElementById('stat_WIL').value = data.stats.WIL;
  }
  const magicSel = document.getElementById('magicStat');
  if (magicSel) magicSel.value = data.magicStat ?? 'INT';
  document.querySelectorAll('#skillsBody tr').forEach((row, i) => {
    row.querySelector('.sp').value = data.skills?.[i]?.sp ?? 0;
  });
  recalc();
}

function allCharacters() { return JSON.parse(localStorage.getItem('sargaroth_chars') || '{}'); }

function refreshSelect(selected = '') {
  const db = allCharacters();
  savedCharacters.innerHTML = '<option value="">-- Оберіть --</option>';
  Object.keys(db).sort().forEach((name) => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    savedCharacters.append(opt);
  });
  savedCharacters.value = selected;
}

function clearForm() { loadData({ stats: {}, skills: [], mpStat: 'INT', magicStat: 'INT' }); savedCharacters.value = ''; }

function saveCurrent() {
  const data = gatherData();
  const key = data.name?.trim();
  if (!key) return alert("Вкажіть ім'я персонажа");
  const db = allCharacters();
  db[key] = data;
  localStorage.setItem('sargaroth_chars', JSON.stringify(db));
  refreshSelect(key);
}

function deleteCurrent() {
  const key = savedCharacters.value;
  if (!key) return;
  const db = allCharacters();
  delete db[key];
  localStorage.setItem('sargaroth_chars', JSON.stringify(db));
  clearForm();
  refreshSelect();
}

init();
