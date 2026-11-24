'use strict';

for (const lesson of document.querySelectorAll('[data-steps]')) {
  const instructions = [...lesson.querySelectorAll('[data-step]')];
  const caption = lesson.querySelector('[data-caption]');
  const marker = lesson.querySelector('.diagram-point');
  const controls = lesson.querySelector('.lesson-buttons');
  const play = controls.querySelector('[data-play]');
  const previous = controls.querySelector('[data-prev-step]');
  const next = controls.querySelector('[data-next-step]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let timer = null;

  function show(index) {
    current = index;
    instructions.forEach((step, number) => {
      if (index === number) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
    const step = instructions[index];
    caption.textContent = step.dataset.step;
    if (marker) {
      marker.style.setProperty('--point-x', step.dataset.x);
      marker.style.setProperty('--point-y', step.dataset.y);
    }
    previous.disabled = current === 0;
    next.disabled = current === instructions.length - 1;
  }

  function pause() {
    clearInterval(timer);
    timer = null;
    play.textContent = 'Play';
  }

  play.addEventListener('click', () => {
    if (timer !== null) {
      pause();
      return;
    }
    if (current === instructions.length - 1) show(0);
    play.textContent = 'Pause';
    timer = setInterval(() => {
      show(current + 1);
      if (current === instructions.length - 1) pause();
    }, 2200);
  });
  previous.addEventListener('click', () => { pause(); show(current - 1); });
  next.addEventListener('click', () => { pause(); show(current + 1); });
  controls.querySelector('[data-replay]').addEventListener('click', () => {
    pause();
    show(0);
    if (!reducedMotion.matches) play.click();
  });
  reducedMotion.addEventListener('change', pause);
  controls.hidden = false;
  show(0);
}

for (const demo of document.querySelectorAll('[data-setups]')) {
  const compareStatus = demo.querySelector('[role="status"]');
  const cards = [...demo.querySelectorAll('.setup-preview figure')];
  cards[0].classList.add('is-highlighted');
  for (const button of demo.querySelectorAll('[data-setup-choice]')) {
    button.addEventListener('click', () => {
      for (const choice of demo.querySelectorAll('[data-setup-choice]')) {
        choice.setAttribute('aria-pressed', String(choice === button));
      }
      cards.forEach((card, index) => card.classList.toggle('is-highlighted', index === (button.dataset.setupChoice === 'a' ? 0 : 1)));
      compareStatus.textContent = button.dataset.setupChoice === 'a'
        ? 'Setup A: the keyboard sits farther from the front edge in this example.'
        : 'Setup B: the same keyboard slides closer without changing angle.';
    });
  }
}

for (const diagram of document.querySelectorAll('[data-structure-diagram]')) {
  const marker = diagram.querySelector('.diagram-point');
  const description = diagram.querySelector('[role="status"]');
  for (const button of diagram.querySelectorAll('[data-structure]')) {
    button.addEventListener('click', () => {
      for (const option of diagram.querySelectorAll('[data-structure]')) {
        option.setAttribute('aria-pressed', String(option === button));
      }
      marker.style.setProperty('--point-x', button.dataset.x);
      marker.style.setProperty('--point-y', button.dataset.y);
      description.textContent = button.dataset.structure;
    });
  }
}
