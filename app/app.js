const DATA = {};
const state = {
  progress: {answered:0, correct:0, byQuestion:{}, byConcept:{}, sessions:0, lastStudy:null},
  license: {premium:false, key:'', instanceId:'', instanceName:'', lastValidated:null, activationUsage:0, activationLimit:0, expiresAt:null, customerEmail:''},
  session: null,
  flashIndex: 0,
  flashFlipped: false,
};

const $ = (s) => document.querySelector(s);
const content = $('#content');
const title = $('#viewTitle');
const toast = $('#toast');
let CATALOG={courses:[],defaultCourseId:''};
let selectedCourseId='';
let PROGRESS_KEY='';
let LICENSE_KEY='';
const SELECTED_COURSE_KEY='amooprep_selected_course';
const blankProgress=()=>({answered:0,correct:0,byQuestion:{},byConcept:{},sessions:0,lastStudy:null});
const blankLicense=()=>({premium:false,key:'',instanceId:'',instanceName:'',lastValidated:null,activationUsage:0,activationLimit:0,expiresAt:null,customerEmail:''});

function courseStorageKeys(courseId){
  const safe=String(courseId).replace(/[^a-z0-9_-]/gi,'_');
  return {progress:`amooprep_course_${safe}_progress`,license:`amooprep_course_${safe}_license`};
}
async function migrateGreekRomanStorage(){
  if(selectedCourseId!=='greek-roman-civilization')return;
  const existingProgress=await storageGet(PROGRESS_KEY);
  const existingLicense=await storageGet(LICENSE_KEY);
  if(!existingProgress){const old=await storageGet('amooprep_greek_roman_progress');if(old)await storageSet(PROGRESS_KEY,old);}
  if(!existingLicense){const old=await storageGet('amooprep_greek_roman_license');if(old)await storageSet(LICENSE_KEY,old);}
}
async function loadCatalog(){
  CATALOG=await fetch('../data/catalog.json').then(r=>r.json());
  const saved=await storageGet(SELECTED_COURSE_KEY);
  const available=new Set((CATALOG.courses||[]).filter(c=>c.status==='available').map(c=>c.courseId));
  selectedCourseId=available.has(saved)?saved:(CATALOG.defaultCourseId||CATALOG.courses?.[0]?.courseId||'');
}
async function loadCourse(courseId){
  const entry=(CATALOG.courses||[]).find(c=>c.courseId===courseId && c.status==='available');
  if(!entry)throw new Error('That AmooPrep course pack is not available yet.');
  selectedCourseId=courseId;
  await storageSet(SELECTED_COURSE_KEY,selectedCourseId);
  const keys=courseStorageKeys(selectedCourseId);PROGRESS_KEY=keys.progress;LICENSE_KEY=keys.license;
  const names=['course','commerce','units','questions','concepts','flashcards','timeline','people'];
  for(const name of names){DATA[name]=await fetch(`../data/courses/${selectedCourseId}/${name}.json`).then(r=>{if(!r.ok)throw new Error(`Missing ${name}.json for ${selectedCourseId}`);return r.json();});}
  await migrateGreekRomanStorage();
  state.progress=await storageGet(PROGRESS_KEY)||blankProgress();
  state.license=await storageGet(LICENSE_KEY)||blankLicense();
  state.session=null;state.flashIndex=0;state.flashFlipped=false;
  normalizeProgress();
  await validateStoredLicense();
  updateLicenseBadge();
  $('#packEyebrow').textContent=DATA.course.packName;
}
async function loadData(){await loadCatalog();await loadCourse(selectedCourseId);}
function normalizeProgress(){
  state.progress.answered ||= 0; state.progress.correct ||= 0; state.progress.byQuestion ||= {}; state.progress.byConcept ||= {}; state.progress.sessions ||= 0;
}
const storageGet = async key => {
  if(globalThis.chrome?.storage?.local){ return new Promise(resolve=>chrome.storage.local.get([key],x=>resolve(x[key]))); }
  try{return JSON.parse(localStorage.getItem(key));}catch{return null;}
};
const storageSet = async (key,val) => {
  if(globalThis.chrome?.storage?.local){ return new Promise(resolve=>chrome.storage.local.set({[key]:val},resolve)); }
  localStorage.setItem(key,JSON.stringify(val));
};
async function saveProgress(){state.progress.lastStudy=new Date().toISOString();await storageSet(PROGRESS_KEY,state.progress);}
async function saveLicense(){await storageSet(LICENSE_KEY,state.license);updateLicenseBadge();}
function updateLicenseBadge(){const el=$('#licenseBadge');if(!el)return;el.textContent=state.license.premium?'Premium Unlocked':'Free Edition';}
function showToast(msg){toast.textContent=msg;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2200);}
function pct(n,d){return d?Math.round(n/d*100):0;}
function conceptStats(cid){const x=state.progress.byConcept[cid]||{attempts:0,correct:0,streak:0};return {...x,accuracy:pct(x.correct,x.attempts),mastery:mastery(x)};}
function mastery(x){if(!x?.attempts)return 0; const acc=x.correct/x.attempts; const volume=Math.min(1,x.attempts/4); const streak=Math.min(1,(x.streak||0)/3); return Math.round((acc*.65+volume*.2+streak*.15)*100);}
function accessibleQuestions(){return state.license.premium?DATA.questions:DATA.questions.filter(q=>q.access==='free');}
function accessibleFlashcards(){return state.license.premium?DATA.flashcards:DATA.flashcards.filter(f=>f.access==='free');}
function unitStats(unit){const qs=accessibleQuestions().filter(q=>q.unit===unit);const ids=new Set(qs.map(q=>q.concept));let attempts=0,correct=0,ms=[];ids.forEach(cid=>{const s=conceptStats(cid);attempts+=s.attempts;correct+=s.correct;ms.push(s.mastery)});return {attempts,correct,accuracy:pct(correct,attempts),mastery:ms.length?Math.round(ms.reduce((a,b)=>a+b,0)/ms.length):0};}
function overallMastery(){const ids=new Set(accessibleQuestions().map(q=>q.concept));const cs=[...ids].map(id=>conceptStats(id).mastery);return cs.length?Math.round(cs.reduce((a,b)=>a+b,0)/cs.length):0;}
function escapeHtml(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function unitName(u){return DATA.units.find(x=>x.id===u)?.title||`Unit ${u}`;}
function premiumRequired(message='This feature requires Premium access.'){showToast(message);navigate('premium');}

function navigate(view){
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  const labels={library:'Course Library',dashboard:'Dashboard',practice:'Adaptive Practice',mock:'Mock Final',units:'Study by Unit',flashcards:'Flashcards',timeline:'Timeline',people:'People & Ideas',weak:'Weak Areas',progress:'Progress',premium:'Premium Access',about:'About'};
  title.textContent=labels[view]||'AmooPrep';
  $('#quickPractice').style.display=view==='library'?'none':'';
  if(view==='library') renderLibrary();
  if(view==='dashboard') renderDashboard();
  if(view==='practice') renderPracticeSetup();
  if(view==='mock') renderMockSetup();
  if(view==='units') renderUnits();
  if(view==='flashcards') renderFlashcards();
  if(view==='timeline') renderTimeline();
  if(view==='people') renderPeople();
  if(view==='weak') renderWeak();
  if(view==='progress') renderProgress();
  if(view==='premium') renderPremium();
  if(view==='about') renderAbout();
}

async function renderLibrary(){
  $('#packEyebrow').textContent='AmooPrep Course Library';
  const cards=[];
  for(const c of (CATALOG.courses||[])){
    if(c.status!=='available')continue;
    const keys=courseStorageKeys(c.courseId);
    let lic=await storageGet(keys.license);
    if(c.courseId==='greek-roman-civilization'&&!lic)lic=await storageGet('amooprep_greek_roman_license');
    const paid=Boolean(lic?.premium);
    const active=c.courseId===selectedCourseId;
    cards.push(`<div class="card"><p>${paid?'<span class="premium-chip">Premium unlocked</span>':'<span class="free-chip">Free + Premium</span>'}</p><h2>${escapeHtml(c.title)}</h2><p class="muted">${escapeHtml(c.summary||'Adaptive study course pack.')}</p><p><strong>${Number(c.questionCount||0).toLocaleString()}</strong> questions • <strong>${Number(c.flashcardCount||0).toLocaleString()}</strong> flashcards${c.price?` • ${escapeHtml(c.price)} Premium`:''}</p><div class="toolbar"><button class="btn ${active?'primary':''}" data-open-course="${escapeHtml(c.courseId)}">${active?'Open Current Course':'Open Course'}</button>${c.landingPageUrl?`<a class="btn" href="${escapeHtml(c.landingPageUrl)}" target="_blank" rel="noopener noreferrer">Course Page</a>`:''}</div></div>`);
  }
  content.innerHTML=`<div class="card"><span class="eyebrow">One app. Multiple courses.</span><h2>Your AmooPrep course library</h2><p class="muted">Each course keeps its own study progress and its own Premium license. Adding another course pack does not require another Chrome extension.</p></div><div class="grid two" style="margin-top:18px">${cards.join('')}</div><div class="notice" style="margin-top:18px">More course packs can be added to this same AmooPrep installation as they are released.</div>`;
  document.querySelectorAll('[data-open-course]').forEach(btn=>btn.onclick=async()=>{btn.disabled=true;try{await loadCourse(btn.dataset.openCourse);navigate('dashboard');showToast(`${DATA.course.title} opened`);}catch(e){showToast(e.message);}finally{btn.disabled=false;}});
}

function renderDashboard(){
  const acc=pct(state.progress.correct,state.progress.answered), m=overallMastery();
  const unlocked=accessibleQuestions().length;
  const weak=DATA.concepts.map(c=>({...c,...conceptStats(c.id)})).filter(c=>c.attempts>0).sort((a,b)=>a.mastery-b.mastery).slice(0,5);
  content.innerHTML=`
    <div class="grid stats">
      <div class="card stat"><div class="value">${unlocked}</div><div class="label">Questions available</div></div>
      <div class="card stat"><div class="value">${state.progress.answered}</div><div class="label">Answers completed</div></div>
      <div class="card stat"><div class="value">${acc}%</div><div class="label">Overall accuracy</div></div>
      <div class="card stat"><div class="value">${m}%</div><div class="label">Concept mastery</div></div>
    </div>
    <div class="grid two" style="margin-top:18px">
      <div class="card">
        <p>${state.license.premium?'<span class="premium-chip">Premium unlocked</span>':'<span class="free-chip">Free edition</span>'}</p>
        <h2>Exam-readiness training</h2>
        <p class="muted">AmooPrep mixes recall, alternate wording, and weak-area review so you learn the concept instead of memorizing a question position.</p>
        <div class="progressbar"><span style="width:${m}%"></span></div>
        <p><strong>${m<40?'Building foundation':m<70?'Developing':m<85?'Strong':'Exam-ready'}</strong> • ${m}% mastery</p>
        <div class="toolbar"><button class="btn primary" data-action="adaptive10">Adaptive 10</button><button class="btn" data-action="mock">Mock Final</button>${!state.license.premium?'<button class="btn" data-action="premium">Unlock Full Pack</button>':''}</div>
      </div>
      <div class="card"><h2>What to study next</h2>${weak.length?weak.map(c=>`<div class="unit-row"><div class="unit-badge">${c.unit}</div><div><strong>${escapeHtml(c.title)}</strong><div class="muted">${c.attempts} attempts • ${c.accuracy}% accuracy</div></div><div class="progressbar"><span style="width:${c.mastery}%"></span></div><div class="unit-score">${c.mastery}%</div></div>`).join(''):'<p class="muted">Answer some questions first. AmooPrep will automatically identify weak concepts.</p>'}</div>
    </div>
    ${!state.license.premium?`<div class="paywall" style="margin-top:18px"><strong>Free preview:</strong> ${DATA.course.freeQuestionCount} questions and ${DATA.course.freeFlashcardCount} flashcards are unlocked. Premium adds ${DATA.course.premiumQuestionCount} more questions, the complete flashcard set, and full-length mock finals. <button class="btn" data-action="premium" style="margin-left:10px">See Premium</button></div>`:''}
    <div class="card" style="margin-top:18px"><h2>Course review map</h2>${DATA.units.map(u=>{const s=unitStats(u.id);return `<div class="unit-row"><div class="unit-badge">${u.id}</div><div><strong>${escapeHtml(u.title)}</strong><div class="muted">${escapeHtml(u.description)}</div></div><div class="progressbar"><span style="width:${s.mastery}%"></span></div><div class="unit-score">${s.mastery}%</div></div>`}).join('')}</div>`;
}

function renderPracticeSetup(){
  content.innerHTML=`<div class="grid two"><div class="card"><h2>Adaptive practice</h2><p>The engine prioritizes concepts you have missed, then brings them back in a different question form.</p><div class="toolbar"><label>Questions <select id="practiceCount" class="select"><option>10</option><option>20</option><option>30</option><option>40</option></select></label><label>Unit <select id="practiceUnit" class="select"><option value="all">All topics</option>${DATA.units.map(u=>`<option value="${u.id}">Topic ${u.id}</option>`).join('')}</select></label></div><button class="btn primary" id="startAdaptive">Start adaptive session</button></div><div class="card"><h2>Adaptive retry</h2><p class="muted">A wrong answer raises that concept's priority. A related question can return later with different wording.</p><div class="notice">Keyboard: <span class="kbd">1</span>–<span class="kbd">4</span> choose an answer. <span class="kbd">Enter</span> moves forward after feedback.</div></div></div>`;
  $('#startAdaptive').onclick=()=>startSession('adaptive',{count:+$('#practiceCount').value,unit:$('#practiceUnit').value});
}
function renderMockSetup(){
  const premium=state.license.premium;
  content.innerHTML=`<div class="grid two"><div class="card"><h2>Mock Final</h2><p>Build a balanced exam across the complete review map.</p><div class="toolbar"><label>Length <select id="mockCount" class="select"><option value="10">10 (Free)</option><option value="20" ${premium?'':'disabled'}>20 ${premium?'':'(Premium)'}</option><option value="40" ${premium?'selected':'disabled'}>40 ${premium?'':'(Premium)'}</option><option value="60" ${premium?'':'disabled'}>60 ${premium?'':'(Premium)'}</option></select></label></div><button id="startMock" class="btn primary">Start Mock Final</button></div><div class="card"><h2>Why randomized?</h2><p class="muted">Questions are selected from the available bank by topic so repeated practice tests do not simply reproduce one fixed answer sheet.</p>${!premium?'<p class="paywall">Full-length mocks are included with Premium.</p>':''}</div></div>`;
  $('#startMock').onclick=()=>{const n=+$('#mockCount').value;if(n>10&&!state.license.premium)return premiumRequired('Full-length mock finals require Premium.');startSession('mock',{count:n});};
}

function weightedAdaptivePool(unit='all'){
  const base=accessibleQuestions().filter(q=>unit==='all'||q.unit===+unit);
  const weighted=[];
  base.forEach(q=>{const s=conceptStats(q.concept);let w=1;if(s.attempts===0)w=3;else if(s.mastery<40)w=7;else if(s.mastery<70)w=4;else if(s.mastery<85)w=2;for(let i=0;i<w;i++)weighted.push(q);});
  return weighted;
}
function uniqueSample(arr,n){const copy=[...arr];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}const seen=new Set(),out=[];for(const q of copy){if(!seen.has(q.id)){seen.add(q.id);out.push(q);}if(out.length>=n)break;}return out;}
function balancedMock(count){
  const bank=accessibleQuestions(); const per=Math.floor(count/8), extra=count%8, out=[];
  DATA.units.forEach((u,idx)=>{const qs=bank.filter(q=>q.unit===u.id);out.push(...uniqueSample(qs,Math.min(qs.length,per+(idx<extra?1:0))));});
  return uniqueSample(out,Math.min(count,out.length));
}
function startSession(mode,opts={}){
  let qs=[];
  if(mode==='mock') qs=balancedMock(opts.count||10);
  if(mode==='adaptive') qs=uniqueSample(weightedAdaptivePool(opts.unit||'all'),opts.count||10);
  if(!qs.length){showToast('No questions are available for that selection.');return;}
  state.session={mode,questions:qs,index:0,correct:0,answers:[],startedAt:Date.now()};
  state.progress.sessions++;
  renderQuestion();
}
function renderQuestion(){
  const s=state.session;if(!s)return;
  if(s.index>=s.questions.length){renderSessionResult();return;}
  const q=s.questions[s.index], cs=conceptStats(q.concept);
  const modeLabel=s.mode==='mock'?'Mock Final':'Adaptive';
  content.innerHTML=`<div class="quiz-wrap"><div class="quiz-head"><div><span class="pill">${modeLabel}</span> <span class="pill">Topic ${q.unit}</span> ${q.access==='premium'?'<span class="premium-chip">Premium</span>':'<span class="free-chip">Free</span>'}</div><div class="muted">${s.index+1} / ${s.questions.length}</div></div><div class="progressbar" style="margin-bottom:18px"><span style="width:${((s.index)/s.questions.length)*100}%"></span></div><div class="card question-card"><p class="eyebrow">${escapeHtml(q.topic)} • Mastery ${cs.mastery}%</p><h2>${escapeHtml(q.prompt)}</h2><div class="options">${q.options.map((o,i)=>`<button class="option" data-option="${i}"><span class="key">${i+1}</span><span>${escapeHtml(o)}</span></button>`).join('')}</div><div id="feedback"></div><div class="quiz-actions"><span class="muted">Choose 1–4</span><button id="nextQuestion" class="btn primary" style="display:none">Next question</button></div></div></div>`;
  document.querySelectorAll('.option').forEach(b=>b.onclick=()=>answerQuestion(+b.dataset.option));
}
let answering=false;
async function answerQuestion(choice){
  if(answering)return;answering=true;
  const s=state.session,q=s.questions[s.index],correct=choice===q.answer;
  s.answers.push({id:q.id,choice,correct,unit:q.unit,concept:q.concept}); if(correct)s.correct++;
  state.progress.answered++; if(correct)state.progress.correct++;
  const qp=state.progress.byQuestion[q.id]||{attempts:0,correct:0};qp.attempts++;if(correct)qp.correct++;state.progress.byQuestion[q.id]=qp;
  const cp=state.progress.byConcept[q.concept]||{attempts:0,correct:0,streak:0};cp.attempts++;if(correct){cp.correct++;cp.streak=(cp.streak||0)+1}else{cp.streak=0;}state.progress.byConcept[q.concept]=cp;
  if(!correct){
    const bank=accessibleQuestions();
    const relatives=(q.relatedQuestionIds||[]).map(id=>bank.find(x=>x.id===id)).filter(Boolean).filter(x=>!s.questions.slice(0,s.index+1).some(y=>y.id===x.id));
    if(relatives.length){const retry=relatives[Math.floor(Math.random()*relatives.length)];const insertAt=Math.min(s.questions.length,s.index+3+Math.floor(Math.random()*3));s.questions.splice(insertAt,0,retry);}
  }
  await saveProgress();
  document.querySelectorAll('.option').forEach((b,i)=>{b.disabled=true;if(i===q.answer)b.classList.add('correct');if(i===choice&&!correct)b.classList.add('wrong');});
  const fb=$('#feedback');fb.innerHTML=`<div class="explanation ${correct?'good':'bad'}"><strong>${correct?'Correct':'Not quite'}</strong><p>${escapeHtml(q.explanation)}</p>${!correct&&q.relatedQuestionIds?.length?'<small class="muted">This concept may return later in a different form.</small>':''}</div>`;
  const next=$('#nextQuestion');next.style.display='inline-flex';next.onclick=()=>{s.index++;answering=false;renderQuestion();};next.focus();
}
function renderSessionResult(){
  const s=state.session, score=pct(s.correct,s.answers.length);
  const unitRows=DATA.units.map(u=>{const a=s.answers.filter(x=>x.unit===u.id);if(!a.length)return '';const c=a.filter(x=>x.correct).length;return `<tr><td>Topic ${u.id}: ${escapeHtml(u.short)}</td><td>${c}/${a.length}</td><td>${pct(c,a.length)}%</td></tr>`}).join('');
  const missed=s.answers.filter(x=>!x.correct).map(x=>DATA.concepts.find(c=>c.id===x.concept)).filter(Boolean);
  content.innerHTML=`<div class="quiz-wrap"><div class="card score-hero"><p class="eyebrow">Session complete</p><div class="score">${score}%</div><h2>${score>=90?'Excellent review performance':score>=80?'Strong — review the misses':score>=70?'Good foundation — target weak areas':'Keep building — adaptive review will help'}</h2><p class="muted">${s.correct} correct out of ${s.answers.length}</p><div class="toolbar" style="justify-content:center"><button class="btn primary" data-action="adaptive10">Review weak areas</button><button class="btn" data-action="dashboard">Dashboard</button></div></div><div class="grid two" style="margin-top:18px"><div class="card"><h2>Topic breakdown</h2><table class="table"><thead><tr><th>Area</th><th>Score</th><th>Accuracy</th></tr></thead><tbody>${unitRows}</tbody></table></div><div class="card"><h2>Missed concepts</h2>${missed.length?[...new Map(missed.map(x=>[x.id,x])).values()].map(c=>`<div class="topic-card"><strong>${escapeHtml(c.title)}</strong><div class="muted">Topic ${c.unit} • ${escapeHtml(c.summary)}</div></div>`).join(''):'<p>No missed concepts in this session.</p>'}</div></div>`;
  state.session=null;saveProgress();
}

function renderUnits(){
  const bank=accessibleQuestions();
  content.innerHTML=`<div class="topic-grid">${DATA.units.map(u=>{const s=unitStats(u.id),available=bank.filter(q=>q.unit===u.id).length,total=DATA.questions.filter(q=>q.unit===u.id).length;return `<div class="card"><span class="pill">Topic ${u.id}</span><h2 style="margin-top:12px">${escapeHtml(u.title)}</h2><p class="muted">${escapeHtml(u.description)}</p><div class="progressbar"><span style="width:${s.mastery}%"></span></div><p>${s.mastery}% mastery • ${available}/${total} questions available</p><button class="btn primary unitPractice" data-unit="${u.id}">Practice this topic</button></div>`}).join('')}</div>`;
  document.querySelectorAll('.unitPractice').forEach(b=>b.onclick=()=>startSession('adaptive',{count:20,unit:b.dataset.unit}));
}
function renderFlashcards(){
  const cards=accessibleFlashcards();
  if(!cards.length){content.innerHTML='<div class="card"><p>No flashcards available.</p></div>';return;}
  state.flashIndex%=cards.length; const f=cards[state.flashIndex];
  content.innerHTML=`<div class="quiz-wrap"><div class="quiz-head"><span class="pill">Topic ${f.unit}</span><span class="muted">Card ${state.flashIndex+1} / ${cards.length}</span></div><div id="flash" class="flashcard">${state.flashFlipped?`<div class="back">${escapeHtml(f.back)}</div>`:`<div class="front">${escapeHtml(f.front)}<div class="muted" style="font-size:14px;margin-top:14px">Click to reveal</div></div>`}</div><div class="quiz-actions"><button class="btn" id="prevFlash">Previous</button><span class="muted">${state.license.premium?'Complete deck':'Free preview deck'}</span><button class="btn primary" id="nextFlash">Next</button></div>${!state.license.premium?'<div class="paywall" style="margin-top:16px">Premium unlocks the complete 99-card deck.</div>':''}</div>`;
  $('#flash').onclick=()=>{state.flashFlipped=!state.flashFlipped;renderFlashcards();};
  $('#prevFlash').onclick=()=>{state.flashIndex=(state.flashIndex-1+cards.length)%cards.length;state.flashFlipped=false;renderFlashcards();};
  $('#nextFlash').onclick=()=>{state.flashIndex=(state.flashIndex+1)%cards.length;state.flashFlipped=false;renderFlashcards();};
}
function renderTimeline(){content.innerHTML=`<div class="card"><h2>High-yield timeline</h2><p class="muted">Use sequence and cause-and-effect to connect political changes instead of memorizing isolated dates.</p><div class="timeline">${DATA.timeline.map(t=>`<div class="timeline-item"><strong>${escapeHtml(t.date)}</strong><div>${escapeHtml(t.event)}</div><small class="muted">Topic ${t.unit}</small></div>`).join('')}</div></div>`;}
function renderPeople(){content.innerHTML=`<div class="people-list">${DATA.people.map(p=>`<div class="person"><span class="pill">Topic ${p.unit}</span><h3>${escapeHtml(p.name)}</h3><p class="muted">${escapeHtml(p.why)}</p></div>`).join('')}</div>`;}
function renderWeak(){
  const accessibleConcepts=new Set(accessibleQuestions().map(q=>q.concept));
  const rows=DATA.concepts.filter(c=>accessibleConcepts.has(c.id)).map(c=>({...c,...conceptStats(c.id)})).filter(c=>c.attempts>0).sort((a,b)=>a.mastery-b.mastery);
  content.innerHTML=`<div class="card"><h2>Weak-area queue</h2><p class="muted">Lowest mastery first. Adaptive practice automatically gives these concepts extra weight.</p>${rows.length?`<table class="table"><thead><tr><th>Concept</th><th>Topic</th><th>Attempts</th><th>Accuracy</th><th>Mastery</th></tr></thead><tbody>${rows.map(c=>`<tr><td>${escapeHtml(c.title)}</td><td>${c.unit}</td><td>${c.attempts}</td><td>${c.accuracy}%</td><td>${c.mastery}%</td></tr>`).join('')}</tbody></table>`:'<p>No data yet. Complete a practice session first.</p>'}</div>`;
}
function renderProgress(){
  const acc=pct(state.progress.correct,state.progress.answered);
  content.innerHTML=`<div class="grid two"><div class="card"><h2>Study record</h2><p><strong>${state.progress.answered}</strong> answers • <strong>${acc}%</strong> accuracy • <strong>${state.progress.sessions}</strong> sessions</p><p class="muted">Last study: ${state.progress.lastStudy?new Date(state.progress.lastStudy).toLocaleString():'Not yet'}</p><div class="toolbar"><button class="btn" id="exportProgress">Export progress</button><label class="btn">Import progress<input id="importProgress" type="file" accept="application/json" hidden></label><button class="btn danger" id="resetProgress">Reset progress</button></div></div><div class="card"><h2>Topic mastery</h2>${DATA.units.map(u=>{const s=unitStats(u.id);return `<div class="unit-row"><div class="unit-badge">${u.id}</div><div><strong>${escapeHtml(u.short)}</strong><div class="muted">${s.attempts} attempts • ${s.accuracy}% accuracy</div></div><div class="progressbar"><span style="width:${s.mastery}%"></span></div><div>${s.mastery}%</div></div>`}).join('')}</div></div>`;
  $('#exportProgress').onclick=()=>{const blob=new Blob([JSON.stringify(state.progress,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`amooprep-${selectedCourseId}-progress.json`;a.click();URL.revokeObjectURL(a.href);};
  $('#importProgress').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{state.progress=JSON.parse(await f.text());normalizeProgress();await saveProgress();showToast('Progress imported');renderProgress();}catch{showToast('Could not import that file');}};
  $('#resetProgress').onclick=async()=>{if(confirm('Reset all study progress for this course pack?')){state.progress={answered:0,correct:0,byQuestion:{},byConcept:{},sessions:0,lastStudy:null};await saveProgress();renderProgress();showToast('Progress reset');}};
}

function merchantConfigured(){return Boolean(DATA.commerce.checkoutUrl && DATA.commerce.expectedProductId && DATA.commerce.expectedVariantId);}
function productMatches(meta){
  if(!meta)return false;
  return String(meta.product_id)===String(DATA.commerce.expectedProductId) && String(meta.variant_id)===String(DATA.commerce.expectedVariantId);
}
async function licensePost(endpoint, params){
  const body=new URLSearchParams(params);
  const r=await fetch(`${DATA.commerce.licenseApiBase}/${endpoint}`,{method:'POST',headers:{'Accept':'application/json','Content-Type':'application/x-www-form-urlencoded'},body});
  const data=await r.json().catch(()=>({error:`HTTP ${r.status}`}));
  if(!r.ok)throw new Error(data.error||`License service returned HTTP ${r.status}`);
  return data;
}
async function validateStoredLicense(){
  if(!state.license?.key||!state.license?.instanceId){state.license={premium:false,key:'',instanceId:'',instanceName:'',lastValidated:null,activationUsage:0,activationLimit:0,expiresAt:null,customerEmail:''};return;}
  if(!merchantConfigured()){state.license.premium=false;return;}
  try{
    const data=await licensePost('validate',{license_key:state.license.key,instance_id:state.license.instanceId});
    state.license.premium=Boolean(data.valid && productMatches(data.meta));
    state.license.lastValidated=new Date().toISOString();
    state.license.activationUsage=Number(data.license_key?.activation_usage||0);
    state.license.activationLimit=Number(data.license_key?.activation_limit||0);
    state.license.expiresAt=data.license_key?.expires_at||null;
    state.license.customerEmail=String(data.meta?.customer_email||state.license.customerEmail||'');
    await storageSet(LICENSE_KEY,state.license);
  }catch{state.license.premium=false;}
}
async function activateLicense(key,email){
  if(!merchantConfigured())throw new Error('Merchant setup is not finished yet. Add the Lemon Squeezy checkout URL, product ID, and variant ID to this course pack’s commerce.json.');
  const cleanKey=key.trim(), cleanEmail=email.trim().toLowerCase();
  if(!cleanKey||!cleanEmail)throw new Error('Enter the license key and the email used at checkout.');
  const instanceName=`${DATA.commerce.activationLabelPrefix} ${crypto.randomUUID().slice(0,8)}`;
  const data=await licensePost('activate',{license_key:cleanKey,instance_name:instanceName});
  if(!data.activated)throw new Error(data.error||'License could not be activated.');
  if(!productMatches(data.meta)){
    if(data.instance?.id){try{await licensePost('deactivate',{license_key:cleanKey,instance_id:data.instance.id});}catch{}}
    throw new Error('This license belongs to a different AmooPrep product.');
  }
  const purchasedEmail=String(data.meta?.customer_email||'').trim().toLowerCase();
  if(purchasedEmail && purchasedEmail!==cleanEmail){
    if(data.instance?.id){try{await licensePost('deactivate',{license_key:cleanKey,instance_id:data.instance.id});}catch{}}
    throw new Error('The email does not match the email used for this purchase.');
  }
  state.license={premium:true,key:cleanKey,instanceId:data.instance?.id||'',instanceName,lastValidated:new Date().toISOString(),activationUsage:Number(data.license_key?.activation_usage||0),activationLimit:Number(data.license_key?.activation_limit||0),expiresAt:data.license_key?.expires_at||null,customerEmail:purchasedEmail||cleanEmail};
  await saveLicense();
}
async function deactivateLicense(){
  if(state.license.key&&state.license.instanceId){try{await licensePost('deactivate',{license_key:state.license.key,instance_id:state.license.instanceId});}catch(e){console.warn(e);}}
  state.license={premium:false,key:'',instanceId:'',instanceName:'',lastValidated:null,activationUsage:0,activationLimit:0,expiresAt:null,customerEmail:''};await saveLicense();
}
function openCheckout(){
  if(!DATA.commerce.checkoutUrl){showToast('Checkout URL has not been added yet.');return;}
  window.open(DATA.commerce.checkoutUrl,'_blank','noopener,noreferrer');
}
function renderPremium(){
  const configured=merchantConfigured();
  const policyLinks=[['Privacy',DATA.commerce.privacyPolicyUrl],['Terms',DATA.commerce.termsUrl],['Refunds',DATA.commerce.refundPolicyUrl]].filter(x=>x[1]&&!x[1].startsWith('YOUR_')).map(([t,u])=>`<a class="mini-link" href="${escapeHtml(u)}" target="_blank" rel="noopener noreferrer">${t}</a>`).join(' • ');
  const usage=state.license.activationLimit?`${state.license.activationUsage}/${state.license.activationLimit}`:'—';
  const expiry=state.license.expiresAt?new Date(state.license.expiresAt).toLocaleDateString():'Never';
  const masked=state.license.key?`••••-${escapeHtml(state.license.key.slice(-4))}`:'—';
  content.innerHTML=`<div class="license-grid"><div class="card"><span class="premium-chip">Premium course pack</span><h2>${escapeHtml(DATA.course.packName)}</h2><p>Unlock all ${DATA.course.questionCount} practice questions, the complete ${DATA.course.flashcardCount}-card deck, full-length randomized mock finals, and unrestricted adaptive practice.</p><div class="toolbar"><button id="buyPremium" class="btn primary">Buy Premium — ${escapeHtml(DATA.commerce.price||'$9.99')}</button></div><p class="muted">Payment is completed on Lemon Squeezy's hosted checkout. AmooPrep does not receive your card number.</p>${policyLinks?`<p>${policyLinks}</p>`:''}${!configured?'<div class="notice"><strong>Developer setup:</strong> Lemon Squeezy product details are not configured yet. Follow LEMON_SQUEEZY_SETUP.md in this package.</div>':''}</div><div class="card"><div class="license-status ${state.license.premium?'paid':''}"><strong>${state.license.premium?'Premium is active on this browser':'Activate a purchase'}</strong><p class="muted">After purchase, enter the license key and the same email address used at checkout.</p>${state.license.premium?`<div class="notice"><strong>License:</strong> ${masked}<br><strong>Activations:</strong> ${usage}<br><strong>Expires:</strong> ${expiry}</div>`:''}</div>${state.license.premium?'':`<div class="form-row"><label>Checkout email</label><input id="licenseEmail" class="input" type="email" autocomplete="email" placeholder="you@example.com"></div><div class="form-row"><label>License key</label><input id="licenseInput" class="input" type="text" autocomplete="off" spellcheck="false" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"></div>`}<div class="toolbar">${state.license.premium?'<button id="validateBtn" class="btn">Check License</button><button id="deactivateBtn" class="btn danger">Deactivate This Browser</button>':'<button id="activateBtn" class="btn primary">Activate License</button>'}</div><p id="licenseMessage" class="muted"></p></div></div>`;
  $('#buyPremium').onclick=openCheckout;
  if($('#activateBtn'))$('#activateBtn').onclick=async()=>{const msg=$('#licenseMessage');msg.textContent='Activating…';try{await activateLicense($('#licenseInput').value,$('#licenseEmail').value);showToast('Premium unlocked');renderPremium();}catch(e){msg.textContent=e.message;}};
  if($('#validateBtn'))$('#validateBtn').onclick=async()=>{const msg=$('#licenseMessage');msg.textContent='Checking…';await validateStoredLicense();updateLicenseBadge();if(state.license.premium){showToast('License is valid');renderPremium();}else{msg.textContent='This browser license could not be validated.';}};
  if($('#deactivateBtn'))$('#deactivateBtn').onclick=async()=>{const msg=$('#licenseMessage');msg.textContent='Deactivating…';await deactivateLicense();showToast('License deactivated on this browser');renderPremium();};
}
function renderAbout(){
  content.innerHTML=`<div class="grid two"><div class="card"><h2>${escapeHtml(DATA.course.productName)}</h2><p>${escapeHtml(DATA.course.disclaimer)}</p><p class="notice">${escapeHtml(DATA.course.dataPolicy)}</p><p><strong>${DATA.course.freeQuestionCount}</strong> questions are included in the free edition; Premium unlocks the complete <strong>${DATA.course.questionCount}</strong>-question bank.</p></div><div class="card"><h2>Built for legitimate study</h2><p>${escapeHtml(DATA.course.purpose)}</p><p>This extension is a standalone pre-exam study tool. It does not read assessment pages, select answers on live exams, inject content into testing websites, or communicate with proctoring systems.</p><p class="muted">AmooPrep uses one extension for multiple independent course packs. Each course keeps separate progress and licensing while sharing the same study engine.</p></div></div>`;
}

content.addEventListener('click',e=>{const a=e.target.closest('[data-action]');if(!a)return;const x=a.dataset.action;if(x==='adaptive10')startSession('adaptive',{count:10,unit:'all'});if(x==='mock')navigate('mock');if(x==='premium')navigate('premium');if(x==='dashboard')navigate('dashboard');});
$('#nav').addEventListener('click',e=>{const b=e.target.closest('.nav-item');if(b)navigate(b.dataset.view);});
$('#quickPractice').onclick=()=>startSession('adaptive',{count:10,unit:'all'});
window.addEventListener('keydown',e=>{if(state.session){if(['1','2','3','4'].includes(e.key)&&!answering){answerQuestion(+e.key-1)}else if(e.key==='Enter'&&answering&&$('#nextQuestion')){$('#nextQuestion').click();}}});

await loadData();
navigate('library');
