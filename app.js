const stats = ['STR', 'DEX', 'CON', 'INT', 'WIL', 'CHA'];
const baseSkills = [
  ['Атлетика', 'STR'], ['Акробатика', 'DEX'], ['Витривалість', 'CON'], ['Ближня зброя', 'STR'],
  ['Стрілецька зброя', 'DEX'], ['Беззбройний бій', 'STR'], ['Непомітність', 'DEX'], ['Крадіжка', 'DEX'],
  ['Замки / Пастки', 'DEX+INT'], ['Уважність', 'WIL'], ['Інтуїція', 'INT+WIL'], ['Аркана', 'INT'],
  ['Історія', 'INT'], ['Ремесло', 'INT+DEX'], ['Медицина', 'INT+WIL'], ['Переконання', 'CHA'],
  ['Залякування', 'STR+CHA'], ['Магія', 'MAGIC'],
];

const simpleFields = [
  'name', 'race', 'archetype',
  'hp', 'hpCurrent',
  'ap', 'apCurrent',
  'bp', 'bpCurrent',
  'tp', 'tpCurrent',
  'mp', 'mpCurrent',
  'mpStat', 'weapons', 'armor', 'inventory',
];
const savedCharacters = document.getElementById('savedCharacters');

function num(id) { return Number(document.getElementById(`stat_${id}`).value || 0); }
function getMagicStat() { return document.getElementById('magicStat')?.value || 'INT'; }

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
  document.getElementById('mp').value = num(document.getElementById('mpStat').value);
}

function recalc() {
  recalcResources();
  document.querySelectorAll('#skillsBody tr[data-formula]').forEach((row) => {
    const formula = row.dataset.formula;
    const base = calcBase(formula);
    row.querySelector('.base-cell').textContent = base;
    row.querySelector('.total').value = base + Number(row.querySelector('.sp').value || 0);
    if (formula === 'MAGIC') row.querySelector('.formula-display').textContent = getMagicStat();
  });
  document.getElementById('saveCharacter').addEventListener('click', saveCurrent);
  document.getElementById('newCharacter').addEventListener('click', clearForm);
  document.getElementById('deleteCharacter').addEventListener('click', deleteCurrent);
  savedCharacters.addEventListener('change', (e) => loadData(allCharacters()[e.target.value]));
  refreshSelect();
  recalc();
}

function skillFormulaCell(formula, isMagic = false) {
  if (isMagic) return '<span class="formula-display"></span><select id="magicStat"><option value="INT">INT</option><option value="WIL">WIL</option></select>';
  if (formula === 'CUSTOM') return `<select class="customFormula"><option value="STR">STR</option><option value="DEX">DEX</option><option value="CON">CON</option><option value="INT">INT</option><option value="WIL">WIL</option><option value="CHA">CHA</option><option value="STR+DEX">STR+DEX</option><option value="STR+CON">STR+CON</option><option value="STR+INT">STR+INT</option><option value="STR+WIL">STR+WIL</option><option value="STR+CHA">STR+CHA</option><option value="DEX+CON">DEX+CON</option><option value="DEX+INT">DEX+INT</option><option value="DEX+WIL">DEX+WIL</option><option value="DEX+CHA">DEX+CHA</option><option value="CON+INT">CON+INT</option><option value="CON+WIL">CON+WIL</option><option value="CON+CHA">CON+CHA</option><option value="INT+WIL">INT+WIL</option><option value="INT+CHA">INT+CHA</option><option value="WIL+CHA">WIL+CHA</option></select>`;
  return `<span class="formula-display">${formula}</span>`;
}

function appendSkillRow(name, formula, sp = 0, customFormula = 'STR') {
  const body = document.getElementById('skillsBody');
  const tr = document.createElement('tr');
  tr.dataset.formula = formula;
  tr.dataset.custom = formula === 'CUSTOM' ? '1' : '0';
  tr.innerHTML = `
    <td class="idx"></td>
    <td>${formula === 'CUSTOM' ? `<input class="skillName" value="${name}" placeholder="Назва навички">` : name}</td>
    <td>${skillFormulaCell(formula, formula === 'MAGIC')}</td>
    <td class="base-cell">0</td>
    <td><input class="sp" type="number" min="0" value="${sp}"></td>
    <td class="total-cell"><input class="total" readonly></td>`;
  body.append(tr);
  if (formula === 'CUSTOM') tr.querySelector('.customFormula').value = customFormula;
}

function renumberSkills() {
  document.querySelectorAll('#skillsBody .idx').forEach((el, i) => (el.textContent = i + 1));
}

function effectiveFormula(row) {
  if (row.dataset.formula === 'MAGIC') return 'MAGIC';
  if (row.dataset.formula === 'CUSTOM') return row.querySelector('.customFormula').value;
  return row.dataset.formula;
}

function init() {
  const statsGrid = document.getElementById('statsGrid');
  stats.forEach((s) => {
    const w = document.createElement('label');
    w.innerHTML = `${s}<input id="stat_${s}" type="number" min="0" value="0"/>`;
    statsGrid.append(w);
  });

  baseSkills.forEach(([name, formula]) => appendSkillRow(name, formula));
  renumberSkills();

  document.querySelectorAll('#statsGrid input, #mpStat').forEach((el) => el.addEventListener('input', recalc));
  document.getElementById('skillsBody').addEventListener('input', (e) => {
    const row = e.target.closest('tr');
    if (!row) return;
    const formula = effectiveFormula(row);
    const base = calcBase(formula);
    row.querySelector('.base-cell').textContent = base;
    row.querySelector('.total').value = base + Number(row.querySelector('.sp').value || 0);
    if (row.dataset.formula === 'MAGIC') row.querySelector('.formula-display').textContent = getMagicStat();
  });

  document.getElementById('addSkill').addEventListener('click', () => {
    appendSkillRow('', 'CUSTOM', 0, 'STR');
    renumberSkills();
    recalc();
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
  document.querySelectorAll('#skillsBody tr').forEach((row) => {
    data.skills.push({
      name: row.dataset.custom === '1' ? row.querySelector('.skillName').value : row.children[1].textContent,
      formula: row.dataset.formula,
      customFormula: row.dataset.formula === 'CUSTOM' ? row.querySelector('.customFormula').value : '',
      sp: row.querySelector('.sp').value,
    });
  });
  return data;
}

function loadData(data) {
  if (!data) return;
  simpleFields.forEach((f) => {
    const el = document.getElementById(f);
    if (el) el.value = data[f] ?? (el.tagName === 'SELECT' ? el.options[0].value : '');
  });
  stats.forEach((s) => (document.getElementById(`stat_${s}`).value = data.stats?.[s] ?? 0));

  const body = document.getElementById('skillsBody');
  body.innerHTML = '';
  if (Array.isArray(data.skills) && data.skills.length) {
    data.skills.forEach((s) => appendSkillRow(s.name || '', s.formula || 'CUSTOM', s.sp || 0, s.customFormula || 'STR'));
  } else {
    baseSkills.forEach(([name, formula]) => appendSkillRow(name, formula));
  }

  renumberSkills();
  const magicSel = document.getElementById('magicStat');
  if (magicSel) magicSel.value = data.magicStat ?? 'INT';
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

function clearForm() {
  loadData({ stats: {}, skills: [], mpStat: 'INT', magicStat: 'INT' });
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
