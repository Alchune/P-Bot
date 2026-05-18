const groups = {
  physical: ['Міць', 'Спритність', 'Витривалість'],
  social: ['Харизма', 'Маніпуляція', 'Витримка'],
  mental: ['Інтелект', 'Кмітливість', 'Рішучість'],
  skills1: ['Атлетизм', 'Боротьба', 'Виживання', 'Керування', 'Крадійство', 'Непомітність', 'Ремесло', 'Рукопашний бій', 'Стрільба'],
  skills2: ['Виступ', 'Вуличний досвід', 'Етикет', 'Залякування', 'Лідерство', 'Переконливість', 'Проникливість', 'Розуміння тварин', 'Хитрість'],
  skills3: ['Знання', 'Медицина', 'Наука', 'Окультизм', 'Політика', 'Розслідування', 'Спостережливість', 'Технології', 'Фінанси'],
};

const simpleFields = ['name','concept','predatorType','chronicle','ambition','clan','sire','desire','generation','disciplines','advantages','story','notes','hunger','humanity','bloodPotency','resonance'];
const savedCharacters = document.getElementById('savedCharacters');

function initDots() {
  const tpl = document.getElementById('dotField');
  Object.entries(groups).forEach(([id, labels]) => {
    const container = document.getElementById(id);
    labels.forEach((text) => {
      const row = tpl.content.firstElementChild.cloneNode(true);
      row.querySelector('.label').textContent = text;
      const input = row.querySelector('input');
      input.id = `${id}_${text}`;
      container.append(row);
    });
  });
}

function gatherData() {
  const data = {};
  simpleFields.forEach((f) => (data[f] = document.getElementById(f).value));
  data.stats = {};
  document.querySelectorAll('.dot-row input').forEach((i) => (data.stats[i.id] = i.value));
  return data;
}

function loadData(data) {
  if (!data) return;
  simpleFields.forEach((f) => (document.getElementById(f).value = data[f] ?? ''));
  document.querySelectorAll('.dot-row input').forEach((i) => (i.value = data.stats?.[i.id] ?? 0));
}

function allCharacters() {
  return JSON.parse(localStorage.getItem('v5chars') || '{}');
}

function saveCurrent() {
  const data = gatherData();
  const key = data.name?.trim();
  if (!key) return alert("Вкажіть ім'я персонажа");
  const db = allCharacters();
  db[key] = data;
  localStorage.setItem('v5chars', JSON.stringify(db));
  refreshSelect(key);
}

function refreshSelect(selectName = '') {
  const db = allCharacters();
  savedCharacters.innerHTML = '<option value="">-- Оберіть --</option>';
  Object.keys(db).sort().forEach((name) => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    savedCharacters.append(opt);
  });
  savedCharacters.value = selectName;
}

function clearForm() {
  loadData({ stats: {} });
  savedCharacters.value = '';
}

document.getElementById('saveCharacter').addEventListener('click', saveCurrent);
document.getElementById('newCharacter').addEventListener('click', clearForm);
document.getElementById('deleteCharacter').addEventListener('click', () => {
  const key = savedCharacters.value;
  if (!key) return;
  const db = allCharacters();
  delete db[key];
  localStorage.setItem('v5chars', JSON.stringify(db));
  refreshSelect();
  clearForm();
});
savedCharacters.addEventListener('change', (e) => loadData(allCharacters()[e.target.value]));

initDots();
refreshSelect();
