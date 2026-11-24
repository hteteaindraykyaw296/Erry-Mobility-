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

function timeSummary(trials) {
  if (!trials.length) return null;
  let total = 0;
  let min = Infinity;
  let max = -Infinity;
  for (const trial of trials) {
    const seconds = Number(trial.seconds);
    total += seconds;
    min = Math.min(min, seconds);
    max = Math.max(max, seconds);
  }
  return {count: trials.length, mean: total / trials.length, min, max};
}

function conditionsKey(trial) {
  return JSON.stringify([trial.input, trial.placement, trial.device, trial.composition]);
}

function comparisonKey(trial) {
  return JSON.stringify([conditionsKey(trial), trial.category, trial.detail]);
}

function csvRows(trials, preferences = new Map()) {
  const spreadsheetText = value => /^[\s]*[=+\-@]|\r|\n|\t/.test(value) ? "'" + value : value;
  return [
    ['Trial', 'Setup', 'Adaptation category', 'Specific change', 'Input method', 'On-screen key placement', 'Device label', 'Composition observed', 'Task completion seconds', 'Final text errors', 'Correction actions', 'Comfort (1–5)', 'Setup B comparison preference'],
    ...trials.map(trial => [
      trial.number, trial.setup, trial.change, spreadsheetText(trial.detail),
      trial.inputLabel, trial.placement, spreadsheetText(trial.device), trial.composition ? 'Yes' : 'No',
      trial.seconds, trial.errors, trial.corrections, trial.comfort,
      trial.setup === 'Setup B' ? preferences.get(comparisonKey(trial)) || '' : ''
    ])
  ].map(row => row.map(value => '"' + String(value).replaceAll('"', '""') + '"').join(',')).join('\r\n');
}

if (typeof module !== 'undefined') module.exports = {textErrors, csvRows, conditionsKey, comparisonKey, timeSummary};
if (typeof document !== 'undefined') initTypingLab();

function initTypingLab() {
  const find = selector => document.querySelector(selector);
  const message = find('#message');
  const keyboard = find('#keyboard');
  const adaptation = find('#adaptation');
  const detail = find('#adaptation-detail');
  const input = find('#input-method');
  const device = find('#device-note');
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
  const comparison = find('#comparison');
  const saveForm = find('#save-form');
  const status = find('#try-status');
  const keyFeedback = find('#key-feedback');
  const resultStatus = find('#result-status');
  const saveStatus = find('#save-status');
  const completionCheck = find('#completion-check');
  const confirmFinish = find('#confirm-finish');
  const sample = find('#sample').textContent;
  const screenKeys = find('#screen-keys');
  const preferences = new Map();
  const adaptationDetails = new Map();
  let detailCategory = adaptation.value;
  const descriptions = {
    position: 'Move the same keyboard to a comfortable position you choose.',
    support: 'Use forearm support that you already find comfortable.',
    keyguard: 'Use an existing keyguard fitted to this keyboard.',
    setting: 'Change one keyboard accessibility setting on your device before starting.',
    onscreen: 'Use the lab on-screen keys in both setups. Setup B displays larger keys.'
  };
  const metrics = [
    {key: 'seconds', label: 'Task completion time', unit: ' s'},
    {key: 'errors', label: 'Final text errors', unit: ''},
    {key: 'corrections', label: 'Correction actions', unit: ''}
  ];

  let setup = 'standard';
  let active = null;
  let trials = [];
  let selectedComparison = '';
  let previousText = '';
  let selectedText = false;
  let composing = false;

  function setStage(stage) {
    for (const name of ['choose', 'try', 'compare']) {
      const marker = find('#' + name + '-step');
      if (name === stage) marker.setAttribute('aria-current', 'step');
      else marker.removeAttribute('aria-current');
    }
  }

  function updateControls() {
    const running = active?.started != null;
    const usingScreenKeys = input.value === 'onscreen';
    const adapted = setup === 'adapted';
    options.forEach(button => {
      button.disabled = Boolean(active);
      button.setAttribute('aria-pressed', String(button.dataset.mode === setup));
    });
    find('#adaptation-fields').hidden = !adapted;
    find('#placement-field').hidden = !usingScreenKeys;
    for (const control of [adaptation, detail, input, device, placement, start]) {
      control.disabled = Boolean(active);
    }
    finish.disabled = message.disabled = !running;
    message.readOnly = usingScreenKeys;
    screenKeys.hidden = !usingScreenKeys;
    pause.disabled = discard.disabled = !active;
    pause.textContent = active && !running ? 'Resume trial' : 'Pause trial';
    keyboard.dataset.placement = placement.value;
    keyboard.classList.toggle('large-lab-keys', adapted && adaptation.value === 'onscreen' && usingScreenKeys);
    for (const button of keyboard.children) button.disabled = !running;
    find('#setup-description').textContent = adapted ? descriptions[adaptation.value] : 'Use your usual arrangement.';
  }

  function describeTrial(trial) {
    return [trial.change, trial.detail, trial.inputLabel, trial.device,
      trial.placement && trial.placement + ' keys', trial.composition && 'composition observed'].filter(Boolean).join(' · ');
  }

  function displaySelection() {
    const adapted = trials.filter(trial => trial.setup === 'Setup B');
    const reference = adapted.findLast(trial => comparisonKey(trial) === selectedComparison);
    const usualReference = reference || trials.at(-1);
    const usual = trials.filter(trial => trial.setup === 'Setup A' && usualReference &&
      conditionsKey(trial) === conditionsKey(usualReference));
    const selected = adapted.filter(trial => comparisonKey(trial) === selectedComparison);
    return {usual, selected, reference, matched: Boolean(usual.length && selected.length)};
  }

  function trialLine(trial) {
    return 'Trial ' + trial.number + ' · ' + describeTrial(trial) + ' · ' + trial.seconds + ' s · ' +
      trial.errors + ' final text errors · ' + trial.corrections + ' correction actions · Comfort ' +
      (trial.comfort ? trial.comfort + '/5' : 'unrated');
  }

  function paragraph(text) {
    return Object.assign(document.createElement('p'), {textContent: text});
  }

  function renderResults() {
    const groups = new Map(trials.filter(trial => trial.setup === 'Setup B')
      .map(trial => [comparisonKey(trial), describeTrial(trial)]));
    if (!groups.has(selectedComparison)) selectedComparison = [...groups.keys()].at(-1) || '';
    comparison.replaceChildren(...[...groups].map(([key, label]) => new Option(label, key)));
    comparison.value = selectedComparison;
    find('#comparison-field').hidden = !groups.size;
    const {usual, selected, reference, matched} = displaySelection();
    const results = find('#results');
    const latestBySetup = [usual.at(-1), selected.at(-1)];
    const guidance = find('#trial-guidance');
    guidance.hidden = !trials.length;
    guidance.textContent = matched
      ? 'The latest trial from each setup uses a matching scale for each measure. Compare time, errors and comfort together.'
      : reference
        ? 'No Setup A trial matches these recorded conditions. This Setup B result can be read on its own. Other trials are in the history.'
        : 'Finish a Setup B trial using matching conditions to compare. Other trials are in the history.';

    results.replaceChildren();
    for (const [index, group] of [usual, selected].entries()) {
      const card = document.createElement('article');
      const title = document.createElement('h3');
      title.textContent = index === 0 ? 'Setup A' : 'Setup B';
      card.append(title, paragraph('Finished trials in this view: ' + group.length));
      const latest = group.at(-1);
      if (!latest) {
        results.append(card);
        continue;
      }
      card.append(paragraph('Latest: trial ' + latest.number + ' · ' + describeTrial(latest)));
      const summary = document.createElement('dl');
      summary.className = 'trial-bars';
      for (const {key, label, unit} of metrics) {
        const name = document.createElement('dt');
        name.textContent = label;
        const value = document.createElement('dd');
        value.textContent = latest[key] + unit;
        if (matched) {
          const bar = document.createElement('meter');
          bar.max = Math.max(1, ...latestBySetup.map(trial => Number(trial[key])));
          bar.value = Number(latest[key]);
          bar.setAttribute('aria-hidden', 'true');
          value.append(bar);
        }
        summary.append(name, value);
      }
      card.append(summary, paragraph('Comfort: ' + (latest.comfort ? latest.comfort + '/5' : 'unrated')));
      if (group.length > 1) {
        const times = timeSummary(group);
        card.append(paragraph('Repeated trials: mean ' + times.mean.toFixed(2) + ' s, range ' +
          times.min.toFixed(2) + '–' + times.max.toFixed(2) + ' s (n = ' + times.count + ').'));
      }
      results.append(card);
    }

    const history = find('#trial-history-list');
    history.replaceChildren(...trials.map(trial => {
      const item = document.createElement('li');
      item.textContent = trial.setup + ' · ' + trialLine(trial);
      return item;
    }));
    const latest = trials.at(-1);
    find('#trial-history').hidden = !latest;
    comfort.disabled = download.disabled = reset.disabled = !latest;
    comfort.value = latest?.comfort || '';
    preferenceField.hidden = !matched;
    for (const option of preferenceField.querySelectorAll('input')) {
      option.checked = matched && option.value === preferences.get(selectedComparison);
    }
    saveForm.hidden = !latest;
  }

  function clearMessage() {
    message.value = previousText = '';
    keyFeedback.textContent = '';
    selectedText = composing = false;
    completionCheck.hidden = true;
  }

  const unsupportedInput = 'Paste and drag-and-drop are unavailable for measured trials. Enter the sample using your selected input method.';
  for (const name of ['paste', 'drop']) {
    message.addEventListener(name, event => {
      event.preventDefault();
      status.textContent = unsupportedInput;
    });
  }
  const isPastedOrDropped = event => /^(insertFromPaste|insertFromDrop)/.test(event.inputType || '');
  message.addEventListener('compositionstart', () => {
    if (active?.started == null || message.readOnly) return;
    composing = true;
    active.composition = true;
  });
  message.addEventListener('compositionend', () => {
    composing = false;
    selectedText = false;
    previousText = message.value;
  });
  message.addEventListener('beforeinput', event => {
    if (isPastedOrDropped(event)) {
      event.preventDefault();
      status.textContent = unsupportedInput;
    }
    selectedText = message.selectionEnd > message.selectionStart;
  });
  message.addEventListener('input', event => {
    if (isPastedOrDropped(event) || active?.started == null || message.readOnly) {
      message.value = previousText;
      selectedText = false;
      if (isPastedOrDropped(event)) status.textContent = unsupportedInput;
      return;
    }
    const type = event.inputType || '';
    const compositionInput = composing || event.isComposing || type.includes('Composition');
    if (compositionInput) active.composition = true;
    if (message.value !== previousText && !compositionInput &&
        (type.startsWith('delete') || (type.startsWith('insert') && selectedText))) {
      active.corrections++;
    }
    previousText = message.value;
    selectedText = false;
    completionCheck.hidden = true;
  });

  function pressKey(key) {
    if (active?.started == null || active.input !== 'onscreen') return;
    const from = message.selectionStart;
    const to = message.selectionEnd;
    const deleting = key === 'Delete';
    if (deleting && to === 0) return;
    if (!deleting && message.value.length - (to - from) >= message.maxLength) return;
    const value = deleting ? '' : key === 'Space' ? ' ' : key;
    const previousLength = deleting && from === to ? Array.from(message.value.slice(0, from)).at(-1)?.length || 1 : 0;
    message.setRangeText(value, from - previousLength, to, 'end');
    if (message.value !== previousText && (deleting || from !== to)) active.corrections++;
    previousText = message.value;
    completionCheck.hidden = true;
    const count = [...message.value].length;
    keyFeedback.textContent = (deleting ? 'Deleted text.' : 'Entered ' + (key === 'Space' ? 'space' : key) + '.') +
      ' ' + count + (count === 1 ? ' character in message.' : ' characters in message.');
  }

  for (const key of [...'qwertyuiopasdfghjklzxcvbnm', 'Space', 'Delete']) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = key;
    button.setAttribute('aria-label', key === 'Delete' ? 'Delete previous character or selection' : key);
    button.addEventListener('click', () => pressKey(key));
    keyboard.append(button);
  }

  options.forEach(button => button.addEventListener('click', () => {
    if (active) return;
    setup = button.dataset.mode;
    setStage('choose');
    updateControls();
  }));
  adaptation.addEventListener('change', () => {
    adaptationDetails.set(detailCategory, detail.value);
    detailCategory = adaptation.value;
    detail.value = adaptationDetails.get(detailCategory) || '';
    updateControls();
  });
  input.addEventListener('change', updateControls);
  placement.addEventListener('change', updateControls);

  function focusEntry() {
    if (active.input === 'onscreen') {
      screenKeys.open = true;
      keyboard.firstElementChild.focus();
    } else {
      message.focus();
    }
  }

  start.addEventListener('click', () => {
    if (active) return;
    if (setup === 'adapted' && adaptation.value === 'onscreen' && input.value !== 'onscreen') {
      status.textContent = 'Choose Lab on-screen keys to test the larger keys. Use that input method in both setups.';
      input.focus();
      return;
    }
    clearMessage();
    resultStatus.textContent = '';
    active = {
      setup: setup === 'standard' ? 'Setup A' : 'Setup B',
      category: setup === 'standard' ? 'usual' : adaptation.value,
      change: setup === 'standard' ? 'Usual arrangement' : adaptation.selectedOptions[0].textContent,
      detail: setup === 'standard' ? '' : detail.value.trim(),
      input: input.value,
      inputLabel: input.selectedOptions[0].textContent,
      device: device.value.trim(),
      placement: input.value === 'onscreen' ? placement.selectedOptions[0].textContent : '',
      composition: false,
      corrections: 0,
      elapsed: 0,
      started: performance.now()
    };
    setStage('try');
    updateControls();
    status.textContent = active.setup + ' trial started. Enter the sample and select Finish trial.';
    focusEntry();
  });

  pause.addEventListener('click', () => {
    if (!active) return;
    const now = performance.now();
    if (active.started === null) {
      active.started = now;
      status.textContent = 'Trial resumed.';
    } else {
      active.elapsed += now - active.started;
      active.started = null;
      status.textContent = 'Trial paused. Select Resume trial when ready.';
    }
    completionCheck.hidden = true;
    updateControls();
    if (active.started !== null) focusEntry();
  });

  function finishTrial(confirmOmissions = false) {
    if (active?.started == null || (confirmOmissions && completionCheck.hidden)) return;
    const finishedAt = performance.now();
    if (composing) {
      status.textContent = 'Finish composing the current text before finishing the trial.';
      message.focus();
      return;
    }
    if (!message.value.trim()) {
      status.textContent = 'Enter the sample to finish, or discard this trial.';
      focusEntry();
      return;
    }
    if (!confirmOmissions && [...message.value].length < [...sample].length) {
      completionCheck.hidden = false;
      status.textContent = 'Check whether you attempted the whole message before finishing.';
      confirmFinish.focus();
      return;
    }
    const {elapsed, started, ...protocol} = active;
    const trial = {...protocol, number: trials.length + 1,
      seconds: ((elapsed + finishedAt - started) / 1000).toFixed(2),
      errors: textErrors(sample, message.value), comfort: ''};
    trials.push(trial);
    if (trial.setup === 'Setup B') selectedComparison = comparisonKey(trial);
    active = null;
    clearMessage();
    setStage('compare');
    updateControls();
    renderResults();
    saveStatus.textContent = status.textContent = '';
    find('#compare-title').focus();
    resultStatus.textContent = trial.setup + ' trial ' + trial.number + ' recorded. Task completion time ' +
      trial.seconds + ' seconds. Final text errors: ' + trial.errors + '.';
  }

  finish.addEventListener('click', () => finishTrial());
  confirmFinish.addEventListener('click', () => finishTrial(true));

  discard.addEventListener('click', () => {
    if (!active) return;
    active = null;
    clearMessage();
    setStage('choose');
    updateControls();
    status.textContent = 'Trial discarded. Finished trials are still available.';
    start.focus();
  });

  comfort.addEventListener('change', () => {
    if (!trials.length) return;
    trials.at(-1).comfort = comfort.value;
    saveStatus.textContent = '';
    renderResults();
  });
  comparison.addEventListener('change', () => {
    selectedComparison = comparison.value;
    saveStatus.textContent = '';
    renderResults();
    resultStatus.textContent = 'Now showing ' + comparison.selectedOptions[0].textContent + '.';
  });
  preferenceField.addEventListener('change', event => {
    if (displaySelection().matched && event.target.name === 'preference') preferences.set(selectedComparison, event.target.value);
    saveStatus.textContent = '';
  });

  reset.addEventListener('click', () => {
    trials = [];
    selectedComparison = '';
    preferences.clear();
    resultStatus.textContent = '';
    renderResults();
    setStage(active ? 'try' : 'choose');
    saveStatus.textContent = 'Finished trials cleared from this session. Journal snapshots are still available.';
    (active ? pause : start).focus();
  });

  download.addEventListener('click', () => {
    const blob = new Blob(['\uFEFF', csvRows(trials, preferences)], {type: 'text/csv;charset=utf-8'});
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
    const {usual, selected, matched} = displaySelection();
    const snapshot = [usual.at(-1), selected.at(-1)].filter(Boolean);
    const preference = matched ? preferences.get(selectedComparison) : '';
    const record = {
      id: globalThis.crypto?.randomUUID?.() || now.getTime().toString(36) + Math.random().toString(36).slice(2),
      date,
      activity: 'Typing setup comparison',
      taskDetail: 'Fixed sample typing trials in the Typing Setup Lab',
      note: snapshot.map(trial => trial.setup + ' · ' + trialLine(trial)).join('\n') + (preference ? '\nPreference: ' + preference : ''),
      nextStep: ''
    };
    try {
      const key = 'eri-mobility-journal-v1';
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(saved)) throw new Error('Invalid journal data');
      localStorage.setItem(key, JSON.stringify([...saved, record]));
      saveStatus.textContent = 'Displayed results saved to My Journal.';
    } catch {
      saveStatus.textContent = 'Could not save to browser storage. You can still download the CSV.';
    }
  });

  updateControls();
  renderResults();
}
