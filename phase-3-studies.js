'use strict';

(() => {
  const sequence = {
    a: [
      ['Approach', 'The index finger moves towards the gold target.', 0],
      ['Contact', 'The fingertip touches the key surface.', 1],
      ['Press', 'The key moves down as the finger and hand angle adjust.', 2],
      ['Release and reposition', 'The finger lifts and the key returns. The approach frame is reused to show the raised position.', 0]
    ],
    b: [
      ['Intention and motor planning', 'Brain networks help select and plan the reach.'],
      ['Cervical spinal cord and peripheral nerves', 'Descending pathways influence spinal circuits. Motor neurons signal muscles through peripheral nerves.'],
      ['Forearm muscle activation', 'Muscles activate and help move or stabilise joints.'],
      ['Sensory feedback and ongoing adjustment', 'Touch, vision and body-position information help guide adjustments throughout the reach.']
    ]
  };

  let library;
  function loadStudies() {
    library ??= fetch('phase-3-studies.html').then(async response => {
      if (!response.ok) throw new Error('Study library unavailable');
      return new DOMParser().parseFromString(await response.text(), 'text/html');
    }).catch(error => {
      library = undefined;
      throw error;
    });
    return library;
  }

  function setupPlayback(study, steps, variant, disclosure) {
    const plate = study.querySelector('.plate');
    const caption = study.querySelector('figcaption');
    const controls = study.querySelector('.controls');
    const progress = document.createElement('div');
    progress.className = 'progress';
    progress.setAttribute('aria-hidden', 'true');
    const segments = steps.map(() => progress.appendChild(document.createElement('span')));
    controls.before(progress);
    let index = 0;
    let timer;

    function control(label, action) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', () => {
        if (button.getAttribute('aria-disabled') !== 'true') action();
      });
      controls.append(button);
      return button;
    }

    const play = control('Play', () => {
      if (timer !== undefined) return pause();
      if (index === steps.length - 1) show(0);
      play.textContent = 'Pause';
      timer = setInterval(() => {
        show(index + 1);
        if (index === steps.length - 1) pause();
      }, 3600);
    });
    const previous = control('Previous step', () => { pause(); show(index - 1); });
    const next = control('Next step', () => { pause(); show(index + 1); });
    control('Reset', () => { pause(); show(0); });

    function pause() {
      clearInterval(timer);
      timer = undefined;
      play.textContent = 'Play';
    }

    function show(step) {
      index = step;
      const [label, explanation, frame] = steps[step];
      caption.textContent = (step + 1) + ' of ' + steps.length + ' · ' + label + '. ' + explanation;
      if (variant === 'b') plate.dataset.phase = step;
      else plate.style.setProperty('--shift', (-frame * 100 / 3) + '%');
      segments.forEach((segment, number) => {
        if (number === step) segment.setAttribute('aria-current', 'step');
        else segment.removeAttribute('aria-current');
      });
      previous.setAttribute('aria-disabled', String(step === 0));
      next.setAttribute('aria-disabled', String(step === steps.length - 1));
    }

    show(0);
    disclosure.addEventListener('toggle', () => { if (!disclosure.open) pause(); });
    new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) pause(); }).observe(study);
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  }

  for (const disclosure of document.querySelectorAll('[data-phase-study]')) {
    const variant = disclosure.dataset.phaseStudy;
    const host = disclosure.querySelector('phase-study');
    const fallback = host.querySelector('p');
    const status = document.createElement('p');
    status.setAttribute('role', 'status');
    status.hidden = true;
    host.prepend(status);
    let loading = false;

    async function mount() {
      if (!disclosure.open || host.shadowRoot || loading) return;
      loading = true;
      status.textContent = 'Loading the illustrated study…';
      status.hidden = false;
      try {
        const doc = await loadStudies();
        const fragment = doc.querySelector('#studies').content;
        const study = fragment.querySelector('[data-story="' + variant + '"], [data-study="' + variant + '"]').cloneNode(true);
        for (const image of study.querySelectorAll('img')) {
          image.addEventListener('error', () => {
            const message = document.createElement('p');
            message.textContent = 'Illustration unavailable. ' + image.alt;
            image.replaceWith(message);
          }, {once: true});
        }
        const shadow = host.attachShadow({mode: 'open'});
        shadow.append(doc.querySelector('style').cloneNode(true), study);
        if (sequence[variant]) setupPlayback(study, sequence[variant], variant, disclosure);
      } catch {
        status.textContent = 'The illustrated study could not load. Reopen this section to retry.';
        fallback.hidden = false;
      } finally {
        loading = false;
      }
    }

    function openLinkedStudy() {
      if (location.hash === '#' + disclosure.id) {
        for (let ancestor = disclosure; ancestor; ancestor = ancestor.parentElement) {
          if (ancestor instanceof HTMLDetailsElement) ancestor.open = true;
        }
      }
    }
    disclosure.addEventListener('toggle', mount);
    window.addEventListener('hashchange', openLinkedStudy);
    openLinkedStudy();
    mount();
  }
})();

