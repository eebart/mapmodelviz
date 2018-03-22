import choroplethColors from './util/colors.js';
import { loadOptionalConfig, loadSettings } from './components/settings/settings.js';
import { loadMap, updateMapData } from './components/mapview/map.js';

window.$ = window.jQuery = require('jquery');
window.Popper = require('popper.js');
require('bootstrap');

import './style/index.scss';

var throttled = false;
var delay = 250;

document.addEventListener('DOMContentLoaded', () => {
  // do your setup here
  loadMap();
  loadOptionalConfig();
  loadSettings();

  var slider = document.getElementById("the-slider");
  slider.oninput = function() {
      config.currentIndex = this.value;
      updateMapData();
  };
});

window.addEventListener('resize', function() {
  if (!throttled) {
    // util.configureSlider();
    throttled = true;
    setTimeout(function() {
      throttled = false;
    }, delay);
  }
});
