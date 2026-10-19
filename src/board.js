(function(){
const D = JSON.parse(document.getElementById('data').textContent);
const byId = new Map(D.nodes.map(n => [n.id, n]));

/* ---------- language ---------- */
const UI = {
  ru: {
    code:'Дело № SP-1993-10 · Silver Pines · Вельвет, Эдди', title:'Дело Эдди Вельвета',
    lede:'Детектива Рэда Уокера наняли найти пропавшего музыканта. Здесь всё, что удалось собрать: кто есть кто, что случилось до игры и во время неё, три концовки, гипотезы и улики за и против. Таймкоды ведут прямо в записи стримов.',
    streams:'Стримы', research:'Ресерч', cards:'карточек', links:'связей', sections:'Разделы',
    tab_board:'Доска', tab_hyp:'Гипотезы', tab_time:'Хронология', tab_people:'Люди', tab_refs:'Отсылки', tab_open:'Открытые вопросы',
    search_ph:'Найти: Элис, канатка, 10:07, Джекман…', search_aria:'Поиск по доске', force:'Разложить по силам', zones:'Разложить по зонам', fit:'Вся доска',
    graph_aria:'Граф: гипотезы, улики, персонажи, события и отсылки',
    fail:'Граф не загрузился. Списки во вкладках «Гипотезы», «Хронология», «Люди» и «Отсылки» работают без него.',
    th_src:'Источник', th_match:'Что совпадает', th_strength:'Сила', th_links:'Ссылки',
    footer:'Источники: расшифровки трёх стримов автора (автосубтитры YouTube, имена в них могли исказиться) и ресерч 19.10.2026 по Steam, YouTube-разборам, прессе и интервью разработчиков. Ключевые реплики сверены по кадрам записи экрана. Метки силы у отсылок: ОФИЦИАЛЬНО — сказали разработчики, ПРЕССА — заметили критики, ГИПОТЕЗА — наша догадка без внешнего источника.',
    g_for:'За эту гипотезу', g_against:'Против', g_supports:'Подтверждает', g_contradicts:'Опровергает', g_next:'Дальше по времени', g_prev:'Раньше по времени',
    g_refs:'Отсылки', g_motifs:'Мотивы', g_about:'Связано', g_qa:'Вопросы и ответы',
    how:'Как пользоваться', click:'Нажми на карточку',
    how_p:'Красное — гипотезы, жёлтое — улики, светлое — люди. Нажми на любую карточку: откроется досье, а на доске останутся только её связи. Зелёная нить — улика за, красный пунктир — против.',
    strongest:'Сильнейшие версии', strength:(n) => `сила: ${n} из 3`,
    l_for:'улика за', l_against:'улика против', l_ref:'отсылка', l_order:'порядок событий', l_about:'связано',
    for:'За', against:'Против', refs_colon:'Отсылки', show:'Показать на доске',
    before:'До игры', before_p:'Порядок восстановлен по запискам и допросу. Игра его намеренно размывает.',
    ingame:'В игре', ingame_p:'Сюжетный стержень — колокола для канатки на гору.',
    clues_versions:'Улики и версии', dig:'Где копать', stream:'стрим'
  },
  en: {
    code:'Case No. SP-1993-10 · Silver Pines · Velvet, Eddie', title:'The Eddie Velvet Case',
    lede:'Detective Red Walker was hired to find a missing musician. Everything we could gather is here: who is who, what happened before and during the game, the three endings, the hypotheses, and the clues for and against each one. Timecodes link straight into the stream recordings.',
    streams:'Streams', research:'Research', cards:'cards', links:'links', sections:'Sections',
    tab_board:'Board', tab_hyp:'Hypotheses', tab_time:'Timeline', tab_people:'People', tab_refs:'References', tab_open:'Open questions',
    search_ph:'Search: Alice, cable car, 10:07, Jackman…', search_aria:'Search the board', force:'Force layout', zones:'Zone layout', fit:'Whole board',
    graph_aria:'Graph: hypotheses, clues, characters, events and references',
    fail:'The graph failed to load. The Hypotheses, Timeline, People and References tabs work without it.',
    th_src:'Source', th_match:'What matches', th_strength:'Strength', th_links:'Links',
    footer:'Sources: transcripts of the author\'s three streams (YouTube auto-captions of him reading the game\'s Russian text aloud) and research from 19.10.2026: Steam, YouTube breakdowns, press and developer interviews. Key lines are checked against frames of the screen recording. In-game quotes use the original English line where we had it; the rest are translated back from the Russian localization. Reference tags: OFFICIAL — said by the developers, PRESS — noticed by critics, HYPOTHESIS — our guess, no outside source.',
    g_for:'For this hypothesis', g_against:'Against', g_supports:'Supports', g_contradicts:'Contradicts', g_next:'Next in time', g_prev:'Earlier in time',
    g_refs:'References', g_motifs:'Motifs', g_about:'Connected', g_qa:'Questions and answers',
    how:'How to use', click:'Click a card',
    how_p:'Red is hypotheses, yellow is clues, light is people. Click any card: its dossier opens and the board keeps only its links. A green thread is a clue for, a red dashed line is a clue against.',
    strongest:'Strongest versions', strength:(n) => `strength: ${n} of 3`,
    l_for:'clue for', l_against:'clue against', l_ref:'reference', l_order:'order of events', l_about:'connected',
    for:'For', against:'Against', refs_colon:'References', show:'Show on the board',
    before:'Before the game', before_p:'The order is pieced together from notes and the interrogation. The game blurs it on purpose.',
    ingame:'In the game', ingame_p:'The spine of the plot: the bells for the cable car up the mountain.',
    clues_versions:'Clues and versions', dig:'Where to dig', stream:'stream'
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
const ST = (n, i) => { const t = n.src[i].t; if(!EN()) return t; return (n.en && n.en.src && n.en.src[i]) || t.replace(/^стрим/, 'stream'); };
const HOLD = h => EN() ? (((D.meta||{}).holders_en||{})[h] || h) : h;
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
function srcHTML(n){ return n.src.length ? `<div class="srcs">${n.src.map((s,i) => `<a href="${esc(s.u)}" target="_blank" rel="noopener">${esc(ST(n,i))} ↗</a>`).join('')}</div>` : ''; }
function meter(n){ return `<span class="meter" title="${esc(u('strength')(n))}">${[1,2,3].map(i => `<b class="${i<=n?'on':''}"></b>`).join('')}</span>`; }
function holders(h){ return `<span class="holders">${(h||[]).map(x => `<span class="tag ${x==='Alex'?'alex':''}">${esc(HOLD(x))}</span>`).join('')}</span>`; }

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

/* ---------- graph ---------- */
let cy = null, hidden = new Set(['place','motif']);
function zonePositions(){
  const pos = {}, hy = D.nodes.filter(n => n.type==='hyp');
  pos.Q = {x:0,y:0};
  const R = Math.max(360, hy.length*22), d = R - 360;
  hy.forEach((h,i) => { const a = -Math.PI/2 + i*2*Math.PI/hy.length; pos[h.id] = {x:Math.cos(a)*R*1.45, y:Math.sin(a)*R, a}; });
  const clues = D.nodes.filter(n => n.type==='clue').map(c => {
    const hs = D.edges.filter(e => e.source===c.id && byId.get(e.target).type==='hyp').map(e => pos[e.target].a);
    const seed = [...c.id].reduce((s,ch) => (s*31 + ch.charCodeAt(0)) % 997, 7) / 997 * 6.283;
    let a = hs.length ? Math.atan2(hs.reduce((s,x)=>s+Math.sin(x),0), hs.reduce((s,x)=>s+Math.cos(x),0)) : seed;
    return {id:c.id, a};
  }).sort((p,q) => p.a-q.a);
  clues.forEach((c,i) => { const a = c.a*0.35 + (-Math.PI + i*2*Math.PI/clues.length)*0.65; const r = 700 + d + (i%3)*80; pos[c.id] = {x:Math.cos(a)*r, y:Math.sin(a)*r}; });
  const ring = (type, r, from, to) => { const L_ = D.nodes.filter(n => n.type===type); L_.forEach((n,i) => { const a = from + (L_.length===1?0.5:i/(L_.length-1))*(to-from); pos[n.id] = {x:Math.cos(a)*r, y:Math.sin(a)*r}; }); };
  ring('char', 1080 + d, -Math.PI*0.95, -Math.PI*0.05);
  ring('place', 1320 + d, -Math.PI*0.85, -Math.PI*0.15);
  ring('ref', 1100 + d, Math.PI*0.6, Math.PI*1.05);
  ring('motif', 1100 + d, Math.PI*0.05, Math.PI*0.3);
  ring('open', 1330 + d, -Math.PI*0.1, Math.PI*0.14);
  const evs = D.nodes.filter(n => n.type==='event').sort((a,b) => (a.era===b.era? a.order-b.order : (a.era==='before'?-1:1)));
  evs.forEach((n,i) => { pos[n.id] = {x:-1180 - d + i*(124 + d/10), y:1240 + d + (i%2)*100}; });
  D.nodes.filter(n => n.type==='ending').forEach((n,i) => { pos[n.id] = {x:1200 + d + i*200, y:960 + d + (i%2)*110}; });
  return pos;
}
function styles(){
  const c = k => col(k);
  return [
    {selector:'node', style:{'label':'data(label)','font-family':'Manrope, system-ui, sans-serif','font-size':15,'color':c('--ink'),'text-wrap':'wrap','text-max-width':170,'text-valign':'bottom','text-margin-y':6,'min-zoomed-font-size':8,'background-color':'data(color)','border-width':0,'width':'data(size)','height':'data(size)','text-outline-color':c('--panel'),'text-outline-width':2}},
    {selector:'node[type="q"]', style:{'shape':'ellipse','font-family':'Prata, Georgia, serif','font-size':20,'text-valign':'center','text-margin-y':0,'color':'#fff','text-outline-width':0,'text-max-width':120}},
    {selector:'node[type="hyp"]', style:{'shape':'round-rectangle','background-color':c('--raise'),'border-color':c('--red'),'border-width':3,'font-family':'Prata, Georgia, serif','font-size':17,'min-zoomed-font-size':5,'text-valign':'center','text-margin-y':0,'text-max-width':150,'text-outline-width':0,'width':'data(w)','height':'data(h)'}},
    {selector:'node[type="ending"]', style:{'shape':'diamond','font-family':'Prata, Georgia, serif','font-size':16}},
    {selector:'node[type="clue"]', style:{'shape':'rectangle'}},
    {selector:'node[type="event"]', style:{'shape':'round-rectangle'}},
    {selector:'node[type="ref"]', style:{'shape':'tag'}},
    {selector:'node[type="motif"]', style:{'shape':'hexagon'}},
    {selector:'node[type="place"]', style:{'shape':'barrel'}},
    {selector:'node[type="open"]', style:{'shape':'star'}},
    {selector:'node[type="char"]', style:{'shape':'ellipse','border-width':2,'border-color':c('--muted'),'font-weight':700}},
    {selector:'edge', style:{'width':1,'line-color':c('--line'),'curve-style':'bezier','opacity':.7}},
    {selector:'edge[kind="supports"]', style:{'line-color':c('--sup'),'width':1.6,'opacity':.75}},
    {selector:'edge[kind="contradicts"]', style:{'line-color':c('--con'),'line-style':'dashed','width':1.8}},
    {selector:'edge[kind="echoes"]', style:{'line-color':c('--violet'),'line-style':'dotted','width':1.4}},
    {selector:'edge[kind="leads"]', style:{'line-color':c('--steel'),'target-arrow-shape':'triangle','target-arrow-color':c('--steel'),'width':1.6}},
    {selector:'edge[kind="answers"]', style:{'line-color':c('--red'),'opacity':.25}},
    {selector:'.faded', style:{'opacity':.08,'text-opacity':0}},
    {selector:'node.hl', style:{'border-width':3,'border-color':c('--red')}},
    {selector:'node.match', style:{'border-width':3,'border-color':c('--amber')}},
    {selector:'edge.hl', style:{'opacity':1,'width':2.4}}
  ];
}
function elements(){
  const pos = zonePositions();
  const size = {q:110, hyp:0, ending:62, clue:24, char:38, event:26, place:28, ref:28, motif:28, open:30};
  const nodes = D.nodes.map(n => {
    const d = {id:n.id, label:L(n), type:n.type, color:col(TYPES[n.type].tok), size:size[n.type]};
    if(n.type==='hyp'){ d.w = 150 + n.strength*14; d.h = 62; d.size = d.w - 18; }
    return {data:d, position:pos[n.id] || {x:0,y:0}};
  });
  const edges = D.edges.map((e,i) => ({data:{id:'e'+i, source:e.source, target:e.target, kind:e.kind}}));
  return nodes.concat(edges);
}
function applyVisibility(){
  if(!cy) return;
  cy.batch(() => { cy.nodes().forEach(n => n.style('display', hidden.has(n.data('type')) ? 'none' : 'element')); });
}
function initGraph(){
  const box = document.getElementById('cy');
  if(typeof cytoscape !== 'function'){ box.innerHTML = `<div class="fail">${esc(u('fail'))}</div>`; return; }
  cy = cytoscape({container:box, elements:elements(), style:styles(), layout:{name:'preset'}, wheelSensitivity:.25, minZoom:.12, maxZoom:2.5, boxSelectionEnabled:false});
  applyVisibility(); cy.fit(cy.elements(':visible'), 30);
  cy.on('tap','node', ev => focusNode(ev.target.id(), false));
  cy.on('tap', ev => { if(ev.target === cy) clearFocus(); });
}
/* focus: pull the node's connections into a ring around it so labels are readable; put them back on the next focus or reset */
let saved = null;
const ORDER = {supports:0, contradicts:1, leads:2, about:3, echoes:4, motif:5, asks:6, answers:7};
function restorePositions(){ if(saved && cy){ cy.batch(() => saved.forEach((p,id) => { const x = cy.getElementById(id); if(x.length) x.position(p); })); } saved = null; }
function gather(n){
  restorePositions();
  const c = {...n.position()};
  const others = n.neighborhood().nodes().filter(x => x.style('display') !== 'none');
  saved = new Map(); others.forEach(x => saved.set(x.id(), {...x.position()}));
  const kindOf = x => { const e = n.edgesWith(x)[0]; return e ? (ORDER[e.data('kind')] ?? 9) : 9; };
  const list = others.toArray().sort((a,b) => kindOf(a)-kindOf(b) || a.data('type').localeCompare(b.data('type')));
  const k = list.length, R = Math.max(240, k*30);
  cy.batch(() => list.forEach((x,i) => { const a = -Math.PI/2 + i*2*Math.PI/Math.max(k,1); x.position({x:c.x + Math.cos(a)*R, y:c.y + Math.sin(a)*R*0.82}); }));
}
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function fitTo(eles, pad, maxZ, dur){
  if(!eles.length) return;
  const bb = eles.boundingBox(), w = cy.width(), h = cy.height();
  let z = Math.min((w-2*pad)/Math.max(bb.w,1), (h-2*pad)/Math.max(bb.h,1));
  z = Math.max(cy.minZoom(), Math.min(maxZ, z));
  const pan = {x: w/2 - z*(bb.x1 + bb.w/2), y: h/2 - z*(bb.y1 + bb.h/2)};
  cy.stop(); cy.animate({zoom:z, pan}, {duration: calm() ? 0 : dur});
}
function clearFocus(){ if(cy){ restorePositions(); cy.elements().removeClass('faded hl'); } shown = null; dossier.innerHTML = defaultDossier(); setHash(''); }
function focusNode(id, center=true){
  showNode(id); setHash('n-'+id);
  if(!cy) return;
  const n = cy.getElementById(id); if(!n.length) return;
  if(n.style('display')==='none'){ hidden.delete(n.data('type')); renderChips(); applyVisibility(); }
  if(!forceOn) gather(n);
  const hood = n.closedNeighborhood();
  cy.elements().addClass('faded').removeClass('hl');
  hood.removeClass('faded'); n.addClass('hl'); hood.edges().addClass('hl');
  if(center || !forceOn) fitTo(hood.filter(':visible'), 40, 1.25, 350);
  if(tab !== 'board') selectTab('board');
}
function setHash(h){ try{ history.replaceState(null,'', h ? '#'+h : location.pathname + location.search); }catch(e){} }

/* chips + legend */
const chipsEl = document.getElementById('chips');
function renderChips(){
  chipsEl.innerHTML = Object.keys(TYPES).filter(t => t!=='q').map(t => `<button type="button" class="chip" data-t="${t}" aria-pressed="${!hidden.has(t)}"><span class="dot" style="background:${col(TYPES[t].tok)}"></span>${esc(TN(t))}<span class="c">${counts[t]||0}</span></button>`).join('');
}
chipsEl.addEventListener('click', e => { const b = e.target.closest('[data-t]'); if(!b) return; const t = b.dataset.t; hidden.has(t) ? hidden.delete(t) : hidden.add(t); renderChips(); applyVisibility(); });
function renderLegend(){
  document.getElementById('legend').innerHTML = [['--sup','l_for','solid'],['--con','l_against','dashed'],['--violet','l_ref','dotted'],['--steel','l_order','solid'],['--line','l_about','solid']].map(([t,l,s]) => `<span><i style="border-top:2px ${s} ${col(t)}"></i>${esc(u(l))}</span>`).join('');
}
document.getElementById('q').addEventListener('input', e => {
  const v = e.target.value.trim().toLowerCase();
  if(!cy) return;
  cy.nodes().removeClass('match');
  if(!v){ return; }
  const hits = cy.nodes().filter(n => { const d = byId.get(n.id()); return [d.label, d.text, d.en && d.en.label, d.en && d.en.text, ...d.src.map(s=>s.t)].filter(Boolean).join(' ').toLowerCase().includes(v); });
  hits.forEach(n => { if(n.style('display')==='none'){ hidden.delete(n.data('type')); } });
  renderChips(); applyVisibility(); hits.addClass('match');
  if(hits.length) fitTo(hits, 60, 1.4, 250);
});
let forceOn = false;
const layoutBtn = document.getElementById('layoutBtn');
layoutBtn.addEventListener('click', () => {
  if(!cy) return; restorePositions(); cy.elements().removeClass('faded hl'); forceOn = !forceOn;
  layoutBtn.textContent = forceOn ? u('zones') : u('force');
  if(forceOn) cy.layout({name:'cose', animate:false, randomize:false, nodeRepulsion:()=>9000, idealEdgeLength:()=>90, numIter:1500, fit:true, padding:30}).run();
  else { const pos = zonePositions(); cy.nodes().forEach(n => n.position(pos[n.id()])); cy.fit(cy.elements(':visible'),30); }
});
document.getElementById('fitBtn').addEventListener('click', () => { if(cy){ clearFocus(); cy.fit(cy.elements(':visible'), 30); } });

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
  const li = (n, cls='') => `<li class="${cls}"><button type="button" class="ev" data-go="${n.id}" style="border:0;padding:0"><span class="t">${esc(L(n))}</span></button><div class="x">${esc(TX(n))}</div><div class="s">${n.src.map((s,i) => `<a href="${esc(s.u)}" target="_blank" rel="noopener">${esc(ST(n,i))}</a>`).join('')}</div></li>`;
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
  const rank = t => /ОФИЦИАЛЬНО/.test(t) ? 0 : /Alex/.test(t) ? 1 : /ПРЕССА/.test(t) ? 2 : /ФАКТ/.test(t) ? 3 : 4;
  R.sort((a,b) => rank(a.tag)-rank(b.tag));
  document.getElementById('refRows').innerHTML = R.map(r => `<tr><td class="r"><button type="button" class="ev" data-go="${r.id}" style="border:0;padding:0">${esc(L(r))}</button></td><td>${esc(TX(r))}</td><td><span class="tag">${esc(TAG(r))}</span></td><td><div class="srcs">${r.src.map((s,i) => `<a href="${esc(s.u)}" target="_blank" rel="noopener">${esc(ST(r,i))} ↗</a>`).join('')}</div></td></tr>`).join('');
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
  if(t==='board' && cy){ cy.resize(); }
}
document.querySelector('nav.tabs').addEventListener('click', e => { const b = e.target.closest('[role="tab"]'); if(b){ selectTab(b.id.slice(2)); if(b.id!=='t-board') setHash(b.id.slice(2)); } });

/* ---------- static text + language switch ---------- */
function applyStatic(){
  document.documentElement.lang = LANG;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = u(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => el.setAttribute('placeholder', u(el.dataset.i18nPh)));
  document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', u(el.dataset.i18nAria)));
  document.querySelectorAll('.lang [data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === LANG)));
  layoutBtn.textContent = forceOn ? u('zones') : u('force');
  document.title = u('title');
  updateStat();
}
function setLang(l){
  if(l === LANG) return;
  LANG = l; store.set('sp-lang', l);
  applyStatic(); renderChips(); renderLegend(); renderHyp(); renderTime(); renderPeople(); renderRefs(); renderOpen();
  if(cy) cy.batch(() => cy.nodes().forEach(x => x.data('label', L(byId.get(x.id())))));
  if(shown) showNode(shown); else dossier.innerHTML = defaultDossier();
}
document.querySelector('.lang').addEventListener('click', e => { const b = e.target.closest('[data-lang]'); if(b) setLang(b.dataset.lang); });

/* theme follow */
function restyle(){ if(!cy) return; cy.style(styles()); cy.nodes().forEach(n => n.data('color', col(TYPES[n.data('type')].tok))); renderChips(); renderLegend(); }
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', restyle);
new MutationObserver(restyle).observe(document.documentElement, {attributes:true, attributeFilter:['data-theme']});

/* boot */
applyStatic();
renderChips(); renderLegend(); renderHyp(); renderTime(); renderPeople(); renderRefs(); renderOpen();
dossier.innerHTML = defaultDossier();
initGraph();
const h = hash0;
let start = store.get('sp-tab') || 'board';
if(TABS.includes(h)) start = h;
selectTab(TABS.includes(start) ? start : 'board');
if(h.startsWith('n-') && byId.has(h.slice(2))) focusNode(h.slice(2));
})();
