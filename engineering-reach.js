'use strict';

function compareReach(lateral, usualDepth, adaptedDepth) {
  if (![lateral, usualDepth, adaptedDepth].every(value => Number.isFinite(value) && value >= 0)) {
    throw new RangeError('Enter non-negative, finite offsets.');
  }
  const usual = Math.hypot(lateral, usualDepth);
  const adapted = Math.hypot(lateral, adaptedDepth);
  return {usual, adapted, change: adapted - usual};
}

if (typeof module !== 'undefined') module.exports = {compareReach};

if (typeof document !== 'undefined') {
  const form = document.querySelector('#reach-calculator');
  const result = form.querySelector('output');
  const offsets = [...form.querySelectorAll('input')];
  const format = new Intl.NumberFormat('en', {maximumFractionDigits: 1, minimumFractionDigits: 1});

  function update() {
    if (!form.checkValidity()) {
      result.textContent = 'Enter all three offsets from 0 to 1,000 mm.';
      return;
    }
    const {usual, adapted, change} = compareReach(...offsets.map(input => input.valueAsNumber));
    const signed = change > 0 ? '+' + format.format(change) : format.format(change);
    result.textContent = 'Setup A: ' + format.format(usual) + ' mm. Setup B: ' + format.format(adapted) +
      ' mm. Change (B − A): ' + signed + ' mm.';
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    update();
  });
  form.addEventListener('input', update);
  update();
}

