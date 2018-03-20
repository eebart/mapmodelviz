//globals: $, jQuery and Tether, see config

// import 'bootstrap';
// adds all custom Bootstrap jQuery plugins
// see all plugins here: http://getbootstrap.com/javascript/

import 'bootstrap';

var modelConfig = require('./config.js');
var mapping = require('./js/map.js');
var util = require('./js/util.js');
var settings = require('./js/settings.js');

var throttled = false;
var delay = 250;

document.addEventListener('DOMContentLoaded', () => {
  // do your setup here
  mapping.loadMap();
  settings.loadOptionalConfig();
  settings.loadSettings();

  var slider = document.getElementById("the-slider");
  slider.oninput = function() {
      modelConfig.currentIndex = this.value;
      mapping.updateMapData();
  };
});

// window.resize event listener
window.addEventListener('resize', function() {
  if (!throttled) {
    util.configureSlider();
    throttled = true;
    setTimeout(function() {
      throttled = false;
    }, delay);
  }
});
