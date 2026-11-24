'use strict';

const movedHomeSections = new Map([
  ['#challenge-title', 'understand.html#movement'],
  ['#position-demo', 'keyboard-position.html#position-demo'],
  ['#keyboard-position-storyboard', 'keyboard-position.html#keyboard-position-storyboard'],
  ['#story-title', 'about.html#why']
]);
const destination = movedHomeSections.get(location.hash);
if (destination) location.replace(destination);
