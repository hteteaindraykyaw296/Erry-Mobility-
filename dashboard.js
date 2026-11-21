'use strict';
(() => {
  const demo = document.querySelector('.keyguard-demo');
  if (demo) {
    demo.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
      const withGuard = button.dataset.view === 'guard';
      demo.dataset.view = withGuard ? 'guard' : 'usual';
      demo.querySelectorAll('[data-view]').forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
      const status = document.querySelector('#demo-status');
      if (status) status.textContent = withGuard ? 'Showing an illustrative keyguard aligned over the keyboard.' : 'Showing usual keyboard without a keyguard.';
    }));
  }

  const root = document.querySelector('#typing-discoveries');
  if (!root) return;
  const addLink = (parent, href, text, className) => {
    const link = document.createElement('a'); link.href = href; link.textContent = text;
    if (className) link.className = className;
    parent.append(link); return link;
  };
  const actions = () => {
    const row = document.createElement('div'); row.className = 'discovery-actions';
    addLink(row, 'journal.html', 'Review my journal');
    addLink(row, 'typing.html', 'Try another comparison');
    return row;
  };
  const empty = () => {
    const state = document.createElement('div'); state.className = 'empty-discovery';
    const heading = document.createElement('h3'); heading.textContent = 'Your discoveries can start here.';
    const copy = document.createElement('p'); copy.textContent = 'After trying two setups, you can choose to save what helped.';
    state.append(heading, copy); addLink(state, 'typing.html', 'Begin a typing comparison →', 'text-link'); root.replaceChildren(state);
  };
  const esc = value => String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const findFirst = (text, patterns) => {
    for (const pattern of patterns) { const match = text.match(pattern); if (match) return match[1].trim(); }
    return '';
  };
  const parsedCount = (note, setup) => {
    const escaped = esc(setup);
    const value = findFirst(note, [new RegExp(escaped + '[^\\n;]*?(?:correction(?:s)?(?: actions?)?\\s*[:—-]\\s*)(\\d+)', 'i'), new RegExp('correction(?:s)?(?: actions?)?\\s*(?:for\\s+)?' + escaped + '\\s*[:—-]?\\s*(\\d+)', 'i')]);
    return value;
  };
  const parsedEffort = (note, setup) => {
    const escaped = esc(setup);
    return findFirst(note, [new RegExp(escaped + '[^\\n;]*?effort(?:\\s*\\(?(?:1\\s*[–-]\\s*5)?\\)?)?\\s*[:—-]\\s*(?:level\\s*)?([1-5](?:\\s*·\\s*[^.;\\n]+)?)', 'i'), new RegExp('effort[^\\n;]*?' + escaped + '\\s*[:—-]\\s*([1-5](?:\\s*·\\s*[^.;\\n]+)?)', 'i')]);
  };
  const formatDate = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return value || 'Date not recorded';
    const date = new Date(value + 'T12:00:00');
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, {year:'numeric', month:'short', day:'numeric'}).format(date);
  };
  const render = entry => {
    const card = document.createElement('article'); card.className = 'discovery-entry';
    const heading = document.createElement('h3'); heading.textContent = 'Typing setup comparison';
    const time = document.createElement('time'); time.textContent = formatDate(entry.date); if (/^\d{4}-\d{2}-\d{2}$/.test(entry.date || '')) time.dateTime = entry.date;
    card.append(heading, time);
    const detail = [entry.taskDetail, entry.setupA, entry.setupB].filter(v => typeof v === 'string' && v.trim()).join(' · ');
    if (detail) { const p = document.createElement('p'); p.textContent = detail; card.append(p); }
    const note = typeof entry.note === 'string' ? entry.note : '';
    const corrections = [parsedCount(note, 'Setup A'), parsedCount(note, 'Setup B')];
    const effort = [parsedEffort(note, 'Setup A'), parsedEffort(note, 'Setup B')];
    const structured = entry.comparison && typeof entry.comparison === 'object' ? entry.comparison : entry;
    const values = [structured.setupACorrections ?? structured.correctionsA ?? structured.corrections?.setupA ?? corrections[0], structured.setupBCorrections ?? structured.correctionsB ?? structured.corrections?.setupB ?? corrections[1]];
    const efforts = [structured.setupAEffort ?? structured.effortA ?? structured.effort?.setupA ?? effort[0], structured.setupBEffort ?? structured.effortB ?? structured.effort?.setupB ?? effort[1]];
    if (values.some(v => v !== '' && v !== null && v !== undefined)) { const p = document.createElement('p'); p.textContent = 'Correction actions — Setup A: ' + (values[0] ?? 'not recorded') + '; Setup B: ' + (values[1] ?? 'not recorded'); card.append(p); }
    if (efforts.some(v => v !== '' && v !== null && v !== undefined)) { const p = document.createElement('p'); p.textContent = 'Effort — Setup A: ' + (efforts[0] ?? 'not recorded') + '; Setup B: ' + (efforts[1] ?? 'not recorded'); card.append(p); }
    const preference = structured.preference ?? structured.preferredSetup ?? findFirst(note, [/preference\s*[:—-]\s*([^.;\n]+)/i, /preferred\s*[:—-]\s*([^.;\n]+)/i]);
    if (preference) { const p = document.createElement('p'); p.textContent = 'Preference: ' + String(preference); card.append(p); }
    return card;
  };
  try {
    const raw = localStorage.getItem('eri-mobility-journal-v1');
    if (raw === null) { empty(); return; }
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error('Journal format is not a list.');
    const comparisons = data.filter(entry => entry && typeof entry === 'object' && typeof entry.activity === 'string' && /typing/i.test(entry.activity));
    comparisons.sort((a,b) => String(b.date || '').localeCompare(String(a.date || '')));
    if (!comparisons.length) { empty(); return; }
    const newest = render(comparisons[0]); root.replaceChildren(newest, actions());
  } catch {
    const notice = document.createElement('p'); notice.className = 'storage-notice'; notice.setAttribute('role','status'); notice.textContent = 'This browser’s journal could not be read right now. Your typing comparison is still available; you can also open My Journal to review or export your records.';
    const links = actions(); root.replaceChildren(notice, links);
  }
})();
