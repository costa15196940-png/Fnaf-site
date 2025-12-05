/* ---------------------------
   CONFIG: impostazioni
----------------------------*/
const ADMIN_PW = 'FNAF world-1987'; // password admin

const SUPABASE_URL = 'https://hsmkbjllivejojedoohi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzbWtiamxsaXZlam9qZWRvb2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMDk2OTksImV4cCI6MjA3ODg4NTY5OX0.M0E32pjY0rFV6T1Irt81CfyF8Jie8lB25URU9Sa24PQ';

const supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* --- stato locale --- */
const STORAGE_KEY = 'fnaf_data_v1';
let state = {
  announcements: [], // {id,name,img,text,created_at}
  comments: [],      // {id,created_at,name,commento}
  fanart: [],        // {id,created_at,Nome_autore,immagine_url}
  polls: [],         // local only
  votes: [],         // local only
  info: "Benvenuti nel FNAF WORLD channel! Modifica le info dall'admin."
};

/* --- caricamento da localStorage --- */
try {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) state = {...state, ...JSON.parse(raw)};
} catch(e){ console.warn('storage read err',e) }

/* --- helpers --- */
function saveLocalBackup(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function saveStateLocalAndRender(){ saveLocalBackup(); renderAll(); }
function escapeHtml(s){ return String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

/* ---------- render UI ---------- */
function renderSlider(){
  const slider = document.getElementById('slider');
  slider.innerHTML='';
  if(!state.announcements.length){
    slider.innerHTML = '<div class="slide" style="opacity:1"><div class="caption">Nessun annuncio</div></div>';
    document.getElementById('latestBody').innerText='Nessun annuncio';
    return;
  }
  state.announcements.forEach((a,idx)=>{
    const s = document.createElement('div'); s.className='slide'; if(idx!==0) s.classList.add('hidden');
    s.style.backgroundImage = a.img ? `url(${a.img})` : 'linear-gradient(180deg,#111,#070707)';
    s.innerHTML = `<div class="caption"><strong>${escapeHtml(a.name)}</strong><div style="margin-top:6px">${escapeHtml(a.text)}</div></div>`;
    slider.appendChild(s);
  });
  document.getElementById('latestBody').innerText = state.announcements[0].text || '';
  startSlider();
}

let slideTimer;
function startSlider(){
  clearInterval(slideTimer);
  const slides = Array.from(document.querySelectorAll('.slide'));
  if(slides.length <=1) return;
  let i=0;
  slideTimer = setInterval(()=>{
    slides[i].classList.add('hidden');
    i = (i+1)%slides.length;
    slides[i].classList.remove('hidden');
    document.getElementById('latestBody').innerText = state.announcements[i].text || '';
  }, 4000);
}

function renderComments(){
  const el = document.getElementById('c_list');
  if(!state.comments.length){ el.innerHTML = '<div class="muted small">Nessun commento</div>'; return; }
  el.innerHTML = state.comments.slice().reverse().map(c=>`
    <div style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.02)">
      <strong>${escapeHtml(c.name)}</strong>
      <div class="muted small">${new Date(c.created_at||c.t||Date.now()).toLocaleString()}</div>
      <div>${escapeHtml(c.commento || c.text || '')}</div>
    </div>`).join('');
}

function renderFanart(){
  const g = document.getElementById('fan_grid'); g.innerHTML='';
  if(!state.fanart.length){ g.innerHTML = '<div class="muted small">Nessuna fanart</div>'; return; }
  state.fanart.slice().reverse().forEach(f=>{
    const node = document.createElement('div'); node.className='fan-item';
    node.innerHTML = `<img src="${f.immagine_url || f.dataurl}" alt=""><div style="margin-top:6px;font-size:.9rem">${escapeHtml(f.Nome_autore || f.title)}</div>`;
    g.appendChild(node);
  });
}

function renderPolls(){
  const el = document.getElementById('polls_list');
  if(!state.polls.length){ el.innerHTML = '<div class="muted small">Nessun sondaggio</div>'; return; }
  el.innerHTML = state.polls.map((p,pi)=>{
    const total = p.opts.reduce((s,o)=>s+o.votes,0) || 0;
    const rows = p.opts.map((o,oi)=>{
      const pct = total ? Math.round((o.votes/total)*100) : 0;
      return `<div style="margin-bottom:8px"><div>${escapeHtml(o.text)} <button data-p="${pi}" data-o="${oi}" class="btn" style="float:right;padding:4px 8px">Vota</button></div><div class="bar" style="margin-top:6px"><i style="width:${pct}%"></i></div></div>`;
    }).join('');
    return `<div style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.03)"><strong>${escapeHtml(p.title)}</strong><div style="margin-top:8px">${rows}</div></div>`;
  }).join('');
}

function renderVotes(){
  const el = document.getElementById('votes_list');
  if(!state.votes.length){ el.innerHTML = '<div class="muted small">Nessun voto attivo</div>'; return; }
  el.innerHTML = state.votes.map((v,vi)=>{
    const total = v.counts.reduce((s,n)=>s+n,0) || 0;
    const rows = v.opts.map((o,oi)=>{
      const pct = total ? Math.round((v.counts[oi]/total)*100) : 0;
      return `<div style="margin-bottom:8px"><div>${escapeHtml(o)} <button data-v="${vi}" data-o="${oi}" class="btn" style="float:right;padding:4px 8px">Vota</button><span style="margin-left:6px">${v.counts[oi]} (${pct}%)</span></div><div class="bar" style="margin-top:6px"><i style="width:${pct}%"></i></div></div>`;
    }).join('');
    return `<div style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.03)"><strong>${escapeHtml(v.title)}</strong><div style="margin-top:8px">${rows}</div></div>`;
  }).join('');
}

function renderInfo(){ document.getElementById('info_text').innerHTML = escapeHtml(state.info); }
function renderAll(){ renderSlider(); renderComments(); renderFanart(); renderPolls(); renderVotes(); renderInfo(); }

/* ---------- commenti ---------- */
document.getElementById('c_send').addEventListener('click', async ()=>{
  const n = document.getElementById('c_name').value.trim() || 'Anonimo';
  const t = document.getElementById('c_text').value.trim();
  if(!t) return alert('Scrivi un commento');

  try {
    const { data, error } = await supabase.from('Commenti').insert([{ name: n, commento: t }]).select();
    if(error) throw error;
    state.comments.push(data[0]||{name:n,commento:t,t:Date.now()});
  } catch(err){
    console.warn('Supabase failed, saving local', err);
    state.comments.push({name:n,commento:t,t:Date.now()});
  }

  saveLocalBackup(); renderAll();
  document.getElementById('c_text').value=''; document.getElementById('c_name').value='';
});

/* ---------- fanart ---------- */
document.getElementById('f_add').addEventListener('click', async ()=>{
  const fileInput = document.getElementById('f_file');
  const title = document.getElementById('f_title').value.trim() || 'Anonimo';
  const file = fileInput.files[0];
  if(!file) return alert('Scegli un\'immagine');

  const reader = new FileReader();
  reader.onload = async function(e){
    const dataurl = e.target.result;
    try {
      const { data, error } = await supabase.from('Fanart').insert([{ Nome_autore: title, immagine_url: dataurl }]).select();
      if(error) throw error;
      state.fanart.push(data[0]||{ Nome_autore:title, immagine_url:dataurl,t:Date.now()});
    } catch(err){
      console.warn('Supabase failed, saving local', err);
      state.fanart.push({title, dataurl, t:Date.now()});
    }
    saveLocalBackup(); renderAll();
    fileInput.value=''; document.getElementById('f_title').value='';
  }
  reader.readAsDataURL(file);
});

/* ---------- admin unlock ---------- */
document.addEventListener('DOMContentLoaded', function(){
  document.getElementById('pw_btn').addEventListener('click', function(){
    const v = document.getElementById('pw').value.trim();
    if(v === ADMIN_PW){
      document.getElementById('adminPanel').style.display='block';
      document.querySelector('.admin-login').style.display='none';
      alert('Accesso admin abilitato');
      renderAll();
    } else alert('Password errata');
  });
});

/* ---------- announcements ---------- */
document.getElementById('a_add').addEventListener('click', async ()=>{
  const title = document.getElementById('a_title').value.trim() || 'Annuncio';
  const img = document.getElementById('a_img').value.trim();
  const text = document.getElementById('a_text').value.trim() || '';

  try {
    const { data, error } = await supabase.from('Announcements').insert([{ name: title, text, img }]).select();
    if(error) throw error;
    state.announcements.unshift(data[0]||{ name:title,text,img,t:Date.now()});
  } catch(err){
    console.warn('Supabase failed, saving local', err);
    state.announcements.unshift({ name:title,text,img,t:Date.now()});
  }

  saveLocalBackup(); renderAll();
  document.getElementById('a_title').value=''; document.getElementById('a_img').value=''; document.getElementById('a_text').value='';
});

/* ---------- export/import ---------- */
document.getElementById('export_data').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'fnaf_full_export.json'; document.body.appendChild(a); a.click(); a.remove();
});
document.getElementById('import_data').addEventListener('click', ()=>{ document.getElementById('import_file').click(); });
document.getElementById('import_file').addEventListener('change', function(){
  const f = this.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = function(e){
    try {
      const imported = JSON.parse(e.target.result);
      state = {...state, ...imported}; saveLocalBackup(); alert('Import completato'); renderAll();
    } catch { alert('File non valido'); }
  };
  r.readAsText(f);
});

/* ---------- save info ---------- */
document.getElementById('save_info').addEventListener('click', ()=>{
  state.info = document.getElementById('info_edit').value || '';
  saveLocalBackup(); alert('Info salvate'); renderInfo();
});

/* ---------- polls & votes buttons ---------- */
document.addEventListener('click', (e)=>{
  const pollBtn = e.target.closest('#polls_list .btn');
  if(pollBtn){
    const p = parseInt(pollBtn.dataset.p);
    const o = parseInt(pollBtn.dataset.o);
    if(!isNaN(p) && !isNaN(o) && state.polls[p]){
      state.polls[p].opts[o].votes = (state.polls[p].opts[o].votes||0)+1;
      saveStateLocalAndRender();
      return;
    }
  }

  const voteBtn = e.target.closest('#votes_list .btn');
  if(voteBtn){
    const v = parseInt(voteBtn.dataset.v);
    const o = parseInt(voteBtn.dataset.o);
    if(!isNaN(v) && !isNaN(o) && state.votes[v]){
      state.votes[v].counts[o] = (state.votes[v].counts[o]||0)+1;
      saveStateLocalAndRender();
      return;
    }
  }
});

document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('info_edit').value = state.info;
  renderAll();
});

/* ---------- EMOJI BUTTONS ---------- */
const emojiBar = document.getElementById('emojiBar');
const commentInput = document.getElementById('c_text');

emojiBar.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    commentInput.value += e.target.textContent; // aggiunge l'emoji all'input
    commentInput.focus();
  }
});

/* ---------- SUPABASE REALTIME ---------- */

// Commenti realtime
supabase
  .channel('public:Commenti')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'Commenti' }, payload => {
      if(payload.new) {
          state.comments.push(payload.new);
          renderComments();
      }
  })
  .subscribe();

// Fanart realtime
supabase
  .channel('public:Fanart')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'Fanart' }, payload => {
      if(payload.new) {
          state.fanart.push(payload.new);
          renderFanart();
      }
  })
  .subscribe();

// Annunci realtime
supabase
  .channel('public:Announcements')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'Announcements' }, payload => {
      if(payload.new) {
          state.announcements.unshift(payload.new);
          renderSlider();
      }
  })
  .subscribe();
