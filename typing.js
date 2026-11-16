'use strict';

const find = selector => document.querySelector(selector);
const message = find('#message');
const keyboard = find('#keyboard');
const adaptation = find('#adaptation');
const placement = find('#placement');
const effort = find('#effort');
const completion = find('#completion');
const stepIds = ['try', 'compare', 'save'];
const modes = ['standard', 'adapted'];
const modeButtons = document.querySelectorAll('[data-mode]');
const emptyAttempt = () => ({ text: '', corrections: 0, effort: '', completion: 'complete' });
let attempts = { standard: emptyAttempt(), adapted: emptyAttempt() };
let results = {};
let mode = 'standard';
let paused = false;
let previousActivation = { key: '', time: 0 };

function label(name) {
  if (name === 'standard') return 'Standard';
  return adaptation.value === 'large' ? 'Larger on-screen keys' : 'Repeat filter (350 ms)';
}

function showStep(step) {
  for (const name of stepIds) {
    const item = find('#' + name + '-step');
    if (name === step) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  }
}

function updateSetup() {
  const active = attempts[mode];
  message.value = active.text;
  effort.value = active.effort;
  completion.value = active.completion;
  keyboard.classList.toggle('large-keys', mode === 'adapted' && adaptation.value === 'large');
  keyboard.dataset.placement = placement.value;
  find('#sample').textContent = adaptation.value === 'repeat' ? 'meet me at noon' : 'meet me at two';
  find('#setup-description').textContent = mode === 'adapted' && adaptation.value === 'repeat'
    ? 'Quick repeats of the same key are filtered. Pause briefly between intended double letters, such as the two o’s in noon.'
    : label(mode) + '. The key size affects the on-screen keyboard.';
  modeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  find('#key-feedback').textContent = '';
  previousActivation = { key: '', time: 0 };
}

function selectMode(name) {
  mode = name;
  updateSetup();
}

function allowKey(key) {
  const now = performance.now();
  const filtered = mode === 'adapted' && adaptation.value === 'repeat'
    && key === previousActivation.key && now - previousActivation.time < 350;
  if (filtered) {
    find('#key-feedback').textContent = 'Repeat filtered. Wait briefly to type the same key again.';
    return false;
  }
  previousActivation = { key, time: now };
  find('#key-feedback').textContent = '';
  return true;
}

message.addEventListener('keydown', event => {
  if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
  if (!allowKey(event.key.toLowerCase())) event.preventDefault();
});
message.addEventListener('input', event => {
  const active = attempts[mode];
  if (event.inputType?.startsWith('delete') && message.value !== active.text) active.corrections++;
  active.text = message.value;
});
effort.addEventListener('change', () => { attempts[mode].effort = effort.value; });
completion.addEventListener('change', () => { attempts[mode].completion = completion.value; });

function pressKey(key) {
  if (paused) return;
  const start = message.selectionStart;
  const end = message.selectionEnd;
  const active = attempts[mode];
  if (key === 'Delete') {
    if (start === 0 && start === end) return;
    message.setRangeText('', start === end ? start - 1 : start, end, 'end');
    active.corrections++;
    previousActivation = { key: '', time: 0 };
  } else {
    const value = key === 'Space' ? ' ' : key;
    if (message.value.length - (end - start) >= message.maxLength || !allowKey(value)) return;
    message.setRangeText(value, start, end, 'end');
  }
  active.text = message.value;
}
for (const key of [...'qwertyuiopasdfghjklzxcvbnm', 'Space', 'Delete']) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = key;
  button.addEventListener('click', () => pressKey(key));
  keyboard.append(button);
}

function renderResults() {
  const grid = find('#results');
  grid.replaceChildren();
  for (const name of modes) {
    const card = document.createElement('article');
    const title = document.createElement('h3');
    title.textContent = label(name);
    card.append(title);
    const result = results[name];
    const summary = document.createElement('p');
    summary.textContent = ({
      skipped: 'Skipped',
      partial: 'Stopped partway',
      complete: 'Finished message'
    })[result?.completion] || 'Waiting for an attempt';
    card.append(summary);
    if (result && result.completion !== 'skipped') {
      const details = document.createElement('p');
      details.textContent = 'Corrections ' + result.corrections + ' · Effort ' + (result.effort || 'unrated');
      card.append(details);
    }
    grid.append(card);
  }
  const compared = modes.every(name => results[name]);
  find('#save-form').hidden = !compared || modes.every(name => results[name].completion === 'skipped');
  for (const option of find('#remember').options) {
    if (option.value) option.disabled = !results[option.value] || results[option.value].completion === 'skipped';
  }
  find('#remember').value = '';
  find('#next-idea').hidden = !compared;
  find('#save-status').textContent = '';
  showStep(compared ? 'compare' : 'try');
}

function keepAttempt(skip) {
  const active = attempts[mode];
  if (!skip && !active.text.trim()) {
    find('#try-status').textContent = 'Type something to keep an attempt, or choose Skip.';
    message.focus();
    return;
  }
  results[mode] = skip ? { completion: 'skipped' } : {
    completion: active.completion,
    corrections: active.corrections,
    effort: active.effort
  };
  renderResults();
  const other = modes.find(name => name !== mode);
  if (!results[other]) {
    selectMode(other);
    find('#try-status').textContent = 'Now try the ' + label(other).toLowerCase() + ' setup.';
    message.focus();
  } else {
    find('#try-status').textContent = 'Both attempts are ready to review.';
    find('#compare-title').focus();
  }
}

function restart() {
  attempts = { standard: emptyAttempt(), adapted: emptyAttempt() };
  results = {};
  find('#observation').value = '';
  selectMode('standard');
  renderResults();
}

modeButtons.forEach(button => button.addEventListener('click', () => selectMode(button.dataset.mode)));
adaptation.addEventListener('change', () => {
  restart();
  selectMode('adapted');
  find('#try-status').textContent = 'New comparison started. Use this sample for both setups.';
});
placement.addEventListener('change', () => { keyboard.dataset.placement = placement.value; });
find('#try-setup').addEventListener('click', () => {
  if (paused) find('#pause').click();
  selectMode('adapted');
  message.focus();
});
find('#keep').addEventListener('click', () => keepAttempt(false));
find('#skip').addEventListener('click', () => keepAttempt(true));
find('#restart').addEventListener('click', () => {
  restart();
  find('#try-status').textContent = 'Comparison restarted.';
  message.focus();
});
find('#pause').addEventListener('click', event => {
  paused = !paused;
  event.currentTarget.textContent = paused ? 'Resume' : 'Pause';
  event.currentTarget.setAttribute('aria-pressed', String(paused));
  for (const control of find('#try-panel').querySelectorAll('textarea, select, button')) {
    if (control !== event.currentTarget) control.disabled = paused;
  }
  find('#try-status').textContent = paused ? 'Paused. Your attempts are held for this visit.' : 'Comparison resumed.';
});
find('#pause').removeAttribute('aria-expanded');
find('#pause').removeAttribute('aria-controls');
find('#pause').setAttribute('aria-pressed', 'false');
find('video').addEventListener('error', () => {
  find('#video-status').textContent = 'Video unavailable. The demonstration steps below are ready to read.';
  find('details').open = true;
});

find('#save-form').addEventListener('submit', event => {
  event.preventDefault();
  const name = find('#remember').value;
  const result = results[name];
  if (!result || result.completion === 'skipped') return;
  const note = find('#observation').value.trim();
  const normalized = text => text.toLowerCase().replace(/\s+/g, ' ').trim();
  if (modes.some(item => normalized(attempts[item].text).length >= 3
    && normalized(note).includes(normalized(attempts[item].text)))) {
    find('#save-status').textContent = 'Remove the practice message from the note before saving.';
    find('#observation').focus();
    return;
  }
  const now = new Date();
  const date = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
    .map(part => String(part).padStart(2, '0')).join('-');
  try {
    const storageKey = 'eri-mobility-journal-v1';
    const entries = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    if (!Array.isArray(entries)) throw new Error('Unexpected journal format');
    entries.push({
      id: globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2),
      date, activity: 'Hand skills & typing',
      taskDetail: label(name) + ' · ' + placement.selectedOptions[0].textContent + ' keys',
      note: ['Effort ' + (result.effort || 'unrated'), 'Corrections ' + result.corrections, note].filter(Boolean).join('\n'),
      nextStep: 'Try this setup again or ask an occupational therapist about keyboard access.'
    });
    localStorage.setItem(storageKey, JSON.stringify(entries));
    find('#save-status').textContent = 'Saved to My Journal.';
    find('#observation').value = '';
    find('#remember').value = '';
    showStep('save');
  } catch {
    find('#save-status').textContent = 'Could not save. Check whether this browser allows local storage.';
  }
});

updateSetup();
renderResults();
