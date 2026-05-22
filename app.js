const stats = ['STR', 'DEX', 'CON', 'INT', 'WIL', 'CHA'];
const baseSkills = [
  ['Атлетика', 'STR'], ['Акробатика', 'DEX'], ['Витривалість', 'CON'], ['Ближня зброя', 'STR'],
  ['Стрілецька зброя', 'DEX'], ['Беззбройний бій', 'STR'], ['Непомітність', 'DEX'], ['Крадіжка', 'DEX'],
  ['Замки / Пастки', 'DEX+INT'], ['Уважність', 'WIL'], ['Інтуїція', 'INT+WIL'], ['Аркана', 'INT'],
  ['Історія', 'INT'], ['Ремесло', 'INT+DEX'], ['Медицина', 'INT+WIL'], ['Переконання', 'CHA'],
  ['Залякування', 'STR+CHA'], ['Природа', 'INT'],
];

const simpleFields = [
  'name', 'race', 'archetype',
  'hp', 'hpCurrent', 'ap', 'apCurrent', 'bp', 'bpCurrent', 'tp', 'tpCurrent', 'mp', 'mpCurrent',
  'mpStat', 'weapons', 'armor', 'inventory',
];

const dom = {};
let rafScheduled = false;
let skillRows = [];

function num(id) { return Number(dom.statInputs[id].value || 0); }

function calcBase(formula) {
  if (formula.includes('+')) {
    const [a, b] = formula.split('+');
    return Math.floor((num(a) + num(b)) / 4);
  }
  return Math.floor(num(formula) / 2);
}

function recalcResources() {
  dom.hp.value = num('CON');
  dom.bp.value = Math.floor(num('STR') / 10);
  dom.tp.value = Math.floor(num('DEX') / 10);
  dom.ap.value = Math.floor((num('CON') + num('WIL')) / 10);
  dom.mp.value = num(dom.mpStat.value);
}

function recalcRow(row) {
  const formula = row.dataset.formula === 'CUSTOM' ? row.customFormulaEl.value : row.dataset.formula;
  const base = calcBase(formula);
  row.baseCell.textContent = base;
  row.totalEl.value = base + Number(row.spEl.value || 0);
}

function recalcAll() {
  recalcResources();
  for (let i = 0; i < skillRows.length; i += 1) recalcRow(skillRows[i]);
}

function scheduleRecalcAll() {
  if (rafScheduled) return;
  rafScheduled = true;
  requestAnimationFrame(() => {
    rafScheduled = false;
    recalcAll();
  });

  document.getElementById('saveCharacter').addEventListener('click', saveCurrent);
  document.getElementById('newCharacter').addEventListener('click', clearForm);
  document.getElementById('deleteCharacter').addEventListener('click', deleteCurrent);
  dom.savedCharacters.addEventListener('change', (e) => loadData(allCharacters()[e.target.value]));

  refreshSelect();
  recalcAll();
}

function skillFormulaCell(formula) {
  if (formula === 'CUSTOM') return `<select class="customFormula"><option value="STR">STR</option><option value="DEX">DEX</option><option value="CON">CON</option><option value="INT">INT</option><option value="WIL">WIL</option><option value="CHA">CHA</option><option value="STR+DEX">STR+DEX</option><option value="STR+CON">STR+CON</option><option value="STR+INT">STR+INT</option><option value="STR+WIL">STR+WIL</option><option value="STR+CHA">STR+CHA</option><option value="DEX+CON">DEX+CON</option><option value="DEX+INT">DEX+INT</option><option value="DEX+WIL">DEX+WIL</option><option value="DEX+CHA">DEX+CHA</option><option value="CON+INT">CON+INT</option><option value="CON+WIL">CON+WIL</option><option value="CON+CHA">CON+CHA</option><option value="INT+WIL">INT+WIL</option><option value="INT+CHA">INT+CHA</option><option value="WIL+CHA">WIL+CHA</option></select>`;
  return `<span>${formula}</span>`;
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
  tr.baseCell = tr.querySelector('.base-cell');
  tr.spEl = tr.querySelector('.sp');
  tr.totalEl = tr.querySelector('.total');
  tr.customFormulaEl = tr.querySelector('.customFormula');
  if (formula === 'CUSTOM' && tr.customFormulaEl) tr.customFormulaEl.value = customFormula;
  return tr;
}

function fillSkillsRows(items) {
  const fragment = document.createDocumentFragment();
  items.forEach((item) => fragment.append(createSkillRow(item.name, item.formula, item.sp ?? 0, item.customFormula ?? 'STR')));
  dom.skillsBody.innerHTML = '';
  dom.skillsBody.append(fragment);
  skillRows = Array.from(dom.skillsBody.querySelectorAll('tr[data-formula]'));
  for (let i = 0; i < skillRows.length; i += 1) skillRows[i].querySelector('.idx').textContent = i + 1;
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
    recalcRow(row);
  });

  document.getElementById('addSkill').addEventListener('click', () => {
    const row = createSkillRow('', 'CUSTOM', 0, 'STR');
    dom.skillsBody.append(row);
    skillRows.push(row);
    for (let i = 0; i < skillRows.length; i += 1) skillRows[i].querySelector('.idx').textContent = i + 1;
    recalcRow(row);
  });

  document.getElementById('saveCharacter').addEventListener('click', saveCurrent);
  document.getElementById('newCharacter').addEventListener('click', clearForm);
  document.getElementById('shareCharacter').addEventListener('click', shareCurrent);
  document.getElementById('importCharacter').addEventListener('click', importPrompt);
  document.getElementById('deleteCharacter').addEventListener('click', deleteCurrent);
  dom.savedCharacters.addEventListener('change', (e) => loadData(allCharacters()[e.target.value]));

  refreshSelect();
  tryImportFromUrl();
  recalcAll();
}

function gatherData() {
  const data = { stats: {}, skills: [] };
  simpleFields.forEach((f) => (data[f] = dom[f].value));
  stats.forEach((s) => (data.stats[s] = dom.statInputs[s].value));
  for (let i = 0; i < skillRows.length; i += 1) {
    const row = skillRows[i];
    data.skills.push({
      name: row.dataset.custom === '1' ? row.querySelector('.skillName').value : row.children[1].textContent,
      formula: row.dataset.formula,
      customFormula: row.dataset.formula === 'CUSTOM' ? row.querySelector('.customFormula').value : '',
      sp: row.querySelector('.sp').value,
    });
  }
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

  recalcAll();
}


function encodeCharacter(data) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}

function decodeCharacter(encoded) {
  return JSON.parse(decodeURIComponent(escape(atob(encoded))));
}

async function shareCurrent() {
  const data = gatherData();
  if (!data.name?.trim()) return alert("Спочатку вкажіть ім'я персонажа");
  const payload = encodeCharacter(data);
  const shareUrl = `${location.origin}${location.pathname}#char=${payload}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: `Sargaroth: ${data.name}`, text: `Персонаж: ${data.name}`, url: shareUrl });
      return;
    } catch (_) {}
  }
  await navigator.clipboard.writeText(shareUrl);
  alert('Посилання скопійовано в буфер обміну');
}

function importPrompt() {
  const raw = prompt('Встав посилання або код персонажа:');
  if (!raw) return;
  let encoded = raw.trim();
  const marker = '#char=';
  const idx = encoded.indexOf(marker);
  if (idx !== -1) encoded = encoded.slice(idx + marker.length);
  try {
    const data = decodeCharacter(encoded);
    loadData(data);
    if (data.name?.trim()) {
      const db = allCharacters();
      db[data.name.trim()] = data;
      localStorage.setItem('sargaroth_chars', JSON.stringify(db));
      refreshSelect(data.name.trim());
    }
    alert('Персонажа імпортовано');
  } catch {
    alert('Невірний формат імпорту');
  }
}

function tryImportFromUrl() {
  if (!location.hash.startsWith('#char=')) return;
  const encoded = location.hash.slice('#char='.length);
  try {
    const data = decodeCharacter(encoded);
    loadData(data);
    if (data.name?.trim()) {
      const db = allCharacters();
      db[data.name.trim()] = data;
      localStorage.setItem('sargaroth_chars', JSON.stringify(db));
      refreshSelect(data.name.trim());
    }
    history.replaceState(null, '', location.pathname + location.search);
  } catch {
    // ignore broken links
  }
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
  loadData({ stats: {}, skills: [], mpStat: 'INT' });
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
