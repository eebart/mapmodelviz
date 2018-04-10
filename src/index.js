import choroplethColors from './util/colors.js';
import { loadOptionalConfigAndSettings } from './components/settings/settings.js';
// import { loadMap, updateMapData } from './components/mapview/map.js';
import { loadMap, updateMapData, configureSlider } from './components/mapview/map.js';

window.$ = window.jQuery = require('jquery');

window.Util = require('exports-loader?Util!bootstrap/js/dist/util'); // eslint-disable-line
window.Modal = require('exports-loader?Modal!bootstrap/js/dist/modal'); // eslint-disable-line
window.Button = require('exports-loader?Modal!bootstrap/js/dist/button'); // eslint-disable-line

import './style/index.scss';
import '../node_modules/leaflet/dist/leaflet.css';

var throttled = false;
var delay = 250;

document.addEventListener('DOMContentLoaded', () => {
  loadMap();
  loadOptionalConfigAndSettings();
  configureSlider();

  var slider = document.getElementById("the-slider");
  slider.oninput = function() {
      config.currentIndex = this.value;
      updateMapData();
  };

});



window.addEventListener('resize', function() {
  if (!throttled) {
    configureSlider();
    throttled = true;
    setTimeout(function() {
      throttled = false;
    }, delay);
  }
});
