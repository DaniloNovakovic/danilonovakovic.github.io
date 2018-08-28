const NAV_OPENED_CLASS = 'fa-bars';
const NAV_CLOSED_CLASS = 'fa-times';

window.onload = function() {
  const navBtn = document.getElementById('nav-btn');
  const classes = navBtn.classList;
  const navbar = document.getElementById('navbar');

  navBtn.addEventListener('click', function() {
    if (classes.contains(NAV_OPENED_CLASS)) {
      openNav();
    } else {
      closeNav();
    }
  });
  const navLinks = document.getElementsByClassName('nav-link');
  [...navLinks].forEach(function(elem) {
    elem.addEventListener('click', function() {
      closeNav();
    });
  });

  function closeNav() {
    classes.remove(NAV_CLOSED_CLASS);
    classes.add(NAV_OPENED_CLASS);
    navbar.classList.add('hide');
  }
  function openNav() {
    classes.remove(NAV_OPENED_CLASS);
    classes.add(NAV_CLOSED_CLASS);
    navbar.classList.remove('hide');
  }
};
