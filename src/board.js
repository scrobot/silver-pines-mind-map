(function(){
const D = JSON.parse(document.getElementById('data').textContent);
const byId = new Map(D.nodes.map(n => [n.id, n]));

/* ---------- language ---------- */
const UI = {
  ru: {
    code:'Дело № SP-1993-10 · Silver Pines · Вельвет, Эдди', title:'Дело Эдди Вельвета',
    lede:'Детектива Рэда Уокера наняли найти пропавшего музыканта. Здесь дело целиком: кто есть кто, что случилось до игры и во время неё, три концовки, гипотезы и улики за и против. У каждой улики — место в игре, где её видно.',
    coverage:'Прохождение', endings:'Концовки', cards:'карточек', links:'связей', sections:'Разделы',
    tab_board:'Доска', tab_hyp:'Гипотезы', tab_time:'Хронология', tab_people:'Люди', tab_refs:'Отсылки', tab_open:'Открытые вопросы',
    search_ph:'Найти: Элис, канатка, 10:07, Джекман…', search_aria:'Поиск по доске', fit:'Вся доска', guide:'Как собирали',
    board_aria:'Доска улик: 96 улик на пробке, нити между ними',
    zoom_in:'Приблизить', zoom_out:'Отдалить', guide_aria:'Как собирали дело', step_prev:'Назад', step_next:'Дальше',
    fs_enter:'Во весь экран', fs_exit:'Выйти из полного экрана',
    th_src:'Источник', th_match:'Что совпадает', th_strength:'Сила', th_links:'Ссылки',
    footer:'Всё на доске — из полного прохождения на 100 %: реплики, записки, документы и экраны игры. Цитаты даны по русской локализации; где известна английская строка, она приведена в оригинале. Часть ключевых реплик вычитана по кадрам и приведена дословно, остальные записаны по ходу прохождения и могут расходиться с игрой в отдельных словах. Внешние источники — пресса, обсуждения игроков и интервью разработчиков — помечены ссылкой. Метки у отсылок: РАЗРАБОТЧИКИ — сказано авторами игры, ПРЕССА — замечено критиками, В ИГРЕ — есть в самой игре, ВЕРСИЯ ДОСКИ — прочтение доски без внешнего подтверждения.',
    g_for:'За эту гипотезу', g_against:'Против', g_supports:'Подтверждает', g_contradicts:'Опровергает', g_next:'Дальше по времени', g_prev:'Раньше по времени',
    g_refs:'Отсылки', g_motifs:'Мотивы', g_about:'Связано', g_qa:'Вопросы и ответы',
    how:'Как пользоваться', click:'Возьми улику с доски',
    how_p:'Доска двигается мышью, колесо приближает. Возьми любую улику: справа откроется досье, а на пробке останутся только её нити. Красная нить — сквозная линия дела, серая — связь послабее. Кнопка «Как собирали» проходит дело с начала, улика за уликой.',
    no_card:'Эту улику доска показывает, но отдельной карточки в деле у неё нет.',
    strongest:'Сильнейшие версии', strength:(n) => `сила: ${n} из 3`,
    l_red:'сквозная линия', l_graphite:'связь', l_pin:'улика на доске', l_off:'карточка без улики на доске',
    hold:{devs:'разработчики', press:'пресса', players:'игроки', board:'версия доски'},
    for:'За', against:'Против', refs_colon:'Отсылки', show:'Показать на доске',
    before:'До игры', before_p:'Порядок восстановлен по запискам и допросу. Игра его намеренно размывает.',
    ingame:'В игре', ingame_p:'Сюжетный стержень — колокола для канатки на гору.',
    clues_versions:'Улики и версии', dig:'Где копать'
  },
  en: {
    code:'Case No. SP-1993-10 · Silver Pines · Velvet, Eddie', title:'The Eddie Velvet Case',
    lede:'Detective Red Walker is hired to find a missing musician. The whole case file is here: who is who, what happened before and during the game, the three endings, the hypotheses, and the clues for and against each one. Every clue names the place in the game where you can see it.',
    coverage:'Playthrough', endings:'Endings', cards:'cards', links:'links', sections:'Sections',
    tab_board:'Board', tab_hyp:'Hypotheses', tab_time:'Timeline', tab_people:'People', tab_refs:'References', tab_open:'Open questions',
    search_ph:'Search: Alice, cable car, 10:07, Jackman…', search_aria:'Search the board', fit:'Whole board', guide:'How it was built',
    board_aria:'Evidence board: 96 clues pinned to cork, threads between them',
    zoom_in:'Zoom in', zoom_out:'Zoom out', guide_aria:'How the case was built', step_prev:'Back', step_next:'Next',
    fs_enter:'Full screen', fs_exit:'Leave full screen',
    th_src:'Source', th_match:'What matches', th_strength:'Strength', th_links:'Links',
    footer:'Everything on this board comes from a full 100% playthrough: dialogue, notes, documents and in-game screens. Quotes follow the Russian localization; where the English line is known, it is given as written. Some key lines were read off the frames and are quoted verbatim, the rest were taken down during play and may differ from the game in individual words. Outside sources — press, player discussion and developer interviews — carry a link. Reference tags: DEVELOPERS — stated by the game\'s authors, PRESS — noted by critics, IN GAME — present in the game itself, BOARD — this board\'s own reading, with no outside confirmation.',
    g_for:'For this hypothesis', g_against:'Against', g_supports:'Supports', g_contradicts:'Contradicts', g_next:'Next in time', g_prev:'Earlier in time',
    g_refs:'References', g_motifs:'Motifs', g_about:'Connected', g_qa:'Questions and answers',
    how:'How to use', click:'Take a clue off the board',
    how_p:'Drag the board to move it, scroll to zoom. Take any clue: its dossier opens on the right and the cork keeps only its threads. A red thread is a through-line of the case, a grey one a looser link. “How it was built” walks the case from the beginning, one clue at a time.',
    no_card:'The board shows this clue, but the case file has no separate card for it.',
    strongest:'Strongest versions', strength:(n) => `strength: ${n} of 3`,
    l_red:'through-line', l_graphite:'link', l_pin:'pinned to the board', l_off:'card with nothing pinned',
    hold:{devs:'developers', press:'press', players:'players', board:'board'},
    for:'For', against:'Against', refs_colon:'References', show:'Show on the board',
    before:'Before the game', before_p:'The order is pieced together from notes and the interrogation. The game blurs it on purpose.',
    ingame:'In the game', ingame_p:'The spine of the plot: the bells for the cable car up the mountain.',
    clues_versions:'Clues and versions', dig:'Where to dig'
  }
};
const TYPES = {
  q:{ru:'Главный вопрос', en:'Main question', tok:'--red'},
  hyp:{ru:'Гипотезы', one:'Гипотеза', en:'Hypotheses', en1:'Hypothesis', tok:'--red'},
  clue:{ru:'Улики', one:'Улика', en:'Clues', en1:'Clue', tok:'--amber'},
  char:{ru:'Люди', one:'Персонаж', en:'People', en1:'Character', tok:'--ink'},
  ending:{ru:'Концовки', one:'Концовка', en:'Endings', en1:'Ending', tok:'--red'},
  event:{ru:'События', one:'Событие', en:'Events', en1:'Event', tok:'--steel'},
  place:{ru:'Места', one:'Место', en:'Places', en1:'Place', tok:'--sage'},
  ref:{ru:'Отсылки', one:'Отсылка', en:'References', en1:'Reference', tok:'--violet'},
  motif:{ru:'Мотивы', one:'Мотив', en:'Motifs', en1:'Motif', tok:'--moss'},
  open:{ru:'Вопросы', one:'Открытый вопрос', en:'Questions', en1:'Open question', tok:'--amber'}
};
const store = { get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }, set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} } };
const hash0 = (location.hash||'').slice(1);
let LANG = (hash0==='en'||hash0==='ru') ? hash0 : (store.get('sp-lang') || ((navigator.language||'').toLowerCase().startsWith('ru') ? 'ru' : 'en'));
if(LANG!=='ru' && LANG!=='en') LANG = 'ru';
const HAS_EN = D.nodes.some(n => n.en);
if(!HAS_EN){ LANG = 'ru'; const sw = document.querySelector('.lang'); if(sw) sw.hidden = true; }
const EN = () => LANG === 'en';
const u = k => UI[LANG][k];
const L = n => (EN() && n.en && n.en.label) || n.label;
const TX = n => (EN() && n.en && typeof n.en.text === 'string') ? n.en.text : (n.text || '');
const AKA = n => (EN() && n.en && n.en.aka) || n.aka;
const TAG = n => (EN() && n.en && n.en.tag) || n.tag;
const NOTE = e => (EN() && e.note_en) || e.note || '';
const ST = (n, i) => { const t = n.src[i].t; if(!EN()) return t; return (n.en && n.en.src && n.en.src[i]) || t; };
/* Who holds a hypothesis: four fixed keys in the data, labelled per language here.
   No tier is anybody's name — "board" is this board's own reading. */
const HOLD = h => (UI[LANG].hold && UI[LANG].hold[h]) || (((D.meta||{}).holders_en||{})[h] || h);
const TN = (t, one) => EN() ? (one ? (TYPES[t].en1||TYPES[t].en) : TYPES[t].en) : (one ? (TYPES[t].one||TYPES[t].ru) : TYPES[t].ru);

const css = () => getComputedStyle(document.documentElement);
const col = t => css().getPropertyValue(t).trim();
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const counts = {}; D.nodes.forEach(n => counts[n.type] = (counts[n.type]||0)+1);
function updateStat(){ document.getElementById('stat').innerHTML = `<b>${D.nodes.length}</b> ${u('cards')} · <b>${D.edges.length}</b> ${u('links')}`; }
['hyp','people','refs','open'].forEach(k => {
  const m = {hyp:'hyp', people:'char', refs:'ref', open:'open'}[k];
  document.getElementById('n-'+k).textContent = counts[m];
});
const rels = id => D.edges.filter(e => e.source === id || e.target === id).map(e => ({e, other: byId.get(e.source === id ? e.target : e.source), out: e.source === id}));
const SRCA = (s, label, arrow) => s.u ? `<a href="${esc(s.u)}" target="_blank" rel="noopener">${esc(label)}${arrow ? ' ↗' : ''}</a>` : `<span class="nolink">${esc(label)}</span>`;
function srcHTML(n){ return n.src.length ? `<div class="srcs">${n.src.map((s,i) => SRCA(s, ST(n,i), true)).join('')}</div>` : ''; }
function meter(n){ return `<span class="meter" title="${esc(u('strength')(n))}">${[1,2,3].map(i => `<b class="${i<=n?'on':''}"></b>`).join('')}</span>`; }
function holders(h){ return `<span class="holders">${(h||[]).map(x => `<span class="tag h-${esc(x)}">${esc(HOLD(x))}</span>`).join('')}</span>`; }

/* ---------- dossier panel ---------- */
const dossier = document.getElementById('dossier');
let shown = null;
function showNode(id){
  const n = byId.get(id); if(!n){ shown = null; dossier.innerHTML = defaultDossier(); return; }
  shown = id;
  const r = rels(id);
  const group = (title, filter) => {
    const list = r.filter(filter); if(!list.length) return '';
    return `<div class="rel"><h3>${title}</h3><ul>${list.map(x => `<li><button type="button" data-go="${x.other.id}"><span class="dot" style="background:${col(TYPES[x.other.type].tok)}"></span><span><span class="t">${esc(L(x.other))}</span>${NOTE(x.e)?`<span class="note">${esc(NOTE(x.e))}</span>`:''}</span></button></li>`).join('')}</ul></div>`;
  };
  let extra = '';
  if(n.type==='hyp') extra = `<div class="kind">${meter(n.strength)} ${holders(n.holders)}</div>`;
  if(n.type==='ref' && n.tag) extra = `<div><span class="tag">${esc(TAG(n))}</span></div>`;
  dossier.innerHTML = `
    <div class="kind"><span class="dot" style="background:${col(TYPES[n.type].tok)}"></span>${esc(TN(n.type, true))}</div>
    <h2>${esc(L(n))}</h2>${extra}
    ${AKA(n)?`<div class="kind">${esc(AKA(n))}</div>`:''}
    ${TX(n)?`<p>${esc(TX(n))}</p>`:''}
    ${srcHTML(n)}
    ${group(u('g_for'), x => x.e.kind==='supports' && !x.out)}
    ${group(u('g_against'), x => x.e.kind==='contradicts' && !x.out)}
    ${group(u('g_supports'), x => x.e.kind==='supports' && x.out)}
    ${group(u('g_contradicts'), x => x.e.kind==='contradicts' && x.out)}
    ${group(u('g_next'), x => x.e.kind==='leads' && x.out)}
    ${group(u('g_prev'), x => x.e.kind==='leads' && !x.out)}
    ${group(u('g_refs'), x => x.e.kind==='echoes')}
    ${group(u('g_motifs'), x => x.e.kind==='motif')}
    ${group(u('g_about'), x => x.e.kind==='about')}
    ${group(u('g_qa'), x => x.e.kind==='asks' || x.e.kind==='answers')}`;
}
function defaultDossier(){
  const top = D.nodes.filter(n => n.type==='hyp').sort((a,b) => b.strength-a.strength).slice(0,5);
  return `<div class="kind">${u('how')}</div><h2>${u('click')}</h2>
  <p>${u('how_p')}</p>
  <div class="rel"><h3>${u('strongest')}</h3><ul>${top.map(h => `<li><button type="button" data-go="${h.id}"><span class="dot" style="background:${col('--red')}"></span><span><span class="t">${esc(L(h))}</span><span class="note">${h.holders.map(HOLD).map(esc).join(', ')}</span></span></button></li>`).join('')}</ul></div>`;
}
dossier.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if(b) focusNode(b.dataset.go); });

/* ---------- the cork board ----------
   cork.js owns the board itself (data/board.json: where each clue hangs, how it is
   pinned, which threads run between the pins). This part joins it to the case file:
   a clue on the cork opens the matching dossier, and a card in any list walks back
   to its clue on the cork. The join is many-to-one — four cards can argue the same
   hypothesis — so the ELEMENT id is the key and the node id is a pointer. */
const CORK = () => window.Cork || null;

function setHash(h){ try{ history.replaceState(null,'', h ? '#'+h : location.pathname + location.search); }catch(e){} }

function clearFocus(){
  shown = null;
  dossier.innerHTML = defaultDossier();
  setHash('');
  const c = CORK(); if(c) c.clear();
}

/* Open a card. Called from the lists, the dossier's own links, and the board. */
function focusNode(id, fromBoard){
  showNode(id);
  setHash('n-'+id);
  if(tab !== 'board') selectTab('board');
  const c = CORK();
  if(c && !fromBoard){
    const els = c.elementsForNode(id);
    if(els.length) c.open(els[0]);
    else c.clear();            /* a card with nothing pinned: dossier only, board at rest */
  }
}

/* cork.js calls back into these */
window.Board = {
  showElement(elId, nodeId){
    if(nodeId && byId.has(nodeId)) { showNode(nodeId); setHash('n-'+nodeId); }
    else { dossier.innerHTML = noDossier(elId); }
  },
  clearElement(){ shown = null; dossier.innerHTML = defaultDossier(); setHash(''); },
  guideProgress(i, n, beat){
    const bar = document.getElementById('gBar'), lab = document.getElementById('gLab');
    if(bar) bar.style.width = (n ? i/n*100 : 0) + '%';
    if(lab) lab.textContent = i + ' / ' + n;
  }
};

/* Nineteen of the ninety-six clues are pieces of the film that no card in the case file
   stands behind — a hand-written aside, a chapter plate. Say so plainly rather than
   opening an empty dossier. */
function noDossier(elId){
  return `<div class="kind">${esc(u('l_pin'))}</div><h2>${esc(elId)}</h2><p>${esc(u('no_card'))}</p>`;
}

function renderLegend(){
  document.getElementById('legend').innerHTML = [
    ['#A8170F','l_red','solid'], ['#6d665e','l_graphite','solid']
  ].map(([c,l,st]) => `<span><i style="border-top:2px ${st} ${c}"></i>${esc(u(l))}</span>`).join('');
}

/* search: light up every clue on the cork whose card matches */
document.getElementById('q').addEventListener('input', e => {
  const v = e.target.value.trim().toLowerCase();
  const c = CORK(); if(!c) return;
  if(!v){ c.find([]); return; }
  const hits = D.nodes.filter(n => [n.label, n.text, n.en && n.en.label, n.en && n.en.text,
    ...n.src.map(s => s.t)].filter(Boolean).join(' ').toLowerCase().includes(v)).map(n => n.id);
  c.find(hits);
});

document.getElementById('fitBtn').addEventListener('click', () => { clearFocus(); const c = CORK(); if(c) c.fit(); });

const guideBtn = document.getElementById('guideBtn');
guideBtn.addEventListener('click', () => {
  const c = CORK(); if(!c) return;
  const on = guideBtn.getAttribute('aria-pressed') !== 'true';
  guideBtn.setAttribute('aria-pressed', String(on));
  c.guide(on);
});
document.getElementById('gNext').addEventListener('click', () => { const c = CORK(); if(c) c.guideStep(1); });
document.getElementById('gPrev').addEventListener('click', () => { const c = CORK(); if(c) c.guideStep(-1); });
document.getElementById('corkZoomIn').addEventListener('click', () => { const c = CORK(); if(c) c.zoom(1.4); });
document.getElementById('corkZoomOut').addEventListener('click', () => { const c = CORK(); if(c) c.zoom(1/1.4); });

/* ---------- the whole screen ----------
   In the page the board is one panel among several and has to share the height.
   Expanding pins the panel — board and dossier together, so a clue still opens
   beside it — over the viewport, and where the Fullscreen API exists we also ask
   for real fullscreen so the browser's chrome goes too. iOS Safari has no element
   fullscreen; there the pinned layer alone does the job. */
const boardPanel = document.querySelector('#p-board .board');
const fsBtn = document.getElementById('corkFs');
const rawFs = boardPanel.requestFullscreen || boardPanel.webkitRequestFullscreen;
const rawExit = document.exitFullscreen || document.webkitExitFullscreen;
const nativeFs = () => document.fullscreenElement || document.webkitFullscreenElement;
const isExpanded = () => boardPanel.classList.contains('expanded');

function setExpanded(on){
  boardPanel.classList.toggle('expanded', on);
  document.body.classList.toggle('cork-expanded', on);
  fsBtn.setAttribute('aria-pressed', String(on));
  fsBtn.setAttribute('aria-label', u(on ? 'fs_exit' : 'fs_enter'));
  fsBtn.dataset.i18nAria = on ? 'fs_exit' : 'fs_enter';
  fsBtn.textContent = on ? '⤡' : '⤢';
}
fsBtn.addEventListener('click', () => {
  const on = !isExpanded();
  setExpanded(on);
  if(!rawFs) return;                       // pinned layer only; still full-viewport
  if(on) { const r = rawFs.call(boardPanel); if(r && r.catch) r.catch(() => {}); }
  else if(nativeFs() && rawExit) rawExit.call(document);
});
/* leaving fullscreen by Escape or the browser's own control must unpin the panel */
['fullscreenchange','webkitfullscreenchange'].forEach(ev =>
  document.addEventListener(ev, () => { if(!nativeFs() && isExpanded()) setExpanded(false); }));
/* and Escape has to work when we never got native fullscreen in the first place */
document.addEventListener('keydown', e => {
  if(e.key === 'Escape' && isExpanded() && !nativeFs()) setExpanded(false);
});

/* ---------- lists ---------- */
function evBtn(n, note){ return `<button type="button" class="ev" data-go="${n.id}">${esc(L(n))}${note?` — <span style="color:var(--muted)">${esc(note)}</span>`:''}${n.src.length?`<small>${esc(ST(n,0))}</small>`:''}</button>`; }
function renderHyp(){
  const H = D.nodes.filter(n => n.type==='hyp').sort((a,b) => b.strength - a.strength);
  document.getElementById('hypGrid').innerHTML = H.map(h => {
    const r = rels(h.id);
    const pro = r.filter(x => x.e.kind==='supports' && !x.out), con = r.filter(x => x.e.kind==='contradicts' && !x.out);
    const refs = r.filter(x => x.e.kind==='echoes').map(x => L(x.other));
    return `<article class="card"><div class="top"><h3>${esc(L(h))}</h3>${meter(h.strength)}</div>${holders(h.holders)}<p>${esc(TX(h))}</p>
      <div class="pro"><h4>${u('for')} · ${pro.length}</h4>${pro.map(x => evBtn(x.other, NOTE(x.e))).join('') || '<span class="empty">—</span>'}</div>
      ${con.length?`<div class="contra"><h4>${u('against')} · ${con.length}</h4>${con.map(x => evBtn(x.other, NOTE(x.e))).join('')}</div>`:''}
      ${refs.length?`<div class="kind">${u('refs_colon')}: ${refs.map(esc).join(', ')}</div>`:''}
      <div><button type="button" class="btn" data-go="${h.id}">${u('show')}</button></div></article>`;
  }).join('');
}
function renderTime(){
  const ev = D.nodes.filter(n => n.type==='event'), end = D.nodes.filter(n => n.type==='ending');
  const li = (n, cls='') => `<li class="${cls}"><button type="button" class="ev" data-go="${n.id}" style="border:0;padding:0"><span class="t">${esc(L(n))}</span></button><div class="x">${esc(TX(n))}</div><div class="s">${n.src.map((s,i) => SRCA(s, ST(n,i), false)).join('')}</div></li>`;
  const col1 = ev.filter(n => n.era==='before').sort((a,b)=>a.order-b.order), col2 = ev.filter(n => n.era==='game').sort((a,b)=>a.order-b.order);
  document.getElementById('timeline').innerHTML = `
    <div class="col"><h2>${u('before')}</h2><p class="x" style="color:var(--muted);margin:0 0 10px">${u('before_p')}</p><ul class="tl">${col1.map(n=>li(n)).join('')}</ul></div>
    <div class="col"><h2>${u('ingame')}</h2><p class="x" style="color:var(--muted);margin:0 0 10px">${u('ingame_p')}</p><ul class="tl">${col2.map(n=>li(n)).join('')}${end.map(n=>li(n,'end')).join('')}</ul></div>`;
}
function renderPeople(){
  const C = D.nodes.filter(n => n.type==='char');
  document.getElementById('peopleGrid').innerHTML = C.map(c => {
    const r = rels(c.id).filter(x => x.other.type==='clue' || x.other.type==='hyp' || x.other.type==='ref');
    return `<article class="card"><div class="top"><h3>${esc(L(c))}</h3></div>${AKA(c)?`<div class="kind">${esc(AKA(c))}</div>`:''}<p>${esc(TX(c))}</p>${srcHTML(c)}
      ${r.length?`<div class="pro"><h4 style="color:var(--muted)">${u('clues_versions')}</h4>${r.map(x => evBtn(x.other)).join('')}</div>`:''}</article>`;
  }).join('');
}
function renderRefs(){
  const R = D.nodes.filter(n => n.type==='ref');
  /* strongest claim first: what the developers said, then the press, then what is
     simply in the game, then the board's own reading */
  const rank = t => /РАЗРАБОТЧИКИ|DEVELOPERS/.test(t) ? 0 : /ПРЕССА|PRESS/.test(t) ? 1 : /В ИГРЕ|IN GAME/.test(t) ? 2 : 3;
  R.sort((a,b) => rank(a.tag)-rank(b.tag));
  document.getElementById('refRows').innerHTML = R.map(r => `<tr><td class="r"><button type="button" class="ev" data-go="${r.id}" style="border:0;padding:0">${esc(L(r))}</button></td><td>${esc(TX(r))}</td><td><span class="tag">${esc(TAG(r))}</span></td><td><div class="srcs">${r.src.map((s,i) => SRCA(s, ST(r,i), true)).join('')}</div></td></tr>`).join('');
}
function renderOpen(){
  const Q = D.nodes.filter(n => n.type==='open');
  document.getElementById('openList').innerHTML = Q.map(q => {
    const r = rels(q.id).filter(x => x.other.id !== 'Q');
    return `<article class="card"><h3>${esc(L(q))}</h3><p>${esc(TX(q))}</p>${r.length?`<div class="pro"><h4 style="color:var(--muted)">${u('dig')}</h4>${r.map(x => evBtn(x.other)).join('')}</div>`:''}</article>`;
  }).join('');
}
document.querySelectorAll('section[role="tabpanel"]').forEach(s => s.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if(b && !b.closest('#dossier')) focusNode(b.dataset.go); }));

/* ---------- tabs ---------- */
let tab = 'board';
const TABS = ['board','hyp','time','people','refs','open'];
function selectTab(t){
  tab = t;
  TABS.forEach(k => { document.getElementById('t-'+k).setAttribute('aria-selected', String(k===t)); document.getElementById('p-'+k).hidden = k!==t; });
  store.set('sp-tab', t);
}
document.querySelector('nav.tabs').addEventListener('click', e => { const b = e.target.closest('[role="tab"]'); if(b){ selectTab(b.id.slice(2)); if(b.id!=='t-board') setHash(b.id.slice(2)); } });

/* ---------- static text + language switch ---------- */
function applyStatic(){
  document.documentElement.lang = LANG;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = u(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => el.setAttribute('placeholder', u(el.dataset.i18nPh)));
  document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', u(el.dataset.i18nAria)));
  document.querySelectorAll('.lang [data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === LANG)));
  document.title = u('title');
  updateStat();
}
function setLang(l){
  if(l === LANG) return;
  LANG = l; store.set('sp-lang', l);
  applyStatic(); renderLegend(); renderHyp(); renderTime(); renderPeople(); renderRefs(); renderOpen();
  const c = CORK(); if(c) c.setLang(l);
  if(shown) showNode(shown); else dossier.innerHTML = defaultDossier();
}
document.querySelector('.lang').addEventListener('click', e => { const b = e.target.closest('[data-lang]'); if(b) setLang(b.dataset.lang); });

/* theme follow: the dossier dots read their colours from CSS variables at render time */
function restyle(){ renderLegend(); if(shown) showNode(shown); }
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', restyle);
new MutationObserver(restyle).observe(document.documentElement, {attributes:true, attributeFilter:['data-theme']});

/* boot */
applyStatic();
renderLegend(); renderHyp(); renderTime(); renderPeople(); renderRefs(); renderOpen();
dossier.innerHTML = defaultDossier();
const h = hash0;
let start = store.get('sp-tab') || 'board';
if(TABS.includes(h)) start = h;
selectTab(TABS.includes(start) ? start : 'board');
if(h.startsWith('n-') && byId.has(h.slice(2))) focusNode(h.slice(2));
})();
