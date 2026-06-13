const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Rewrite handleAuth
const oldAuth = html.substring(html.indexOf('async function handleAuth() {'), html.indexOf('function showAuthMsg'));
const newAuth = `async function handleAuth() {
  const username = document.getElementById('auth-username').value.trim().toLowerCase();
  const pass  = document.getElementById('auth-password').value.trim();
  if (!username || !pass) { showAuthMsg('Completa todos los campos', 'error'); return; }

  const btn = document.getElementById('auth-btn');
  btn.disabled = true; btn.textContent = '...';

  if (!navigator.onLine) {
    // Modo Offline
    startSession({ id: username, username: username, pin: pass });
    return;
  }

  try {
    if (authMode === 'login') {
      const { data, error } = await db.from('custom_users').select('*').eq('username', username).eq('pin', pass).maybeSingle();
      if (error || !data) { showAuthMsg('Apodo o PIN incorrectos', 'error'); btn.disabled=false; btn.textContent='Entrar'; return; }
      startSession(data);
    } else {
      const { data: exist } = await db.from('custom_users').select('id').eq('username', username).maybeSingle();
      if (exist) { showAuthMsg('Ese apodo ya está en uso', 'error'); btn.disabled=false; btn.textContent='Crear cuenta'; return; }
      const { data, error } = await db.from('custom_users').insert([{ username: username, pin: pass }]).select().single();
      if (error) throw error;
      showAuthMsg('✅ ¡Cuenta creada! Puedes entrar ahora.', 'ok');
      authMode = 'login';
      document.getElementById('tab-login').classList.add('active');
      document.getElementById('tab-register').classList.remove('active');
      document.getElementById('auth-btn').textContent = 'Entrar';
      btn.disabled = false;
    }
  } catch (err) {
    showAuthMsg('Sesión iniciada (Modo Offline)', 'ok');
    startSession({ id: username, username: username, pin: pass });
  }
}

let syncQueue = JSON.parse(localStorage.getItem('mundial26_sync')||'[]');
function pushToSync(type, payload) {
  syncQueue.push({ type, payload, time: Date.now() });
  localStorage.setItem('mundial26_sync', JSON.stringify(syncQueue));
  attemptSync();
}

async function attemptSync() {
  if (!navigator.onLine || syncQueue.length === 0) return;
  const q = [...syncQueue];
  syncQueue = [];
  localStorage.setItem('mundial26_sync', JSON.stringify(syncQueue));
  
  for(let item of q) {
    try {
      if (item.type === 'result') {
        const { match_id } = item.payload;
        const exist = await db.from('user_results').select('id').eq('user_id', currentUser.id).eq('match_id', match_id).maybeSingle();
        if (exist.data) await db.from('user_results').update(item.payload).eq('user_id', currentUser.id).eq('match_id', match_id);
        else await db.from('user_results').insert([item.payload]);
      } else if (item.type === 'elim') {
        const { match_id } = item.payload;
        const exist = await db.from('user_elim_teams').select('id').eq('user_id', currentUser.id).eq('match_id', match_id).maybeSingle();
        if (exist.data) await db.from('user_elim_teams').update(item.payload).eq('user_id', currentUser.id).eq('match_id', match_id);
        else await db.from('user_elim_teams').insert([item.payload]);
      } else if (item.type === 'goals') {
        await db.from('user_goals').delete().eq('user_id', currentUser.id).eq('match_id', item.payload.match_id);
        if (item.payload.goals.length > 0) await db.from('user_goals').insert(item.payload.goals);
      } else if (item.type === 'champion') {
        const exist = await db.from('user_predictions').select('id').eq('user_id', currentUser.id).maybeSingle();
        if (exist.data) await db.from('user_predictions').update(item.payload).eq('user_id', currentUser.id);
        else await db.from('user_predictions').insert([item.payload]);
      }
    } catch(e) {
      syncQueue.push(item); // Falló, regresa a la cola
    }
  }
  localStorage.setItem('mundial26_sync', JSON.stringify(syncQueue));
}
window.addEventListener('online', attemptSync);

`;
html = html.replace(oldAuth, newAuth);


// 2. Rewrite loadAll
const oldLoadAll = html.substring(html.indexOf('async function loadAll() {'), html.indexOf('// ══════════════════════════════════════════\n//  NAVEGACIÓN'));
const newLoadAll = `async function loadAll() {
  // Carga local primero (instantánea)
  userResults = JSON.parse(localStorage.getItem('m26_results_'+currentUser.id) || '{}');
  userGoals = JSON.parse(localStorage.getItem('m26_goals_'+currentUser.id) || '{}');
  userElim = JSON.parse(localStorage.getItem('m26_elim_'+currentUser.id) || '{}');
  userChampion = localStorage.getItem('m26_champ_'+currentUser.id) || null;

  const customSchedules = JSON.parse(localStorage.getItem('mundial26_schedules')||'{}');
  allMatches.forEach(m => {
    if(customSchedules[m.id]) {
      m.date = customSchedules[m.id].date;
      m.time = customSchedules[m.id].time;
    }
  });

  // Si hay internet, actualizamos en segundo plano
  if (navigator.onLine) {
    try {
      const { data: results } = await db.from('user_results').select('*').eq('user_id', currentUser.id);
      if(results) {
        results.forEach(r => userResults[r.match_id] = r);
        localStorage.setItem('m26_results_'+currentUser.id, JSON.stringify(userResults));
      }

      const { data: goals } = await db.from('user_goals').select('*').eq('user_id', currentUser.id);
      if(goals) {
        userGoals = {};
        goals.forEach(g => {
          if (!userGoals[g.match_id]) userGoals[g.match_id] = [];
          userGoals[g.match_id].push(g);
        });
        localStorage.setItem('m26_goals_'+currentUser.id, JSON.stringify(userGoals));
      }

      const { data: elim } = await db.from('user_elim_teams').select('*').eq('user_id', currentUser.id);
      if(elim) {
        elim.forEach(e => userElim[e.match_id] = e);
        localStorage.setItem('m26_elim_'+currentUser.id, JSON.stringify(userElim));
      }

      const { data: pred } = await db.from('user_predictions').select('*').eq('user_id', currentUser.id).maybeSingle();
      if(pred) {
        userChampion = pred.champion;
        localStorage.setItem('m26_champ_'+currentUser.id, userChampion);
      }
      
      attemptSync(); // Intenta enviar los que estaban offline
      renderAll();
    } catch(e) { console.log('Offline mode active'); }
  }
}

`;
html = html.replace(oldLoadAll, newLoadAll);

// 3. Rewrite saveResult
const oldSaveResult = html.substring(html.indexOf('async function saveResult(matchId, isElim=false) {'), html.indexOf('// ══════════════════════════════════════════\n//  TABLA DE POSICIONES'));
const newSaveResult = `async function saveResult(matchId, isElim=false) {
  const hs = parseInt(document.getElementById(\`edit-hs-\${matchId}\`)?.value);
  const as = parseInt(document.getElementById(\`edit-as-\${matchId}\`)?.value);
  
  const newDate = document.getElementById(\`edit-date-\${matchId}\`)?.value;
  const newTime = document.getElementById(\`edit-time-\${matchId}\`)?.value;
  if(newDate && newTime) {
    let customSchedules = JSON.parse(localStorage.getItem('mundial26_schedules')||'{}');
    customSchedules[matchId] = {date: newDate, time: newTime};
    localStorage.setItem('mundial26_schedules', JSON.stringify(customSchedules));
    const matchObj = allMatches.find(x=>x.id===matchId);
    if(matchObj) { matchObj.date = newDate; matchObj.time = newTime; }
  }

  if (isNaN(hs)||isNaN(as)||hs<0||as<0) { 
    if(newDate && newTime) { cancelEdit(); return; }
    alert('Ingresa un marcador válido'); return; 
  }

  const hpEl = document.getElementById(\`edit-hp-\${matchId}\`);
  const apEl = document.getElementById(\`edit-ap-\${matchId}\`);
  const hp = hpEl?.value!==''&&hpEl?.value!=null ? parseInt(hpEl.value) : null;
  const ap = apEl?.value!==''&&apEl?.value!=null ? parseInt(apEl.value) : null;

  const resultPayload = { user_id: currentUser.id, match_id: matchId, home_score: hs, away_score: as, home_pen: hp, away_pen: ap, updated_at: new Date().toISOString() };
  
  userResults[matchId] = resultPayload;
  localStorage.setItem('m26_results_'+currentUser.id, JSON.stringify(userResults));
  pushToSync('result', resultPayload);

  if (isElim) {
    const homeEl = document.getElementById(\`elim-home-\${matchId}\`);
    const awayEl = document.getElementById(\`elim-away-\${matchId}\`);
    if (homeEl && awayEl && homeEl.value && awayEl.value) {
      const elimPayload = { user_id: currentUser.id, match_id: matchId, home_team: homeEl.value.trim(), away_team: awayEl.value.trim(), updated_at: new Date().toISOString() };
      userElim[matchId] = elimPayload;
      localStorage.setItem('m26_elim_'+currentUser.id, JSON.stringify(userElim));
      pushToSync('elim', elimPayload);
    }
  }

  const goalsPayload = editGoalsDraft.map(g => ({ user_id: currentUser.id, match_id: matchId, team: g.team, player_name: g.player_name, goals_count: g.goals_count }));
  userGoals[matchId] = goalsPayload;
  localStorage.setItem('m26_goals_'+currentUser.id, JSON.stringify(userGoals));
  pushToSync('goals', { match_id: matchId, goals: goalsPayload });

  editingMatchId = null;
  editGoalsDraft = [];
  renderAll();
}

`;
html = html.replace(oldSaveResult, newSaveResult);

// 4. Rewrite saveChampion
const oldSaveChampion = html.substring(html.indexOf('async function saveChampion(team) {'), html.indexOf('let deferredPrompt;'));
const newSaveChampion = `async function saveChampion(team) {
  userChampion = team;
  isChoosingChampion = false;
  localStorage.setItem('m26_champ_'+currentUser.id, team);
  pushToSync('champion', { user_id: currentUser.id, champion: team });
  renderCampeon();
}

`;
html = html.replace(oldSaveChampion, newSaveChampion);

fs.writeFileSync('index.html', html);
console.log('Refactor complete!');
