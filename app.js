const stats = ['STR', 'DEX', 'CON', 'INT', 'WIL', 'CHA'];
const baseSkills = [
  ['Атлетика', 'STR'], ['Акробатика', 'DEX'], ['Витривалість', 'CON'], ['Ближня зброя', 'STR'],
  ['Стрілецька зброя', 'DEX'], ['Беззбройний бій', 'STR'], ['Непомітність', 'DEX'], ['Крадіжка', 'DEX'],
  ['Замки / Пастки', 'DEX+INT'], ['Уважність', 'WIL'], ['Інтуїція', 'INT+WIL'], ['Аркана', 'INT'],
  ['Історія', 'INT'], ['Ремесло', 'INT+DEX'], ['Медицина', 'INT+WIL'], ['Переконання', 'CHA'],
  ['Залякування', 'STR+CHA'], ['Природа', 'INT'],
];

const simpleFields = ['name', 'race', 'archetype', 'hp', 'hpCurrent', 'ap', 'apCurrent', 'bp', 'bpCurrent', 'tp', 'tpCurrent', 'mp', 'mpCurrent', 'mpStat', 'inventory'];
const dom = {};
let skillRows = [];

function num(id) { return Number(dom.statInputs[id].value || 0); }
function calcBase(formula) { if (formula.includes('+')) { const [a, b] = formula.split('+'); return Math.floor((num(a) + num(b)) / 4); } return Math.floor(num(formula) / 2); }
function recalcResources() { dom.hp.value = num('CON'); dom.bp.value = Math.floor(num('STR') / 10); dom.tp.value = Math.floor(num('DEX') / 10); dom.ap.value = Math.floor((num('CON') + num('WIL')) / 10); dom.mp.value = num(dom.mpStat.value); }
function recalcSkills() { skillRows.forEach((row) => { const formula = row.dataset.formula === 'CUSTOM' ? row.querySelector('.customFormula').value : row.dataset.formula; const base = calcBase(formula); row.querySelector('.base-cell').textContent = base; row.querySelector('.total').value = base + Number(row.querySelector('.sp').value || 0); }); }
function recalcAll() { recalcResources(); recalcSkills(); }

function makeRemoveBtn(cls='removeRow') { return `<button class="${cls} danger" type="button">✕</button>`; }
function renumber(tbody) { Array.from(tbody.children).forEach((tr,i)=>{ const c=tr.querySelector('.idx'); if(c)c.textContent=i+1; }); }

function addSkillRow(name, formula, sp=0, customFormula='STR') {
  const tr = document.createElement('tr'); tr.dataset.formula = formula;
  tr.innerHTML = `<td class="idx"></td><td>${formula==='CUSTOM'?`<input class="skillName" value="${name}">`:name}</td><td>${formula==='CUSTOM'?`<select class="customFormula"><option>STR</option><option>DEX</option><option>CON</option><option>INT</option><option>WIL</option><option>CHA</option><option>STR+DEX</option><option>STR+CON</option><option>STR+INT</option><option>STR+WIL</option><option>STR+CHA</option><option>DEX+CON</option><option>DEX+INT</option><option>DEX+WIL</option><option>DEX+CHA</option><option>CON+INT</option><option>CON+WIL</option><option>CON+CHA</option><option>INT+WIL</option><option>INT+CHA</option><option>WIL+CHA</option></select>`:formula}</td><td class="base-cell">0</td><td><input class="sp" type="number" min="0" value="${sp}"></td><td><input class="total" readonly></td><td>${makeRemoveBtn('removeSkill')}</td>`;
  dom.skillsBody.append(tr); if (formula==='CUSTOM') tr.querySelector('.customFormula').value = customFormula; skillRows.push(tr); renumber(dom.skillsBody); recalcSkills();
}

function addTalentRow(name='', info='') { const tr=document.createElement('tr'); tr.innerHTML=`<td class="idx"></td><td><input class="talentName" value="${name}"></td><td><input class="talentInfo" value="${info}"></td><td>${makeRemoveBtn('removeTalent')}</td>`; dom.talentsBody.append(tr); renumber(dom.talentsBody); }
function addWeaponRow(v={}) { const tr=document.createElement('tr'); tr.innerHTML=`<td class="idx"></td><td><input class="wName" value="${v.name||''}"></td><td><input class="wType" value="${v.type||''}"></td><td><input class="wDmg" value="${v.damage||''}"></td><td><input class="wMod" value="${v.mod||''}"></td><td><input class="wNote" value="${v.note||''}"></td><td>${makeRemoveBtn('removeWeapon')}</td>`; dom.weaponsBody.append(tr); renumber(dom.weaponsBody); }
function addArmorRow(v={}) { const tr=document.createElement('tr'); tr.innerHTML=`<td class="idx"></td><td><input class="aName" value="${v.name||''}"></td><td><input class="aPart" value="${v.part||''}"></td><td><input class="aDef" value="${v.defense||''}"></td><td><input class="aNote" value="${v.note||''}"></td><td>${makeRemoveBtn('removeArmor')}</td>`; dom.armorBody.append(tr); renumber(dom.armorBody); }

function gatherRows(selector, mapFn){ return Array.from(selector.children).map(mapFn); }

function gatherData() {
  const data = { stats: {}, skills: [], talents: [], weapons: [], armor: [] };
  simpleFields.forEach((f)=> data[f]=dom[f].value); stats.forEach((s)=> data.stats[s]=dom.statInputs[s].value);
  data.skills = gatherRows(dom.skillsBody, (row)=>({ name: row.dataset.formula==='CUSTOM'?row.querySelector('.skillName').value:row.children[1].textContent, formula: row.dataset.formula, customFormula: row.dataset.formula==='CUSTOM'?row.querySelector('.customFormula').value:'', sp: row.querySelector('.sp').value }));
  data.talents = gatherRows(dom.talentsBody, (r)=>({ name:r.querySelector('.talentName').value, info:r.querySelector('.talentInfo').value }));
  data.weapons = gatherRows(dom.weaponsBody, (r)=>({ name:r.querySelector('.wName').value, type:r.querySelector('.wType').value, damage:r.querySelector('.wDmg').value, mod:r.querySelector('.wMod').value, note:r.querySelector('.wNote').value }));
  data.armor = gatherRows(dom.armorBody, (r)=>({ name:r.querySelector('.aName').value, part:r.querySelector('.aPart').value, defense:r.querySelector('.aDef').value, note:r.querySelector('.aNote').value }));
  return data;
}

function fillSkills(skills){ dom.skillsBody.innerHTML=''; skillRows=[]; (skills?.length?skills:baseSkills.map(([name,formula])=>({name,formula,sp:0}))).forEach((s)=>addSkillRow(s.name||'', s.formula||'CUSTOM', s.sp||0, s.customFormula||'STR')); }
function fillList(data, addFn){ data?.length?data.forEach((x)=>addFn(x)):addFn({}); }

function loadData(data) {
  if (!data) return;
  simpleFields.forEach((f)=> dom[f].value = data[f] ?? (dom[f].tagName==='SELECT'?dom[f].options[0].value:''));
  stats.forEach((s)=> dom.statInputs[s].value = data.stats?.[s] ?? 0);
  fillSkills(data.skills);
  dom.talentsBody.innerHTML=''; fillList(data.talents, (t)=>addTalentRow(t.name||'', t.info||''));
  dom.weaponsBody.innerHTML=''; fillList(data.weapons, addWeaponRow);
  dom.armorBody.innerHTML=''; fillList(data.armor, addArmorRow);
  recalcAll();
}

function encodeCharacter(data){ return btoa(unescape(encodeURIComponent(JSON.stringify(data)))); }
function decodeCharacter(encoded){ return JSON.parse(decodeURIComponent(escape(atob(encoded)))); }
function legacyCopy(text){ const ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); let ok=false; try{ok=document.execCommand('copy');}catch{} ta.remove(); return ok; }
async function shareCurrent(){ const data=gatherData(); if(!data.name?.trim()) return alert("Спочатку вкажіть ім'я персонажа"); const url=`${location.origin}${location.pathname}#char=${encodeCharacter(data)}`; if(navigator.share){ try{ await navigator.share({title:`Sargaroth: ${data.name}`,url}); alert('Посилання на персонажа надіслано'); return;}catch(e){ if(e?.name==='AbortError') return; }} if(legacyCopy(url)){ alert('Посилання скопійовано в буфер обміну'); return;} try{ if(navigator.clipboard?.writeText){ await navigator.clipboard.writeText(url); alert('Посилання скопійовано в буфер обміну'); return;}}catch{} window.prompt('Скопіюй посилання на персонажа:', url); }
function importPrompt(){ const raw=prompt('Встав посилання або код персонажа:'); if(!raw) return; let encoded=raw.trim(); const idx=encoded.indexOf('#char='); if(idx!==-1) encoded=encoded.slice(idx+6); try{ const data=decodeCharacter(encoded); loadData(data); if(data.name?.trim()){ const db=allCharacters(); db[data.name.trim()]=data; localStorage.setItem('sargaroth_chars', JSON.stringify(db)); refreshSelect(data.name.trim()); } alert('Персонажа імпортовано'); }catch{ alert('Невірний формат імпорту'); }}
function tryImportFromUrl(){ if(!location.hash.startsWith('#char=')) return; try{ const data=decodeCharacter(location.hash.slice(6)); loadData(data); history.replaceState(null,'',location.pathname+location.search);}catch{} }

function allCharacters(){ return JSON.parse(localStorage.getItem('sargaroth_chars')||'{}'); }
function refreshSelect(selected=''){ const db=allCharacters(); dom.savedCharacters.innerHTML='<option value="">-- Оберіть --</option>'; Object.keys(db).sort().forEach((name)=>{ const opt=document.createElement('option'); opt.value=name; opt.textContent=name; dom.savedCharacters.append(opt);}); dom.savedCharacters.value=selected; }
function saveCurrent(){ const data=gatherData(); const key=data.name?.trim(); if(!key) return alert("Вкажіть ім'я персонажа"); const db=allCharacters(); db[key]=data; localStorage.setItem('sargaroth_chars', JSON.stringify(db)); refreshSelect(key); }
function clearForm(){ loadData({stats:{}, skills:[], talents:[], weapons:[], armor:[], mpStat:'INT'}); dom.savedCharacters.value=''; }
function deleteCurrent(){ const key=dom.savedCharacters.value; if(!key) return; const db=allCharacters(); delete db[key]; localStorage.setItem('sargaroth_chars', JSON.stringify(db)); clearForm(); refreshSelect(); }

function init(){
  [...simpleFields, 'skillsBody','talentsBody','weaponsBody','armorBody','savedCharacters'].forEach((id)=> dom[id]=document.getElementById(id));
  dom.statInputs={}; const statsGrid=document.getElementById('statsGrid'); const frag=document.createDocumentFragment(); stats.forEach((s)=>{ const w=document.createElement('label'); w.innerHTML=`${s}<input id="stat_${s}" type="number" min="0" value="0"/>`; frag.append(w);}); statsGrid.append(frag); stats.forEach((s)=> dom.statInputs[s]=document.getElementById(`stat_${s}`));
  fillSkills(); dom.talentsBody.innerHTML=''; addTalentRow(); dom.weaponsBody.innerHTML=''; addWeaponRow(); dom.armorBody.innerHTML=''; addArmorRow();

  stats.forEach((s)=> dom.statInputs[s].addEventListener('input', recalcAll)); dom.mpStat.addEventListener('input', recalcAll);
  dom.skillsBody.addEventListener('input', (e)=>{ const row=e.target.closest('tr'); if(row) recalcRow(row); });
  dom.skillsBody.addEventListener('click', (e)=>{ const b=e.target.closest('.removeSkill'); if(!b) return; const row=b.closest('tr'); row.remove(); skillRows=skillRows.filter((r)=>r!==row); renumber(dom.skillsBody); recalcAll(); });
  dom.talentsBody.addEventListener('click', (e)=>{ const b=e.target.closest('.removeTalent'); if(!b) return; b.closest('tr').remove(); renumber(dom.talentsBody); });
  dom.weaponsBody.addEventListener('click', (e)=>{ const b=e.target.closest('.removeWeapon'); if(!b) return; b.closest('tr').remove(); renumber(dom.weaponsBody); });
  dom.armorBody.addEventListener('click', (e)=>{ const b=e.target.closest('.removeArmor'); if(!b) return; b.closest('tr').remove(); renumber(dom.armorBody); });

  document.getElementById('addSkill').addEventListener('click', ()=>addSkillRow('', 'CUSTOM', 0, 'STR'));
  document.getElementById('addTalent').addEventListener('click', ()=>addTalentRow());
  document.getElementById('addWeapon').addEventListener('click', ()=>addWeaponRow());
  document.getElementById('addArmor').addEventListener('click', ()=>addArmorRow());
  document.getElementById('newCharacter').addEventListener('click', clearForm);
  document.getElementById('saveCharacter').addEventListener('click', saveCurrent);
  document.getElementById('shareCharacter').addEventListener('click', shareCurrent);
  document.getElementById('importCharacter').addEventListener('click', importPrompt);
  document.getElementById('deleteCharacter').addEventListener('click', deleteCurrent);
  dom.savedCharacters.addEventListener('change', (e)=>loadData(allCharacters()[e.target.value]));

  refreshSelect(); tryImportFromUrl(); recalcAll();
}

init();
