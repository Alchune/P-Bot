const stats = ['STR', 'DEX', 'CON', 'INT', 'WIL', 'CHA'];
const skills = [
  ['Атлетика', 'STR'], ['Акробатика', 'DEX'], ['Витривалість', 'CON'], ['Ближня зброя', 'STR'],
  ['Стрілецька зброя', 'DEX'], ['Беззбройний бій', 'STR'], ['Непомітність', 'DEX'], ['Крадіжка', 'DEX'],
  ['Замки / Пастки', 'DEX+INT'], ['Уважність', 'WIL'], ['Інтуїція', 'INT+WIL'], ['Аркана', 'INT'],
  ['Історія', 'INT'], ['Ремесло', 'INT+DEX'], ['Медицина', 'INT+WIL'], ['Переконання', 'CHA'],
  ['Залякування', 'STR+CHA'], ['Магія', 'INT+WIL'],
];

const simpleFields = ['name', 'race', 'archetype', 'hp', 'ap', 'bp', 'tp', 'mp', 'weapons', 'armor'];
const savedCharacters = document.getElementById('savedCharacters');

function num(id) {
  return Number(document.getElementById(`stat_${id}`).value || 0);
}

function calcBase(formula) {
  if (formula.includes('+')) {
    const [a, b] = formula.split('+');
    return Math.floor((num(a) + num(b)) / 4);
  }
  return Math.floor(num(formula) / 2);
}

function recalc() {
  document.querySelectorAll('tr[data-formula]').forEach((row) => {
    const base = calcBase(row.dataset.formula);
    row.querySelector('.base-cell').textContent = base;
    const sp = Number(row.querySelector('.sp').value || 0);
    row.querySelector('.total').value = base + sp;
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
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${name}</td>
      <td>${formula}</td>
      <td class="base-cell">0</td>
      <td><input class="sp" type="number" min="0" value="0"></td>
      <td class="total-cell"><input class="total" readonly></td>`;
    body.append(tr);
  });

  document.querySelectorAll('#statsGrid input, .sp').forEach((el) => el.addEventListener('input', recalc));
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
  stats.forEach((s) => (data.stats[s] = document.getElementById(`stat_${s}`).value));
  document.querySelectorAll('#skillsBody tr').forEach((row) => {
    data.skills.push({ sp: row.querySelector('.sp').value });
  });
  return data;
}

function loadData(data) {
  if (!data) return;
  simpleFields.forEach((f) => (document.getElementById(f).value = data[f] ?? ''));
  stats.forEach((s) => (document.getElementById(`stat_${s}`).value = data.stats?.[s] ?? 0));
  document.querySelectorAll('#skillsBody tr').forEach((row, i) => {
    row.querySelector('.sp').value = data.skills?.[i]?.sp ?? 0;
  });
  recalc();
}

function allCharacters() {
  return JSON.parse(localStorage.getItem('sargaroth_chars') || '{}');
}

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

function clearForm() {
  loadData({ stats: {}, skills: [] });
  savedCharacters.value = '';
}

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
