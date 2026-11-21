'use strict';

const homeMenu = document.querySelector('.home-menu');
const homeNavigation = document.querySelector('#home-navigation');
const compactNavigation = window.matchMedia('(max-width: 52rem)');

function setHomeMenu(open) {
  homeMenu.setAttribute('aria-expanded', String(open));
  homeNavigation.hidden = compactNavigation.matches && !open;
}

function syncHomeNavigation() {
  if (compactNavigation.matches) {
    homeMenu.hidden = false;
    if (homeNavigation.contains(document.activeElement)) {
      homeMenu.focus();
    }
    setHomeMenu(false);
  } else {
    setHomeMenu(false);
    if (document.activeElement === homeMenu) {
      homeNavigation.querySelector('a').focus();
    }
    homeMenu.hidden = true;
  }
}

homeMenu.addEventListener('click', () => {
  setHomeMenu(homeMenu.getAttribute('aria-expanded') !== 'true');
});

homeMenu.closest('header').addEventListener('keydown', event => {
  if (event.key === 'Escape' && homeMenu.getAttribute('aria-expanded') === 'true') {
    setHomeMenu(false);
    homeMenu.focus();
  }
});

compactNavigation.addEventListener('change', syncHomeNavigation);
syncHomeNavigation();
