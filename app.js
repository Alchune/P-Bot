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
  'hp', 'hpCurrent', 'ap', 'apCurrent', 'bp', 'bpCurrent', 'tp', 'tpCurrent', 'mp', 'mpCurrent',
  'mpStat', 'weapons', 'armor', 'inventory',
];

const dom = {};
let rafScheduled = false;

function num(id) {
  return Number(dom.statInputs[id].value || 0);
}

function getMagicStat() {
  const magicSelect = dom.skillsBody.querySelector('#magicStat');
  return magicSelect ? magicSelect.value : 'INT';
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
  dom.bp.value = Math.floor(num('STR') / 10);
  dom.tp.value = Math.floor(num('DEX') / 10);
  dom.ap.value = Math.floor((num('CON') + num('WIL')) / 10);
  dom.mp.value = num(dom.mpStat.value);
}

function recalcRow(row) {
  const formula = row.dataset.formula === 'CUSTOM' ? row.querySelector('.customFormula').value : row.dataset.formula;
  const base = calcBase(formula);
  row.querySelector('.base-cell').textContent = base;
  row.querySelector('.total').value = base + Number(row.querySelector('.sp').value || 0);
  if (row.dataset.formula === 'MAGIC') row.querySelector('.formula-display').textContent = getMagicStat();
}

function recalcAll() {
  recalcResources();
  dom.skillsBody.querySelectorAll('tr[data-formula]').forEach(recalcRow);
}

function scheduleRecalcAll() {
  if (rafScheduled) return;
  rafScheduled = true;
  requestAnimationFrame(() => {
    rafScheduled = false;
    recalcAll();
  });
}

function skillFormulaCell(formula) {
  if (formula === 'MAGIC') return '<span class="formula-display"></span><select id="magicStat"><option value="INT">INT</option><option value="WIL">WIL</option></select>';
  if (formula === 'CUSTOM') return `<select class="customFormula"><option value="STR">STR</option><option value="DEX">DEX</option><option value="CON">CON</option><option value="INT">INT</option><option value="WIL">WIL</option><option value="CHA">CHA</option><option value="STR+DEX">STR+DEX</option><option value="STR+CON">STR+CON</option><option value="STR+INT">STR+INT</option><option value="STR+WIL">STR+WIL</option><option value="STR+CHA">STR+CHA</option><option value="DEX+CON">DEX+CON</option><option value="DEX+INT">DEX+INT</option><option value="DEX+WIL">DEX+WIL</option><option value="DEX+CHA">DEX+CHA</option><option value="CON+INT">CON+INT</option><option value="CON+WIL">CON+WIL</option><option value="CON+CHA">CON+CHA</option><option value="INT+WIL">INT+WIL</option><option value="INT+CHA">INT+CHA</option><option value="WIL+CHA">WIL+CHA</option></select>`;
  return `<span class="formula-display">${formula}</span>`;
}

function createSkillRow(name, formula, sp = 0, customFormula = 'STR') {
  const tr = document.createElement('tr');
  tr.dataset.formula = formula;
  tr.dataset.custom = formula === 'CUSTOM' ? '1' : '0';
  tr.innerHTML = `
    <td class="idx"></td>
    <td>${formula === 'CUSTOM' ? `<input class="skillName" value="${name}" placeholder="Назва навички">` : name}</td>
    <td>${skillFormulaCell(formula)}</td>
    <td class="base-cell">0</td>
    <td><input class="sp" type="number" min="0" value="${sp}"></td>
    <td class="total-cell"><input class="total" readonly></td>`;
  if (formula === 'CUSTOM') tr.querySelector('.customFormula').value = customFormula;
  return tr;
}

function fillSkillsRows(items) {
  const fragment = document.createDocumentFragment();
  items.forEach((item) => fragment.append(createSkillRow(item.name, item.formula, item.sp ?? 0, item.customFormula ?? 'STR')));
  dom.skillsBody.innerHTML = '';
  dom.skillsBody.append(fragment);
  dom.skillsBody.querySelectorAll('.idx').forEach((el, i) => (el.textContent = i + 1));
}

function init() {
  simpleFields.forEach((id) => { dom[id] = document.getElementById(id); });
  dom.skillsBody = document.getElementById('skillsBody');
  dom.savedCharacters = document.getElementById('savedCharacters');

  const statsGrid = document.getElementById('statsGrid');
  dom.statInputs = {};
  const fragment = document.createDocumentFragment();
  stats.forEach((s) => {
    const w = document.createElement('label');
    w.innerHTML = `${s}<input id="stat_${s}" type="number" min="0" value="0"/>`;
    fragment.append(w);
  });
  statsGrid.append(fragment);
  stats.forEach((s) => { dom.statInputs[s] = document.getElementById(`stat_${s}`); });

  fillSkillsRows(baseSkills.map(([name, formula]) => ({ name, formula, sp: 0 })));

  stats.forEach((s) => dom.statInputs[s].addEventListener('input', scheduleRecalcAll));
  dom.mpStat.addEventListener('input', scheduleRecalcAll);

  dom.skillsBody.addEventListener('input', (e) => {
    const row = e.target.closest('tr');
    if (!row) return;
    if (e.target.id === 'magicStat') {
      scheduleRecalcAll();
      return;
    }
    recalcRow(row);
  });

  document.getElementById('addSkill').addEventListener('click', () => {
    dom.skillsBody.append(createSkillRow('', 'CUSTOM', 0, 'STR'));
    dom.skillsBody.querySelectorAll('.idx').forEach((el, i) => (el.textContent = i + 1));
    recalcRow(dom.skillsBody.lastElementChild);
  });

  document.getElementById('saveCharacter').addEventListener('click', saveCurrent);
  document.getElementById('newCharacter').addEventListener('click', clearForm);
  document.getElementById('deleteCharacter').addEventListener('click', deleteCurrent);
  dom.savedCharacters.addEventListener('change', (e) => loadData(allCharacters()[e.target.value]));

  refreshSelect();
  recalcAll();
}

function gatherData() {
  const data = { stats: {}, skills: [] };
  simpleFields.forEach((f) => (data[f] = dom[f].value));
  data.magicStat = getMagicStat();
  stats.forEach((s) => (data.stats[s] = dom.statInputs[s].value));
  dom.skillsBody.querySelectorAll('tr').forEach((row) => {
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
  simpleFields.forEach((f) => { dom[f].value = data[f] ?? (dom[f].tagName === 'SELECT' ? dom[f].options[0].value : ''); });
  stats.forEach((s) => (dom.statInputs[s].value = data.stats?.[s] ?? 0));

  if (Array.isArray(data.skills) && data.skills.length) {
    fillSkillsRows(data.skills.map((s) => ({
      name: s.name || '',
      formula: s.formula || 'CUSTOM',
      sp: s.sp || 0,
      customFormula: s.customFormula || 'STR',
    })));
  } else {
    fillSkillsRows(baseSkills.map(([name, formula]) => ({ name, formula, sp: 0 })));
  }

  const magicSel = dom.skillsBody.querySelector('#magicStat');
  if (magicSel) magicSel.value = data.magicStat ?? 'INT';
  recalcAll();
}

function allCharacters() { return JSON.parse(localStorage.getItem('sargaroth_chars') || '{}'); }

function refreshSelect(selected = '') {
  const db = allCharacters();
  dom.savedCharacters.innerHTML = '<option value="">-- Оберіть --</option>';
  Object.keys(db).sort().forEach((name) => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    dom.savedCharacters.append(opt);
  });
  dom.savedCharacters.value = selected;
}

function clearForm() {
  loadData({ stats: {}, skills: [], mpStat: 'INT', magicStat: 'INT' });
  dom.savedCharacters.value = '';
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
  const key = dom.savedCharacters.value;
  if (!key) return;
  const db = allCharacters();
  delete db[key];
  localStorage.setItem('sargaroth_chars', JSON.stringify(db));
  clearForm();
  refreshSelect();
}

init();
