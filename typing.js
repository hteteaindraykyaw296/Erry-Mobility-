'use strict';
const find = selector => document.querySelector(selector);
const message = find('#message'), keyboard = find('#keyboard'), adaptation = find('#adaptation'), placement = find('#placement'), effort = find('#effort');
const stepIds = ['try','compare','save'], modes = ['standard','adapted'];
const modeButtons = document.querySelectorAll('[data-mode]');
const emptyAttempt = () => ({text:'',corrections:0,effort:'',placement:'center'});
let attempts={standard:emptyAttempt(),adapted:emptyAttempt()},results={},mode='standard',paused=false,composing=false,selectionBeforeInput=null;
let comparisonId = null;
let saved = false;
let lastKey = '';
let lastTime = -Infinity;
const repeatWindow = find('#repeat-window');
const saveForm = find('#save-form');
const saveStatus = find('#save-status');
const saveButton = saveForm.querySelector('button[type=submit]');

function invalidate(name) {
  if (!results[name]) return;
  delete results[name];
  comparisonId = null;
  saved = false;
  saveForm.reset();
  saveStatus.textContent = '';
  renderResults();
}

function setPaused(value) {
  paused = value;
  const button = find('#pause');
  button.textContent = value ? 'Resume' : 'Pause';
  button.setAttribute('aria-pressed', String(value));
  for (const control of [message, effort, find('#keep'), find('#skip'), ...keyboard.querySelectorAll('button')]) {
    control.disabled = value;
  }
}

function repeatBlocked(key) {
  if (mode !== 'adapted' || adaptation.value !== 'repeat') return false;
  const now = performance.now();
  const blocked = key === lastKey && now - lastTime < Number(repeatWindow.value);
  if (!blocked) {
    lastKey = key;
    lastTime = now;
  }
  return blocked;
}

const describeMode=name=>name==='standard'?'Setup A · Usual':'Setup B · One change';
function showStep(step){stepIds.forEach(name=>{const el=find('#'+name+'-step');if(name===step)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current')})}
function changeDescription(){const descriptions={position:'Move the keyboard to a comfortable position you choose. No equipment is required.',support:'Use only forearm support that is already comfortable and available to you. Do not add or adjust fitted equipment.',keyguard:'Use an existing keyguard that has already been fitted for your device. Do not try to fit or modify one for this activity.',setting:'Change one keyboard accessibility setting on your device yourself before the trial. Restore it afterward if you wish.',large:'Use the larger on-screen keys in Setup B. Physical key size stays the same.',repeat:'Choose a repeat window for Setup B. Paste and composition are unaffected.'};return descriptions[adaptation.value]}
function updateSetup(){const active=attempts[mode];message.value=active.text;effort.value=active.effort;placement.value=active.placement;keyboard.dataset.placement=placement.value;keyboard.classList.toggle('larger-keys',mode==='adapted'&&adaptation.value==='large');modeButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));find('#setup-description').textContent=mode==='standard'?'Use the keyboard arrangement you usually use.':changeDescription();find('#key-feedback').textContent='';selectionBeforeInput=null}
function selectMode(name){mode=name;composing=false;lastKey='';lastTime=-Infinity;updateSetup()}
function countCorrection(){attempts[mode].corrections+=1}
message.addEventListener('compositionstart',()=>{composing=true});message.addEventListener('compositionend',()=>{composing=false;if(attempts[mode].text!==message.value)invalidate(mode);attempts[mode].text=message.value;selectionBeforeInput=null});
message.addEventListener('beforeinput',event=>{selectionBeforeInput={start:message.selectionStart,end:message.selectionEnd,type:event.inputType,composing:event.isComposing||composing}});
message.addEventListener('input',event=>{const old=selectionBeforeInput;const type=event.inputType||old?.type||'';const inComposition=event.isComposing||composing||old?.composing||/composition/i.test(type);const hasSelection=old&&old.end>old.start;const deletion=type.startsWith('delete');const replacement=type.startsWith('insert')&&hasSelection;
 // Count a deletion or replacement of selected text outside input-method composition.
 if(attempts[mode].text!==message.value||(!inComposition&&(deletion||replacement)))invalidate(mode);
 if(!inComposition&&(deletion||replacement))countCorrection();attempts[mode].text=message.value;selectionBeforeInput=null;
});
effort.addEventListener('change',()=>{invalidate(mode);attempts[mode].effort=effort.value});
message.addEventListener('keydown', event => {
  if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.isComposing && !composing && /^[a-z ]$/i.test(event.key) && repeatBlocked(event.key.toLowerCase())) {
    event.preventDefault();
    find('#key-feedback').textContent = 'A quick repeated key was ignored.';
  }
});
function dispatchInput(inputType){try{message.dispatchEvent(new InputEvent('input',{bubbles:true,inputType,data:null}))}catch{message.dispatchEvent(new Event('input',{bubbles:true}))}}
function pressKey(key) {
  if (paused) return;
  if (key !== 'Delete' && repeatBlocked(key === 'Space' ? ' ' : key)) {
    find('#key-feedback').textContent = 'A quick repeated key was ignored.';
    return;
  }
  message.focus();
  const start = message.selectionStart;
  const end = message.selectionEnd;
  if (key === 'Delete') {
    if (start === 0 && end === 0) return;
    const previous = [...message.value.slice(0,start)].at(-1);
    const from = start === end ? start - previous.length : start;
    message.setRangeText('', from, end, 'end');
    dispatchInput('deleteContentBackward');
    return;
  }

  if (message.value.length - (end - start) >= message.maxLength) return;
  // setRangeText does not fire beforeinput, so preserve the selection for the input listener.
  selectionBeforeInput = {start, end};
  message.setRangeText(key === 'Space' ? ' ' : key, start, end, 'end');
  dispatchInput(start === end ? 'insertText' : 'insertReplacementText');
}

for(const key of [...'qwertyuiopasdfghjklzxcvbnm','Space','Delete']){const button=document.createElement('button');button.type='button';button.textContent=key;button.setAttribute('aria-label',key==='Space'?'Space':key==='Delete'?'Delete previous character':key);button.addEventListener('click',()=>pressKey(key));keyboard.append(button)}
function renderResults() {
  const grid = find('#results');
  grid.replaceChildren();
  for (const name of modes) {
    const card = document.createElement('article');
    const title = document.createElement('h3');
    title.textContent = describeMode(name);
    card.append(title);
    const result = results[name];
    const lines = !result ? ['Waiting for this attempt'] : result.skipped ? ['Skipped'] :
      ['Correction actions: '+result.corrections, 'Effort: '+(result.effort || 'not rated')];
    for (const line of lines) {
      const paragraph = document.createElement('p');
      paragraph.textContent = line;
      card.append(paragraph);
    }
    grid.append(card);
  }
  const complete = modes.every(name => results[name]);
  const anyKept = modes.some(name => results[name] && !results[name].skipped);
  find('#preference-field').hidden = !complete || !anyKept;
  saveForm.hidden = !complete || !anyKept;
  saveButton.disabled = saved;
  for (const choice of document.querySelectorAll('input[name="preference"]')) {
    choice.disabled = choice.value !== 'none' && (saved || modes.some(name => results[name]?.skipped));
    if (choice.disabled && !saved) choice.checked = false;
  }
  showStep(saved ? 'save' : complete ? 'compare' : 'try');
}

function keepAttempt(skip) {
  const active = attempts[mode];
  if (!skip && !active.text.trim()) {
    find('#try-status').textContent = 'Type a message to keep this attempt, or choose Skip.';
    message.focus();
    return;
  }
  if (!results[mode] || results[mode].skipped !== skip) {
    invalidate(mode);
    results[mode] = skip ? {skipped:true} : {skipped:false, corrections:active.corrections, effort:active.effort};
  }
  renderResults();
  const other = modes.find(name => name !== mode);
  if (!results[other]) {
    selectMode(other);
    find('#try-status').textContent = 'Now try '+describeMode(other)+'.';
    message.focus();
  } else {
    find('#try-status').textContent = 'Both attempts are ready to review.';
    find('#compare-title').focus();
  }
}

function restart() {
  attempts = {standard:emptyAttempt(), adapted:emptyAttempt()};
  results = {};
  comparisonId = null;
  saved = false;
  saveForm.reset();
  saveStatus.textContent = '';
  find('#try-status').textContent = '';
  setPaused(false);
  selectMode('standard');
  renderResults();
  message.focus();
}

modeButtons.forEach(button => button.addEventListener('click', () => selectMode(button.dataset.mode)));
adaptation.addEventListener('change', () => {
  invalidate('adapted');
  attempts.adapted = emptyAttempt();
  lastKey = '';
  lastTime = -Infinity;
  updateSetup();
  find('#adaptation-help').textContent = changeDescription();
  find('#repeat-options').hidden = adaptation.value !== 'repeat';
  find('#try-status').textContent = 'Setup B changed. Keep an attempt with this change before comparing.';
});
repeatWindow.addEventListener('input', () => {
  invalidate('adapted');
  attempts.adapted = emptyAttempt();
  lastKey = '';
  lastTime = -Infinity;
  if (mode === 'adapted') updateSetup();
  find('#repeat-value').value = repeatWindow.value+' ms';
  find('#try-status').textContent = 'Repeat window changed. Start Setup B again.';
});
placement.addEventListener('change', () => {
  invalidate(mode);
  attempts[mode].placement = placement.value;
  keyboard.dataset.placement = placement.value;
});
find('#try-setup').addEventListener('click', () => {
  selectMode('adapted');
  (paused ? find('#pause') : message).focus();
});
find('#keep').addEventListener('click', () => keepAttempt(false));
find('#skip').addEventListener('click', () => keepAttempt(true));
find('#restart').addEventListener('click', restart);
find('#pause').addEventListener('click', () => {
  setPaused(!paused);
  find('#try-status').textContent = paused ? 'Paused. Your attempts stay on this page.' : 'Comparison resumed.';
});

saveForm.addEventListener('submit', event => {
  event.preventDefault();
  if (saved || saveForm.hidden) return;
  const preference = find('input[name="preference"]:checked');
  const oneSkipped = modes.some(name => results[name].skipped);
  if (!preference && !oneSkipped) {
    saveStatus.textContent = 'Choose a preference, including No clear preference, before saving.';
    find('input[name="preference"]').focus();
    return;
  }

  const preferenceLabel = oneSkipped ? 'Not compared (one attempt skipped)' :
    {standard:'Setup A', adapted:'Setup B', none:'No clear preference'}[preference.value];
  const correction = name => results[name].skipped ? 'skipped' : results[name].corrections;
  const rating = name => results[name].skipped ? 'skipped' : results[name].effort || 'not rated';
  const now = new Date();
  const date = [now.getFullYear(), String(now.getMonth()+1).padStart(2,'0'), String(now.getDate()).padStart(2,'0')].join('-');
  comparisonId ??= globalThis.crypto?.randomUUID?.() || Date.now().toString(36)+Math.random().toString(36).slice(2);
  const record = {
    id: comparisonId,
    date,
    activity: 'Typing setup comparison',
    taskDetail: 'Setup A: usual keyboard arrangement; Setup B: '+adaptation.options[adaptation.selectedIndex].textContent+
      (adaptation.value === 'repeat' ? ' ('+repeatWindow.value+' ms)' : '')+
      '. On-screen alignment (A/B): '+attempts.standard.placement+'/'+attempts.adapted.placement,
    note: 'Correction actions — Setup A: '+correction('standard')+'; Setup B: '+correction('adapted')+
      '. Effort (1–5) — Setup A: '+rating('standard')+'; Setup B: '+rating('adapted')+'. Preference: '+preferenceLabel+'.',
    nextStep: ''
  };
  try {
    const key = 'eri-mobility-journal-v1';
    const entries = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(entries)) throw new Error('Unreadable journal');
    if (!entries.some(entry => entry?.id === record.id)) {
      entries.push(record);
      localStorage.setItem(key, JSON.stringify(entries));
    }
    saved = true;
    saveStatus.textContent = 'Comparison saved to My Journal. Practice-message text was not saved.';
    renderResults();
  } catch {
    saveStatus.textContent = 'Could not save. Your comparison is still here. Check browser storage or back up your journal, then try again.';
  }
});

find('#restart').setAttribute('aria-label','Restart both typing trials');
find('#adaptation-help').textContent = changeDescription();
updateSetup();
renderResults();

function openLinkedExplanation() {
  if (location.hash === '#keyguard-demo') find('#keyguard-demo').open = true;
}
window.addEventListener('hashchange', openLinkedExplanation);
openLinkedExplanation();
