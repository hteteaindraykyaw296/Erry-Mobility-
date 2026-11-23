const test = require('node:test');
const assert = require('node:assert/strict');
const {textErrors, csvRows} = require('../typing.js');

test('fixed sample scoring counts insertions, deletions, substitutions, case, and spaces', () => {
  const sample = 'meet me at noon';
  for (const [text, expected] of [[sample, 0], ['', 15], ['Me et me at noon', 2], ['meet me at non', 1], ['meetme at noon', 1], ['meet me at moon', 1], ['meet me at noon ', 1]]) {
    assert.equal(textErrors(sample, text), expected, text);
  }
});

test('CSV keeps every trial, quotes labels, and leaves practice text out', () => {
  const row = {number: 1, setup: 'Setup A', change: 'A "usual" arrangement', placement: 'Centred', seconds: '2.50', errors: 0, corrections: 1, comfort: '', text: 'private practice text'};
  const csv = csvRows([row, {...row, number: 2, setup: 'Setup B', comfort: '4'}], 'Setup B');
  assert.equal(csv.split('\r\n').length, 3);
  assert.match(csv, /"1","Setup A","A ""usual"" arrangement","Centred","2.50","0","1","","Setup B"/);
  assert.match(csv, /"2","Setup B"/);
  assert.doesNotMatch(csv, /private practice text/);
});
