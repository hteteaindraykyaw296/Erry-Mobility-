'use strict';

function textErrors(sample, text) {
  const expected = [...sample];
  let row = Array.from({length: expected.length + 1}, (_, index) => index);
  for (const character of text) {
    const next = [row[0] + 1];
    expected.forEach((letter, index) => {
      next.push(Math.min(next[index] + 1, row[index + 1] + 1, row[index] + Number(letter !== character)));
    });
    row = next;
  }
  return row[expected.length];
}

function csvRows(trials, preference) {
  return [
    ['Trial', 'Setup', 'Change', 'Key placement', 'Elapsed seconds', 'Final text errors', 'Correction actions', 'Comfort (1–5)', 'Preference'],
    ...trials.map(trial => [trial.number, trial.setup, trial.change, trial.placement, trial.seconds, trial.errors, trial.corrections, trial.comfort, preference])
  ].map(row => row.map(value => '"' + String(value).replaceAll('"', '""') + '"').join(',')).join('\r\n');
}

if (typeof module !== 'undefined') module.exports = {textErrors, csvRows};
if (typeof document !== 'undefined') initTypingLab();

function initTypingLab() {
  const find = selector => document.querySelector(selector);
  const message = find('#message');
  const keyboard = find('#keyboard');
  const adaptation = find('#adaptation');
  const placement = find('#placement');
  const comfort = find('#comfort');
  const start = find('#start');
  const finish = find('#keep');
  const pause = find('#pause');
  const discard = find('#skip');
  const reset = find('#restart');
  const download = find('#export');
  const options = document.querySelectorAll('[data-mode]');
  const preferenceField = find('#preference-field');
  const saveForm = find('#save-form');
  const status = find('#try-status');
  const saveStatus = find('#save-status');
  const sample = find('#sample').textContent;
  const screenKeys = find('#screen-keys');
  const descriptions = {
    position: 'Move the same keyboard to a comfortable position you choose.',
    support: 'Use forearm support that you already find comfortable.',
    keyguard: 'Use an existing keyguard fitted to this keyboard.',
    setting: 'Change one keyboard accessibility setting on your device before starting.',
    onscreen: 'Use the on-screen keys in both setups. Setup B displays larger keys.'
  };

  let setup = 'standard';
  let active = null;
  let trials = [];
  let previousText = '';
  let selectedText = false;
  let composing = false;

  function preference() {
    return find('input[name="preference"]:checked')?.value || '';
  }

  function updateControls() {
    const running = active && active.started !== null;
    const larger = setup === 'adapted' && adaptation.value === 'onscreen';
    options.forEach(button => {
      button.disabled = Boolean(active);
      button.setAttribute('aria-pressed', String(button.dataset.mode === setup));
    });
    adaptation.disabled = placement.disabled = start.disabled = Boolean(active);
    finish.disabled = message.disabled = !running;
    pause.disabled = discard.disabled = !active;
    pause.textContent = active && !running ? 'Resume trial' : 'Pause trial';
    keyboard.dataset.placement = placement.value;
    keyboard.classList.toggle('large-lab-keys', larger);
    for (const button of keyboard.children) button.disabled = !running;
    find('#setup-description').textContent = setup === 'standard' ? 'Use your usual arrangement.' : descriptions[adaptation.value];
    if (larger) screenKeys.open = true;
  }

  function renderResults() {
    const results = find('#results');
    results.replaceChildren();
    for (const setupLabel of ['Setup A', 'Setup B']) {
      const card = document.createElement('article');
      const title = document.createElement('h3');
      title.textContent = setupLabel;
      card.append(title);
      const list = document.createElement('ul');
      for (const trial of trials.filter(entry => entry.setup === setupLabel)) {
        const item = document.createElement('li');
        item.textContent = 'Trial ' + trial.number + ' · ' + trial.change + ' · ' + trial.seconds + ' s · ' + trial.errors + ' final text errors · ' + trial.corrections + ' correction actions · Comfort ' + (trial.comfort ? trial.comfort + '/5' : 'unrated') + ' · Keys ' + trial.placement.toLowerCase();
        list.append(item);
      }
      if (list.childElementCount) card.append(list);
      else card.append(Object.assign(document.createElement('p'), {textContent: 'No finished trials.'}));
      results.append(card);
    }
    const latest = trials.at(-1);
    comfort.disabled = download.disabled = reset.disabled = !latest;
    comfort.value = latest?.comfort || '';
    preferenceField.hidden = new Set(trials.map(trial => trial.setup)).size < 2;
    saveForm.hidden = !latest;
    const step = preferenceField.hidden ? 'try' : 'compare';
    for (const name of ['try', 'compare', 'save']) {
      const marker = find('#' + name + '-step');
      if (name === step) marker.setAttribute('aria-current', 'step');
      else marker.removeAttribute('aria-current');
    }
  }

  function clearMessage() {
    message.value = previousText = '';
    selectedText = composing = false;
  }

  message.addEventListener('compositionstart', () => { composing = true; });
  message.addEventListener('compositionend', () => {
    composing = false;
    selectedText = false;
    previousText = message.value;
  });
  message.addEventListener('beforeinput', () => { selectedText = message.selectionEnd > message.selectionStart; });
  message.addEventListener('input', event => {
    const type = event.inputType || '';
    if (active?.started != null && message.value !== previousText && !composing && !event.isComposing &&
        (type.startsWith('delete') || (type.startsWith('insert') && selectedText))) {
      active.corrections++;
    }
    previousText = message.value;
    selectedText = false;
  });

  function pressKey(key) {
    if (active?.started == null) return;
    const from = message.selectionStart;
    const to = message.selectionEnd;
    const deleting = key === 'Delete';
    if (deleting && to === 0) return;
    if (!deleting && message.value.length - (to - from) >= message.maxLength) return;
    const value = deleting ? '' : key === 'Space' ? ' ' : key;
    message.setRangeText(value, deleting && from === to ? from - 1 : from, to, 'end');
    if (message.value !== previousText && (deleting || from !== to)) active.corrections++;
    previousText = message.value;
  }

  for (const key of [...'qwertyuiopasdfghjklzxcvbnm', 'Space', 'Delete']) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = key;
    if (key === 'Delete') button.setAttribute('aria-label', 'Delete previous character or selection');
    button.addEventListener('click', () => pressKey(key));
    keyboard.append(button);
  }

  options.forEach(button => button.addEventListener('click', () => {
    setup = button.dataset.mode;
    updateControls();
  }));
  adaptation.addEventListener('change', updateControls);
  placement.addEventListener('change', updateControls);
  find('#try-setup').addEventListener('click', event => {
    event.preventDefault();
    (active ? pause : start).focus();
  });

  start.addEventListener('click', () => {
    clearMessage();
    active = {
      setup: setup === 'standard' ? 'Setup A' : 'Setup B',
      change: setup === 'standard' ? 'Usual arrangement' : adaptation.selectedOptions[0].textContent,
      placement: placement.selectedOptions[0].textContent,
      corrections: 0,
      elapsed: 0,
      started: performance.now()
    };
    updateControls();
    status.textContent = 'Trial started. Type the sample and select Finish trial.';
    message.focus();
  });

  pause.addEventListener('click', () => {
    const now = performance.now();
    if (active.started === null) {
      active.started = now;
      status.textContent = 'Trial resumed.';
    } else {
      active.elapsed += now - active.started;
      active.started = null;
      status.textContent = 'Trial paused. Select Resume trial when you are ready.';
    }
    updateControls();
    if (active.started !== null) message.focus();
  });

  finish.addEventListener('click', () => {
    if (active?.started == null) return;
    if (!message.value.trim()) {
      status.textContent = 'Enter some text to finish, or discard this trial.';
      message.focus();
      return;
    }
    const {elapsed, started, setup: label, change, placement: position, corrections} = active;
    const seconds = ((elapsed + performance.now() - started) / 1000).toFixed(2);
    trials.push({number: trials.length + 1, setup: label, change, placement: position, corrections,
      seconds, errors: textErrors(sample, message.value), comfort: ''});
    active = null;
    clearMessage();
    updateControls();
    renderResults();
    saveStatus.textContent = '';
    status.textContent = label + ' trial ' + trials.length + ' recorded.';
    find('#compare-title').focus();
  });

  discard.addEventListener('click', () => {
    active = null;
    clearMessage();
    updateControls();
    status.textContent = 'Trial discarded. Finished trials are still available.';
    start.focus();
  });

  comfort.addEventListener('change', () => {
    trials.at(-1).comfort = comfort.value;
    saveStatus.textContent = '';
    renderResults();
  });
  preferenceField.addEventListener('change', () => { saveStatus.textContent = ''; });

  reset.addEventListener('click', () => {
    trials = [];
    for (const input of preferenceField.querySelectorAll('input')) input.checked = false;
    renderResults();
    saveStatus.textContent = 'Finished trials cleared from this session. Any journal snapshots are still available.';
    (active ? pause : start).focus();
  });

  download.addEventListener('click', () => {
    const blob = new Blob(['\uFEFF', csvRows(trials, preference())], {type: 'text/csv;charset=utf-8'});
    const link = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: 'erry-mobility-typing-trials.csv'
    });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  });

  saveForm.addEventListener('submit', event => {
    event.preventDefault();
    const now = new Date();
    const date = [now.getFullYear(), now.getMonth() + 1, now.getDate()].map(part => String(part).padStart(2, '0')).join('-');
    const snapshot = ['Setup A', 'Setup B'].map(label => trials.findLast(trial => trial.setup === label)).filter(Boolean);
    const record = {
      id: globalThis.crypto?.randomUUID?.() || now.getTime().toString(36) + Math.random().toString(36).slice(2),
      date,
      activity: 'Typing setup comparison',
      taskDetail: 'Fixed sample typing trials in the Typing Setup Lab',
      note: snapshot.map(trial => 'Trial ' + trial.number + ', ' + trial.setup + ' (' + trial.change + ', ' + trial.placement + ' keys): ' + trial.seconds + ' s, ' + trial.errors + ' final text errors, ' + trial.corrections + ' correction actions, comfort ' + (trial.comfort ? trial.comfort + '/5' : 'unrated') + '.').join(' ') + (preference() ? ' Preference: ' + preference() + '.' : ''),
      nextStep: ''
    };
    try {
      const key = 'eri-mobility-journal-v1';
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(saved)) throw new Error('Invalid journal data');
      localStorage.setItem(key, JSON.stringify([...saved, record]));
      saveStatus.textContent = 'Results saved to My Journal.';
      find('#try-step').removeAttribute('aria-current');
      find('#compare-step').removeAttribute('aria-current');
      find('#save-step').setAttribute('aria-current', 'step');
    } catch {
      saveStatus.textContent = 'Could not save to browser storage. You can still download the CSV.';
    }
  });

  updateControls();
  renderResults();
}
