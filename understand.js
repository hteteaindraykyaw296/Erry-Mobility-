'use strict';

const cpScience = document.querySelector('#cp-science');
const cpLessons = [...document.querySelectorAll('.cp-lesson')];
const cpLessonLinks = [...document.querySelectorAll('.cp-lesson-nav a')];

function revealCpTarget(hash) {
  const target = document.getElementById(hash.slice(1));
  if (!target) return;
  const lesson = target.closest('.cp-lesson');
  const disclosure = lesson || (cpScience.contains(target) ? cpScience : null);
  if (!disclosure || disclosure.open) return;
  disclosure.open = true;
  requestAnimationFrame(() => target.scrollIntoView());
}

function updateCpLessonLinks() {
  const openLesson = cpLessons.find(lesson => lesson.open);
  cpLessonLinks.forEach(link => {
    if (link.hash === '#' + openLesson?.id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

cpLessonLinks.forEach(link => link.addEventListener('click', () => revealCpTarget(link.hash)));
cpLessons.forEach(lesson => lesson.addEventListener('toggle', () => {
  updateCpLessonLinks();
  const playback = lesson.querySelector('[data-play]');
  if (!lesson.open && playback?.textContent === 'Pause') playback.click();
}));
window.addEventListener('hashchange', () => revealCpTarget(location.hash));
revealCpTarget(location.hash);
updateCpLessonLinks();

